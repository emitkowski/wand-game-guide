<?php

namespace App\Utils\Logger;

use Exception;

trait UtilLoggerTrait
{
    public function getUtilName(): string
    {
        if (!isset($this->util_name)) {
            throw new \Exception('Util Name not set in class: ' . static::class);
        }

        return strtolower($this->util_name);
    }

    public function setUtilName(string $name): void
    {
        if (!isset($this->util_name)) {
            $this->util_name = $name;
        }
    }

    protected function logInfo(mixed $message, ?string $log_name = null): bool
    {
        try {
            \Logger::writeUtil($this->getUtilName(), $message, 'info', $log_name);
        } catch (Exception $e) {
            $this->loggingError($e);
        }

        return true;
    }

    protected function logWarning(mixed $message, ?string $log_name = null): bool
    {
        try {
            \Logger::writeUtil($this->getUtilName(), $message, 'warning', $log_name);
        } catch (Exception $e) {
            $this->loggingError($e);
        }

        return true;
    }

    protected function logError(mixed $message, ?string $log_name = null): bool
    {
        try {
            \Logger::writeUtil($this->getUtilName(), $message, 'error', $log_name);
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
