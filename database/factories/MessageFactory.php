<?php

namespace Database\Factories;

use App\Models\Conversation;
use App\Models\Enums\OriginPlatform;
use App\Models\Enums\SenderType;
use App\Models\Message;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Message>
 */
class MessageFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'conversation_id' => Conversation::factory(),
            'sender_type' => SenderType::Player,
            'body' => fake()->sentence(),
            'origin_platform' => fake()->randomElement(OriginPlatform::cases()),
            'client_message_id' => (string) Str::uuid(),
            'client_created_at' => null,
            'sequence_number' => fake()->unique()->numberBetween(1, 1_000_000),
        ];
    }
}
