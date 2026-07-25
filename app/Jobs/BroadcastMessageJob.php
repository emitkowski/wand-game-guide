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

    public function handle(): void
    {
        MessageCreated::dispatch($this->message);
    }
}
