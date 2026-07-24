<?php

namespace Tests\Feature\Api;

use App\Jobs\BroadcastPingJob;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class BroadcastPingTest extends TestCase
{
    use RefreshDatabase;

    public function test_broadcast_ping_dispatches_job(): void
    {
        Queue::fake();

        $user = User::factory()->create();

        $this->actingAs($user)
            ->postJson('/api/v1/broadcast-ping')
            ->assertNoContent();

        Queue::assertPushed(BroadcastPingJob::class, function (BroadcastPingJob $job) use ($user): bool {
            return $job->userId === (string) $user->id;
        });
    }

    public function test_broadcast_ping_requires_authentication(): void
    {
        $this->postJson('/api/v1/broadcast-ping')
            ->assertUnauthorized();
    }
}
