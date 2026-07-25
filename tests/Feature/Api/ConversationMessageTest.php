<?php

namespace Tests\Feature\Api;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ConversationMessageTest extends TestCase
{
    use RefreshDatabase;

    public function test_player_can_send_a_message(): void
    {
        $user = User::factory()->create();
        $conversation = Conversation::factory()->for($user)->create();

        Sanctum::actingAs($user);

        $response = $this->postJson("/api/v1/conversations/{$conversation->id}/messages", [
            'body' => 'Which wand suits a Gryffindor?',
            'client_message_id' => (string) Str::uuid(),
            'origin_platform' => 'web',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.body', 'Which wand suits a Gryffindor?')
            ->assertJsonPath('data.sequence_number', 1)
            ->assertJsonPath('data.sender_type', 'player');
    }

    public function test_duplicate_client_message_id_is_idempotent(): void
    {
        $user = User::factory()->create();
        $conversation = Conversation::factory()->for($user)->create();
        $clientMessageId = (string) Str::uuid();

        Sanctum::actingAs($user);

        $payload = [
            'body' => 'Sent while offline',
            'client_message_id' => $clientMessageId,
            'origin_platform' => 'overlay',
        ];

        $first = $this->postJson("/api/v1/conversations/{$conversation->id}/messages", $payload);
        $second = $this->postJson("/api/v1/conversations/{$conversation->id}/messages", $payload);

        $first->assertCreated();
        $second->assertOk();
        $this->assertSame($first->json('data.id'), $second->json('data.id'));
        $this->assertSame(1, Message::where('client_message_id', $clientMessageId)->count());
    }

    public function test_messages_receive_strictly_increasing_sequence_numbers(): void
    {
        $user = User::factory()->create();
        $conversation = Conversation::factory()->for($user)->create();

        Sanctum::actingAs($user);

        foreach (range(1, 3) as $i) {
            $response = $this->postJson("/api/v1/conversations/{$conversation->id}/messages", [
                'body' => "Message {$i}",
                'client_message_id' => (string) Str::uuid(),
                'origin_platform' => 'desktop',
            ]);

            $response->assertCreated()->assertJsonPath('data.sequence_number', $i);
        }
    }

    public function test_user_cannot_post_to_another_users_conversation(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $conversation = Conversation::factory()->for($owner)->create();

        Sanctum::actingAs($intruder);

        $response = $this->postJson("/api/v1/conversations/{$conversation->id}/messages", [
            'body' => 'Not my conversation',
            'client_message_id' => (string) Str::uuid(),
            'origin_platform' => 'web',
        ]);

        $response->assertForbidden();
    }

    public function test_user_cannot_list_another_users_conversation_messages(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $conversation = Conversation::factory()->for($owner)->create();

        Sanctum::actingAs($intruder);

        $response = $this->getJson("/api/v1/conversations/{$conversation->id}/messages");

        $response->assertForbidden();
    }

    public function test_messages_are_listed_in_order_with_cursor_pagination(): void
    {
        $user = User::factory()->create();
        $conversation = Conversation::factory()->for($user)->create();

        Message::factory()
            ->for($conversation)
            ->count(5)
            ->sequence(fn ($sequence) => ['sequence_number' => $sequence->index + 1])
            ->create();

        Sanctum::actingAs($user);

        $firstPage = $this->getJson("/api/v1/conversations/{$conversation->id}/messages?limit=2");

        $firstPage->assertOk();
        $this->assertCount(2, $firstPage->json('data'));
        $this->assertSame(1, $firstPage->json('data.0.sequence_number'));
        $this->assertSame(2, $firstPage->json('data.1.sequence_number'));

        $nextCursor = $firstPage->json('meta.next_cursor');
        $this->assertNotNull($nextCursor);

        $secondPage = $this->getJson("/api/v1/conversations/{$conversation->id}/messages?limit=2&cursor={$nextCursor}");

        $secondPage->assertOk();
        $this->assertSame(3, $secondPage->json('data.0.sequence_number'));
        $this->assertSame(4, $secondPage->json('data.1.sequence_number'));
    }
}
