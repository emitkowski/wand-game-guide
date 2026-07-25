<?php

namespace Tests\Feature\Api;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
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

    public function test_messages_endpoint_returns_the_most_recent_messages_first_then_pages_older(): void
    {
        $user = User::factory()->create();
        $conversation = Conversation::factory()->for($user)->create();

        Message::factory()
            ->for($conversation)
            ->count(5)
            ->sequence(fn ($sequence) => ['sequence_number' => $sequence->index + 1])
            ->create();

        Sanctum::actingAs($user);

        $latest = $this->getJson("/api/v1/conversations/{$conversation->id}/messages?limit=2");

        $latest->assertOk();
        $this->assertCount(2, $latest->json('data'));
        $this->assertSame(4, $latest->json('data.0.sequence_number'));
        $this->assertSame(5, $latest->json('data.1.sequence_number'));

        $olderCursor = $latest->json('meta.next_cursor');
        $this->assertNotNull($olderCursor);

        $older = $this->getJson("/api/v1/conversations/{$conversation->id}/messages?limit=2&cursor={$olderCursor}");

        $older->assertOk();
        $this->assertSame(2, $older->json('data.0.sequence_number'));
        $this->assertSame(3, $older->json('data.1.sequence_number'));
    }

    public function test_default_history_fetch_is_cached_and_invalidated_on_new_message(): void
    {
        $user = User::factory()->create();
        $conversation = Conversation::factory()->for($user)->create();

        Sanctum::actingAs($user);

        $this->postJson("/api/v1/conversations/{$conversation->id}/messages", [
            'body' => 'The first message',
            'client_message_id' => (string) Str::uuid(),
            'origin_platform' => 'web',
        ])->assertCreated();

        $cacheKey = "conversation:{$conversation->id}:recent";
        $this->assertFalse(Cache::has($cacheKey), 'cache should be invalidated when a new message is recorded');

        $first = $this->getJson("/api/v1/conversations/{$conversation->id}/messages");
        $first->assertOk();
        $this->assertCount(1, $first->json('data'));
        $this->assertTrue(Cache::has($cacheKey));

        $this->postJson("/api/v1/conversations/{$conversation->id}/messages", [
            'body' => 'A second message',
            'client_message_id' => (string) Str::uuid(),
            'origin_platform' => 'web',
        ])->assertCreated();

        $this->assertFalse(Cache::has($cacheKey), 'cache should be invalidated when a new message is recorded');

        $second = $this->getJson("/api/v1/conversations/{$conversation->id}/messages");
        $second->assertOk();
        $this->assertCount(2, $second->json('data'));
    }
}
