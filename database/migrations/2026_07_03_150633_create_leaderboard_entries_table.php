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
        Schema::create('leaderboard_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('player_id')->constrained('players')->cascadeOnDelete();
            $table->foreignId('game_session_id')->nullable()->constrained('game_sessions')->nullOnDelete();
            $table->string('mode', 20)->nullable();               // Mode game (~15 bytes)
            $table->unsignedInteger('skor');                       // 4 bytes
            $table->string('rank_label', 50);                     // Snapshot level (~20 bytes)
            $table->timestamps();
            $table->index('skor');
            $table->index(['mode', 'skor']);                      // Composite index
            $table->index('player_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leaderboard_entries');
    }
};
