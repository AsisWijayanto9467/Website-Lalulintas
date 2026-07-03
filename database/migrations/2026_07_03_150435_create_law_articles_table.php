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
        Schema::create('law_articles', function (Blueprint $table) {
            $table->id();
            $table->string('pasal', 60);                          // Pasal 77 ayat (1) (~20 bytes)
            $table->string('kategori', 20);                       // umum, tata-tertib (~15 bytes)
            $table->text('isi');                                  // Isi pasal (~200 bytes)
            $table->timestamps();  
            $table->index('kategori');
            $table->index('pasal');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('law_articles');
    }
};
