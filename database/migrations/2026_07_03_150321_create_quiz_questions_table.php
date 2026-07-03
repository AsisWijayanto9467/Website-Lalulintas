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
        Schema::create('quiz_questions', function (Blueprint $table) {
            $table->id();
            $table->string('gambar', 255)->nullable();             // URL placeholder (~80 bytes)
            $table->text('situasi');                               // Pertanyaan (~150 bytes)
            $table->json('pilihan');                               // [{...}] (~250 bytes)
            $table->char('jawaban', 1);                            // "A"/"B"/"C" (1 byte)
            $table->text('penjelasan');                            // Penjelasan (~250 bytes)
            $table->string('pasal', 100);                          // Referensi pasal (~30 bytes)
            $table->unsignedTinyInteger('poin')->default(10);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quiz_questions');
    }
};
