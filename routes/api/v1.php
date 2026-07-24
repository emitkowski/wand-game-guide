<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

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
