<?php

namespace App\Utils\Logger;

use Monolog\Logger;
use Monolog\Handler\StreamHandler;

class MyLogger implements LoggerInterface
{
    private string $base_path;

    private bool $all_logs_enabled;

    private bool $global_error_log_enabled;

    private bool $separate_process_type_enabled;

    private bool $add_process_name_enabled;

    private string $process_name;

    public function __construct()
    {
        $this->base_path = storage_path() . '/logs/';
        $this->all_logs_enabled = (bool) config('logger.enabled_all_logs', true);
        $this->global_error_log_enabled = true;
        $this->separate_process_type_enabled = false;
        $this->add_process_name_enabled = false;
        $this->process_name = php_sapi_name() ?: 'cli';
    }

    public function write(mixed $message, string $level = 'info', ?string $log_path = null, string $log_title = ''): bool
    {
        if ($this->all_logs_enabled) {

            $message = $this->formatMessage($message);
            $log_event_time = app()->make('log_event_time');

            $base_path = $this->base_path;

            if ($this->separate_process_type_enabled) {
                $base_path .= $this->process_name . '/';
                $this->makeDir($base_path);
            }

            if (is_null($log_path)) {
                $log_path = $this->buildLogName($base_path, 'general', '', $level);
            }

            $service_log = new Logger($log_event_time);
            $service_log->pushHandler(new StreamHandler($log_path, Logger::INFO));
            $service_log->log($level, $message);

            if ($level === 'error' && $this->global_error_log_enabled) {
                $log_path = $this->buildLogName($base_path, 'all-errors');
                $error_log = new Logger($log_event_time . ($log_title !== '' ? '-' . $log_title : ''));
                $error_log->pushHandler(new StreamHandler($log_path, Logger::ERROR));
                $error_log->log($level, $message);
            }
        }

        return true;
    }

    public function writeCommand(string $command_name, mixed $message, string $level = 'info', ?string $log_name = 'command'): bool
    {
        if ($this->all_logs_enabled) {

            $command_name = $this->formatName($command_name);

            $base_path = $this->base_path;

            if ($this->separate_process_type_enabled) {
                $base_path .= $this->process_name . '/';
                $this->makeDir($base_path);
            }

            $base_path .= 'commands/';
            $this->makeDir($base_path);

            $base_path .= $this->formatName($command_name) . '/';
            $this->makeDir($base_path);

            $log_path = $this->buildLogName($base_path, $log_name, $command_name, $level);

            $this->write($message, $level, $log_path, $command_name);
        }

        return true;
    }

    public function writeUtil(string $util_name, mixed $message, string $level = 'info', ?string $log_name = 'util'): bool
    {
        if ($this->all_logs_enabled) {

            $base_path = $this->base_path;

            $util_name = $this->formatName($util_name);

            if ($this->separate_process_type_enabled) {
                $base_path .= $this->process_name . '/';
                $this->makeDir($base_path);
            }

            $base_path .= $util_name . '/';
            $this->makeDir($base_path);

            $log_path = $this->buildLogName($base_path, $log_name, $util_name, $level);

            $this->write($message, $level, $log_path, $util_name);
        }

        return true;
    }

    private function makeDir(string $path): void
    {
        if (!is_dir($path)) {
            mkdir($path);
        }
    }

    private function buildLogName(string $base_path, ?string $log_name, ?string $name = null, ?string $level = null): string
    {
        if (!is_null($log_name)) {
            $log_path = $base_path . $log_name;
        } else {
            $log_path = $base_path . $name;
        }

        if (is_null($log_name)) {
            $log_path .= match ($level) {
                'info'    => '-info',
                'warning' => '-warning',
                'error'   => '-error',
                default   => '',
            };
        }

        if ($this->add_process_name_enabled) {
            $log_path .= '-' . $this->process_name;
        }

        return $log_path . '.log';
    }

    private function formatName(string $name): string
    {
        return strtolower(str_replace(' ', '_', $name));
    }

    private function formatMessage(mixed $message): string
    {
        if (is_array($message) || is_object($message)) {
            return print_r(is_object($message) ? get_object_vars($message) : $message, true);
        }

        return (string) $message;
    }
}
