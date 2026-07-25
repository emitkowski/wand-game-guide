<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'eric.mitkowski@gmail.com'],
            [
                'name'     => 'Eric Mitkowski',
                'password' => Hash::make('secret'),
            ],
        );

        User::firstOrCreate(
            ['email' => 'test@wand.com'],
            [
                'name'              => 'Test User',
                'password'          => Hash::make('gameguidetest'),
                'email_verified_at' => now(),
            ],
        );
    }
}
