<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MessageResource extends JsonResource
{
    /**
     * `sequence_number`, not `id` or `created_at`, is what a client should sort
     * on — it's the only authoritative ordering signal (see docs/SCHEMA.md).
     * `client_created_at` is included purely as a display hint.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'conversation_id' => $this->conversation_id,
            'sender_type' => $this->sender_type->value,
            'body' => $this->body,
            'origin_platform' => $this->origin_platform->value,
            'client_message_id' => $this->client_message_id,
            'sequence_number' => $this->sequence_number,
            'client_created_at' => $this->client_created_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
