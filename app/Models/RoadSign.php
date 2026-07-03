<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RoadSign extends Model
{
    protected $table = 'road_signs';

    protected $fillable = [
        'nama',
        'tipe',
        'ikon',
        'gambar',
        'deskripsi'
    ];
}
