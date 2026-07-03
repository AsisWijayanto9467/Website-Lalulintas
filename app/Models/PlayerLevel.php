<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PlayerLevel extends Model
{
    protected $table = 'player_levels';

    protected $fillable = [
        'name',
        'min_poin',
        'ikon',
        'order'
    ];

    protected $casts = [
        'min_poin' => 'integer',
        'order' => 'integer'
    ];

    public function players()
    {
        return $this->hasMany(Player::class);
    }
}
