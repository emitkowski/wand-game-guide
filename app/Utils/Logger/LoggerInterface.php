<?php

namespace App\Utils\Logger;

interface LoggerInterface
{
    public function write(mixed $message, string $level = 'info', ?string $log_path = null, string $log_title = ''): bool;

    public function writeCommand(string $command_name, mixed $message, string $level = 'info', ?string $log_name = 'command'): bool;

    public function writeUtil(string $util_name, mixed $message, string $level = 'info', ?string $log_name = 'util'): bool;
}
