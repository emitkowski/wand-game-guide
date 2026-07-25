<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('messages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('conversation_id')->constrained()->cascadeOnDelete();
            $table->string('sender_type');
            $table->text('body');
            $table->string('origin_platform');
            $table->uuid('client_message_id');
            $table->timestamp('client_created_at')->nullable();
            $table->unsignedBigInteger('sequence_number');
            $table->timestamps();

            $table->unique(['conversation_id', 'client_message_id']);
            $table->unique(['conversation_id', 'sequence_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('messages');
    }
};
