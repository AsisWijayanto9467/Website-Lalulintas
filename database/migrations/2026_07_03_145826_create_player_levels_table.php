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
        Schema::create('player_levels', function (Blueprint $table) {
            $table->id();
            $table->string('name', 50);                           // Pesepeda, Pejalan Kaki, dll (~20 bytes)
            $table->unsignedInteger('min_poin');                   // 4 bytes
            $table->string('ikon', 100);                          // Path ke icon (~50 bytes)
            $table->unsignedTinyInteger('order')->default(0);     // 1 byte (cukup untuk 1-7)
            $table->timestamps();
            $table->index('min_poin');
            $table->index('order');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('player_levels');
    }
};
