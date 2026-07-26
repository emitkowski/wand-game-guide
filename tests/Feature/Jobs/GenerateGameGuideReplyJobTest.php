<?php

namespace Tests\Feature\Jobs;

use App\Actions\GenerateGameGuideReply;
use App\Jobs\GenerateGameGuideReplyJob;
use App\Models\Conversation;
use App\Models\Enums\OriginPlatform;
use App\Models\Message;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use RuntimeException;
use Tests\TestCase;

class GenerateGameGuideReplyJobTest extends TestCase
{
    use RefreshDatabase;

    public function test_handle_delegates_to_the_generate_reply_action(): void
    {
        $conversation = Conversation::factory()->for(User::factory()->create())->create();
        $triggeringMessage = Message::factory()->for($conversation)->create([
            'origin_platform' => OriginPlatform::Overlay,
        ]);

        $action = Mockery::mock(GenerateGameGuideReply::class);
        $action->shouldReceive('generate')
            ->once()
            ->with(Mockery::on(fn (Message $m) => $m->is($triggeringMessage)))
            ->andReturn(Message::factory()->for($conversation)->make());

        $job = new GenerateGameGuideReplyJob($triggeringMessage);
        $job->handle($action);

        $this->assertTrue(true);
    }

    public function test_handle_logs_and_rethrows_when_the_action_fails(): void
    {
        $conversation = Conversation::factory()->for(User::factory()->create())->create();
        $triggeringMessage = Message::factory()->for($conversation)->create([
            'origin_platform' => OriginPlatform::Web,
        ]);

        $action = Mockery::mock(GenerateGameGuideReply::class);
        $action->shouldReceive('generate')->once()->andThrow(new RuntimeException('Anthropic API request failed.'));

        $job = new GenerateGameGuideReplyJob($triggeringMessage);

        $this->expectException(RuntimeException::class);
        $job->handle($action);
    }
}
