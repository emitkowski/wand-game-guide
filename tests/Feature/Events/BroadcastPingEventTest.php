<?php

namespace Tests\Feature\Events;

use App\Events\BroadcastPing;
use Illuminate\Broadcasting\Channel;
use Tests\TestCase;

class BroadcastPingEventTest extends TestCase
{
    public function test_broadcast_on_returns_channel_with_user_id(): void
    {
        $event = new BroadcastPing('user-123', '2026-01-01T00:00:00Z');

        $channel = $event->broadcastOn();

        $this->assertInstanceOf(Channel::class, $channel);
        $this->assertStringContainsString('user-123', $channel->name);
    }

    public function test_broadcast_as_returns_ping(): void
    {
        $event = new BroadcastPing('user-123', '2026-01-01T00:00:00Z');

        $this->assertSame('ping', $event->broadcastAs());
    }

    public function test_broadcast_with_returns_sent_at(): void
    {
        $event = new BroadcastPing('user-123', '2026-01-01T12:30:00Z');

        $payload = $event->broadcastWith();

        $this->assertSame('2026-01-01T12:30:00Z', $payload['sent_at']);
    }

    public function test_event_stores_constructor_properties(): void
    {
        $event = new BroadcastPing('user-abc', '2026-05-01T10:00:00Z');

        $this->assertSame('user-abc', $event->userId);
        $this->assertSame('2026-05-01T10:00:00Z', $event->sentAt);
    }
}
