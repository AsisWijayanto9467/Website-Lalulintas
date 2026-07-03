<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PlayerLevelSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $levels = [
            [
                'name' => 'Pesepeda',
                'min_poin' => 0,
                'ikon' => 'assets/image/level/pesepeda.svg',
                'order' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Pejalan Kaki',
                'min_poin' => 20,
                'ikon' => 'assets/image/level/pejalankaki.svg',
                'order' => 2,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Siswa',
                'min_poin' => 50,
                'ikon' => 'assets/image/level/siswa.svg',
                'order' => 3,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Pelajar',
                'min_poin' => 100,
                'ikon' => 'assets/image/level/pelajar.svg',
                'order' => 4,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Pengendara',
                'min_poin' => 200,
                'ikon' => 'assets/image/level/pengendara.svg',
                'order' => 5,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Pelopor',
                'min_poin' => 350,
                'ikon' => 'assets/image/level/pelopor.svg',
                'order' => 6,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Pahlawan Jalan',
                'min_poin' => 500,
                'ikon' => 'assets/image/level/pahlawanjalan.svg',
                'order' => 7,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('player_levels')->insert($levels);
    }
}
