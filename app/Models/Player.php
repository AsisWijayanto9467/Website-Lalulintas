<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Player extends Model
{
    protected $table = 'players';

    protected $fillable = [
        'nama',
        'session_id',
        'total_poin',
        'player_level_id',
        'high_score',
        'session_count',
        'modes_dimainkan',
        'last_played'
    ];

    protected $casts = [
        'total_poin' => 'integer',
        'high_score' => 'integer',
        'session_count' => 'integer',
        'modes_dimainkan' => 'array',
        'last_played' => 'date'
    ];

    public function playerLevel()
    {
        return $this->belongsTo(PlayerLevel::class);
    }

    public function badges()
    {
        return $this->belongsToMany(Badge::class, 'player_badges')
                    ->withPivot('earned_at')
                    ->withTimestamps();
    }

    public function gameSessions()
    {
        return $this->hasMany(GameSession::class);
    }

    public function leaderboardEntries()
    {
        return $this->hasMany(LeaderboardEntry::class);
    }
}
