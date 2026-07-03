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
        Schema::create('road_signs', function (Blueprint $table) {
            $table->id();
            $table->string('nama', 50);                           // Dilarang Masuk (~20 bytes)
            $table->string('tipe', 20);                           // Larangan/Peringatan/Perintah (~10 bytes)
            $table->string('ikon', 20);                           // ⛔ (~5 bytes)
            $table->string('gambar', 255);                        // URL gambar (~120 bytes)
            $table->text('deskripsi');                            // Deskripsi rambu (~200 bytes)
            $table->timestamps();     
            $table->index('tipe');
            $table->index('nama');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('road_signs');
    }
};
