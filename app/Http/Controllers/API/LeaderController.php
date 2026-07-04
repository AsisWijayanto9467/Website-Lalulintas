<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\LeaderboardEntry;
use App\Models\Player;
use Illuminate\Http\Request;

class LeaderController extends Controller
{
    /**
     * Ambil token dari query parameter
     */
    private function getToken(Request $request): ?string
    {
        return $request->query('token')
            ?? $request->input('token');
    }

    /**
     * Leaderboard + info current player
     * GET /api/v1/leaderboard?token=xxx (token opsional)
     */
    public function index(Request $request)
    {
        // Leaderboard (tidak perlu token)
        $leaderboard = LeaderboardEntry::with('player')
            ->orderBy('skor', 'desc')
            ->take(10)
            ->get()
            ->map(function ($entry) {
                return [
                    'nama' => $entry->player?->nama ?? 'Anonymous',
                    'skor' => $entry->skor,
                    'rank_label' => $entry->rank_label,
                ];
            });

        // Current player (perlu token, tapi opsional)
        $token = $this->getToken($request);
        $player = $token ? Player::where('player_token', $token)->first() : null;

        return response()->json([
            'leaderboard' => $leaderboard,
            'current_player' => $player ? [
                'nama' => $player->nama,
                'high_score' => $player->high_score,
                'level' => $player->playerLevel?->name ?? 'Pesepeda',
            ] : null,
        ]);
    }
}
