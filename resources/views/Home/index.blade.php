<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>LajuAman - Game Edukasi Keselamatan Lalu Lintas</title>
    <meta name="description"
        content="Game edukasi interaktif keselamatan lalu lintas untuk pelajar Indonesia. Belajar UU No. 22 Tahun 2009 dengan cara yang menyenangkan.">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            corePlugins: {
                preflight: false
            }
        }
    </script>
    <!-- Lucide Icons untuk Desain Ikon Modern -->
    <script src="https://unpkg.com/lucide@latest"></script>
    <link rel="stylesheet" href="{{ asset('assets/css/main.css') }}">
    <script>
        // Setup CSRF dan API Base URL
        window.CSRF_TOKEN = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
        window.API_BASE = '{{ url('/api/v1') }}';
    </script>
</head>

<body>

    <!-- LOADING SCREEN -->
    <div id="loading-screen" class="screen active">
        <div class="loader">
            <div class="traffic-light-loader">
                <div class="light red"></div>
                <div class="light yellow"></div>
                <div class="light green"></div>
            </div>
            <h2>Memuat LajuAman...</h2>
            <p class="text-muted">Game Edukasi Keselamatan LLAJ</p>
        </div>
    </div>

    <!-- MAIN MENU -->
    <div id="main-menu" class="screen">
        <!-- Top Profile Header -->
        <header class="app-header">
            <div class="header-top">
                <div class="logo-small flex items-center gap-2">
                    <img src="{{ asset('assets/image/logo/lajuaman.png') }}" alt="Logo LajuAman"
                        class="w-[5rem] logo-img">
                    LajuAman
                </div>
                <div style="display: flex; gap: 8px;">
                    <button class="btn-icon-small" onclick="app.toggleFullScreen()" title="Full Screen">
                        <i data-lucide="maximize"></i>
                    </button>
                    <button class="btn-icon-small" onclick="app.showScreen('belajar-menu')">
                        <i data-lucide="info"></i>
                    </button>
                </div>
            </div>
            <div class="profile-section">
                <div class="profile-avatar-wrap">
                    <img src="{{ asset('assets/image/logo/maskot.png') }}" alt="Avatar" class="profile-avatar">
                </div>
                <div class="profile-info">
                    <input type="text" id="player-name" class="profile-name-input" placeholder="Ketik Nama Anda..."
                        autocomplete="off" maxlength="20">
                    <span class="profile-tagline">@pelopor_keselamatan</span>
                </div>
            </div>
        </header>

        <main class="dashboard-main">
            <!-- Stats Wrapper -->
            <div id="player-stats-bar" style="display:none;">
                <div class="stats-grid">
                    <div class="stat-card level-card">
                        <div class="stat-data">
                            <span class="stat-label">Level</span>
                            <div class="stat-value" id="ui-home-level">Siswa</div>
                        </div>
                    </div>
                    <div class="stat-card points-card">
                        <div class="stat-data">
                            <span class="stat-label">Total Poin</span>
                            <div class="stat-value" id="ui-home-points">0</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Recommended Games -->
            <div class="section-header">
                <h3>Area Bermain</h3>
                <span>↓ Pilih Tantangan</span>
            </div>

            <div class="game-grid">
                <button class="game-card-btn" onclick="app.startGame('skenario')">
                    <div class="game-card-icon bg-blue">
                        <img src="{{ asset('assets/image/logo/traffic-light-svgrepo-com.svg') }}" class="w-7"
                            alt="">
                    </div>
                    <span class="game-card-title">Skenario</span>
                    <span class="game-card-subtitle">15 Situasi</span>
                    <div class="play-btn-small">Main</div>
                </button>
                <button class="game-card-btn" onclick="app.startGame('tebak_rambu')">
                    <div class="game-card-icon bg-red">
                        <img src="{{ asset('assets/image/logo/traffic-sign-stop-svgrepo-com.svg') }}" class="w-7"
                            alt="">
                    </div>
                    <span class="game-card-title">Tebak Rambu</span>
                    <span class="game-card-subtitle">Waktu Cepat</span>
                    <div class="play-btn-small">Main</div>
                </button>
                <button class="game-card-btn" onclick="app.startGame('kuis')">
                    <div class="game-card-icon bg-yellow">
                        <img src="{{ asset('assets/image/logo/quiz-svgrepo-com.svg') }}" class="w-7" alt="">
                    </div>
                    <span class="game-card-title">Kuis UU</span>
                    <span class="game-card-subtitle">20 Soal</span>
                    <div class="play-btn-small">Main</div>
                </button>
                <button class="game-card-btn" onclick="app.startGame('puzzle')">
                    <div class="game-card-icon bg-green">
                        <img src="{{ asset('assets/image/logo/puzzle-piece-svgrepo-com.svg') }}" class="w-7"
                            alt="">
                    </div>
                    <span class="game-card-title">Traffic Tap</span>
                    <span class="game-card-subtitle">Puzzle</span>
                    <div class="play-btn-small">Main</div>
                </button>
                <button class="game-card-btn" onclick="app.startGame('slowcars')">
                    <div class="game-card-icon bg-teal">
                        <img src="{{ asset('assets/image/logo/car-angled-front-left-svgrepo-com.svg') }}"
                            class="w-7" alt="">
                    </div>
                    <span class="game-card-title">Slow Cars</span>
                    <span class="game-card-subtitle">Endless</span>
                    <div class="play-btn-small">Main</div>
                </button>
                <button class="game-card-btn" onclick="app.startGame('bus')">
                    <div class="game-card-icon bg-orange">
                        <img src="{{ asset('assets/image/logo/bus-svgrepo-com.svg') }}" class="w-7"
                            alt="">
                    </div>
                    <span class="game-card-title">Supir Bus</span>
                    <span class="game-card-subtitle">Simulator</span>
                    <div class="play-btn-small">Main</div>
                </button>
            </div>

            <!-- Area Belajar -->
            <div class="section-header" style="margin-top: 10px;">
                <h3>Area Belajar</h3>
                <span>Pahami Aturan</span>
            </div>

            <div class="game-grid" style="grid-template-columns: 1fr; margin-bottom: 50px;">
                <button class="game-card-btn" style="flex-direction: row; align-items: center; gap: 15px;"
                    onclick="app.showBelajar()">
                    <div class="game-card-icon bg-blue" style="margin: 0;">
                        <img src="{{ asset('assets/image/logo/book-and-person-summer-svgrepo-com.svg') }}"
                            class="w-7" alt="">
                    </div>
                    <div>
                        <span class="game-card-title" style="display:block;">Ensiklopedia</span>
                        <span class="game-card-subtitle" style="margin:0;">10 Rambu</span>
                    </div>
                </button>
                <button class="game-card-btn" style="flex-direction: row; align-items: center; gap: 15px;"
                    onclick="app.showRangkumanUU()">
                    <div class="game-card-icon bg-purple" style="margin: 0; background: #F3E8FF; color: #7E22CE;">
                        <img src="{{ asset('assets/image/logo/law-book-law-svgrepo-com.svg') }}" class="w-7"
                            alt="">
                    </div>
                    <div>
                        <span class="game-card-title" style="display:block;">UU LLAJ</span>
                        <span class="game-card-subtitle" style="margin:0;">Aturan Hukum</span>
                    </div>
                </button>
            </div>

        </main>

    </div>

    <!-- Bottom Navigation (Global - outside any screen) -->
    <nav id="bottom-nav" class="bottom-nav">
        <button class="nav-item active" onclick="app.showScreen('main-menu')">
            <i data-lucide="home"></i>
            <span>Beranda</span>
        </button>
        <button class="nav-item" onclick="app.showScreen('leaderboard')">
            <i data-lucide="trophy"></i>
            <span>Top Skor</span>
        </button>
        <button class="nav-item" onclick="app.showScreen('badge-screen')">
            <i data-lucide="award"></i>
            <span>Badges</span>
        </button>
    </nav>

    <!-- GAME MENU (Sub-menu Area Bermain) -->
    <div id="game-menu" class="screen">
        <header class="sub-header">
            <button class="btn-back" onclick="app.showScreen('main-menu')">←</button>
            <h2>🎮 Area Bermain</h2>
        </header>
        <main class="sub-menu-content">
            <p class="sub-desc">Pilih permainan edukatif untuk menguji pengetahuanmu!</p>
            <div class="game-list">
                <button class="game-card" onclick="app.startGame('skenario')">
                    <img src="{{ asset('assets/image/perempatan.png') }}" alt="Skenario" class="game-card-img">
                    <div class="game-card-body">
                        <h3>🚦 Simulasi Skenario</h3>
                        <p>Hadapi 15 situasi lalu lintas nyata dan buat keputusan yang tepat!</p>
                        <span class="game-card-tag">15 Skenario</span>
                    </div>
                </button>
                <button class="game-card" onclick="app.startGame('tebak_rambu')">
                    <img src="{{ asset('assets/image/bg-main.png') }}" alt="Tebak Rambu" class="game-card-img">
                    <div class="game-card-body">
                        <h3>🛑 Tebak Rambu Cepat</h3>
                        <p>Tebak arti rambu lalu lintas secepat mungkin sebelum waktu habis!</p>
                        <span class="game-card-tag">10 Rambu • Timer</span>
                    </div>
                </button>
                <button class="game-card" onclick="app.startGame('kuis')">
                    <img src="{{ asset('assets/image/zebra cros.png') }}" alt="Kuis UU" class="game-card-img">
                    <div class="game-card-body">
                        <h3>📝 Kuis Cerdas UU LLAJ</h3>
                        <p>Jawab 20 pertanyaan tentang UU No. 22 Tahun 2009 dan peraturan lalu lintas.</p>
                        <span class="game-card-tag">20 Soal</span>
                    </div>
                </button>
                <button class="game-card" onclick="app.startGame('puzzle')">
                    <img src="{{ asset('assets/image/maskot.png') }}" alt="Puzzle" class="game-card-img">
                    <div class="game-card-body">
                        <h3>🧩 Traffic Tap Puzzle</h3>
                        <p>Kelola persimpangan padat! Ketuk mobil untuk mengatur lalu lintas.</p>
                        <span class="game-card-tag">8 Level</span>
                    </div>
                </button>
                <button class="game-card" onclick="app.startGame('slowcars')">
                    <img src="{{ asset('assets/image/perempatan.png') }}" alt="Slow Cars" class="game-card-img">
                    <div class="game-card-body">
                        <h3>🚗 Slow Cars Puzzle</h3>
                        <p>Atur kecepatan mobil agar tidak tabrakan di persimpangan!</p>
                        <span class="game-card-tag">Tak Terbatas</span>
                    </div>
                </button>
                <button class="game-card" onclick="app.startGame('bus')">
                    <img src="{{ asset('assets/image/bg-main.png') }}" alt="Bus Simulator" class="game-card-img">
                    <div class="game-card-body">
                        <h3>🚌 Supir Bus Cilik</h3>
                        <p>Antar siswa ke sekolah dengan aman! Patuhi rambu lalu lintas.</p>
                        <span class="game-card-tag">Simulator</span>
                    </div>
                </button>
            </div>
        </main>
    </div>

    <!-- BELAJAR MENU (Sub-menu Area Belajar) -->
    <div id="belajar-menu" class="screen">
        <header class="sub-header">
            <button class="btn-back" onclick="app.showScreen('main-menu')">←</button>
            <h2>📚 Area Belajar</h2>
        </header>
        <main class="sub-menu-content">
            <p class="sub-desc">Pelajari materi keselamatan lalu lintas sebelum bermain!</p>
            <div class="game-list">
                <button class="game-card" onclick="app.showBelajar()">
                    <img src="{{ asset('assets/image/bg-main.png') }}" alt="Ensiklopedia" class="game-card-img">
                    <div class="game-card-body">
                        <h3>📖 Ensiklopedia Rambu</h3>
                        <p>Kenali semua jenis rambu lalu lintas di Indonesia dan artinya.</p>
                        <span class="game-card-tag">10 Rambu</span>
                    </div>
                </button>
                <button class="game-card" onclick="app.showRangkumanUU()">
                    <img src="{{ asset('assets/image/perempatan.png') }}" alt="UU LLAJ" class="game-card-img">
                    <div class="game-card-body">
                        <h3>📜 Rangkuman UU LLAJ</h3>
                        <p>Pasal-pasal penting dari UU No. 22 Tahun 2009 yang wajib diketahui.</p>
                        <span class="game-card-tag">Referensi</span>
                    </div>
                </button>
            </div>
        </main>
    </div>

    <!-- GAME SCREEN (Skenario / Kuis / Tebak Rambu) -->
    <div id="game-screen" class="screen">
        <header class="game-header">
            <button class="btn-back" onclick="app.quitGame()">✕</button>
            <div class="stats">
                <button class="btn-icon-small" onclick="app.toggleFullScreen()"
                    style="width: 28px; height: 28px; color: var(--text-muted); background: transparent; padding: 0;">
                    <i data-lucide="maximize" style="width: 18px; height: 18px;"></i>
                </button>
                <span id="ui-score">⭐ 0</span>
                <span id="ui-combo" class="combo-badge hidden">🔥 0x</span>
            </div>
            <span id="ui-timer" class="timer-badge" style="display:none;">⏱️ 0s</span>
        </header>

        <!-- Progress Bar -->
        <div class="progress-bar-container">
            <div id="progress-bar" class="progress-bar"></div>
            <span id="ui-progress-text" class="progress-text">1/15</span>
        </div>

        <!-- Ilustrasi Skenario -->
        <div class="scenario-illustration">
            <img id="ui-scenario-img" src="{{ asset('assets/image/perempatan.png') }}" alt="Ilustrasi situasi"
                class="scenario-img">
        </div>

        <!-- Panel Soal -->
        <div class="scenario-panel">
            <p id="ui-scenario-text" class="scenario-text">Memuat skenario...</p>
            <div id="ui-choices" class="choices-container">
                <!-- Choices injected here -->
            </div>
        </div>
    </div>

    <!-- FEEDBACK SCREEN -->
    <div id="feedback-screen" class="screen">
        <div class="feedback-card">
            <div id="ui-feedback-icon" class="feedback-icon">✅</div>
            <h2 id="ui-feedback-title" class="feedback-title correct">BENAR!</h2>
            <p id="ui-feedback-points" class="feedback-points">+10 Poin</p>

            <div class="explanation-box">
                <div class="explanation-header">
                    <img src="{{ asset('assets/image/maskot.png') }}" alt="Maskot" class="explanation-maskot">
                    <h3>📖 Penjelasan:</h3>
                </div>
                <p id="ui-feedback-explanation">Penjelasan hukum di sini.</p>
                <div class="pasal-tag" id="ui-feedback-pasal">Pasal XX UU 22/2009</div>
            </div>

            <button class="btn btn-primary btn-large" onclick="app.nextScenario()">Lanjut ➡️</button>
        </div>
    </div>

    <!-- RESULT SCREEN -->
    <div id="result-screen" class="screen">
        <div class="result-card">
            <img src="{{ asset('assets/image/maskot.png') }}" alt="Maskot" class="result-maskot">
            <h2 class="result-title">🎖️ SELAMAT!</h2>
            <h3 id="ui-result-name" class="result-name">Pemain</h3>

            <div class="result-stats">
                <div class="stat-item">
                    <div class="stat-value" id="ui-result-score">0</div>
                    <div class="stat-label">Total Skor</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value" id="ui-result-accuracy">0%</div>
                    <div class="stat-label">Akurasi</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value" id="ui-result-rank">Siswa</div>
                    <div class="stat-label">Rank</div>
                </div>
            </div>

            <div id="ui-new-badges" class="new-badges-container"></div>

            <div class="result-actions">
                <button class="btn btn-primary" onclick="app.showScreen('main-menu')">🏠 Menu Utama</button>
                <button class="btn btn-outline" onclick="app.showScreen('leaderboard')">🏆 Leaderboard</button>
            </div>
        </div>
    </div>

    <!-- LEADERBOARD SCREEN -->
    <div id="leaderboard" class="screen">
        <header class="sub-header">
            <button class="btn-back" onclick="app.showScreen('main-menu')">←</button>
            <h2>🏆 Papan Juara</h2>
        </header>
        <div class="leaderboard-card">
            <ul id="ui-leaderboard-list" class="leaderboard-list"></ul>
            <div id="ui-leaderboard-current" class="leaderboard-current"></div>
        </div>
    </div>

    <!-- BADGE SCREEN -->
    <div id="badge-screen" class="screen">
        <header class="sub-header">
            <button class="btn-back" onclick="app.showScreen('main-menu')">←</button>
            <h2>🏅 Koleksi Badge</h2>
        </header>
        <div class="badge-grid" id="ui-badge-grid"></div>
    </div>

    <!-- BELAJAR (Ensiklopedia Rambu) SCREEN -->
    <div id="belajar-screen" class="screen">
        <header class="sub-header">
            <button class="btn-back" onclick="app.showScreen('belajar-menu')">←</button>
            <h2>📖 Ensiklopedia Rambu</h2>
        </header>
        <div class="belajar-content">
            <div id="ui-rambu-list" class="rambu-list"></div>
        </div>
    </div>

    <!-- RANGKUMAN UU SCREEN -->
    <div id="uu-screen" class="screen">
        <header class="sub-header">
            <button class="btn-back" onclick="app.showScreen('belajar-menu')">←</button>
            <h2>📜 Rangkuman UU LLAJ</h2>
        </header>
        <div class="belajar-content">
            <div class="uu-tabs" id="ui-uu-tabs">
                <button class="uu-tab-btn active" onclick="app.filterUU('semua', this)">Semua</button>
                <button class="uu-tab-btn" onclick="app.filterUU('umum', this)">Dokumen & SIM</button>
                <button class="uu-tab-btn" onclick="app.filterUU('tata-tertib', this)">Tata Tertib</button>
                <button class="uu-tab-btn" onclick="app.filterUU('keselamatan', this)">Keselamatan</button>
                <button class="uu-tab-btn" onclick="app.filterUU('sanksi', this)">Sanksi & Denda</button>
            </div>
            <div class="uu-list" id="ui-uu-list"></div>
        </div>
    </div>

    <!-- PUZZLE SCREEN (Traffic Tap Puzzle) -->
    <div id="puzzle-screen" class="screen">
        <div
            class="h-screen w-screen flex items-center justify-center overflow-hidden md:p-6 bg-gradient-to-br from-cyan-50 to-sky-100">
            <div
                class="relative w-full h-full md:h-auto max-w-4xl bg-white md:rounded-[32px] overflow-hidden border-0 md:border-4 border-cyan-300 flex flex-col md:shadow-2xl">

                <!-- Header -->
                <div
                    class="bg-gradient-to-r from-cyan-400 to-sky-400 px-3 py-3 md:px-6 md:py-4 flex justify-between items-center text-white z-10 shadow-md">
                    <div class="flex items-center gap-2 md:gap-3">
                        <button
                            class="bg-white/20 hover:bg-white/30 text-white rounded-full w-8 h-8 flex items-center justify-center transition-all"
                            onclick="app.quitGame()" title="Tutup Game">
                            <i data-lucide="x" class="w-5 h-5"></i>
                        </button>
                        <div class="bg-white/30 p-2 md:p-2.5 rounded-full text-yellow-200 shadow-inner hidden md:flex">
                            <i data-lucide="gamepad-2" class="w-6 h-6"></i>
                        </div>
                        <div>
                            <h1 class="font-bubble text-base md:text-xl tracking-wide text-white drop-shadow-sm">
                                PENGENDALI LALU LINTAS</h1>
                        </div>
                    </div>

                    <div class="flex items-center gap-1 md:gap-4 text-white font-bubble drop-shadow-sm">
                        <div
                            class="bg-white/20 px-2 py-1 md:px-3.5 md:py-1.5 rounded-xl flex flex-col items-center justify-center border border-white/30 shadow-inner">
                            <span
                                class="text-[7px] md:text-[8px] font-sans text-cyan-100 font-bold uppercase">Target</span>
                            <span id="pzl-target" class="text-[10px] md:text-sm">0</span>
                        </div>
                        <div
                            class="bg-white/20 px-2 py-1 md:px-3.5 md:py-1.5 rounded-xl flex items-center gap-1 border border-white/30 shadow-inner">
                            <i data-lucide="check-circle" class="text-emerald-100 w-3 h-3 md:w-4 md:h-4"></i>
                            <span id="pzl-score" class="text-[11px] md:text-sm text-yellow-100">0</span>
                        </div>
                    </div>

                    <div class="flex items-center gap-1 md:gap-2">
                        <button id="pzl-btn-sound"
                            class="p-2 bg-white/20 hover:bg-white/30 active:scale-95 transition-all rounded-xl text-yellow-100 border border-white/30">🔊</button>
                        <button id="pzl-btn-pause"
                            class="p-2 bg-white/20 hover:bg-white/30 active:scale-95 transition-all rounded-xl text-yellow-100 border border-white/30">⏸️</button>
                    </div>
                </div>

                <!-- Area Canvas -->
                <div
                    class="relative w-full flex-1 md:h-[500px] bg-emerald-900 flex items-center justify-center overflow-hidden">
                    <!-- INI CANVAS UTAMA - ID: puzzleCanvas -->
                    <canvas id="puzzleCanvas" class="w-full h-full block"></canvas>

                    <!-- Level Select Overlay -->
                    <div id="pzl-level-select" class="pzl-overlay">
                        <div class="pzl-modal">
                            <div class="pzl-icon-bounce">🚗</div>
                            <h2>PILIH LEVEL</h2>
                            <p>Kelola persimpangan lalu lintas agar aman!</p>
                            <div class="pzl-levels-grid" id="pzl-levels-container"></div>
                        </div>
                    </div>

                    <!-- Start Level Overlay -->
                    <div id="pzl-start-menu" class="pzl-overlay hidden">
                        <div class="pzl-modal">
                            <h2 id="pzl-lvl-title">LEVEL 1</h2>
                            <p id="pzl-lvl-desc" style="margin-bottom:15px">Target: Loloskan 10 Mobil</p>
                            <div class="pzl-guide">
                                <div class="pzl-guide-item" style="border-color:#3b82f6"><span
                                        style="font-size:24px">🚗</span><br>Normal</div>
                                <div class="pzl-guide-item" style="border-color:#ef4444"><span
                                        style="font-size:24px">🛑</span><br>Berhenti</div>
                                <div class="pzl-guide-item" style="border-color:#f59e0b"><span
                                        style="font-size:24px">⚡</span><br>Ngebut!</div>
                            </div>
                            <p style="font-size:12px; margin-bottom:20px">💡 Ketuk mobil untuk mengubah kecepatan</p>
                            <button id="pzl-btn-play" class="btn btn-primary">MULAI MENGATUR</button>
                            <button class="btn btn-outline"
                                onclick="document.getElementById('pzl-start-menu').classList.add('hidden');document.getElementById('pzl-level-select').classList.remove('hidden');"
                                style="margin-top:10px">Kembali</button>
                        </div>
                    </div>

                    <!-- Game Over Overlay -->
                    <div id="pzl-game-over" class="pzl-overlay hidden" style="background:rgba(192,0,0,0.8)">
                        <div class="pzl-modal">
                            <div class="pzl-icon-shake">💥</div>
                            <h2 style="color:var(--danger-light)">TABRAKAN!</h2>
                            <p style="margin-bottom:20px">Lalu lintas tidak aman.</p>
                            <div class="pzl-result-box">
                                <p>Mobil Lolos: <strong id="pzl-final-score">0</strong></p>
                            </div>
                            <button id="pzl-btn-restart" class="btn btn-primary">ULANGI LEVEL</button>
                            <button class="btn btn-outline" onclick="TrafficPuzzle.showLevelSelect()"
                                style="margin-top:10px">Pilih Level</button>
                        </div>
                    </div>

                    <!-- Level Complete Overlay -->
                    <div id="pzl-level-complete" class="pzl-overlay hidden" style="background:rgba(112,173,71,0.8)">
                        <div class="pzl-modal">
                            <div class="pzl-icon-bounce">🏆</div>
                            <h2>LEVEL SELESAI!</h2>
                            <p style="margin-bottom:20px">Persimpangan aman terkendali.</p>
                            <div class="pzl-stars-container">⭐⭐⭐</div>
                            <button id="pzl-btn-next" class="btn btn-primary">LEVEL SELANJUTNYA</button>
                            <button class="btn btn-outline" onclick="TrafficPuzzle.showLevelSelect()"
                                style="margin-top:10px">Pilih Level</button>
                        </div>
                    </div>

                    <!-- Pause Overlay -->
                    <div id="pzl-pause-screen" class="pzl-overlay hidden">
                        <div class="pzl-modal">
                            <div style="font-size:50px; margin-bottom:10px">⏸️</div>
                            <h2>GAME DIJEDA</h2>
                            <button id="pzl-btn-resume" class="btn btn-primary"
                                style="margin-top:20px">LANJUTKAN</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <<!-- SLOW CARS SCREEN -->
        <div id="slowcars-screen" class="screen">
            <div
                class="h-screen w-screen flex items-center justify-center overflow-hidden md:p-6 bg-gradient-to-br from-cyan-50 to-sky-100">
                <div
                    class="relative w-full h-full md:h-auto max-w-4xl bg-white md:rounded-[32px] overflow-hidden border-0 md:border-4 border-cyan-300 flex flex-col md:shadow-2xl">

                    <!-- Header -->
                    <div
                        class="bg-gradient-to-r from-cyan-400 to-sky-400 px-3 py-3 md:px-6 md:py-4 flex justify-between items-center text-white z-10 shadow-md">
                        <div class="flex items-center gap-2 md:gap-3">
                            <button
                                class="bg-white/20 hover:bg-white/30 text-white rounded-full w-8 h-8 flex items-center justify-center transition-all"
                                onclick="app.quitGame()" title="Tutup Game">
                                <i data-lucide="x" class="w-5 h-5"></i>
                            </button>
                            <div
                                class="bg-white/30 p-2 md:p-2.5 rounded-full text-yellow-200 shadow-inner hidden md:flex">
                                <i data-lucide="car-front" class="w-6 h-6"></i>
                            </div>
                            <div>
                                <h1 class="font-bubble text-base md:text-xl tracking-wide text-white drop-shadow-sm">
                                    SLOW
                                    CARS PUZZLE</h1>
                            </div>
                        </div>

                        <div class="flex items-center gap-1 md:gap-4 text-white font-bubble drop-shadow-sm">
                            <div
                                class="bg-white/20 px-2 py-1 md:px-3.5 md:py-1.5 rounded-xl flex flex-col items-center justify-center border border-white/30 shadow-inner">
                                <span
                                    class="text-[7px] md:text-[8px] font-sans text-cyan-100 font-bold uppercase">Skor</span>
                                <span id="slw-score-display" class="text-[10px] md:text-sm">0</span>
                            </div>
                            <div
                                class="bg-white/20 px-2 py-1 md:px-3.5 md:py-1.5 rounded-xl flex flex-col items-center justify-center border border-white/30 shadow-inner">
                                <span
                                    class="text-[7px] md:text-[8px] font-sans text-cyan-100 font-bold uppercase">Tertinggi</span>
                                <span id="slw-highscore-display"
                                    class="text-[10px] md:text-sm text-yellow-100">0</span>
                            </div>
                        </div>

                        <div class="flex items-center gap-1 md:gap-2">
                            <button id="slw-btn-sound"
                                class="p-2 bg-white/20 hover:bg-white/30 active:scale-95 transition-all rounded-xl text-yellow-100 border border-white/30">
                                🔊
                            </button>
                            <button id="slw-btn-pause"
                                class="p-2 bg-white/20 hover:bg-white/30 active:scale-95 transition-all rounded-xl text-yellow-100 border border-white/30">
                                ⏸️
                            </button>
                        </div>
                    </div>

                    <div
                        class="relative w-full flex-1 md:h-[500px] bg-emerald-900 flex items-center justify-center overflow-hidden">
                        <canvas id="slowCarsCanvas" class="w-full h-full block"></canvas>

                        <!-- Start Modal -->
                        <div id="slw-start-menu" class="pzl-overlay">
                            <div class="pzl-modal">
                                <div class="pzl-icon-bounce">🚗</div>
                                <h2>SLOW CARS</h2>
                                <p>Atur kecepatan mobil agar tidak tabrakan di persimpangan!</p>
                                <p style="font-size:12px; margin-bottom:20px">💡 Ketuk mobil untuk mengganti: Normal ➔
                                    Cepat
                                    ➔ Berhenti</p>
                                <button id="slw-btn-play" class="btn btn-primary">MULAI MAIN</button>
                            </div>
                        </div>

                        <!-- Game Over Modal -->
                        <div id="slw-game-over-screen" class="pzl-overlay hidden"
                            style="background:rgba(192,0,0,0.8)">
                            <div class="pzl-modal">
                                <div class="pzl-icon-shake">💥</div>
                                <h2 style="color:var(--danger-light)">TABRAKAN!</h2>
                                <p style="margin-bottom:20px">Lalu lintas menjadi kacau.</p>
                                <div class="pzl-result-box">
                                    <p>Skor Anda: <strong id="slw-final-score">0</strong></p>
                                    <p>Skor Tertinggi: <strong id="slw-final-highscore">0</strong></p>
                                </div>
                                <button id="slw-btn-restart" class="btn btn-primary">MAIN LAGI</button>
                            </div>
                        </div>

                        <!-- Pause Modal -->
                        <div id="slw-pause-screen" class="pzl-overlay hidden">
                            <div class="pzl-modal">
                                <div style="font-size:50px; margin-bottom:10px">⏸️</div>
                                <h2>GAME DIJEDA</h2>
                                <button id="slw-btn-resume" class="btn btn-primary"
                                    style="margin-top:20px">LANJUTKAN</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- BUS SCREEN -->
        <div id="bus-screen" class="screen">
            <div
                class="h-screen w-screen flex items-center justify-center overflow-hidden md:p-6 bg-gradient-to-br from-cyan-50 to-sky-100">
                <!-- Kontainer Utama Game -->
                <div
                    class="relative w-full h-full md:h-auto max-w-4xl bg-white md:rounded-[32px] overflow-hidden border-0 md:border-4 border-cyan-300 flex flex-col md:shadow-2xl">

                    <!-- Header Dashboard Edukasi Premium -->
                    <div
                        class="bg-gradient-to-r from-cyan-400 to-sky-400 px-3 py-3 md:px-6 md:py-4 flex justify-between items-center text-white z-10 shadow-md">
                        <div class="flex items-center gap-2 md:gap-3">
                            <button
                                class="bg-white/20 hover:bg-white/30 text-white rounded-full w-8 h-8 flex items-center justify-center transition-all"
                                onclick="app.quitGame()" title="Tutup Game">
                                <i data-lucide="x" class="w-5 h-5"></i>
                            </button>
                            <div
                                class="bg-white/30 p-2 md:p-2.5 rounded-full text-yellow-200 shadow-inner hidden md:flex">
                                <i data-lucide="bus" class="w-6 h-6"></i>
                            </div>
                            <div>
                                <h1 class="font-bubble text-base md:text-2xl tracking-wide text-white drop-shadow-sm">
                                    SUPIR
                                    BUS CILIK</h1>
                            </div>
                        </div>

                        <!-- Dashboard Skor, SIM & Kecepatan -->
                        <div class="flex items-center gap-1 md:gap-4 text-white font-bubble drop-shadow-sm">
                            <div
                                class="bg-white/20 px-2 py-1 md:px-3.5 md:py-1.5 rounded-xl flex items-center gap-1 border border-white/30 shadow-inner">
                                <i data-lucide="star"
                                    class="text-yellow-300 w-3 h-3 md:w-4 md:h-4 fill-yellow-300"></i>
                                <span id="bus-score-display" class="text-[11px] md:text-sm">0</span>
                            </div>
                            <div
                                class="bg-white/20 px-2 py-1 md:px-3.5 md:py-1.5 rounded-xl flex items-center gap-1 border border-white/30 shadow-inner">
                                <i data-lucide="shield-check" class="text-emerald-100 w-3 h-3 md:w-4 md:h-4"></i>
                                <span id="bus-points-display" class="text-[11px] md:text-sm">3</span>
                            </div>
                            <div id="speedo-container"
                                class="bg-white/20 px-2 py-0.5 md:px-3.5 md:py-1.5 rounded-xl flex flex-col items-center justify-center border border-white/30 min-w-[45px] md:min-w-[85px] shadow-inner transition-colors duration-300">
                                <span
                                    class="text-[7px] md:text-[8px] font-sans text-cyan-100 font-bold uppercase tracking-wider">Spedo</span>
                                <span id="bus-speedo-display" class="text-[10px] md:text-sm text-yellow-100">0
                                    km/h</span>
                            </div>
                        </div>

                        <!-- Kontrol Audio -->
                        <button id="bus-btn-sound"
                            class="p-2 bg-white/20 hover:bg-white/30 active:scale-95 transition-all rounded-xl text-yellow-100 border border-white/30"
                            title="Suara">
                            <i data-lucide="volume-2" id="bus-icon-sound" class="w-4 h-4 md:w-5 md:h-5"></i>
                        </button>
                    </div>

                    <!-- Area Simulasi Canvas Utama -->
                    <div
                        class="relative w-full flex-1 md:h-[450px] bg-emerald-900 flex items-center justify-center overflow-hidden">
                        <!-- Kanvas Simulasi Jalan Utama -->
                        <canvas id="busCanvas" class="w-full h-full block"></canvas>

                        <!-- Overlay Menu Utama (Mulai Mengemudi) -->
                        <div id="bus-start-menu"
                            class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm flex flex-col items-center justify-center p-4 md:p-6 text-center z-20 transition-all duration-500">
                            <div
                                class="bg-white border-4 border-cyan-300 p-6 md:p-8 rounded-[32px] max-w-md shadow-2xl scale-100 transition-all duration-300 w-full">
                                <div
                                    class="w-16 h-16 md:w-20 md:h-20 bg-cyan-100 border-4 border-cyan-400 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4 animate-bounce">
                                    <i data-lucide="shield-alert" class="w-8 h-8 md:w-12 md:h-12 text-cyan-500"></i>
                                </div>
                                <h2 class="text-2xl md:text-3xl font-bubble text-cyan-600 mb-1">SIM Cilik Mengemudi
                                </h2>
                                <p class="text-cyan-500 text-[10px] font-bold uppercase tracking-wider mb-3 md:mb-4">
                                    Edisi
                                    Tertib & Bebas Pusing</p>

                                <p class="text-slate-600 text-[11px] md:text-sm mb-5 leading-relaxed font-bold">
                                    Bantu jemput teman-teman di halte dan antar ke sekolah. Patuhi rambu lalu lintas,
                                    kurangi kecepatan, beri jalan kendaraan darurat, dan sayangi hewan!
                                </p>

                                <!-- Aturan Edukatif Rambu Driver -->
                                <div
                                    class="grid grid-cols-3 gap-2 mb-6 text-[9px] md:text-[10px] font-extrabold text-slate-700">
                                    <div
                                        class="bg-rose-50 border-2 border-rose-200 p-2 rounded-2xl flex flex-col justify-center">
                                        <span class="block text-red-500 text-lg md:text-xl mb-1">🚥</span>
                                        Henti Total Lampu Merah
                                    </div>
                                    <div
                                        class="bg-amber-50 border-2 border-amber-200 p-2 rounded-2xl flex flex-col justify-center">
                                        <span
                                            class="block text-amber-500 text-lg md:text-xl font-bubble mb-1">30</span>
                                        Rem &lt; 30 km/h di Radar
                                    </div>
                                    <div
                                        class="bg-emerald-50 border-2 border-emerald-200 p-2 rounded-2xl flex flex-col justify-center">
                                        <span class="block text-emerald-500 text-lg md:text-xl mb-1">🚒 🐈</span>
                                        Sayangi Sesama Makhluk
                                    </div>
                                </div>

                                <button id="bus-btn-play"
                                    class="w-full py-3 md:py-4 bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 hover:to-sky-300 active:scale-[0.98] transition-all text-white font-bubble rounded-2xl shadow-lg border-b-4 border-sky-500 tracking-wider text-sm md:text-base">
                                    SAYA SIAP BERKENDARA! 🚌
                                </button>
                            </div>
                        </div>

                        <!-- Balon Panduan Mengapung (Sangat Halus & Tenang) -->
                        <div id="bus-tutorial-bubble"
                            class="absolute top-4 left-4 bg-white/95 border border-cyan-200 px-4 py-3 rounded-2xl text-[11px] md:text-xs text-slate-700 font-bold max-w-[280px] shadow-lg pointer-events-none transition-all duration-300">
                            💡 <span class="text-cyan-600 font-bubble">Misi Utama:</span> Tekan tombol <b
                                class="text-emerald-500">GAS</b> atau tombol <b class="text-amber-500">Panah Atas</b>
                            untuk
                            menjalankan bus. Dekati halte perlahan!
                        </div>

                        <!-- Overlay Selesai Rute (Win Screen) -->
                        <div id="bus-win-screen"
                            class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center z-20 hidden">
                            <div
                                class="bg-white border-4 border-emerald-300 p-6 rounded-[32px] max-w-sm shadow-2xl w-full">
                                <div
                                    class="w-16 h-16 bg-emerald-100 border-4 border-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3 animate-bounce">
                                    <i data-lucide="award" class="w-8 h-8 text-emerald-500 fill-emerald-500"></i>
                                </div>
                                <h2 class="text-2xl font-bubble text-emerald-500 mb-1">PENGEMUDI TELADAN! 🎉</h2>
                                <p class="text-emerald-600/70 text-[10px] font-bold uppercase tracking-wider mb-3">
                                    Semua
                                    Siswa Selamat Sampai Tujuan</p>
                                <p id="bus-win-description"
                                    class="text-slate-600 text-xs md:text-sm mb-5 leading-relaxed font-bold">Luar
                                    biasa!
                                    Mengemudi dengan stabil, selalu mematuhi rambu jalan, dan mendarat di halte dengan
                                    sangat halus.</p>

                                <button id="bus-btn-next"
                                    class="w-full py-3 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 active:scale-[0.98] transition-all text-white font-bubble rounded-2xl shadow-md border-b-4 border-teal-500 text-sm">
                                    ULANGI PERJALANAN! 🌟
                                </button>
                            </div>
                        </div>

                        <!-- Overlay Pelanggaran / Lisensi Dicabut (Lose Screen) -->
                        <div id="bus-lose-screen"
                            class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center z-20 hidden">
                            <div
                                class="bg-white border-4 border-rose-300 p-6 rounded-[32px] max-w-sm shadow-2xl w-full">
                                <div
                                    class="w-16 h-16 bg-rose-100 border-4 border-rose-400 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <i data-lucide="alert-triangle" class="w-8 h-8 text-rose-500"></i>
                                </div>
                                <h2 class="text-2xl font-bubble text-rose-500 mb-1">SIM DICABUT! 🛑</h2>
                                <p class="text-rose-600/70 text-[10px] font-bold uppercase tracking-wider mb-3">Terlalu
                                    Banyak Pelanggaran</p>
                                <p id="bus-lose-description"
                                    class="text-slate-600 text-xs md:text-sm mb-5 leading-relaxed font-bold">Aduh! Anda
                                    terpaksa ditilang karena berkendara terlalu kencang atau melanggar lampu merah. Mari
                                    belajar tertib lagi!</p>

                                <button id="bus-btn-retry"
                                    class="w-full py-3 bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-400 hover:to-red-400 active:scale-[0.98] transition-all text-white font-bubble rounded-2xl shadow-md border-b-4 border-red-600 text-sm">
                                    BELAJAR KEMBALI 💪
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Panel Kontrol Pengemudi (Gas, Rem, Klakson, Setir Lajur) -->
                    <div id="bus-controls-panel"
                        class="bg-sky-50 border-t-2 border-sky-200 p-2 md:p-4 grid grid-cols-4 gap-2 z-10 opacity-40 cursor-not-allowed pointer-events-none transition-all duration-300">
                        <!-- Pindah Lajur Kiri -->
                        <button id="bus-btn-steer-left"
                            class="py-2.5 md:py-4 bg-slate-200 hover:bg-slate-300 active:scale-95 transition-all rounded-xl md:rounded-2xl text-slate-700 font-bubble text-[10px] md:text-xs border-b-4 border-slate-400 flex flex-col items-center justify-center gap-1">
                            <i data-lucide="chevron-left" class="w-4 h-4 md:w-5 md:h-5 text-slate-600"></i>
                            <span class="hidden md:inline">◀ LAJUR KIRI</span>
                            <span class="md:hidden text-center leading-tight">◀<br>KIRI</span>
                            <span
                                class="hidden md:block text-[8px] font-sans font-bold text-slate-500 uppercase">Hindari
                                Rintangan</span>
                        </button>

                        <!-- Pedal Rem -->
                        <button id="bus-btn-brake"
                            class="py-2.5 md:py-4 bg-rose-500 hover:bg-rose-400 active:scale-95 transition-all rounded-xl md:rounded-2xl text-white font-bubble text-[10px] md:text-xs border-b-4 border-rose-700 flex flex-col items-center justify-center gap-1">
                            <i data-lucide="circle-dot" class="w-4 h-4 md:w-5 md:h-5"></i>
                            <span class="hidden md:inline">🛑 PEDAL REM</span>
                            <span class="md:hidden text-center leading-tight">🛑<br>REM</span>
                            <span
                                class="hidden md:block text-[8px] font-sans font-bold text-rose-100 uppercase">Hentikan
                                Bus</span>
                        </button>

                        <!-- Tombol Klakson -->
                        <button id="bus-btn-horn"
                            class="py-2.5 md:py-4 bg-amber-400 hover:bg-amber-300 active:scale-95 transition-all rounded-xl md:rounded-2xl text-white font-bubble text-[10px] md:text-xs border-b-4 border-amber-600 flex flex-col items-center justify-center gap-1">
                            <i data-lucide="volume-2" class="w-4 h-4 md:w-5 md:h-5"></i>
                            <span class="hidden md:inline">📯 KLAKSON</span>
                            <span class="md:hidden text-center leading-tight">📯<br>BUNYI</span>
                            <span class="hidden md:block text-[8px] font-sans font-bold text-amber-100 uppercase">Beri
                                Peringatan</span>
                        </button>

                        <!-- Pedal Gas -->
                        <button id="bus-btn-gas"
                            class="py-2.5 md:py-4 bg-emerald-500 hover:bg-emerald-400 active:scale-95 transition-all rounded-xl md:rounded-2xl text-white font-bubble text-[10px] md:text-xs border-b-4 border-emerald-700 flex flex-col items-center justify-center gap-1 shadow-md">
                            <i data-lucide="chevrons-up" class="w-4 h-4 md:w-5 md:h-5"></i>
                            <span class="hidden md:inline">⚡ PEDAL GAS</span>
                            <span class="md:hidden text-center leading-tight">⚡<br>GAS</span>
                            <span
                                class="hidden md:block text-[8px] font-sans font-bold text-emerald-100 uppercase">Tahan
                                Untuk Jalan</span>
                        </button>
                    </div>
                </div>

            </div>
        </div>
        </div>

        <!-- BADGE NOTIFICATION POPUP -->
        <div id="badge-notification" class="badge-notification hidden">
            <div class="badge-notif-icon">🏅</div>
            <div class="badge-notif-info">
                <h4>Badge Baru!</h4>
                <p id="badge-name-notif">Nama Badge</p>
            </div>
        </div>

        <!-- COMBO POPUP -->
        <div id="ui-combo-popup" class="combo-popup hidden">🔥 COMBO! +5</div>

        <script src="{{ asset('assets/js/scenarios.js') }}"></script>
        <script src="{{ asset('assets/js/traffic-puzzle.js') }}"></script>
        <script src="{{ asset('assets/js/slow-cars.js') }}"></script>
        <script src="{{ asset('assets/js/bus.js') }}"></script>
        <script src="{{ asset('assets/js/main.js') }}"></script>
</body>

</html>
