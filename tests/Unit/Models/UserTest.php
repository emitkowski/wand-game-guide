<?php

namespace Tests\Unit\Models;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_is_assigned_a_uuid_on_creation(): void
    {
        $user = User::factory()->create();

        $this->assertMatchesRegularExpression(
            '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/',
            $user->id
        );
    }

    public function test_two_users_have_distinct_uuids(): void
    {
        $a = User::factory()->create();
        $b = User::factory()->create();

        $this->assertNotEquals($a->id, $b->id);
    }

    public function test_email_is_lowercased_on_save(): void
    {
        $user = User::factory()->create(['email' => 'TEST@EXAMPLE.COM']);

        $this->assertSame('test@example.com', $user->email);
    }
}
