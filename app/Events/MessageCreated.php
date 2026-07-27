<?php

namespace App\Events;

use App\Models\Message;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly Message $message,
    ) {}

    /**
     * Private, not public — routes/channels.php's authorizer re-checks
     * conversation ownership per socket connection, same guarantee the
     * REST endpoints enforce, so this channel can't be sniffed by guessing.
     */
    public function broadcastOn(): PrivateChannel
    {
        return new PrivateChannel('conversation.' . $this->message->conversation_id);
    }

    /**
     * A short, stable alias instead of the default (the fully-qualified
     * class name) — keeps the frontend's Echo listener name decoupled from
     * this class's namespace/location.
     */
    public function broadcastAs(): string
    {
        return 'message.created';
    }

    /**
     * Deliberately mirrors MessageResource's shape so the client can handle a
     * message identically whether it arrived via broadcast or via the sync
     * fetch — one parsing path, not two.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'id' => $this->message->id,
            'conversation_id' => $this->message->conversation_id,
            'sender_type' => $this->message->sender_type->value,
            'body' => $this->message->body,
            'origin_platform' => $this->message->origin_platform->value,
            'client_message_id' => $this->message->client_message_id,
            'sequence_number' => $this->message->sequence_number,
            'created_at' => $this->message->created_at?->toISOString(),
        ];
    }
}
