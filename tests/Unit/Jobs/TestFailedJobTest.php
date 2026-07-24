<?php

namespace Tests\Unit\Jobs;

use App\Jobs\TestFailedJob;
use Tests\TestCase;

class TestFailedJobTest extends TestCase
{
    public function test_handle_throws_exception(): void
    {
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('purposeful exception');

        $job = new TestFailedJob();
        $job->handle();
    }
}
