<?php

namespace App\Providers;

use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Laravel\Pennant\Events\FeatureRetrieved;
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

        // Real hook for the rollout dashboards described in docs/chat-sync-spec.md §7 —
        // every check of the flag is logged with its resolved value and scope.
        Event::listen(function (FeatureRetrieved $event) {
            if ($event->feature === 'chat-history-sync') {
                Log::info('game_guide.feature_flag_exposure', [
                    'feature' => $event->feature,
                    'value' => $event->value,
                    'user_id' => $event->scope?->id,
                ]);
            }
        });

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
