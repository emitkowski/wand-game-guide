<?php

namespace App\Facades;

use Illuminate\Support\Facades\Facade;

/**
 * @method static bool write(mixed $message, string $level = 'info', string $log_path = null, string $log_title = '')
 * @method static bool writeCommand(string $command_name, mixed $message, string $level = 'info', string $log_name = 'command')
 * @method static bool writeUtil(string $util_name, mixed $message, string $level = 'info', string $log_name = 'util')
 *
 * @see \App\Utils\Logger\MyLogger
 */
class Logger extends Facade
{
    protected static function getFacadeAccessor(): string
    {
        return 'logger.custom';
    }
}
