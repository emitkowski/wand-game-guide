<?php

use App\Http\Controllers\Api\V1\ConversationMessageController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Laravel\Pennant\Middleware\EnsureFeaturesAreActive;

Route::get('/ping', fn () => ['message' => 'pong', 'timestamp' => now()->toIso8601String()])->name('ping');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', fn (Request $request) => $request->user());

    Route::post('/broadcast-ping', function (Request $request) {
        \App\Jobs\BroadcastPingJob::dispatch(
            (string) $request->user()->id,
            now()->toISOString(),
        );

        return response()->noContent();
    })->name('broadcast-ping');
});

Route::middleware(['auth:sanctum', EnsureFeaturesAreActive::using('chat-history-sync')])->group(function () {
    // Only the write path is throttled: a buggy/abusive client hammering POST
    // has compounding cost per request — a row lock, a DB write, a queued
    // broadcast job, and in production a paid Anthropic call. GET is read-only
    // and the common (no cursor/limit) shape is Redis-cached, so it's cheap by
    // default — but a request that *does* pass cursor/limit bypasses that cache
    // (see FetchConversationMessages::fetch()) and isn't throttled anywhere in
    // this app, so it's not fully protected against being hammered either.
    Route::post('/conversations/{conversation}/messages', [ConversationMessageController::class, 'store'])
        ->middleware('throttle:60,1')
        ->name('conversations.messages.store');

    Route::get('/conversations/{conversation}/messages', [ConversationMessageController::class, 'index'])
        ->name('conversations.messages.index');
});
