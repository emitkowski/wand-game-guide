<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\FetchConversationMessages;
use App\Actions\RecordConversationMessage;
use App\Http\Requests\Api\V1\IndexMessagesRequest;
use App\Http\Requests\Api\V1\StoreMessageRequest;
use App\Http\Resources\MessageResource;
use App\Models\Conversation;
use Illuminate\Http\JsonResponse;

class ConversationMessageController extends Controller
{
    /**
     * Serves both scroll-back and reconnect delta-sync from the same cursor
     * mechanism (§4.4 of docs/chat-sync-spec.md) — no separate endpoint needed.
     */
    public function index(
        IndexMessagesRequest $request,
        Conversation $conversation,
        FetchConversationMessages $action,
    ): JsonResponse {
        return $action->fetch($request, $conversation);
    }

    /**
     * 201 for a genuinely new message, 200 when `client_message_id` matched an
     * existing one — the idempotent-replay signal an offline outbox relies on
     * to tell "created" apart from "already had this" without a second field.
     */
    public function store(
        StoreMessageRequest $request,
        Conversation $conversation,
        RecordConversationMessage $action,
    ): JsonResponse {
        $message = $action->record($conversation, $request->validated());

        return (new MessageResource($message))
            ->response()
            ->setStatusCode($message->wasRecentlyCreated ? 201 : 200);
    }
}
