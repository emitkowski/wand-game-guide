<?php

namespace App\Actions;

use App\Jobs\BroadcastMessageJob;
use App\Models\Conversation;
use App\Models\Enums\SenderType;
use App\Models\Message;
use Illuminate\Support\Facades\DB;

class RecordConversationMessage
{
    /**
     * Record a player-authored message, deduplicating on the client-generated
     * idempotency key so replayed offline sends never create duplicates.
     *
     * @param  array{body: string, client_message_id: string, origin_platform: string, client_created_at: ?string}  $data
     */
    public function record(Conversation $conversation, array $data): Message
    {
        $message = DB::transaction(function () use ($conversation, $data) {
            $existing = Message::query()
                ->where('conversation_id', $conversation->id)
                ->where('client_message_id', $data['client_message_id'])
                ->first();

            if ($existing !== null) {
                return $existing;
            }

            $locked = Conversation::query()
                ->whereKey($conversation->id)
                ->lockForUpdate()
                ->first();

            $sequenceNumber = $locked->last_sequence_number + 1;

            $message = Message::create([
                'conversation_id' => $locked->id,
                'sender_type' => SenderType::Player,
                'body' => $data['body'],
                'origin_platform' => $data['origin_platform'],
                'client_message_id' => $data['client_message_id'],
                'client_created_at' => $data['client_created_at'] ?? null,
                'sequence_number' => $sequenceNumber,
            ]);

            // forceFill: last_sequence_number/last_message_at are deliberately absent
            // from Conversation::$fillable so no request path can ever mass-assign
            // them; this is the one trusted internal writer.
            $locked->forceFill([
                'last_sequence_number' => $sequenceNumber,
                'last_message_at' => $message->created_at,
            ])->save();

            return $message;
        });

        if ($message->wasRecentlyCreated) {
            BroadcastMessageJob::dispatch($message);
        }

        return $message;
    }
}
