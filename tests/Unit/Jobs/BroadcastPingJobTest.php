<?php

namespace Tests\Unit\Jobs;

use App\Events\BroadcastPing;
use App\Jobs\BroadcastPingJob;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class BroadcastPingJobTest extends TestCase
{
    public function test_handle_dispatches_the_broadcast_ping_event(): void
    {
        Event::fake([BroadcastPing::class]);

        (new BroadcastPingJob('user-123', '2026-01-01T00:00:00Z'))->handle();

        Event::assertDispatched(BroadcastPing::class, function (BroadcastPing $event): bool {
            return $event->userId === 'user-123' && $event->sentAt === '2026-01-01T00:00:00Z';
        });
    }
}
