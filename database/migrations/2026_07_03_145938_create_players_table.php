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
            $table->string('nama', 100)->nullable();               // Nama player (~50 bytes)
            $table->string('session_id', 64)->unique();            // Laravel session ID (~40 bytes)
            $table->unsignedInteger('total_poin')->default(0);     // 4 bytes
            $table->foreignId('player_level_id')->nullable()->constrained('player_levels')->nullOnDelete();                                // SET NULL jika level dihapus
            $table->unsignedInteger('high_score')->default(0);     // 4 bytes
            $table->unsignedInteger('session_count')->default(0);  // 4 bytes
            $table->json('modes_dimainkan')->nullable();           // Array mode (~100 bytes)
            $table->date('last_played')->nullable();               // 3 bytes
            $table->timestamps();
            $table->index('total_poin');
            $table->index('high_score');
            $table->index('session_count');
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
