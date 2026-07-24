<?php

namespace App\Console\Commands;

use App\Utils\Logger\CommandLoggerTrait;
use Illuminate\Console\Command;

abstract class CommandAbstract extends Command
{
    use CommandLoggerTrait;

    protected bool $is_logged = true;

    protected bool $is_timed = true;

    protected bool $is_locked = true;

    protected ?float $start_time = null;

    protected ?float $end_time = null;

    protected ?float $run_time = null;

    protected function handleStart(): void
    {
        set_time_limit(0);

        if ($this->is_timed) {
            $this->startTimer();
        }
    }

    protected function handleComplete(bool $result = true): int
    {
        if ($this->is_timed) {
            $run_time = $this->stopTimer();
        }

        $info_string = $this->getCommandName() . ' has';
        $info_string .= $result ? ' completed' : ' failed';

        if (isset($run_time)) {
            $info_string .= ' after ' . $run_time . ' sec(s)';
        }

        $info_string .= '!';

        if ($result) {
            $this->info($info_string);
            if ($this->is_logged) {
                $this->logInfo($info_string);
            }
        } else {
            $this->error($info_string);
            if ($this->is_logged) {
                $this->logError($info_string);
            }
        }

        return $result ? self::SUCCESS : self::FAILURE;
    }

    protected function startTimer(): float
    {
        $this->start_time = microtime(true);

        return $this->start_time;
    }

    protected function stopTimer(): float
    {
        $this->end_time = microtime(true);
        $this->run_time = round($this->end_time - $this->start_time, 3);

        return $this->run_time;
    }

    public function getCommandName(): string
    {
        if (!isset($this->command_name)) {
            throw new \Exception('Command Name not set in class: ' . static::class);
        }

        return $this->command_name;
    }
}
