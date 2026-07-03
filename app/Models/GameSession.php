<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GameSession extends Model
{
    protected $table = 'game_sessions';

    protected $fillable = [
        'player_id',
        'mode',
        'session_score',
        'correct_count',
        'total_questions',
        'answers_detail',
        'started_at',
        'ended_at'
    ];

    protected $casts = [
        'session_score' => 'integer',
        'correct_count' => 'integer',
        'total_questions' => 'integer',
        'answers_detail' => 'array',
        'started_at' => 'datetime',
        'ended_at' => 'datetime'
    ];

    public function player()
    {
        return $this->belongsTo(Player::class);
    }

    public function leaderboardEntries()
    {
        return $this->hasMany(LeaderboardEntry::class);
    }
}
