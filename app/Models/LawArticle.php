<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LawArticle extends Model
{
    protected $table = 'law_articles';

    protected $fillable = [
        'pasal',
        'kategori',
        'isi'
    ];
}
