<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RoadSignSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $signs = [
            [
                'nama' => 'Dilarang Masuk',
                'tipe' => 'Larangan',
                'ikon' => '⛔',
                'gambar' => 'https://res.cloudinary.com/dtjbvmrow/image/upload/v1782295681/download_12_wivs0f.jpg',
                'deskripsi' => 'Rambu lingkaran merah dengan garis strip putih mendatar. Semua kendaraan dilarang masuk ke jalan tersebut dari arah rambu dipasang.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'nama' => 'Dilarang Parkir',
                'tipe' => 'Larangan',
                'ikon' => '🅿️🚫',
                'gambar' => 'https://res.cloudinary.com/dtjbvmrow/image/upload/v1782295747/download_13_qejr8i.jpg',
                'deskripsi' => 'Rambu lingkaran merah dengan huruf P dicoret. Kendaraan dilarang parkir di area yang ditentukan.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'nama' => 'Dilarang Berhenti',
                'tipe' => 'Larangan',
                'ikon' => '🛑',
                'gambar' => 'https://res.cloudinary.com/dtjbvmrow/image/upload/v1782295871/VtJozUtZPkzitm4vNzTB2gKjj6Rjyq0g0yZ77FIN_zpjp7v.webp',
                'deskripsi' => 'Rambu lingkaran merah dengan huruf S dicoret silang. Kendaraan dilarang berhenti walau sejenak.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'nama' => 'Zebra Cross',
                'tipe' => 'Peringatan',
                'ikon' => '🚸',
                'gambar' => 'https://res.cloudinary.com/dtjbvmrow/image/upload/v1782295947/images_2_wwggp9.jpg',
                'deskripsi' => 'Rambu persegi biru dengan segitiga putih bergambar orang menyeberang. Menunjukkan tempat penyeberangan pejalan kaki.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'nama' => 'Lampu Lalu Lintas',
                'tipe' => 'Peringatan',
                'ikon' => '🚥',
                'gambar' => 'https://res.cloudinary.com/dtjbvmrow/image/upload/v1782295989/images_1_zswgez.png',
                'deskripsi' => 'Rambu belah ketupat kuning bergambar lampu lalu lintas. Memperingatkan ada persimpangan bersinyal di depan.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'nama' => 'Wajib Lurus',
                'tipe' => 'Perintah',
                'ikon' => '⬆️',
                'gambar' => 'https://res.cloudinary.com/dtjbvmrow/image/upload/v1782296093/images_3_aerqhw.jpg',
                'deskripsi' => 'Rambu lingkaran biru dengan panah putih ke atas. Semua kendaraan wajib berjalan lurus.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'nama' => 'Jalan Licin',
                'tipe' => 'Peringatan',
                'ikon' => '⚠️',
                'gambar' => 'https://res.cloudinary.com/dtjbvmrow/image/upload/v1782296141/images_4_fuchtd.jpg',
                'deskripsi' => 'Rambu belah ketupat kuning dengan ikon mobil berkelok. Berhati-hati karena jalanan licin.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'nama' => 'Banyak Anak-Anak',
                'tipe' => 'Peringatan',
                'ikon' => '🚸',
                'gambar' => 'https://res.cloudinary.com/dtjbvmrow/image/upload/v1782296231/images_2_ctcxbe.png',
                'deskripsi' => 'Rambu belah ketupat kuning dengan ikon dua anak kecil. Area sekolah, kurangi kecepatan.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'nama' => 'Kecepatan Maks 40',
                'tipe' => 'Larangan',
                'ikon' => '4️⃣0️⃣',
                'gambar' => 'https://res.cloudinary.com/dtjbvmrow/image/upload/v1782296286/images_3_fv1azt.png',
                'deskripsi' => 'Rambu lingkaran putih berbingkai merah dengan angka 40. Dilarang melebihi 40 km/jam.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'nama' => 'Dilarang menyalip',
                'tipe' => 'Larangan',
                'ikon' => '🚫',
                'gambar' => 'https://res.cloudinary.com/dtjbvmrow/image/upload/v1782296426/images_5_a0ql9l.jpg',
                'deskripsi' => 'Rambu lingkaran putih berbingkai merah dengan simbol dua mobil dan garis batas merah melintang. Menandakan larangan bagi semua kendaraan untuk menyalip/mendahului kendaraan lain di area jalan tersebut.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('road_signs')->insert($signs);
    }
}
