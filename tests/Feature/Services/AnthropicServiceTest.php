<?php

namespace Tests\Feature\Services;

use App\Services\AnthropicService;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use Tests\TestCase;

class AnthropicServiceTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config([
            'game_guide.anthropic_api_key' => 'test-key',
            'game_guide.model' => 'claude-sonnet-5',
            'game_guide.max_tokens' => 1024,
        ]);
    }

    public function test_it_returns_the_concatenated_text_content_from_the_response(): void
    {
        Http::fake([
            'api.anthropic.com/*' => Http::response([
                'content' => [
                    ['type' => 'text', 'text' => 'Hello '],
                    ['type' => 'text', 'text' => 'there!'],
                ],
            ]),
        ]);

        $text = app(AnthropicService::class)->complete('You are Game Guide.', [
            ['role' => 'user', 'content' => 'Hi'],
        ]);

        $this->assertSame('Hello there!', $text);
    }

    public function test_it_sends_the_system_prompt_wrapped_for_prompt_caching_and_the_configured_model(): void
    {
        Http::fake([
            'api.anthropic.com/*' => Http::response(['content' => []]),
        ]);

        app(AnthropicService::class)->complete('You are Game Guide.', [
            ['role' => 'user', 'content' => 'Hi'],
        ]);

        Http::assertSent(function ($request) {
            return $request->url() === 'https://api.anthropic.com/v1/messages'
                && $request->hasHeader('x-api-key', 'test-key')
                && $request['model'] === 'claude-sonnet-5'
                && $request['max_tokens'] === 1024
                && $request['system'] === [[
                    'type' => 'text',
                    'text' => 'You are Game Guide.',
                    'cache_control' => ['type' => 'ephemeral'],
                ]]
                && $request['messages'] === [['role' => 'user', 'content' => 'Hi']];
        });
    }

    public function test_it_throws_on_rate_limit(): void
    {
        Http::fake([
            'api.anthropic.com/*' => Http::response([], 429),
        ]);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('rate limit');

        app(AnthropicService::class)->complete('You are Game Guide.', []);
    }

    public function test_it_throws_on_a_failed_request(): void
    {
        Http::fake([
            'api.anthropic.com/*' => Http::response(['error' => 'boom'], 500),
        ]);

        $this->expectException(RuntimeException::class);

        app(AnthropicService::class)->complete('You are Game Guide.', []);
    }

    public function test_it_throws_when_no_api_key_is_configured(): void
    {
        config(['game_guide.anthropic_api_key' => null]);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('ANTHROPIC_API_KEY');

        app(AnthropicService::class);
    }
}
