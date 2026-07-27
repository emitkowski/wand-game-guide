<?php

namespace App\Jobs;

use App\Events\MessageCreated;
use App\Models\Message;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class BroadcastMessageJob implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly Message $message,
    ) {}

    /**
     * Deliberately just this one line — the job's whole purpose is to move
     * the broadcast off the request/response path (see CODE_PATTERNS.md's
     * "Real-time is a queued side effect of a write"), not to do more work.
     */
    public function handle(): void
    {
        MessageCreated::dispatch($this->message);
    }
}
