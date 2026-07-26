<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class AnthropicService
{
    private string $apiKey;

    private string $model;

    private int $maxTokens;

    private string $apiBase = 'https://api.anthropic.com/v1';

    public function __construct()
    {
        $this->apiKey = config('game_guide.anthropic_api_key')
            ?: throw new RuntimeException('ANTHROPIC_API_KEY is not configured.');
        $this->model = config('game_guide.model', 'claude-sonnet-5');
        $this->maxTokens = config('game_guide.max_tokens', 1024);
    }

    /**
     * Send a message and return the full response text.
     *
     * @param  array<int, array{role: string, content: string}>  $messages
     */
    public function complete(string $systemPrompt, array $messages): string
    {
        $response = Http::withHeaders($this->headers())
            ->timeout(60)
            ->post("{$this->apiBase}/messages", [
                'model' => $this->model,
                'max_tokens' => $this->maxTokens,
                'system' => $this->cachedSystem($systemPrompt),
                'messages' => $messages,
            ]);

        if ($response->status() === 429) {
            throw new RuntimeException('Anthropic API rate limit exceeded. Please try again shortly.');
        }

        if ($response->failed()) {
            Log::error('game_guide.anthropic_api_error', [
                'status' => $response->status(),
                'error_type' => $response->json('error.type'),
                'error_message' => $response->json('error.message'),
            ]);

            throw new RuntimeException('Anthropic API request failed.');
        }

        return collect($response->json('content', []))
            ->where('type', 'text')
            ->pluck('text')
            ->implode('');
    }

    private function headers(): array
    {
        return [
            'x-api-key' => $this->apiKey,
            'anthropic-version' => '2023-06-01',
            'anthropic-beta' => 'prompt-caching-2024-07-31',
            'content-type' => 'application/json',
        ];
    }

    /**
     * Wrap the system prompt in the cache_control block format — Anthropic
     * caches this server-side for 5 min so repeated replies in the same
     * conversation (identical personality preamble) cost ~10% of normal
     * input price on cache hits.
     *
     * @return array<int, array{type: string, text: string, cache_control: array{type: string}}>
     */
    private function cachedSystem(string $systemPrompt): array
    {
        return [
            [
                'type' => 'text',
                'text' => $systemPrompt,
                'cache_control' => ['type' => 'ephemeral'],
            ],
        ];
    }
}
