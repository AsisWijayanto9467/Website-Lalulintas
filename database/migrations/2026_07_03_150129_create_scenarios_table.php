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
        Schema::create('scenarios', function (Blueprint $table) {
            $table->id();
            $table->string('kategori', 30);                        // etika, regulasi, distraksi (~10 bytes)
            $table->string('gambar', 255)->nullable();             // URL Cloudinary (~100 bytes)
            $table->text('situasi');                               // Deskripsi situasi (~200 bytes)
            $table->json('pilihan');                               // [{"id":"A","teks":"..."}] (~300 bytes)
            $table->char('jawaban', 1);                            // "A"/"B"/"C" (1 byte)
            $table->text('penjelasan');                            // Penjelasan detail (~300 bytes)
            $table->string('pasal', 100);                          // "Pasal 106 UU 22/2009" (~30 bytes)
            $table->unsignedTinyInteger('poin')->default(10);     // 1 byte (max 255)
            $table->timestamps();
            $table->index('kategori');
            $table->index('poin');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('scenarios');
    }
};
