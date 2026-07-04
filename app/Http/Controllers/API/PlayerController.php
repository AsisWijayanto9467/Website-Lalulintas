<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Badge;
use App\Models\Player;
use App\Models\PlayerLevel;
use Illuminate\Http\Request;

class PlayerController extends Controller
{
    /**
     * Ambil token dari berbagai sumber
     */
    private function getToken(Request $request): ?string
    {
        // Priority: query param > body > header
        return $request->query('token')
            ?? $request->input('token')
            ?? $request->header('X-Player-Token');
    }

    /**
     * Register player baru
     * POST /api/v1/player/register
     */
    public function register(Request $request)
    {
        $request->validate([
            'nama' => 'required|string|min:1|max:100',
        ]);

        $defaultLevel = PlayerLevel::where('min_poin', 0)->first();

        $player = Player::create([
            'nama' => $request->nama,
            'player_token' => Player::generateToken(),
            'player_level_id' => $defaultLevel?->id ?? 1,
            'total_poin' => 0,
            'high_score' => 0,
            'session_count' => 0,
            'last_played' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Pemain berhasil didaftarkan',
            'player' => $this->formatPlayer($player),
            'token' => $player->player_token,
        ]);
    }

    /**
     * Cek token valid
     * GET /api/v1/player/check?token=xxx
     */
    public function check(Request $request)
    {
        $token = $this->getToken($request);

        if (!$token) {
            return response()->json([
                'exists' => false,
                'need_register' => true,
                'message' => 'Token tidak ditemukan. Silakan daftar.',
            ]);
        }

        $player = Player::where('player_token', $token)->first();

        if (!$player) {
            return response()->json([
                'exists' => false,
                'need_register' => true,
                'message' => 'Player tidak ditemukan.',
            ]);
        }

        if ($player->isExpired()) {
            $player->resetPlayer();
            return response()->json([
                'exists' => false,
                'need_register' => true,
                'expired' => true,
                'message' => 'Sesi berakhir setelah 7 hari tidak aktif.',
            ]);
        }

        $player->update(['last_played' => now()]);

        return response()->json([
            'exists' => true,
            'need_register' => false,
            'player' => $this->formatPlayer($player),
            'token' => $player->player_token,
        ]);
    }

    /**
     * Update nama
     * PUT /api/v1/player/name?token=xxx
     */
    public function updateName(Request $request)
    {
        $request->validate([
            'nama' => 'required|string|min:1|max:100',
        ]);

        $token = $this->getToken($request);
        $player = Player::where('player_token', $token)->first();

        if (!$player) {
            return response()->json(['error' => 'Player tidak ditemukan'], 404);
        }

        $player->update(['nama' => $request->nama]);

        return response()->json([
            'success' => true,
            'player' => $this->formatPlayer($player),
        ]);
    }

    /**
     * Info player
     * GET /api/v1/player/info?token=xxx
     */
    public function getInfo(Request $request)
    {
        $token = $this->getToken($request);

        if (!$token) {
            return response()->json([
                'exists' => false,
                'need_register' => true,
            ]);
        }

        $player = Player::where('player_token', $token)->first();

        if (!$player || $player->isExpired()) {
            return response()->json([
                'exists' => false,
                'need_register' => true,
            ]);
        }

        return response()->json([
            'exists' => true,
            'need_register' => false,
            'player' => $this->formatPlayer($player),
        ]);
    }

    /**
     * Badges player
     * GET /api/v1/player/badges?token=xxx
     */
    public function getBadges(Request $request)
    {
        $token = $this->getToken($request);
        $player = Player::where('player_token', $token)->first();
        $unlockedBadgeIds = $player ? $player->badges()->pluck('badge_id')->toArray() : [];

        $badges = Badge::all()->map(function ($badge) use ($unlockedBadgeIds) {
            $unlocked = in_array($badge->id, $unlockedBadgeIds);
            $parts = explode(' ', $badge->label, 2);

            return [
                'code' => $badge->code,
                'icon' => $parts[0] ?? '🏅',
                'name' => $parts[1] ?? $badge->label,
                'condition_text' => $badge->condition_text,
                'unlocked' => $unlocked,
            ];
        });

        return response()->json(['badges' => $badges]);
    }

    private function formatPlayer($player): array
    {
        return [
            'id' => $player->id,
            'nama' => $player->nama,
            'total_poin' => $player->total_poin,
            'high_score' => $player->high_score,
            'session_count' => $player->session_count,
            'level' => $player->playerLevel?->name ?? 'Pesepeda',
            'level_icon' => $player->playerLevel?->ikon ?? '🎒',
            'modes_dimainkan' => $player->modes_dimainkan ?? [],
            'last_played' => $player->last_played?->format('d M Y'),
            'is_expired' => $player->isExpired(),
        ];
    }
}
