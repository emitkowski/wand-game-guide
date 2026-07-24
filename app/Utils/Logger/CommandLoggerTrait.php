<?php

namespace App\Utils\Logger;

use Exception;

trait CommandLoggerTrait
{
    protected function logInfo(mixed $message, ?string $log_name = null): bool
    {
        try {
            \Logger::writeCommand(strtolower($this->getCommandName()), $message, 'info', $log_name);
        } catch (Exception $e) {
            $this->loggingError($e);
        }

        return true;
    }

    protected function logWarning(mixed $message, ?string $log_name = null): bool
    {
        try {
            \Logger::writeCommand(strtolower($this->getCommandName()), $message, 'warning', $log_name);
        } catch (Exception $e) {
            $this->loggingError($e);
        }

        return true;
    }

    protected function logError(mixed $message, ?string $log_name = null): bool
    {
        try {
            \Logger::writeCommand(strtolower($this->getCommandName()), $message, 'error', $log_name);
        } catch (Exception $e) {
            $this->loggingError($e);
        }

        return true;
    }

    private function loggingError(Exception $error): void
    {
        \Logger::write('Logger Error: ' . $error->getMessage(), 'info', storage_path() . '/logs/logger-errors.log');
    }
}
