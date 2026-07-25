<?php

namespace App\Providers;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Laravel\Pennant\Feature;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        // Defaults active for local/dev; the real rollout dials this via a
        // percentage-based Lottery per docs/chat-sync-spec.md's phased plan.
        Feature::define('chat-history-sync', fn () => true);

        if ($this->app->isProduction()) {
            URL::forceScheme('https');

            if (! config('session.secure')) {
                Log::warning(
                    'SESSION_SECURE_COOKIE is not enabled in production. Set SESSION_SECURE_COOKIE=true.'
                );
            }
        }
    }
}
