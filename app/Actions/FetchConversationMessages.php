<?php

namespace App\Actions;

use App\Http\Requests\Api\V1\IndexMessagesRequest;
use App\Http\Resources\MessageResource;
use App\Models\Conversation;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class FetchConversationMessages
{
    /**
     * Returns the most recent messages when called with no cursor/limit
     * (cacheable — see §6 of docs/chat-sync-spec.md), or a page relative
     * to a client-supplied cursor otherwise. Always ascending/chronological.
     */
    public function fetch(IndexMessagesRequest $request, Conversation $conversation): JsonResponse
    {
        $startedAt = microtime(true);
        $limit = $request->integer('limit', 50);
        $cacheable = ! $request->has('cursor') && ! $request->has('limit');

        if (! $cacheable) {
            $response = $this->paginatedMessages($conversation, $limit);
            $this->logSync($conversation, $request, 'bypass', $startedAt);

            return $response;
        }

        $cacheKey = "conversation:{$conversation->id}:recent";
        $cacheHit = Cache::has($cacheKey);

        $payload = Cache::remember(
            $cacheKey,
            now()->addMinutes(5),
            fn () => $this->paginatedMessages($conversation, $limit)->getData(true),
        );

        $this->logSync($conversation, $request, $cacheHit ? 'hit' : 'miss', $startedAt);

        return response()->json($payload);
    }

    /**
     * With no cursor, cursorPaginate() on a descending query returns the
     * most recent $limit messages — reversing only the resource collection
     * (not the underlying paginator) restores ascending display order
     * without corrupting next_cursor/prev_cursor computation, which Laravel
     * derives lazily from the paginator's own untouched item list.
     */
    private function paginatedMessages(Conversation $conversation, int $limit): JsonResponse
    {
        $messages = $conversation->messages()
            ->orderByDesc('sequence_number')
            ->cursorPaginate($limit);

        $resource = MessageResource::collection($messages);
        $resource->collection = $resource->collection->reverse()->values();

        return $resource->response();
    }

    /**
     * `duration_ms` spans the whole fetch() call, not just the query, so a
     * cache hit's near-zero latency and a cache miss/bypass's real query time
     * are directly comparable in the telemetry channel (see CODE_PATTERNS.md).
     */
    private function logSync(Conversation $conversation, IndexMessagesRequest $request, string $cacheStatus, float $startedAt): void
    {
        Log::channel('game_guide_telemetry')->info('game_guide.messages_synced', [
            'conversation_id' => $conversation->id,
            'user_id' => $conversation->user_id,
            'cursor_provided' => $request->has('cursor'),
            'cache' => $cacheStatus,
            'duration_ms' => (int) round((microtime(true) - $startedAt) * 1000),
        ]);
    }
}
