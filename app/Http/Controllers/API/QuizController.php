<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Badge;
use App\Models\GameSession;
use App\Models\LawArticle;
use App\Models\LeaderboardEntry;
use App\Models\Player;
use App\Models\PlayerBadge;
use App\Models\PlayerLevel;
use App\Models\QuizQuestion;
use App\Models\RoadSign;
use App\Models\Scenario;
use Illuminate\Http\Request;

class QuizController extends Controller
{
    /**
     * Ambil token dari berbagai sumber
     * Priority: query param > input body > header (fallback)
     */
    private function getToken(Request $request): ?string
    {
        return $request->query('token')
            ?? $request->input('token');
    }

    /**
     * Ambil player berdasarkan token
     */
    private function getPlayer(Request $request): ?Player
    {
        $token = $this->getToken($request);
        if (!$token) return null;

        return Player::where('player_token', $token)->first();
    }

    // ========== GET DATA (TIDAK PERLU TOKEN) ==========

    public function getScenarios()
    {
        $scenarios = Scenario::all()->makeHidden(['jawaban']);
        return response()->json($scenarios);
    }

    public function getQuestions()
    {
        $questions = QuizQuestion::all()->makeHidden(['jawaban']);
        return response()->json($questions);
    }

    public function getRoadSigns()
    {
        return response()->json(RoadSign::all());
    }

    public function getRandomRoadSigns($count = 10)
    {
        $signs = RoadSign::inRandomOrder()->limit((int)$count)->get();
        return response()->json($signs);
    }

    public function getLawArticles(Request $request)
    {
        $query = LawArticle::query();

        if ($request->has('kategori') && $request->kategori !== 'semua') {
            $query->where('kategori', $request->kategori);
        }

        return response()->json($query->get());
    }

    // ========== GAME ACTIONS (PERLU TOKEN) ==========

    /**
     * Submit jawaban - VALIDASI DI SERVER
     * POST /api/v1/quiz/submit?token=xxx
     */
    public function submitAnswer(Request $request)
    {
        $request->validate([
            'mode' => 'required|string|in:skenario,kuis,tebak_rambu',
            'question_id' => 'required|integer|min:1',
            'answer' => 'required|string|max:50',
            'combo' => 'nullable|integer|min:0',
        ]);

        // Tentukan model berdasarkan mode
        $model = match ($request->mode) {
            'skenario' => Scenario::class,
            'kuis' => QuizQuestion::class,
            'tebak_rambu' => RoadSign::class,
            default => null,
        };

        if (!$model) {
            return response()->json(['error' => 'Mode tidak valid'], 400);
        }

        $question = $model::find($request->question_id);

        if (!$question) {
            return response()->json(['error' => 'Soal tidak ditemukan'], 404);
        }

        // Tentukan jawaban benar
        $correctAnswer = $request->mode === 'tebak_rambu'
            ? $question->nama
            : $question->jawaban;

        $isCorrect = $correctAnswer === $request->answer;

        // Hitung poin
        $basePoints = $request->mode === 'tebak_rambu' ? 15 : ($question->poin ?? 10);
        $comboBonus = ($isCorrect && ($request->combo ?? 0) >= 3) ? 5 : 0;
        $points = $isCorrect ? ($basePoints + $comboBonus) : 0;

        // Update player (gunakan method getPlayer)
        $player = $this->getPlayer($request);
        if ($player && $isCorrect) {
            $player->increment('total_poin', $points);
            $this->checkLevelUp($player);
        }

        // Siapkan penjelasan
        $penjelasan = $request->mode === 'tebak_rambu'
            ? $question->deskripsi
            : $question->penjelasan;

        $pasal = $request->mode === 'tebak_rambu'
            ? $question->tipe
            : ($question->pasal ?? '');

        return response()->json([
            'correct' => $isCorrect,
            'points' => $points,
            'correct_answer' => $correctAnswer,
            'penjelasan' => $penjelasan,
            'pasal' => $pasal,
            'player_stats' => $player ? [
                'total_poin' => (int) $player->fresh()->total_poin,
                'level' => $player->playerLevel?->name ?? 'Pesepeda',
                'level_icon' => $player->playerLevel?->ikon ?? '🎒',
            ] : null,
        ]);
    }

    /**
     * Akhiri sesi game
     * POST /api/v1/quiz/end?token=xxx
     */
    public function endSession(Request $request)
    {
        $request->validate([
            'mode' => 'required|string',
            'session_score' => 'required|integer|min:0',
            'correct_count' => 'required|integer|min:0',
            'total_questions' => 'required|integer|min:1',
        ]);

        $player = $this->getPlayer($request);

        if (!$player) {
            return response()->json([
                'success' => false,
                'message' => 'Player tidak ditemukan. Pastikan token valid.',
            ], 404);
        }

        // Simpan game session
        $gameSession = GameSession::create([
            'player_id' => $player->id,
            'mode' => $request->mode,
            'session_score' => $request->session_score,
            'correct_count' => $request->correct_count,
            'total_questions' => $request->total_questions,
            'started_at' => now()->subMinutes(10),
            'ended_at' => now(),
        ]);

        // Update high score
        if ($request->session_score > $player->high_score) {
            $player->update(['high_score' => $request->session_score]);
        }

        // Update session count & last played
        $player->increment('session_count');
        $player->update(['last_played' => now()]);

        // Update modes dimainkan
        $modes = $player->modes_dimainkan ?? [];
        if (!in_array($request->mode, $modes)) {
            $modes[] = $request->mode;
            $player->update(['modes_dimainkan' => $modes]);
        }

        // Tambahkan ke leaderboard
        LeaderboardEntry::create([
            'player_id' => $player->id,
            'game_session_id' => $gameSession->id,
            'mode' => $request->mode,
            'skor' => $request->session_score,
            'rank_label' => $player->playerLevel?->name ?? 'Pesepeda',
        ]);

        // Cek & award badges
        $newBadges = $this->awardBadges($player, $request);

        return response()->json([
            'success' => true,
            'new_badges' => $newBadges,
            'player_stats' => [
                'total_poin' => (int) $player->fresh()->total_poin,
                'high_score' => (int) $player->high_score,
                'session_count' => (int) $player->session_count,
                'level' => $player->playerLevel?->name ?? 'Pesepeda',
            ],
        ]);
    }

    // ========== PRIVATE HELPERS ==========

    private function checkLevelUp(Player $player): void
    {
        $newLevel = PlayerLevel::where('min_poin', '<=', $player->total_poin)
            ->orderBy('min_poin', 'desc')
            ->first();

        if ($newLevel && $newLevel->id !== $player->player_level_id) {
            $player->update(['player_level_id' => $newLevel->id]);
        }
    }

    private function awardBadges(Player $player, Request $request): array
    {
        $awarded = [];

        $badgeChecks = [
            ['code' => 'first_play',    'condition' => $player->session_count === 1],
            ['code' => 'persistent',    'condition' => $player->session_count >= 3],
            ['code' => 'zero_violation','condition' => $request->correct_count === $request->total_questions && $request->total_questions > 0],
            ['code' => 'etika_hero',    'condition' => $request->mode === 'skenario'],
            ['code' => 'uu_master',     'condition' => $request->mode === 'kuis' && $request->session_score >= 80],
            ['code' => 'rambu_master',  'condition' => $request->mode === 'tebak_rambu'],
            ['code' => 'combo_king',    'condition' => $request->session_score >= 150],
        ];

        foreach ($badgeChecks as $check) {
            if ($check['condition']) {
                $badge = Badge::where('code', $check['code'])->first();
                if ($badge) {
                    $exists = PlayerBadge::where('player_id', $player->id)
                        ->where('badge_id', $badge->id)
                        ->exists();
                    if (!$exists) {
                        PlayerBadge::create([
                            'player_id' => $player->id,
                            'badge_id' => $badge->id,
                            'earned_at' => now(),
                        ]);
                        $awarded[] = ['code' => $badge->code, 'label' => $badge->label];
                    }
                }
            }
        }

        // All modes badge
        $modes = $player->modes_dimainkan ?? [];
        $allModes = ['skenario', 'kuis', 'tebak_rambu', 'puzzle', 'slowcars', 'bus'];
        $allPlayed = count(array_intersect($allModes, $modes)) >= count($allModes);

        if ($allPlayed) {
            $badge = Badge::where('code', 'all_modes')->first();
            if ($badge) {
                $exists = PlayerBadge::where('player_id', $player->id)
                    ->where('badge_id', $badge->id)
                    ->exists();
                if (!$exists) {
                    PlayerBadge::create([
                        'player_id' => $player->id,
                        'badge_id' => $badge->id,
                        'earned_at' => now(),
                    ]);
                    $awarded[] = ['code' => $badge->code, 'label' => $badge->label];
                }
            }
        }

        return $awarded;
    }
}
