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
    Route::post('/conversations/{conversation}/messages', [ConversationMessageController::class, 'store'])
        ->middleware('throttle:60,1')
        ->name('conversations.messages.store');

    Route::get('/conversations/{conversation}/messages', [ConversationMessageController::class, 'index'])
        ->name('conversations.messages.index');
});
