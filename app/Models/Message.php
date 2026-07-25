<?php

namespace App\Models;

use App\Models\Enums\OriginPlatform;
use App\Models\Enums\SenderType;
use Database\Factories\MessageFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Message extends Model
{
    /** @use HasFactory<MessageFactory> */
    use HasFactory;

    use HasUuids;

    protected $fillable = [
        'conversation_id',
        'sender_type',
        'body',
        'origin_platform',
        'client_message_id',
        'client_created_at',
        'sequence_number',
    ];

    protected function casts(): array
    {
        return [
            'sender_type' => SenderType::class,
            'origin_platform' => OriginPlatform::class,
            'client_created_at' => 'datetime',
            'sequence_number' => 'integer',
        ];
    }

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }
}
