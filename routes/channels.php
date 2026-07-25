<?php

use App\Models\Conversation;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    // $user->id is a UUID string (HasUuids) — casting to (int) previously made
    // both sides always 0, so this always authorized regardless of user (BUG-1).
    return $user->id === $id;
});

Broadcast::channel('conversation.{conversationId}', function ($user, $conversationId) {
    return Conversation::where('id', $conversationId)
        ->where('user_id', $user->id)
        ->exists();
});
