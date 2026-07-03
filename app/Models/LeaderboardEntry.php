<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LeaderboardEntry extends Model
{
    protected $table = 'leaderboard_entries';

    protected $fillable = [
        'player_id',
        'game_session_id',
        'mode',
        'skor',
        'rank_label'
    ];

    protected $casts = [
        'skor' => 'integer'
    ];

    public function player()
    {
        return $this->belongsTo(Player::class);
    }

    public function gameSession()
    {
        return $this->belongsTo(GameSession::class);
    }
}
