<?php

namespace App\Jobs;

use App\Actions\GenerateGameGuideReply;
use App\Models\Message;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Throwable;

class GenerateGameGuideReplyJob implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly Message $triggeringMessage,
    ) {}

    public function handle(GenerateGameGuideReply $action): void
    {
        try {
            $action->generate($this->triggeringMessage);
        } catch (Throwable $e) {
            // Player message is already persisted and visible regardless of
            // whether Game Guide manages to reply — log and let the queue's
            // normal retry/failed-job handling take over rather than
            // surfacing this as a request-time error.
            Log::error('game_guide.assistant_reply_failed', [
                'conversation_id' => $this->triggeringMessage->conversation_id,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }
}
