<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Anthropic API Configuration
    |--------------------------------------------------------------------------
    | Same setup as the sibling "advisor" project's AnthropicService — a
    | direct Messages API integration, no SDK.
    */
    'anthropic_api_key' => env('ANTHROPIC_API_KEY'),
    'model' => env('GAME_GUIDE_MODEL', 'claude-sonnet-5'),
    'max_tokens' => env('GAME_GUIDE_MAX_TOKENS', 1024),

    /*
    |--------------------------------------------------------------------------
    | Reply Generation
    |--------------------------------------------------------------------------
    | Max prior messages (player + assistant) sent as context for each reply.
    | Older history is dropped, not summarized — mirrors advisor's thread_trim_length.
    */
    'max_thread_messages' => env('GAME_GUIDE_MAX_THREAD_MESSAGES', 30),

];
