<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuizQuestion extends Model
{
    protected $table = 'quiz_questions';

    protected $fillable = [
        'gambar',
        'situasi',
        'pilihan',
        'jawaban',
        'penjelasan',
        'pasal',
        'poin'
    ];

    protected $casts = [
        'pilihan' => 'array',
        'poin' => 'integer'
    ];
}
