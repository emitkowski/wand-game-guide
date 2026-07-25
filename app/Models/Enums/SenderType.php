<?php

namespace App\Models\Enums;

enum SenderType: string
{
    case Player = 'player';
    case Assistant = 'assistant';
    case System = 'system';
}
