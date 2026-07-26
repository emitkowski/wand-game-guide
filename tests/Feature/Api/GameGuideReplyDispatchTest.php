<?php

namespace Tests\Feature\Api;

use App\Jobs\GenerateGameGuideReplyJob;
use App\Models\Conversation;
use App\Models\Enums\OriginPlatform;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;
use Laravel\Pennant\Feature;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class GameGuideReplyDispatchTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_new_player_message_dispatches_a_reply_job(): void
    {
        $user = User::factory()->create();
        $conversation = Conversation::factory()->for($user)->create();

        Sanctum::actingAs($user);

        $this->postJson("/api/v1/conversations/{$conversation->id}/messages", [
            'body' => 'What wand should I get?',
            'client_message_id' => (string) Str::uuid(),
            'origin_platform' => 'web',
        ])->assertCreated();

        Queue::assertPushed(GenerateGameGuideReplyJob::class, function (GenerateGameGuideReplyJob $job) use ($conversation) {
            return $job->conversation->is($conversation) && $job->originPlatform === OriginPlatform::Web;
        });
    }

    public function test_an_idempotent_replay_does_not_dispatch_a_second_reply_job(): void
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

        $this->postJson("/api/v1/conversations/{$conversation->id}/messages", $payload)->assertCreated();
        $this->postJson("/api/v1/conversations/{$conversation->id}/messages", $payload)->assertOk();

        Queue::assertPushed(GenerateGameGuideReplyJob::class, 1);
    }

    public function test_reply_job_is_not_dispatched_when_the_feature_flag_is_inactive(): void
    {
        Feature::define('game-guide-ai-replies', fn () => false);

        $user = User::factory()->create();
        $conversation = Conversation::factory()->for($user)->create();

        Sanctum::actingAs($user);

        $this->postJson("/api/v1/conversations/{$conversation->id}/messages", [
            'body' => 'What wand should I get?',
            'client_message_id' => (string) Str::uuid(),
            'origin_platform' => 'web',
        ])->assertCreated();

        Queue::assertNotPushed(GenerateGameGuideReplyJob::class);
    }
}
