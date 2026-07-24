<?php

namespace Tests\Feature\Providers;

use App\Providers\AppServiceProvider;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class AppServiceProviderTest extends TestCase
{
    use RefreshDatabase;

    public function test_boot_forces_https_scheme_in_production(): void
    {
        // Simulate a production environment
        $this->app->instance('env', 'production');

        URL::shouldReceive('forceScheme')->once()->with('https');

        $provider = new AppServiceProvider($this->app);
        $provider->boot();
    }

    public function test_boot_does_not_force_https_in_non_production(): void
    {
        URL::shouldReceive('forceScheme')->never();

        // Default environment is 'testing'
        $provider = new AppServiceProvider($this->app);
        $provider->boot();
    }
}
