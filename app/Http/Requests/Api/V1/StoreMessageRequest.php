<?php

namespace App\Http\Requests\Api\V1;

use App\Models\Conversation;
use App\Models\Enums\OriginPlatform;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var Conversation $conversation */
        $conversation = $this->route('conversation');

        return $conversation->user_id === $this->user()->id;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'body' => ['required', 'string', 'max:8000'],
            'client_message_id' => ['required', 'uuid'],
            'origin_platform' => ['required', Rule::enum(OriginPlatform::class)],
            'client_created_at' => ['nullable', 'date'],
        ];
    }
}
