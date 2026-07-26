<?php

namespace App\Actions;

use App\Jobs\BroadcastMessageJob;
use App\Jobs\GenerateGameGuideReplyJob;
use App\Models\Conversation;
use App\Models\Enums\OriginPlatform;
use App\Models\Enums\SenderType;
use App\Models\Message;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Laravel\Pennant\Feature;

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

            return $this->createLocked($conversation, [
                'sender_type' => SenderType::Player,
                'body' => $data['body'],
                'origin_platform' => $data['origin_platform'],
                'client_message_id' => $data['client_message_id'],
                'client_created_at' => $data['client_created_at'] ?? null,
            ]);
        });

        if ($message->wasRecentlyCreated) {
            Cache::forget("conversation:{$conversation->id}:recent");

            Log::info('game_guide.message_recorded', [
                'conversation_id' => $conversation->id,
                'user_id' => $conversation->user_id,
                'message_id' => $message->id,
                'sequence_number' => $message->sequence_number,
                'origin_platform' => $data['origin_platform'],
            ]);

            BroadcastMessageJob::dispatch($message);

            if (Feature::for($conversation->user)->active('game-guide-ai-replies')) {
                GenerateGameGuideReplyJob::dispatch($conversation, $message->origin_platform);
            }
        } else {
            Log::info('game_guide.message_replay_deduplicated', [
                'conversation_id' => $conversation->id,
                'user_id' => $conversation->user_id,
                'message_id' => $message->id,
                'client_message_id' => $data['client_message_id'],
            ]);
        }

        return $message;
    }

    /**
     * Record an assistant-authored reply. Always creates a new message — unlike
     * player sends, this internal path has no client retrying it, so there's no
     * idempotency key to dedupe on beyond the schema's own uniqueness constraint.
     */
    public function recordAssistantReply(Conversation $conversation, string $body, OriginPlatform $originPlatform): Message
    {
        $message = DB::transaction(fn () => $this->createLocked($conversation, [
            'sender_type' => SenderType::Assistant,
            'body' => $body,
            'origin_platform' => $originPlatform->value,
            'client_message_id' => (string) Str::uuid(),
            'client_created_at' => null,
        ]));

        Cache::forget("conversation:{$conversation->id}:recent");

        Log::info('game_guide.message_recorded', [
            'conversation_id' => $conversation->id,
            'user_id' => $conversation->user_id,
            'message_id' => $message->id,
            'sequence_number' => $message->sequence_number,
            'origin_platform' => $originPlatform->value,
        ]);

        BroadcastMessageJob::dispatch($message);

        return $message;
    }

    /**
     * Shared locked-increment-and-create logic (§4.1 of docs/chat-sync-spec.md):
     * takes a row lock on the conversation, increments its sequence counter,
     * and stamps the new message with that value. Must run inside a transaction.
     *
     * @param  array{sender_type: SenderType, body: string, origin_platform: string, client_message_id: string, client_created_at: ?string}  $data
     */
    private function createLocked(Conversation $conversation, array $data): Message
    {
        $locked = Conversation::query()
            ->whereKey($conversation->id)
            ->lockForUpdate()
            ->first();

        $sequenceNumber = $locked->last_sequence_number + 1;

        $message = Message::create([
            'conversation_id' => $locked->id,
            'sender_type' => $data['sender_type'],
            'body' => $data['body'],
            'origin_platform' => $data['origin_platform'],
            'client_message_id' => $data['client_message_id'],
            'client_created_at' => $data['client_created_at'],
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
    }
}
