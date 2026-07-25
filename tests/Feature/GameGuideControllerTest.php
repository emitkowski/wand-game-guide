<?php

namespace Tests\Feature;

use App\Models\Conversation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class GameGuideControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_visiting_game_guide_creates_a_conversation_for_a_new_user(): void
    {
        $user = User::factory()->create();

        $this->assertSame(0, $user->conversations()->count());

        $response = $this->actingAs($user)->get(route('game-guide.index'));

        $response->assertOk();
        $this->assertSame(1, $user->conversations()->count());

        $conversation = $user->conversations()->sole();

        $response->assertInertia(fn (Assert $page) => $page
            ->component('game-guide/Chat')
            ->where('conversationId', $conversation->id)
        );
    }

    public function test_visiting_game_guide_again_reuses_the_existing_conversation(): void
    {
        $user = User::factory()->create();
        $conversation = Conversation::factory()->for($user)->create();

        $response = $this->actingAs($user)->get(route('game-guide.index'));

        $response->assertOk();
        $this->assertSame(1, $user->conversations()->count());
        $response->assertInertia(fn (Assert $page) => $page
            ->where('conversationId', $conversation->id)
        );
    }

    public function test_guests_are_redirected_to_login(): void
    {
        $response = $this->get(route('game-guide.index'));

        $response->assertRedirect(route('login'));
    }
}
