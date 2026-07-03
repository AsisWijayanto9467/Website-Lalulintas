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
        Schema::create('game_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('player_id')->constrained('players')->cascadeOnDelete();
            $table->string('mode', 20);                           // skenario, kuis (~15 bytes)
            $table->unsignedInteger('session_score')->default(0);  // 4 bytes
            $table->unsignedSmallInteger('correct_count')->default(0); // 2 bytes
            $table->unsignedSmallInteger('total_questions')->default(0); // 2 bytes
            $table->json('answers_detail')->nullable();            // Detail jawaban (~300 bytes)
            $table->timestamp('started_at')->nullable();           // 8 bytes
            $table->timestamp('ended_at')->nullable();             // 8 bytes
            $table->timestamps();
            $table->index('player_id');
            $table->index('mode');
            $table->index('session_score');
            $table->index('started_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('game_sessions');
    }
};
