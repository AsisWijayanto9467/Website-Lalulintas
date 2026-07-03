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
        Schema::create('badges', function (Blueprint $table) {
            $table->id();
            $table->string('code', 30)->unique();                 // first_play, zero_violation (~15 bytes)
            $table->string('label', 60);                          // 🎯 Pelopor Pertama (~25 bytes)
            $table->string('condition_text', 100);                // "Main pertama kali" (~30 bytes)
            $table->string('condition_type', 30);                 // first_session, perfect_score (~20 bytes)
            $table->json('condition_data')->nullable();           // Parameter kondisi (~100 bytes)
            $table->timestamps();  
            $table->index('condition_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('badges');
    }
};
