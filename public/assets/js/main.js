// ============================================================
// LajuAman — Game Logic (Edukasi Murni)
// Game Edukasi Keselamatan Lalu Lintas
// PPKLAJ Provinsi Jawa Tengah 2026
// ============================================================

const app = (function () {
    // --- State ---
    let state = {
        nama: "",
        totalPoin: 0,
        currentLevel: "Pesepeda",
        badges: [],
        sessionCount: 0,
        highScore: 0,
        lastPlayed: null,
        currentMode: null,
        scenarioIndex: 0,
        combo: 0,
        correctCount: 0,
        sessionScore: 0,
        timerInterval: null,
        timeTaken: 0,
        modesDimainkan: []
    };

    let leaderboard = [];
    let tebakRambuData = [];

    // --- Audio (Web Audio API) ---
    let audioCtx;
    function getAudioCtx() {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        return audioCtx;
    }

    function playTone(freq, type, duration, vol = 0.08) {
        try {
            const ctx = getAudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            gain.gain.setValueAtTime(vol, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + duration);
        } catch (e) { /* ignore audio errors */ }
    }

    function playDing() {
        playTone(523, 'sine', 0.1);
        setTimeout(() => playTone(659, 'sine', 0.15), 80);
        setTimeout(() => playTone(784, 'sine', 0.2), 160);
    }

    function playBuzz() {
        playTone(150, 'sawtooth', 0.25, 0.12);
    }

    // --- LocalStorage ---
    function loadData() {
        try {
            const saved = localStorage.getItem('lajuaman_player');
            if (saved) {
                const parsed = JSON.parse(saved);
                state = { ...state, ...parsed };
            }
            const savedLB = localStorage.getItem('lajuaman_leaderboard');
            if (savedLB) {
                leaderboard = JSON.parse(savedLB);
            } else {
                leaderboard = [
                    { nama: "Budi", skor: 140, rank: "Pelopor" },
                    { nama: "Citra", skor: 120, rank: "Pengendara" },
                    { nama: "Andi", skor: 80, rank: "Pelajar" }
                ];
                saveLeaderboard();
            }
        } catch (e) { console.error("Load error:", e); }
    }

    function saveData() {
        try {
            localStorage.setItem('lajuaman_player', JSON.stringify({
                nama: state.nama,
                totalPoin: state.totalPoin,
                currentLevel: state.currentLevel,
                badges: state.badges,
                sessionCount: state.sessionCount,
                highScore: state.highScore,
                modesDimainkan: state.modesDimainkan,
                lastPlayed: new Date().toISOString().slice(0, 10)
            }));
        } catch (e) { console.error("Save error:", e); }
    }

    function saveLeaderboard() {
        try {
            localStorage.setItem('lajuaman_leaderboard', JSON.stringify(leaderboard));
        } catch (e) { console.error("Save LB error:", e); }
    }

    // --- UI Navigation ---
    function showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        const screen = document.getElementById(screenId);
        if (screen) screen.classList.add('active');

        // Show bottom nav only on dashboard-type screens
        const bottomNav = document.getElementById('bottom-nav');
        if (bottomNav) {
            const showNav = ['main-menu', 'leaderboard', 'badge-screen'].includes(screenId);
            bottomNav.style.display = showNav ? 'flex' : 'none';
        }

        if (screenId === 'leaderboard') renderLeaderboard();
        if (screenId === 'badge-screen') renderBadges();
        if (screenId === 'main-menu') updateHomeStats();
    }

    function updateHomeStats() {
        const bar = document.getElementById('player-stats-bar');
        if (state.nama) {
            bar.style.display = 'block';
            document.getElementById('ui-home-level').innerHTML = `<span class="stat-main-icon">${getLevelIcon()}</span><span class="stat-main-text">${state.currentLevel}</span>`;
            document.getElementById('ui-home-points').innerHTML = `<span class="stat-main-icon">⭐</span><span class="stat-main-text">${state.totalPoin} Poin</span>`;
        } else {
            bar.style.display = 'none';
        }
    }

    function getLevelIcon() {
        const lvl = LEVELS.find(l => l.name === state.currentLevel);
        const iconSource = lvl ? lvl.ikon : "🎒";
        
        if (iconSource.endsWith('.svg') || iconSource.endsWith('.png')) {
            return `<img src="${iconSource}" class="level-icon-img" alt="Icon">`;
        }
        return iconSource;
    }

    function quitGame() {
        clearInterval(state.timerInterval);
        if (typeof TrafficPuzzle !== 'undefined') TrafficPuzzle.quit();
        if (typeof SlowCars !== 'undefined') SlowCars.quit();
        if (typeof BusGame !== 'undefined') BusGame.quit();
        showScreen('main-menu');
    }

    // --- Gamification ---
    function checkLevelUp() {
        let newLevel = LEVELS[0].name;
        for (let i = LEVELS.length - 1; i >= 0; i--) {
            if (state.totalPoin >= LEVELS[i].minPoin) {
                newLevel = LEVELS[i].name;
                break;
            }
        }
        if (newLevel !== state.currentLevel) {
            state.currentLevel = newLevel;
        }
    }

    function awardBadge(badgeId) {
        if (!state.badges.includes(badgeId)) {
            state.badges.push(badgeId);
            const badgeDef = BADGES.find(b => b.id === badgeId);
            if (badgeDef) showBadgePopup(badgeDef.label);
            saveData();
        }
    }

    function showBadgePopup(badgeName) {
        const popup = document.getElementById('badge-notification');
        document.getElementById('badge-name-notif').textContent = badgeName;
        popup.classList.remove('hidden', 'hiding');
        setTimeout(() => {
            popup.classList.add('hiding');
            setTimeout(() => popup.classList.add('hidden'), 500);
        }, 3000);
    }

    function showComboPopup() {
        const p = document.getElementById('ui-combo-popup');
        p.classList.remove('hidden');
        p.style.animation = 'none';
        void p.offsetWidth;
        p.style.animation = 'comboAnim 1s forwards';
        setTimeout(() => p.classList.add('hidden'), 1100);
    }

    // --- Data Access ---
    function getActiveData() {
        if (state.currentMode === 'kuis') return KUIS_DATA;
        if (state.currentMode === 'tebak_rambu') return tebakRambuData;
        return SCENARIOS;
    }

    // --- Start Game ---
    function startGame(mode) {
        const nameInput = document.getElementById('player-name').value.trim();
        if (!nameInput) {
            alert("Silakan masukkan nama Anda terlebih dahulu!");
            showScreen('main-menu');
            return;
        }

        state.nama = nameInput;
        state.currentMode = mode;
        state.scenarioIndex = 0;
        state.sessionScore = 0;
        state.combo = 0;
        state.correctCount = 0;

        state.sessionCount++;
        if (state.sessionCount === 1) awardBadge("first_play");
        if (state.sessionCount >= 3) awardBadge("persistent");

        if (!state.modesDimainkan.includes(mode)) state.modesDimainkan.push(mode);
        if (state.modesDimainkan.length >= 3) awardBadge("all_modes");

        checkLevelUp();

        document.getElementById('ui-score').textContent = `⭐ 0`;

        const comboEl = document.getElementById('ui-combo');
        comboEl.classList.add('hidden');

        const uiTimer = document.getElementById('ui-timer');
        if (mode === 'tebak_rambu') {
            uiTimer.style.display = 'inline-flex';
        } else {
            uiTimer.style.display = 'none';
        }

        if (mode === 'puzzle') {
            showScreen('puzzle-screen');
            if (typeof TrafficPuzzle !== 'undefined') {
                TrafficPuzzle.init();
            }
            return; // Don't load scenario
        }

        if (mode === 'slowcars') {
            showScreen('slowcars-screen');
            if (typeof SlowCars !== 'undefined') {
                SlowCars.init();
            }
            return;
        }

        if (mode === 'bus') {
            showScreen('bus-screen');
            if (typeof BusGame !== 'undefined') {
                BusGame.init();
            }
            return;
        }

        showScreen('game-screen');

        if (mode === 'tebak_rambu') {
            tebakRambuData = [...RAMBU_DATA].sort(() => 0.5 - Math.random()).slice(0, 10);
            loadTebakRambu();
        } else {
            loadScenario();
        }
    }

    // --- Load Scenario (Skenario & Kuis) ---
    function loadScenario() {
        const data = getActiveData();
        if (state.scenarioIndex >= data.length) {
            endGame();
            return;
        }

        const sc = data[state.scenarioIndex];
        const prefix = state.currentMode === 'kuis' ? 'Soal' : 'Skenario';

        // Update progress
        const total = data.length;
        document.getElementById('progress-bar').style.width = `${(state.scenarioIndex / total) * 100}%`;
        document.getElementById('ui-progress-text').textContent = `${state.scenarioIndex + 1}/${total}`;

        // Set illustration
        const img = document.getElementById('ui-scenario-img');
        img.classList.remove('rambu-mode');
        img.parentElement.classList.remove('rambu-mode');
        
        if (state.currentMode === 'kuis') {
            img.parentElement.style.display = 'none';
        } else {
            img.parentElement.style.display = '';
            img.src = sc.gambar || 'assets/image/bg-main.png';
            img.alt = sc.situasi.substring(0, 60);
        }

        // Set question
        document.getElementById('ui-scenario-text').textContent = sc.situasi;

        // Render choices
        const container = document.getElementById('ui-choices');
        container.innerHTML = '';
        sc.pilihan.forEach(p => {
            const btn = document.createElement('button');
            btn.className = 'choice-btn';
            btn.innerHTML = `<strong>[${p.id}]</strong>&nbsp;&nbsp;${p.teks}`;
            btn.onclick = () => handleAnswer(p.id, btn);
            container.appendChild(btn);
        });
    }

    // --- Load Tebak Rambu ---
    function loadTebakRambu() {
        if (state.scenarioIndex >= tebakRambuData.length) {
            endGame();
            return;
        }

        const rambu = tebakRambuData[state.scenarioIndex];
        const total = tebakRambuData.length;

        // Progress
        document.getElementById('progress-bar').style.width = `${(state.scenarioIndex / total) * 100}%`;
        document.getElementById('ui-progress-text').textContent = `${state.scenarioIndex + 1}/${total}`;

        // Show rambu image as illustration
        const img = document.getElementById('ui-scenario-img');
        img.classList.add('rambu-mode');
        img.parentElement.classList.add('rambu-mode');
        img.parentElement.style.display = '';
        img.src = rambu.gambar || 'https://placehold.co/400x400/png?text=Rambu';
        img.alt = rambu.nama;

        // Question without icon
        document.getElementById('ui-scenario-text').innerHTML = `
            <div style="text-align:center; font-weight: 700; font-size: 18px; margin-top: 10px;">Apa arti rambu di atas?</div>
        `;

        // Generate choices (1 correct + 3 random wrong)
        const container = document.getElementById('ui-choices');
        container.innerHTML = '';
        const wrongs = RAMBU_DATA.filter(r => r.nama !== rambu.nama)
            .sort(() => 0.5 - Math.random()).slice(0, 3);
        const options = [...wrongs, rambu].sort(() => 0.5 - Math.random());

        options.forEach((opt, idx) => {
            const btn = document.createElement('button');
            btn.className = 'choice-btn';
            const letter = String.fromCharCode(65 + idx);
            btn.innerHTML = `<strong>[${letter}]</strong>&nbsp;&nbsp;${opt.nama}`;
            btn.onclick = () => handleTebakAnswer(opt.nama === rambu.nama, btn, rambu);
            container.appendChild(btn);
        });

        // Timer (10 seconds)
        clearInterval(state.timerInterval);
        state.timeTaken = 10;
        const uiTimer = document.getElementById('ui-timer');
        uiTimer.textContent = `⏱️ 10s`;
        uiTimer.classList.remove('timer-warning');

        state.timerInterval = setInterval(() => {
            state.timeTaken--;
            uiTimer.textContent = `⏱️ ${state.timeTaken}s`;
            if (state.timeTaken <= 3) uiTimer.classList.add('timer-warning');
            if (state.timeTaken <= 0) {
                clearInterval(state.timerInterval);
                // Time's up = wrong
                document.querySelectorAll('.choice-btn').forEach(b => b.disabled = true);
                handleTebakAnswer(false, document.createElement('div'), rambu);
            }
        }, 1000);
    }

    // --- Handle Answer (Skenario & Kuis) ---
    function handleAnswer(selectedId, btnElement) {
        clearInterval(state.timerInterval);
        document.querySelectorAll('.choice-btn').forEach(b => b.disabled = true);

        const data = getActiveData();
        const sc = data[state.scenarioIndex];
        const isCorrect = selectedId === sc.jawaban;

        if (isCorrect) {
            btnElement.classList.add('correct');
            playDing();

            let points = sc.poin;
            state.combo++;
            state.correctCount++;

            if (state.combo >= 3) {
                points += 5;
                showComboPopup();
            }
            if (state.combo >= 5) awardBadge("combo_king");

            state.sessionScore += points;
            state.totalPoin += points;

            // Update combo display
            const comboEl = document.getElementById('ui-combo');
            if (state.combo >= 2) {
                comboEl.textContent = `🔥 ${state.combo}x`;
                comboEl.classList.remove('hidden');
            }

            showFeedback(true, points, sc);
        } else {
            btnElement.classList.add('wrong');
            playBuzz();
            state.combo = 0;
            document.getElementById('ui-combo').classList.add('hidden');

            // Highlight correct answer
            document.querySelectorAll('.choice-btn').forEach(b => {
                if (b.innerHTML.includes(`[${sc.jawaban}]`)) b.classList.add('correct');
            });

            showFeedback(false, 0, sc);
        }

        document.getElementById('ui-score').textContent = `⭐ ${state.sessionScore}`;
        checkLevelUp();
        saveData();
    }

    // --- Handle Tebak Rambu Answer ---
    function handleTebakAnswer(isCorrect, btnElement, rambu) {
        clearInterval(state.timerInterval);
        document.querySelectorAll('.choice-btn').forEach(b => b.disabled = true);

        if (isCorrect) {
            btnElement.classList.add('correct');
            playDing();

            let points = 15;
            state.combo++;
            state.correctCount++;

            if (state.combo >= 3) { points += 5; showComboPopup(); }
            if (state.combo >= 5) awardBadge("combo_king");

            state.sessionScore += points;
            state.totalPoin += points;

            const comboEl = document.getElementById('ui-combo');
            if (state.combo >= 2) {
                comboEl.textContent = `🔥 ${state.combo}x`;
                comboEl.classList.remove('hidden');
            }

            showFeedback(true, points, { penjelasan: rambu.deskripsi, pasal: rambu.tipe });
        } else {
            btnElement.classList.add('wrong');
            playBuzz();
            state.combo = 0;
            document.getElementById('ui-combo').classList.add('hidden');

            document.querySelectorAll('.choice-btn').forEach(b => {
                if (b.innerHTML.includes(rambu.nama)) b.classList.add('correct');
            });

            showFeedback(false, 0, { penjelasan: rambu.deskripsi, pasal: rambu.tipe });
        }

        document.getElementById('ui-score').textContent = `⭐ ${state.sessionScore}`;
        checkLevelUp();
        saveData();
    }

    // --- Feedback ---
    function showFeedback(isCorrect, points, sc) {
        setTimeout(() => {
            document.getElementById('ui-feedback-icon').textContent = isCorrect ? '✅' : '❌';
            document.getElementById('ui-feedback-title').textContent = isCorrect ? 'BENAR!' : 'SALAH!';
            document.getElementById('ui-feedback-title').className = `feedback-title ${isCorrect ? 'correct' : 'wrong'}`;
            document.getElementById('ui-feedback-points').textContent = isCorrect ? `+${points} Poin` : '+0 Poin';
            document.getElementById('ui-feedback-explanation').textContent = sc.penjelasan;
            document.getElementById('ui-feedback-pasal').textContent = sc.pasal;
            showScreen('feedback-screen');
        }, 800);
    }

    // --- Next Scenario ---
    function nextScenario() {
        state.scenarioIndex++;
        showScreen('game-screen');

        if (state.currentMode === 'tebak_rambu') {
            loadTebakRambu();
        } else {
            loadScenario();
        }
    }

    // --- End Game ---
    function endGame() {
        clearInterval(state.timerInterval);
        const data = getActiveData();

        // Badges
        if (state.currentMode === 'skenario') awardBadge("etika_hero");
        if (state.currentMode === 'kuis' && state.sessionScore >= 80) awardBadge("uu_master");
        if (state.currentMode === 'tebak_rambu') awardBadge("rambu_master");
        if (state.correctCount === data.length) awardBadge("zero_violation");

        if (state.sessionScore > state.highScore) {
            state.highScore = state.sessionScore;
        }

        // Leaderboard
        leaderboard.push({
            nama: state.nama,
            skor: state.sessionScore,
            rank: state.currentLevel
        });
        leaderboard.sort((a, b) => b.skor - a.skor);
        leaderboard = leaderboard.slice(0, 10);
        saveLeaderboard();

        const myRank = leaderboard.findIndex(e => e.nama === state.nama && e.skor === state.sessionScore);
        if (myRank >= 0 && myRank < 3) awardBadge("top_scorer");

        saveData();

        // Populate Result
        document.getElementById('ui-result-name').textContent = state.nama;
        document.getElementById('ui-result-score').textContent = state.sessionScore;
        const accuracy = data.length > 0 ? Math.round((state.correctCount / data.length) * 100) : 0;
        document.getElementById('ui-result-accuracy').textContent = `${accuracy}%`;
        document.getElementById('ui-result-rank').textContent = state.currentLevel;

        showScreen('result-screen');
    }

    // --- Leaderboard ---
    function renderLeaderboard() {
        const list = document.getElementById('ui-leaderboard-list');
        list.innerHTML = '';
        const medals = ['🥇', '🥈', '🥉'];
        leaderboard.forEach((entry, i) => {
            const li = document.createElement('li');
            const medal = medals[i] || `${i + 1}.`;
            li.innerHTML = `<span>${medal} ${entry.nama}</span><span>${entry.skor} ⭐ ${entry.rank}</span>`;
            list.appendChild(li);
        });

        const cur = document.getElementById('ui-leaderboard-current');
        if (state.nama) {
            cur.innerHTML = `→ ${state.nama} | Skor Tertinggi: ${state.highScore} | ${state.currentLevel}`;
        } else {
            cur.innerHTML = 'Mainkan game untuk masuk Leaderboard!';
        }
    }

    // --- Badge Screen ---
    function renderBadges() {
        const grid = document.getElementById('ui-badge-grid');
        grid.innerHTML = '';
        BADGES.forEach(b => {
            const unlocked = state.badges.includes(b.id);
            const div = document.createElement('div');
            div.className = `badge-card ${unlocked ? '' : 'locked'}`;
            const parts = b.label.split(' ');
            const icon = parts[0];
            const name = parts.slice(1).join(' ');
            div.innerHTML = `
                <div class="badge-card-icon">${icon}</div>
                <div class="badge-card-label">${name}</div>
                <div class="badge-card-cond">${unlocked ? '✅ Terbuka' : b.cond}</div>
            `;
            grid.appendChild(div);
        });
    }

    // --- Belajar (Ensiklopedia Rambu) ---
    function showBelajar() {
        if (!state.modesDimainkan.includes('belajar')) state.modesDimainkan.push('belajar');

        const list = document.getElementById('ui-rambu-list');
        list.innerHTML = '';
        RAMBU_DATA.forEach(r => {
            const div = document.createElement('div');
            div.className = 'rambu-item';
            div.innerHTML = `
                <div class="rambu-icon-container" style="display: flex; align-items: center; justify-content: center; width: 60px; height: 60px; flex-shrink: 0;">
                    <img src="${r.gambar}" alt="${r.nama}" style="max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 8px;">
                </div>
                <div class="rambu-info">
                    <h4>${r.nama} ${r.ikon}</h4>
                    <span>${r.tipe}</span>
                    <p>${r.deskripsi}</p>
                </div>
            `;
            list.appendChild(div);
        });
        showScreen('belajar-screen');
    }

    // --- Data UU LLAJ No. 22/2009 ---
    const PASAL_DATA = [
        { pasal: "Pasal 77 ayat (1)", kategori: "umum", isi: "Setiap orang yang mengemudikan kendaraan bermotor wajib memiliki Surat Izin Mengemudi (SIM) sesuai jenis kendaraannya." },
        { pasal: "Pasal 81", kategori: "umum", isi: "Syarat usia minimal untuk memperoleh SIM adalah 17 tahun untuk SIM A (mobil) dan SIM C (sepeda motor)." },
        { pasal: "Pasal 68 ayat (1)", kategori: "umum", isi: "Setiap kendaraan bermotor yang dioperasikan di jalan wajib dilengkapi Surat Tanda Nomor Kendaraan (STNK) dan Tanda Nomor Kendaraan Bermotor (pelat nomor)." },
        { pasal: "Pasal 106 ayat (1)", kategori: "tata-tertib", isi: "Setiap pengemudi wajib mengemudikan kendaraan dengan wajar dan penuh konsentrasi (tidak terdistraksi HP, mengantuk, dll)." },
        { pasal: "Pasal 106 ayat (2)", kategori: "keselamatan", isi: "Setiap pengemudi wajib mengutamakan keselamatan pejalan kaki dan pesepeda saat berkendara di jalan." },
        { pasal: "Pasal 106 ayat (8)", kategori: "keselamatan", isi: "Pengemudi dan penumpang sepeda motor wajib mengenakan helm yang memenuhi Standar Nasional Indonesia (SNI)." },
        { pasal: "Pasal 107 ayat (2)", kategori: "keselamatan", isi: "Pengemudi sepeda motor wajib menyalakan lampu utama pada siang hari (Daytime Running Light)." },
        { pasal: "Pasal 109 ayat (1)", kategori: "tata-tertib", isi: "Mendahului/menyalip kendaraan lain wajib dari sisi kanan, serta memberikan isyarat (sein) dan menjaga jarak aman." },
        { pasal: "Pasal 112 ayat (1)", kategori: "tata-tertib", isi: "Pengemudi wajib memberikan isyarat (lampu sein) sekurang-kurangnya 30 meter sebelum berbelok atau berpindah lajur." },
        { pasal: "Pasal 113 ayat (1)", kategori: "tata-tertib", isi: "Pada persimpangan tanpa lampu lalu lintas, pengemudi wajib mendahulukan kendaraan dari kiri atau dari jalan utama." },
        { pasal: "Pasal 115", kategori: "tata-tertib", isi: "Pengemudi dilarang melampaui batas kecepatan maksimum yang ditetapkan atau melakukan balapan liar di jalan." },
        { pasal: "Pasal 131", kategori: "keselamatan", isi: "Pejalan kaki berhak atas ketersediaan fasilitas pendukung berupa trotoar, zebra cross, dan fasilitas penyeberangan aman." },
        { pasal: "Pasal 134", kategori: "keselamatan", isi: "Pengguna jalan wajib mendahulukan kendaraan prioritas (Pemadam kebakaran, Ambulans, Penolong kecelakaan, rombongan resmi)." },
        { pasal: "Pasal 289", kategori: "keselamatan", isi: "Pengemudi dan penumpang depan mobil wajib memakai sabuk keselamatan (safety belt) saat kendaraan melaju." },
        { pasal: "Pasal 280", kategori: "sanksi", isi: "Mengemudikan kendaraan bermotor tanpa pelat nomor (TNKB) resmi dipidana kurungan maks 2 bulan atau denda maks Rp500.000." },
        { pasal: "Pasal 281", kategori: "sanksi", isi: "Mengemudikan kendaraan bermotor tanpa memiliki SIM dipidana kurungan maks 4 bulan atau denda maks Rp1.000.000." },
        { pasal: "Pasal 283", kategori: "sanksi", isi: "Mengemudi dengan gangguan konsentrasi (seperti bermain HP) dipidana kurungan maks 3 bulan atau denda maks Rp750.000." },
        { pasal: "Pasal 287 ayat (1)", kategori: "sanksi", isi: "Melanggar rambu lalu lintas atau marka jalan dipidana kurungan maks 2 bulan atau denda maks Rp500.000." },
        { pasal: "Pasal 287 ayat (2)", kategori: "sanksi", isi: "Menerobos lampu merah (melanggar APILL) dipidana kurungan maks 2 bulan atau denda maks Rp500.000." },
        { pasal: "Pasal 287 ayat (5)", kategori: "sanksi", isi: "Melanggar batas kecepatan tertinggi atau terendah dipidana kurungan maks 2 bulan atau denda maks Rp500.000." },
        { pasal: "Pasal 288 ayat (1)", kategori: "sanksi", isi: "Mengemudikan kendaraan bermotor tanpa dilengkapi STNK yang sah dipidana kurungan maks 2 bulan atau denda maks Rp500.000." },
        { pasal: "Pasal 288 ayat (2)", kategori: "sanksi", isi: "Mengemudi tanpa membawa/menunjukkan SIM saat razia dipidana kurungan maks 1 bulan atau denda maks Rp250.000." },
        { pasal: "Pasal 291", kategori: "sanksi", isi: "Pengendara atau penumpang sepeda motor yang tidak menggunakan helm SNI dipidana kurungan maks 1 bulan atau denda maks Rp250.000." }
    ];

    // --- Rangkuman UU ---
    function showRangkumanUU() {
        // Reset active tab in UI
        const tabContainer = document.getElementById('ui-uu-tabs');
        if (tabContainer) {
            const btns = tabContainer.querySelectorAll('.uu-tab-btn');
            btns.forEach((btn, idx) => {
                if (idx === 0) btn.classList.add('active');
                else btn.classList.remove('active');
            });
        }

        renderUUList('semua');
        showScreen('uu-screen');
    }

    function renderUUList(category) {
        const list = document.getElementById('ui-uu-list');
        if (!list) return;

        list.innerHTML = '';

        const filtered = category === 'semua'
            ? PASAL_DATA
            : PASAL_DATA.filter(p => p.kategori === category);

        filtered.forEach(p => {
            const div = document.createElement('div');
            div.className = 'uu-item';
            div.innerHTML = `<h4>📌 ${p.pasal}</h4><p>${p.isi}</p>`;
            list.appendChild(div);
        });
    }

    function filterUU(category, btnElement) {
        // Update active class
        const tabContainer = document.getElementById('ui-uu-tabs');
        if (tabContainer) {
            tabContainer.querySelectorAll('.uu-tab-btn').forEach(btn => {
                btn.classList.remove('active');
            });
        }
        if (btnElement) {
            btnElement.classList.add('active');
        }

        renderUUList(category);
    }

    // --- Initialization ---
    window.onload = () => {
        setTimeout(() => {
            loadData();
            if (!state.modesDimainkan) state.modesDimainkan = [];
            showScreen('main-menu');
            if (state.nama) {
                document.getElementById('player-name').value = state.nama;
            }
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }, 1200);
    };

    // --- Full Screen Toggle ---
    function toggleFullScreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.warn(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }

    // --- Expose API ---
    return {
        showScreen,
        startGame,
        quitGame,
        handleAnswer,
        nextScenario,
        showBelajar,
        showRangkumanUU,
        filterUU,
        toggleFullScreen
    };
})();
