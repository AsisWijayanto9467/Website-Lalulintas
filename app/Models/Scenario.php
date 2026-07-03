<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Scenario extends Model
{
    protected $table = 'scenarios';

    protected $fillable = [
        'kategori',
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
