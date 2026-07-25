<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\RecordConversationMessage;
use App\Http\Requests\Api\V1\IndexMessagesRequest;
use App\Http\Requests\Api\V1\StoreMessageRequest;
use App\Http\Resources\MessageResource;
use App\Models\Conversation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ConversationMessageController extends Controller
{
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

    public function index(IndexMessagesRequest $request, Conversation $conversation): AnonymousResourceCollection
    {
        $messages = $conversation->messages()
            ->orderBy('sequence_number')
            ->cursorPaginate($request->integer('limit', 50));

        return MessageResource::collection($messages);
    }
}
