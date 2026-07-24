<?php

namespace App\Providers;

use App\Utils\Logger\MyLogger;
use Illuminate\Foundation\AliasLoader;
use Illuminate\Support\ServiceProvider;

class LoggerServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton('logger.custom', fn() => new MyLogger());

        $this->app->singleton('log_event_time', fn() => now()->format('Y-m-d_H-i-s'));

        $loader = AliasLoader::getInstance();
        $loader->alias('Logger', \App\Facades\Logger::class);
    }
}
