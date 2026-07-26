<?php

namespace Tests;

use App\Jobs\GenerateGameGuideReplyJob;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\Queue;
use Laravel\Fortify\Features;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // QUEUE_CONNECTION=sync (phpunit.xml) intentionally runs most jobs
        // inline so BroadcastMessageJob/MessageCreated get exercised by
        // ordinary message-sending tests (see docs/memory/testing.md). But
        // GenerateGameGuideReplyJob calls the real Anthropic API — fake only
        // that job so unrelated tests never make a live network call; tests
        // that actually exercise the AI reply path call the underlying
        // App\Actions\GenerateGameGuideReply directly instead.
        Queue::fake([GenerateGameGuideReplyJob::class]);
    }

    protected function skipUnlessFortifyHas(string $feature, ?string $message = null): void
    {
        if (! Features::enabled($feature)) {
            $this->markTestSkipped($message ?? "Fortify feature [{$feature}] is not enabled.");
        }
    }
}
