<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class BadgeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $badges = [
            [
                'code' => 'first_play',
                'label' => '🎯 Pelopor Pertama',
                'condition_text' => 'Main pertama kali',
                'condition_type' => 'first_session',
                'condition_data' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => 'zero_violation',
                'label' => '✅ Zero Violation',
                'condition_text' => 'Sempurna tanpa salah',
                'condition_type' => 'perfect_score',
                'condition_data' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => 'etika_hero',
                'label' => '🦸 Etika Hero',
                'condition_text' => 'Selesaikan Mode Skenario',
                'condition_type' => 'complete_mode',
                'condition_data' => json_encode(['mode' => 'skenario']),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => 'uu_master',
                'label' => '📚 UU Master',
                'condition_text' => 'Skor Mode Kuis > 80',
                'condition_type' => 'score_threshold',
                'condition_data' => json_encode(['mode' => 'kuis', 'min_score' => 80]),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => 'rambu_master',
                'label' => '🛑 Rambu Master',
                'condition_text' => 'Selesaikan Tebak Rambu',
                'condition_type' => 'complete_mode',
                'condition_data' => json_encode(['mode' => 'tebak_rambu']),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => 'combo_king',
                'label' => '🔥 Combo King',
                'condition_text' => 'Combo 5x beruntun',
                'condition_type' => 'combo_count',
                'condition_data' => json_encode(['min_combo' => 5]),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => 'persistent',
                'label' => '💪 Pantang Menyerah',
                'condition_text' => 'Main 3 sesi berbeda',
                'condition_type' => 'session_count',
                'condition_data' => json_encode(['min_sessions' => 3]),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => 'top_scorer',
                'label' => '🏆 Juara Lokal',
                'condition_text' => 'Masuk top 3 leaderboard',
                'condition_type' => 'top_rank',
                'condition_data' => json_encode(['max_rank' => 3]),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => 'speed_learner',
                'label' => '⚡ Speed Learner',
                'condition_text' => 'Jawab < 5 detik rata-rata',
                'condition_type' => 'speed_threshold',
                'condition_data' => json_encode(['max_avg_seconds' => 5]),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => 'all_modes',
                'label' => '🌟 All Rounder',
                'condition_text' => 'Mainkan semua mode',
                'condition_type' => 'all_modes_played',
                'condition_data' => json_encode(['required_modes' => ['skenario', 'kuis', 'tebak_rambu', 'puzzle', 'slowcars', 'bus', 'belajar']]),
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('badges')->insert($badges);
    }
}
