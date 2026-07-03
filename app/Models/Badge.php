<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Badge extends Model
{
    protected $table = 'badges';

    protected $fillable = [
        'code',
        'label',
        'condition_text',
        'condition_type',
        'condition_data'
    ];

    protected $casts = [
        'condition_data' => 'array'
    ];

    public function players()
    {
        return $this->belongsToMany(Player::class, 'player_badges')
                    ->withPivot('earned_at')
                    ->withTimestamps();
    }
}
