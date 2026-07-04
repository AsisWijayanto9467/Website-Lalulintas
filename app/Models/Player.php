<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use Laravel\Sanctum\HasApiTokens;

class Player extends Model
{
    use HasApiTokens;
    
    protected $table = 'players';

    protected $fillable = [
        'nama',
        'player_token',
        'total_poin',
        'player_level_id',
        'high_score',
        'session_count',
        'modes_dimainkan',
        'last_played',
    ];

    protected $casts = [
        'total_poin' => 'integer',
        'high_score' => 'integer',
        'session_count' => 'integer',
        'modes_dimainkan' => 'array',
        'last_played' => 'date',
    ];

    /**
     * Generate token unik
     */
    public static function generateToken(): string
    {
        return Str::random(32) . '-' . time();
    }

    /**
     * Cek apakah player sudah expired (7 hari tidak main)
     */
    public function isExpired(): bool
    {
        if (!$this->last_played) {
            return false;
        }
        return $this->last_played->diffInDays(now()) >= 7;
    }

    /**
     * Reset player (nama + progress)
     */
    public function resetPlayer(): void
    {
        $this->update([
            'nama' => null,
            'total_poin' => 0,
            'high_score' => 0,
            'session_count' => 0,
            'modes_dimainkan' => null,
            'player_level_id' => PlayerLevel::where('min_poin', 0)->first()?->id ?? 1,
        ]);

        // Hapus badges
        $this->badges()->detach();

        // Generate token baru
        $this->update(['player_token' => self::generateToken()]);
    }

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
