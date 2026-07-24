<?php

namespace Tests\Feature\Api;

use Tests\TestCase;

class PingTest extends TestCase
{
    public function test_ping_returns_pong_message(): void
    {
        $response = $this->getJson('/api/v1/ping');

        $response->assertOk()
            ->assertJsonPath('message', 'pong');
    }

    public function test_ping_includes_timestamp(): void
    {
        $response = $this->getJson('/api/v1/ping');

        $response->assertOk()
            ->assertJsonStructure(['message', 'timestamp']);

        $this->assertNotEmpty($response->json('timestamp'));
    }

    public function test_ping_does_not_require_authentication(): void
    {
        $response = $this->getJson('/api/v1/ping');

        $response->assertOk();
    }
}
