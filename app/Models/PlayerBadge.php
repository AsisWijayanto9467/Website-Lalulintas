<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PlayerBadge extends Model
{
    protected $table = 'player_badges';

    protected $fillable = [
        'player_id',
        'badge_id',
        'earned_at'
    ];

    protected $casts = [
        'earned_at' => 'datetime'
    ];

    public function player()
    {
        return $this->belongsTo(Player::class);
    }

    public function badge()
    {
        return $this->belongsTo(Badge::class);
    }
}
