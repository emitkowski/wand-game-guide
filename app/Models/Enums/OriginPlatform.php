<?php

namespace App\Models\Enums;

enum OriginPlatform: string
{
    case Desktop = 'desktop';
    case Web = 'web';
    case Overlay = 'overlay';
}
