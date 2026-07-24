<?php

namespace App\Console\Commands\Utility;

use App\Console\Commands\CommandAbstract;
use App\Jobs\TestFailedJob;

class Test extends CommandAbstract
{
    /**
     * The console command name.
     *
     * @var string
     */
    protected $signature = 'utility:test {--queue}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test Command Functionality.';

    /**
     * Command Name for output
     *
     * @var string
     */
    protected $command_name = 'Test Command';

    /**
     * Execute the console command.
     *
     * @return mixed
     * @throws \Exception
     */
    public function handle()
    {
        $this->handleStart();

        if ($this->option('queue')) {
            dump('Testing Job Failure....');
            dispatch(new TestFailedJob());
        } else {
            sleep(4);
        }

        return $this->handleComplete(true);
    }


}
