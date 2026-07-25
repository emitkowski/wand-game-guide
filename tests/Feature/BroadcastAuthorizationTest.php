<?php

namespace Tests\Feature;

use App\Models\Conversation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BroadcastAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Testing forces BROADCAST_CONNECTION=null (phpunit.xml), whose
        // NullBroadcaster::auth() is a no-op that always authorizes — it
        // never actually calls the registered channel callbacks. Switch to
        // the real 'reverb' (Pusher-protocol) driver so these tests exercise
        // the actual authorization logic in routes/channels.php.
        config([
            'broadcasting.default' => 'reverb',
            'broadcasting.connections.reverb.key' => 'testing-key',
            'broadcasting.connections.reverb.secret' => 'testing-secret',
            'broadcasting.connections.reverb.app_id' => 'testing-app-id',
        ]);

        // routes/channels.php already ran once at boot, registering channels
        // against whatever connection was default THEN (null, per phpunit.xml)
        // — a distinct broadcaster instance from 'reverb' resolved just above,
        // with its own separate (empty) $channels array. Re-run it now so the
        // registrations attach to the connection these tests actually use.
        require base_path('routes/channels.php');
    }

    public function test_a_user_can_authorize_their_own_private_user_channel(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/broadcasting/auth', [
            'socket_id' => '1234.1234',
            'channel_name' => 'private-App.Models.User.'.$user->id,
        ]);

        $response->assertOk();
    }

    public function test_a_user_cannot_authorize_another_users_private_user_channel(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/broadcasting/auth', [
            'socket_id' => '1234.1234',
            'channel_name' => 'private-App.Models.User.'.$otherUser->id,
        ]);

        $response->assertForbidden();
    }

    public function test_a_user_can_authorize_their_own_conversation_channel(): void
    {
        $user = User::factory()->create();
        $conversation = Conversation::factory()->for($user)->create();

        $response = $this->actingAs($user)->postJson('/broadcasting/auth', [
            'socket_id' => '1234.1234',
            'channel_name' => 'private-conversation.'.$conversation->id,
        ]);

        $response->assertOk();
    }

    public function test_a_user_cannot_authorize_another_users_conversation_channel(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $conversation = Conversation::factory()->for($owner)->create();

        $response = $this->actingAs($intruder)->postJson('/broadcasting/auth', [
            'socket_id' => '1234.1234',
            'channel_name' => 'private-conversation.'.$conversation->id,
        ]);

        $response->assertForbidden();
    }
}
