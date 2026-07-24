<?php

namespace App\Jobs;

use App\Events\BroadcastPing;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class BroadcastPingJob implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly string $userId,
        public readonly string $sentAt,
    ) {}

    public function handle(): void
    {
        BroadcastPing::dispatch($this->userId, $this->sentAt);
    }
}
