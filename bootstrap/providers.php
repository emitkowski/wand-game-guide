<?php

use App\Providers\AppServiceProvider;
use App\Providers\FortifyServiceProvider;
use App\Providers\TelescopeServiceProvider;
use Laravel\Telescope\TelescopeApplicationServiceProvider;

return [
    AppServiceProvider::class,
    FortifyServiceProvider::class,
    ...(class_exists(TelescopeApplicationServiceProvider::class) ? [TelescopeServiceProvider::class] : []),
];
