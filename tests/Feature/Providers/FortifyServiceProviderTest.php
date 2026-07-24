<?php

namespace Tests\Feature\Providers;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Tests\TestCase;

class FortifyServiceProviderTest extends TestCase
{
    use RefreshDatabase;

    public function test_two_factor_rate_limiter_callback_returns_limit(): void
    {
        // The 'two-factor' rate limiter is registered in FortifyServiceProvider::boot().
        // We trigger the callback by resolving it and calling it with a fake request.
        $limiter = RateLimiter::limiter('two-factor');

        $this->assertNotNull($limiter);

        $request = Request::create('/two-factor-challenge', 'POST');
        $request->setLaravelSession(app('session.store'));

        $result = $limiter($request);

        $this->assertInstanceOf(Limit::class, $result);
    }
}
