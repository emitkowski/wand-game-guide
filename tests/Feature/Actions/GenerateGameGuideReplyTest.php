<?php

namespace Tests\Feature\Actions;

use App\Actions\GenerateGameGuideReply;
use App\Models\Conversation;
use App\Models\Enums\OriginPlatform;
use App\Models\Enums\SenderType;
use App\Models\Message;
use App\Models\User;
use App\Services\AnthropicService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Mockery;
use Tests\TestCase;

class GenerateGameGuideReplyTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_persists_an_assistant_reply_built_from_the_thread_history(): void
    {
        $user = User::factory()->create();
        $conversation = Conversation::factory()->for($user)->create();

        Message::factory()->for($conversation)->create([
            'sender_type' => SenderType::Player,
            'body' => 'What wand should I get?',
            'sequence_number' => 1,
        ]);
        $conversation->forceFill(['last_sequence_number' => 1])->save();

        $claude = Mockery::mock(AnthropicService::class);
        $claude->shouldReceive('complete')
            ->once()
            ->withArgs(function (string $systemPrompt, array $messages) {
                return str_contains($systemPrompt, 'Game Guide')
                    && $messages === [['role' => 'user', 'content' => 'What wand should I get?']];
            })
            ->andReturn('A holly wand suits you well.');
        $this->app->instance(AnthropicService::class, $claude);

        Cache::put("conversation:{$conversation->id}:recent", ['stale' => true]);

        $message = app(GenerateGameGuideReply::class)->generate($conversation, OriginPlatform::Web);

        $this->assertSame(SenderType::Assistant, $message->sender_type);
        $this->assertSame('A holly wand suits you well.', $message->body);
        $this->assertSame(2, $message->sequence_number);
        $this->assertSame(OriginPlatform::Web, $message->origin_platform);
        $this->assertFalse(Cache::has("conversation:{$conversation->id}:recent"));

        $this->assertDatabaseHas('messages', [
            'id' => $message->id,
            'sender_type' => 'assistant',
        ]);
    }

    public function test_only_player_and_assistant_messages_are_included_as_thread_context(): void
    {
        $user = User::factory()->create();
        $conversation = Conversation::factory()->for($user)->create();

        Message::factory()->for($conversation)->create([
            'sender_type' => SenderType::Player,
            'body' => 'First question',
            'sequence_number' => 1,
        ]);
        Message::factory()->for($conversation)->create([
            'sender_type' => SenderType::Assistant,
            'body' => 'First answer',
            'sequence_number' => 2,
        ]);
        Message::factory()->for($conversation)->create([
            'sender_type' => SenderType::System,
            'body' => 'A system note that should never reach Claude',
            'sequence_number' => 3,
        ]);
        Message::factory()->for($conversation)->create([
            'sender_type' => SenderType::Player,
            'body' => 'Follow-up question',
            'sequence_number' => 4,
        ]);
        $conversation->forceFill(['last_sequence_number' => 4])->save();

        $claude = Mockery::mock(AnthropicService::class);
        $claude->shouldReceive('complete')
            ->once()
            ->withArgs(fn (string $systemPrompt, array $messages) => $messages === [
                ['role' => 'user', 'content' => 'First question'],
                ['role' => 'assistant', 'content' => 'First answer'],
                ['role' => 'user', 'content' => 'Follow-up question'],
            ])
            ->andReturn('An answer');
        $this->app->instance(AnthropicService::class, $claude);

        app(GenerateGameGuideReply::class)->generate($conversation, OriginPlatform::Desktop);
    }
}
