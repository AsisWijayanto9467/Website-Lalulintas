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
        Schema::create('players', function (Blueprint $table) {
            $table->id();
            $table->string('nama', 100)->nullable();
            $table->string('player_token', 64)->unique();        // Token untuk localStorage
            $table->unsignedInteger('total_poin')->default(0);
            $table->foreignId('player_level_id')->nullable()->constrained('player_levels')->nullOnDelete();
            $table->unsignedInteger('high_score')->default(0);
            $table->unsignedInteger('session_count')->default(0);
            $table->json('modes_dimainkan')->nullable();
            $table->date('last_played')->nullable();
            $table->timestamps();
            $table->index('player_token');
            $table->index('total_poin');
            $table->index('high_score');
            $table->index('session_count');
            $table->index('last_played');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('players');
    }
};
