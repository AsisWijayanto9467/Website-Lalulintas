<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class LawArticleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $articles = [
            [
                'pasal' => 'Pasal 77 ayat (1)',
                'kategori' => 'umum',
                'isi' => 'Setiap orang yang mengemudikan kendaraan bermotor wajib memiliki Surat Izin Mengemudi (SIM) sesuai jenis kendaraannya.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'pasal' => 'Pasal 81',
                'kategori' => 'umum',
                'isi' => 'Syarat usia minimal untuk memperoleh SIM adalah 17 tahun untuk SIM A (mobil) dan SIM C (sepeda motor).',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'pasal' => 'Pasal 68 ayat (1)',
                'kategori' => 'umum',
                'isi' => 'Setiap kendaraan bermotor yang dioperasikan di jalan wajib dilengkapi Surat Tanda Nomor Kendaraan (STNK) dan Tanda Nomor Kendaraan Bermotor (pelat nomor).',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'pasal' => 'Pasal 106 ayat (1)',
                'kategori' => 'tata-tertib',
                'isi' => 'Setiap pengemudi wajib mengemudikan kendaraan dengan wajar dan penuh konsentrasi (tidak terdistraksi HP, mengantuk, dll).',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'pasal' => 'Pasal 106 ayat (2)',
                'kategori' => 'keselamatan',
                'isi' => 'Setiap pengemudi wajib mengutamakan keselamatan pejalan kaki dan pesepeda saat berkendara di jalan.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'pasal' => 'Pasal 106 ayat (8)',
                'kategori' => 'keselamatan',
                'isi' => 'Pengemudi dan penumpang sepeda motor wajib mengenakan helm yang memenuhi Standar Nasional Indonesia (SNI).',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'pasal' => 'Pasal 107 ayat (2)',
                'kategori' => 'keselamatan',
                'isi' => 'Pengemudi sepeda motor wajib menyalakan lampu utama pada siang hari (Daytime Running Light).',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'pasal' => 'Pasal 109 ayat (1)',
                'kategori' => 'tata-tertib',
                'isi' => 'Mendahului/menyalip kendaraan lain wajib dari sisi kanan, serta memberikan isyarat (sein) dan menjaga jarak aman.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'pasal' => 'Pasal 112 ayat (1)',
                'kategori' => 'tata-tertib',
                'isi' => 'Pengemudi wajib memberikan isyarat (lampu sein) sekurang-kurangnya 30 meter sebelum berbelok atau berpindah lajur.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'pasal' => 'Pasal 113 ayat (1)',
                'kategori' => 'tata-tertib',
                'isi' => 'Pada persimpangan tanpa lampu lalu lintas, pengemudi wajib mendahulukan kendaraan dari kiri atau dari jalan utama.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'pasal' => 'Pasal 115',
                'kategori' => 'tata-tertib',
                'isi' => 'Pengemudi dilarang melampaui batas kecepatan maksimum yang ditetapkan atau melakukan balapan liar di jalan.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'pasal' => 'Pasal 131',
                'kategori' => 'keselamatan',
                'isi' => 'Pejalan kaki berhak atas ketersediaan fasilitas pendukung berupa trotoar, zebra cross, dan fasilitas penyeberangan aman.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'pasal' => 'Pasal 134',
                'kategori' => 'keselamatan',
                'isi' => 'Pengguna jalan wajib mendahulukan kendaraan prioritas (Pemadam kebakaran, Ambulans, Penolong kecelakaan, rombongan resmi).',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'pasal' => 'Pasal 289',
                'kategori' => 'keselamatan',
                'isi' => 'Pengemudi dan penumpang depan mobil wajib memakai sabuk keselamatan (safety belt) saat kendaraan melaju.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'pasal' => 'Pasal 280',
                'kategori' => 'sanksi',
                'isi' => 'Mengemudikan kendaraan bermotor tanpa pelat nomor (TNKB) resmi dipidana kurungan maks 2 bulan atau denda maks Rp500.000.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'pasal' => 'Pasal 281',
                'kategori' => 'sanksi',
                'isi' => 'Mengemudikan kendaraan bermotor tanpa memiliki SIM dipidana kurungan maks 4 bulan atau denda maks Rp1.000.000.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'pasal' => 'Pasal 283',
                'kategori' => 'sanksi',
                'isi' => 'Mengemudi dengan gangguan konsentrasi (seperti bermain HP) dipidana kurungan maks 3 bulan atau denda maks Rp750.000.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'pasal' => 'Pasal 287 ayat (1)',
                'kategori' => 'sanksi',
                'isi' => 'Melanggar rambu lalu lintas atau marka jalan dipidana kurungan maks 2 bulan atau denda maks Rp500.000.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'pasal' => 'Pasal 287 ayat (2)',
                'kategori' => 'sanksi',
                'isi' => 'Menerobos lampu merah (melanggar APILL) dipidana kurungan maks 2 bulan atau denda maks Rp500.000.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'pasal' => 'Pasal 287 ayat (5)',
                'kategori' => 'sanksi',
                'isi' => 'Melanggar batas kecepatan tertinggi atau terendah dipidana kurungan maks 2 bulan atau denda maks Rp500.000.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'pasal' => 'Pasal 288 ayat (1)',
                'kategori' => 'sanksi',
                'isi' => 'Mengemudikan kendaraan bermotor tanpa dilengkapi STNK yang sah dipidana kurungan maks 2 bulan atau denda maks Rp500.000.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'pasal' => 'Pasal 288 ayat (2)',
                'kategori' => 'sanksi',
                'isi' => 'Mengemudi tanpa membawa/menunjukkan SIM saat razia dipidana kurungan maks 1 bulan atau denda maks Rp250.000.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'pasal' => 'Pasal 291',
                'kategori' => 'sanksi',
                'isi' => 'Pengendara atau penumpang sepeda motor yang tidak menggunakan helm SNI dipidana kurungan maks 1 bulan atau denda maks Rp250.000.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('law_articles')->insert($articles);
    }
}
