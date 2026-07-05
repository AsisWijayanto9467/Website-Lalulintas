// ============================================================
// LajuAman — Laravel API Version (Token + localStorage)
// ============================================================

// ========== TOKEN MANAGER ==========
const TokenManager = {
    KEY: "lajuaman_player_token",

    get() {
        return localStorage.getItem(this.KEY);
    },

    save(token) {
        localStorage.setItem(this.KEY, token);
    },

    clear() {
        localStorage.removeItem(this.KEY);
    },
};

// ========== API HELPER ==========
const API = {
    async call(endpoint, options = {}) {
        try {
            const token = TokenManager.get();
            // Add token to URL if it's a GET request
            let url = `${window.API_BASE}${endpoint}`;
            const headers = {
                "Content-Type": "application/json",
                Accept: "application/json",
                "X-CSRF-TOKEN": window.CSRF_TOKEN,
            };

            // Add token as query parameter for GET requests or to body for POST
            if (token) {
                if (options.method === "GET" || !options.method) {
                    const separator = url.includes("?") ? "&" : "?";
                    url += `${separator}token=${token}`;
                } else {
                    // For POST/PUT, add to request body
                    const body = JSON.parse(options.body || "{}");
                    body.token = token;
                    options.body = JSON.stringify(body);
                }
            }

            const res = await fetch(url, {
                headers,
                ...options,
            });

            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (e) {
            console.error("API Error:", e.message);
            return null;
        }
    },

    // ===== PLAYER =====
    register: (nama) =>
        API.call("/player/register", {
            method: "POST",
            body: JSON.stringify({ nama }),
        }),

    updateName: (nama) =>
        API.call("/player/name", {
            method: "PUT",
            body: JSON.stringify({ nama }),
        }),

    checkToken: () => {
        const token = TokenManager.get();
        if (!token) return Promise.resolve(null);
        return API.call("/player/check");
    },

    getPlayerInfo: () => API.call("/player/info"),
    getBadges: () => API.call("/player/badges"),

    // ===== GAME DATA =====
    getQuestions: (mode) => {
        const map = {
            skenario: "/scenarios",
            kuis: "/quiz-questions",
            tebak_rambu: "/road-signs/random/10",
        };
        return API.call(map[mode] || "/scenarios");
    },
    getRoadSigns: () => API.call("/road-signs"),
    getLawArticles: (kategori) => {
        const url = kategori
            ? `/law-articles?kategori=${kategori}`
            : "/law-articles";
        return API.call(url);
    },

    // ===== GAME ACTIONS =====
    submitAnswer: (data) =>
        API.call("/quiz/submit", {
            method: "POST",
            body: JSON.stringify(data),
        }),
    endSession: (data) =>
        API.call("/quiz/end", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    // ===== LEADERBOARD =====
    getLeaderboard: () => API.call("/leaderboard"),
};

// ========== MAIN APP ==========
const app = (function () {
    // --- State ---
    let state = {
        nama: "",
        totalPoin: 0,
        currentLevel: "Pesepeda",
        levelIcon: "🎒",
        highScore: 0,
        sessionCount: 0,
        currentMode: null,
        scenarioIndex: 0,
        combo: 0,
        correctCount: 0,
        sessionScore: 0,
        timerInterval: null,
        timeTaken: 0,
        modesDimainkan: [],
    };

    let currentGameData = [];
    let isRegistered = false;

    // ===== AUDIO =====
    let audioCtx;
    function getAudioCtx() {
        if (!audioCtx)
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === "suspended") audioCtx.resume();
        return audioCtx;
    }
    function playTone(f, t, d, v = 0.08) {
        try {
            const c = getAudioCtx(),
                o = c.createOscillator(),
                g = c.createGain();
            o.type = t;
            o.frequency.setValueAtTime(f, c.currentTime);
            g.gain.setValueAtTime(v, c.currentTime);
            g.gain.exponentialRampToValueAtTime(0.01, c.currentTime + d);
            o.connect(g);
            g.connect(c.destination);
            o.start();
            o.stop(c.currentTime + d);
        } catch (e) {}
    }
    function playDing() {
        playTone(523, "sine", 0.1);
        setTimeout(() => playTone(659, "sine", 0.15), 80);
        setTimeout(() => playTone(784, "sine", 0.2), 160);
    }
    function playBuzz() {
        playTone(150, "sawtooth", 0.25, 0.12);
    }

    // ===== UI =====
    function showScreen(id) {
        document
            .querySelectorAll(".screen")
            .forEach((s) => s.classList.remove("active"));
        const el = document.getElementById(id);
        if (el) el.classList.add("active");
        const nav = document.getElementById("bottom-nav");
        if (nav)
            nav.style.display = [
                "main-menu",
                "leaderboard",
                "badge-screen",
            ].includes(id)
                ? "flex"
                : "none";
        if (id === "leaderboard") renderLeaderboard();
        if (id === "badge-screen") renderBadges();
        if (id === "main-menu") updateHomeStats();

        // Update bottom nav active state
        document
            .querySelectorAll(".nav-item")
            .forEach((n) => n.classList.remove("active"));
        const activeNav = document.querySelector(`.nav-item[onclick*="${id}"]`);
        if (activeNav) activeNav.classList.add("active");
    }

    function getLevelIconPath(levelName) {
        // Mapping nama level ke path file SVG
        const levelIconMap = {
            'Pesepeda': '/assets/image/level/pesepeda.svg',
            'Siswa': '/assets/image/level/siswa.svg',
            'Pelajar': '/assets/image/level/pelajar.svg',
            'Pengendara': '/assets/image/level/pengendara.svg',
            'Pengemudi': '/assets/image/level/pengemudi.svg',
            'Bikers': '/assets/image/level/bikers.svg',
            'Road Captain': '/assets/image/level/road-captain.svg',
            'Safety Warrior': '/assets/image/level/safety-warrior.svg',
            'Traffic Legend': '/assets/image/level/traffic-legend.svg',
        };

        // Kembalikan path jika ada, atau gunakan emoji sebagai fallback
        return levelIconMap[levelName] || null;
    }

    function updateHomeStats() {
        const bar = document.getElementById("player-stats-bar");
        if (state.nama) {
            bar.style.display = "block";

            // Dapatkan path icon level
            const levelIconPath = getLevelIconPath(state.currentLevel);

            // Tampilkan icon level (gambar SVG atau emoji sebagai fallback)
            if (levelIconPath) {
                document.getElementById("ui-home-level").innerHTML =
                    `<img src="${levelIconPath}" alt="${state.currentLevel}" class="level-icon-inline" style="width:20px;height:20px;vertical-align:middle;margin-right:4px;" onerror="this.style.display='none'"> ${state.currentLevel}`;
            } else {
                document.getElementById("ui-home-level").innerHTML =
                    `${state.levelIcon} ${state.currentLevel}`;
            }

            document.getElementById("ui-home-points").innerHTML =
                `⭐ ${state.totalPoin} Poin`;
        } else {
            bar.style.display = "none";
        }
    }

    // ===== MODIFIED QUIT GAME WITH CONFIRMATION =====
    function quitGame() {
        // Cek apakah sedang dalam mode quiz (skenario, kuis, tebak_rambu)
        const quizModes = ['skenario', 'kuis', 'tebak_rambu'];
        const isQuizMode = quizModes.includes(state.currentMode);

        if (isQuizMode && state.scenarioIndex < currentGameData.length) {
            // Tampilkan popup konfirmasi pertama: Yakin mau keluar?
            showExitConfirmation();
        } else {
            // Langsung keluar untuk game canvas atau quiz yang sudah selesai
            performQuitGame(false);
        }
    }

    // ===== SHOW EXIT CONFIRMATION POPUP =====
    function showExitConfirmation() {
        // Hentikan timer sementara
        clearInterval(state.timerInterval);

        const progressInfo = `Progress: ${state.scenarioIndex + 1}/${currentGameData.length} soal (${state.correctCount} benar, ⭐ ${state.sessionScore} poin)`;

        const overlay = document.createElement('div');
        overlay.className = 'confirm-overlay';
        overlay.id = 'exit-confirm-overlay';

        overlay.innerHTML = `
            <div class="confirm-card">
                <div class="confirm-icon warning">⚠️</div>
                <h2 class="confirm-title">Yakin Mau Keluar?</h2>
                <p class="confirm-message">
                    Kamu sedang mengerjakan <strong>${getModeName(state.currentMode)}</strong>.
                    Progress pengerjaanmu akan hilang jika tidak disimpan.
                </p>
                <div class="confirm-progress-info">
                    ${progressInfo}
                </div>
                <div class="confirm-actions">
                    <button class="confirm-btn confirm-btn-secondary" id="btn-cancel-exit">
                        ❌ Lanjutkan
                    </button>
                    <button class="confirm-btn confirm-btn-primary" id="btn-confirm-exit">
                        🚪 Keluar & Simpan
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Event listeners
        document.getElementById('btn-cancel-exit').onclick = () => {
            document.body.removeChild(overlay);
            // Lanjutkan timer jika mode tebak_rambu
            if (state.currentMode === 'tebak_rambu') {
                startTimer();
            }
        };

        document.getElementById('btn-confirm-exit').onclick = () => {
            // Tampilkan popup kedua: Simpan progress?
            document.body.removeChild(overlay);
            showSaveProgressConfirmation();
        };
    }

    // ===== SHOW SAVE PROGRESS CONFIRMATION =====
    function showSaveProgressConfirmation() {
        const overlay = document.createElement('div');
        overlay.className = 'confirm-overlay';
        overlay.id = 'save-progress-overlay';

        const modeName = getModeName(state.currentMode);

        overlay.innerHTML = `
            <div class="confirm-card">
                <div class="confirm-icon">💾</div>
                <h2 class="confirm-title">Simpan Progress?</h2>
                <p class="confirm-message">
                    Kamu sudah mengerjakan <strong>${state.scenarioIndex + 1} dari ${currentGameData.length}</strong> soal
                    di mode <strong>${modeName}</strong>.
                </p>
                <div class="confirm-progress-info">
                    📊 Skor sementara: <strong>⭐ ${state.sessionScore}</strong><br>
                    ✅ Jawaban benar: <strong>${state.correctCount}</strong><br>
                    🔥 Combo: <strong>${state.combo}x</strong>
                </div>
                <div class="confirm-actions">
                    <button class="confirm-btn confirm-btn-secondary" id="btn-no-save">
                        🗑️ Jangan Simpan
                    </button>
                    <button class="confirm-btn confirm-btn-success" id="btn-yes-save">
                        💾 Simpan Progress
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        document.getElementById('btn-no-save').onclick = () => {
            document.body.removeChild(overlay);
            performQuitGame(false);
        };

        document.getElementById('btn-yes-save').onclick = () => {
            document.body.removeChild(overlay);
            saveGameProgress();
            performQuitGame(true);
        };
    }

    // ===== SAVE GAME PROGRESS =====
    function saveGameProgress() {
        const progressData = {
            mode: state.currentMode,
            scenarioIndex: state.scenarioIndex,
            sessionScore: state.sessionScore,
            correctCount: state.correctCount,
            combo: state.combo,
            totalQuestions: currentGameData.length,
            gameData: currentGameData, // Simpan data soal
            timestamp: Date.now()
        };

        localStorage.setItem('lajuaman_game_progress', JSON.stringify(progressData));
        console.log('Progress saved:', progressData);
    }

    // ===== LOAD GAME PROGRESS =====
    function loadGameProgress() {
        const saved = localStorage.getItem('lajuaman_game_progress');
        if (!saved) return null;

        try {
            const progressData = JSON.parse(saved);

            // Cek apakah progress masih valid (kurang dari 24 jam)
            const hoursPassed = (Date.now() - progressData.timestamp) / (1000 * 60 * 60);
            if (hoursPassed > 24) {
                localStorage.removeItem('lajuaman_game_progress');
                return null;
            }

            return progressData;
        } catch (e) {
            localStorage.removeItem('lajuaman_game_progress');
            return null;
        }
    }

    // ===== CHECK FOR SAVED PROGRESS =====
    function checkSavedProgress() {
        const progress = loadGameProgress();
        if (!progress || progress.scenarioIndex >= progress.totalQuestions) return false;

        return progress;
    }

    // ===== RESUME GAME FROM SAVED PROGRESS =====
    async function resumeGame() {
        const progress = loadGameProgress();
        if (!progress) return false;

        state.currentMode = progress.mode;
        state.scenarioIndex = progress.scenarioIndex;
        state.sessionScore = progress.sessionScore;
        state.correctCount = progress.correctCount;
        state.combo = progress.combo;
        currentGameData = progress.gameData;

        document.getElementById("ui-score").textContent = `⭐ ${state.sessionScore}`;

        if (state.combo >= 2) {
            const ce = document.getElementById("ui-combo");
            ce.textContent = `🔥 ${state.combo}x`;
            ce.classList.remove("hidden");
            ce.style.display = "inline-flex";
        }

        document.getElementById("ui-timer").style.display =
            state.currentMode === "tebak_rambu" ? "inline-flex" : "none";

        showScreen("game-screen");
        loadScenario();

        // Hapus progress setelah di-resume
        localStorage.removeItem('lajuaman_game_progress');

        return true;
    }

    // ===== PERFORM ACTUAL QUIT =====
    function performQuitGame(wasSaved) {
        // Hentikan semua timer yang berjalan
        clearInterval(state.timerInterval);
        state.timerInterval = null;

        // End session ke server jika ada progress yang belum disimpan
        if (!wasSaved && state.correctCount > 0 && state.currentMode) {
            API.endSession({
                mode: state.currentMode,
                session_score: state.sessionScore,
                correct_count: state.correctCount,
                total_questions: currentGameData.length,
            }).then(result => {
                if (result?.player_stats) {
                    state.totalPoin = result.player_stats.total_poin;
                    state.highScore = result.player_stats.high_score;
                    state.currentLevel = result.player_stats.level;
                    state.sessionCount = result.player_stats.session_count;
                }
                updateHomeStats();
            }).catch(e => console.log('Error ending session:', e));
        }

        // Reset state game
        state.currentMode = null;
        state.scenarioIndex = 0;
        state.sessionScore = 0;
        state.combo = 0;
        state.correctCount = 0;
        state.timeTaken = 0;
        currentGameData = [];

        // Hentikan game canvas dengan aman
        try {
            if (typeof TrafficPuzzle !== "undefined" && TrafficPuzzle.quit) {
                TrafficPuzzle.quit();
            }
        } catch (e) { console.log("TrafficPuzzle not available"); }

        try {
            if (typeof SlowCars !== "undefined" && SlowCars.quit) {
                SlowCars.quit();
            }
        } catch (e) {
            console.log("SlowCars not available");
        }

        try {
            if (typeof BusGame !== "undefined" && BusGame.quit) {
                BusGame.quit();
            }
        } catch (e) {
            console.log("BusGame not available");
        }

        // Reset UI game screen
        resetGameUI();

        // Kembali ke main menu
        showScreen("main-menu");

        // Update stats di home
        updateHomeStats();

        console.log("Game quit successfully", wasSaved ? "(progress saved)" : "");
    }

    // ===== RESET GAME UI =====
    function resetGameUI() {
        const uiScore = document.getElementById("ui-score");
        if (uiScore) uiScore.textContent = "⭐ 0";

        const uiCombo = document.getElementById("ui-combo");
        if (uiCombo) {
            uiCombo.classList.add("hidden");
            uiCombo.style.display = "none";
        }

        const uiTimer = document.getElementById("ui-timer");
        if (uiTimer) {
            uiTimer.style.display = "none";
            uiTimer.textContent = "⏱️ 0s";
            uiTimer.classList.remove("timer-warning");
        }

        const progressBar = document.getElementById("progress-bar");
        if (progressBar) progressBar.style.width = "0%";

        const progressText = document.getElementById("ui-progress-text");
        if (progressText) progressText.textContent = "0/0";

        const scenarioText = document.getElementById("ui-scenario-text");
        if (scenarioText) scenarioText.textContent = "Memuat skenario...";

        const choicesContainer = document.getElementById("ui-choices");
        if (choicesContainer) choicesContainer.innerHTML = "";

        const scenarioImg = document.getElementById("ui-scenario-img");
        if (scenarioImg) {
            scenarioImg.classList.remove("rambu-mode");
            scenarioImg.parentElement.classList.remove("rambu-mode");
            scenarioImg.parentElement.style.display = "";
        }

        // Reset semua tombol choice
        document.querySelectorAll(".choice-btn").forEach((btn) => {
            btn.disabled = false;
            btn.classList.remove("correct", "wrong");
        });
    }

    // ===== GET MODE NAME HELPER =====
    function getModeName(mode) {
        const modeNames = {
            'skenario': 'Simulasi Skenario',
            'kuis': 'Kuis UU LLAJ',
            'tebak_rambu': 'Tebak Rambu Cepat',
            'puzzle': 'Traffic Tap Puzzle',
            'slowcars': 'Slow Cars Puzzle',
            'bus': 'Supir Bus Cilik'
        };
        return modeNames[mode] || mode;
    }

    function showBadgePopup(n) {
        const p = document.getElementById("badge-notification");
        if (!p) return;
        document.getElementById("badge-name-notif").textContent = n;
        p.classList.remove("hidden", "hiding");
        p.style.display = "block";
        setTimeout(() => {
            p.classList.add("hiding");
            setTimeout(() => {
                p.classList.add("hidden");
                p.style.display = "none";
            }, 500);
        }, 3000);
    }

    function showComboPopup() {
        const p = document.getElementById("ui-combo-popup");
        if (!p) return;
        p.classList.remove("hidden");
        p.style.display = "block";
        p.style.animation = "none";
        void p.offsetWidth;
        p.style.animation = "comboAnim 1s forwards";
        setTimeout(() => {
            p.classList.add("hidden");
            p.style.display = "none";
        }, 1100);
    }

    function toggleFullScreen() {
        if (!document.fullscreenElement)
            document.documentElement.requestFullscreen().catch(() => {});
        else if (document.exitFullscreen) document.exitFullscreen();
    }

    // ===== REGISTRATION CHECK =====
    async function checkRegistration() {
        const savedToken = TokenManager.get();

        if (!savedToken) {
            isRegistered = false;
            showScreen("main-menu");
            updateHomeStats();
            return;
        }

        const result = await API.checkToken();

        if (result?.exists) {
            isRegistered = true;
            state.nama = result.player.nama || "";
            state.totalPoin = result.player.total_poin || 0;
            state.currentLevel = result.player.level || "Pesepeda";
            state.levelIcon = result.player.level_icon || "🎒";
            state.highScore = result.player.high_score || 0;
            state.sessionCount = result.player.session_count || 0;
            state.modesDimainkan = result.player.modes_dimainkan || [];
        } else {
            TokenManager.clear();
            isRegistered = false;
        }

        showScreen("main-menu");
        if (state.nama) {
            const nameInput = document.getElementById("player-name");
            if (nameInput) nameInput.value = state.nama;
        }
        updateHomeStats();
    }

    // ===== START GAME =====
    async function startGame(mode) {
        const nameInput = document.getElementById("player-name");
        const inputName = nameInput ? nameInput.value.trim() : "";

        // Cek apakah ada progress tersimpan untuk mode ini
        const savedProgress = checkSavedProgress();
        if (savedProgress && savedProgress.mode === mode) {
            // Tampilkan popup untuk melanjutkan progress
            showResumeProgressPopup(mode, savedProgress, inputName);
            return;
        }

        // Jika tidak ada progress tersimpan, mulai game baru
        await startGameFresh(mode, inputName);
    }

    // ===== SHOW RESUME PROGRESS POPUP =====
    function showResumeProgressPopup(mode, progress, inputName) {
        const overlay = document.createElement('div');
        overlay.className = 'confirm-overlay';
        overlay.id = 'resume-progress-overlay';

        const modeName = getModeName(mode);

        overlay.innerHTML = `
            <div class="confirm-card">
                <div class="confirm-icon">📋</div>
                <h2 class="confirm-title">Lanjutkan Progress?</h2>
                <p class="confirm-message">
                    Kamu memiliki progress yang belum selesai di mode <strong>${modeName}</strong>.
                </p>
                <div class="confirm-progress-info">
                    📍 Progress: <strong>${progress.scenarioIndex + 1}/${progress.totalQuestions} soal</strong><br>
                    ⭐ Skor: <strong>${progress.sessionScore} poin</strong><br>
                    ✅ Benar: <strong>${progress.correctCount} soal</strong>
                </div>
                <div class="confirm-actions">
                    <button class="confirm-btn confirm-btn-secondary" id="btn-new-game">
                        🆕 Mulai Baru
                    </button>
                    <button class="confirm-btn confirm-btn-success" id="btn-resume-game">
                        ▶️ Lanjutkan
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        document.getElementById('btn-new-game').onclick = async () => {
            document.body.removeChild(overlay);
            localStorage.removeItem('lajuaman_game_progress');
            // Lanjutkan start game baru
            await startGameFresh(mode, inputName);
        };

        document.getElementById('btn-resume-game').onclick = async () => {
            document.body.removeChild(overlay);
            await resumeGame();
        };
    }

    // ===== EXTRACT ORIGINAL START GAME LOGIC =====
    async function startGameFresh(mode, inputName) {
        // Jika belum register, harus isi nama
        if (!isRegistered) {
            if (!inputName) {
                alert("Silakan masukkan nama Anda terlebih dahulu!");
                showScreen("main-menu");
                return;
            }

            const result = await API.register(inputName);
            if (result?.token) {
                TokenManager.save(result.token);
                isRegistered = true;
                state.nama = result.player.nama;
                state.totalPoin = result.player.total_poin;
                state.currentLevel = result.player.level;
                state.levelIcon = result.player.level_icon;
                state.highScore = result.player.high_score;
                state.sessionCount = result.player.session_count;
                state.modesDimainkan = result.player.modes_dimainkan || [];
            } else {
                alert("Gagal mendaftar. Silakan coba lagi.");
                return;
            }
        } else {
            // Update nama jika berbeda
            if (inputName && inputName !== state.nama) {
                await API.updateName(inputName);
                state.nama = inputName;
            }
        }

        state.currentMode = mode;
        state.scenarioIndex = 0;
        state.sessionScore = 0;
        state.combo = 0;
        state.correctCount = 0;

        document.getElementById("ui-score").textContent = "⭐ 0";
        document.getElementById("ui-combo").classList.add("hidden");
        document.getElementById("ui-timer").style.display =
            mode === "tebak_rambu" ? "inline-flex" : "none";

        // Canvas games
        if (mode === "puzzle") {
            showScreen("puzzle-screen");
            if (typeof TrafficPuzzle !== "undefined") TrafficPuzzle.init();
            return;
        }
        if (mode === "slowcars") {
            showScreen("slowcars-screen");
            if (typeof SlowCars !== "undefined") SlowCars.init();
            return;
        }
        if (mode === "bus") {
            showScreen("bus-screen");
            if (typeof BusGame !== "undefined") BusGame.init();
            return;
        }

        showScreen("game-screen");
        currentGameData = await API.getQuestions(mode);
        if (currentGameData?.length) loadScenario();
        else {
            alert("Gagal memuat soal.");
            showScreen("main-menu");
        }
    }

    // ===== LOAD SCENARIO =====
    function loadScenario() {
        if (state.scenarioIndex >= currentGameData.length) {
            endGame();
            return;
        }

        const sc = currentGameData[state.scenarioIndex];
        const total = currentGameData.length;

        document.getElementById("progress-bar").style.width = `${(state.scenarioIndex / total) * 100}%`;
        document.getElementById("ui-progress-text").textContent = `${state.scenarioIndex + 1}/${total}`;

        const img = document.getElementById("ui-scenario-img");
        const imgContainer = img.parentElement;

        img.classList.remove("rambu-mode");
        imgContainer.classList.remove("rambu-mode");

        // ===== MODE: Kuis UU (tanpa gambar) =====
        if (state.currentMode === "kuis") {
            imgContainer.style.display = "none";
            document.getElementById("ui-scenario-text").textContent = sc.situasi || sc.pertanyaan;
        }
        // ===== MODE: Tebak Rambu =====
        else if (state.currentMode === "tebak_rambu") {
            imgContainer.style.display = "flex";
            img.classList.add("rambu-mode");

            // Tampilkan gambar rambu
            if (sc.gambar) {
                img.src = sc.gambar.startsWith("http") ? sc.gambar : `/storage/${sc.gambar}`;
            }

            // Pertanyaan untuk tebak rambu
            document.getElementById("ui-scenario-text").textContent = "Rambu apakah ini?";

            // Buat pilihan jawaban dari nama-nama rambu
            const container = document.getElementById("ui-choices");
            container.innerHTML = "";

            // Kumpulkan semua nama rambu dari currentGameData
            const allNames = currentGameData.map(r => r.nama);
            const correctAnswer = sc.nama;

            // Ambil 2 jawaban salah yang unik
            const wrongAnswers = allNames
                .filter(n => n !== correctAnswer)
                .sort(() => Math.random() - 0.5)
                .slice(0, 2);

            // Gabungkan dan acak pilihan
            const choices = [
                { id: correctAnswer, teks: correctAnswer },
                ...wrongAnswers.map(n => ({ id: n, teks: n }))
            ].sort(() => Math.random() - 0.5);

            // Tambahkan label A, B, C
            const labels = ['A', 'B', 'C'];
            choices.forEach((choice, index) => {
                const btn = document.createElement("button");
                btn.className = "choice-btn";
                btn.innerHTML = `<strong>[${labels[index]}]</strong> ${choice.teks}`;
                btn.onclick = () => handleAnswer(choice.id, btn);
                container.appendChild(btn);
            });

            // Mulai timer
            startTimer();

            // Re-render icons
            if (typeof lucide !== "undefined") lucide.createIcons();
            return;
        }
        // ===== MODE: Skenario =====
        else {
            imgContainer.style.display = "flex";
            if (sc.gambar) {
                img.src = sc.gambar.startsWith("http") ? sc.gambar : `/storage/${sc.gambar}`;
            }
            document.getElementById("ui-scenario-text").textContent = sc.situasi || sc.pertanyaan;
        }

        // Untuk mode skenario & kuis (yang punya field pilihan)
        const container = document.getElementById("ui-choices");
        container.innerHTML = "";

        const choices = typeof sc.pilihan === "string" ? JSON.parse(sc.pilihan) : sc.pilihan;

        if (choices && choices.length > 0) {
            choices.forEach((p) => {
                const btn = document.createElement("button");
                btn.className = "choice-btn";
                btn.innerHTML = `<strong>[${p.id}]</strong> ${p.teks}`;
                btn.onclick = () => handleAnswer(p.id, btn);
                container.appendChild(btn);
            });
        }

        // Re-render icons
        if (typeof lucide !== "undefined") lucide.createIcons();
    }

    function startTimer() {
        clearInterval(state.timerInterval);
        state.timeTaken = 10;
        const uiTimer = document.getElementById("ui-timer");
        uiTimer.style.display = "inline-flex";
        uiTimer.textContent = "⏱️ 10s";
        uiTimer.classList.remove("timer-warning");

        state.timerInterval = setInterval(() => {
            state.timeTaken--;
            uiTimer.textContent = `⏱️ ${state.timeTaken}s`;
            if (state.timeTaken <= 3) uiTimer.classList.add("timer-warning");
            if (state.timeTaken <= 0) {
                clearInterval(state.timerInterval);
                document.querySelectorAll(".choice-btn").forEach((b) => (b.disabled = true));
                handleAnswer("__timeout__", document.createElement("div"));
            }
        }, 1000);
    }

    // ===== HANDLE ANSWER =====
    async function handleAnswer(selectedId, btnElement) {
        clearInterval(state.timerInterval);
        document
            .querySelectorAll(".choice-btn")
            .forEach((b) => (b.disabled = true));
        const question = currentGameData[state.scenarioIndex];
        const result = await API.submitAnswer({
            mode: state.currentMode,
            question_id: question.id,
            answer: String(selectedId),
            combo: state.combo,
        });
        if (!result) return;
        if (result.correct) {
            btnElement.classList.add("correct");
            playDing();
            state.combo++;
            state.correctCount++;
            state.sessionScore += result.points;
            if (result.player_stats) {
                state.totalPoin = result.player_stats.total_poin;
                state.currentLevel = result.player_stats.level;
                state.levelIcon = result.player_stats.level_icon;
            }
            if (state.combo >= 3) showComboPopup();
            const ce = document.getElementById("ui-combo");
            if (state.combo >= 2) {
                ce.textContent = `🔥 ${state.combo}x`;
                ce.classList.remove("hidden");
                ce.style.display = "inline-flex";
            }
            showFeedback(true, result.points, {
                penjelasan: result.penjelasan,
                pasal: result.pasal,
            });
        } else {
            btnElement.classList.add("wrong");
            playBuzz();
            state.combo = 0;
            document.getElementById("ui-combo").classList.add("hidden");
            document.getElementById("ui-combo").style.display = "none";
            // Highlight correct answer
            document.querySelectorAll(".choice-btn").forEach((b) => {
                if (b.textContent.trim() === result.correct_answer?.trim())
                    b.classList.add("correct");
            });
            showFeedback(false, 0, {
                penjelasan: result.penjelasan,
                pasal: result.pasal,
            });
        }
        document.getElementById("ui-score").textContent =
            `⭐ ${state.sessionScore}`;
        updateHomeStats();
    }

    function showFeedback(isCorrect, points, sc) {
        setTimeout(() => {
            document.getElementById("ui-feedback-icon").textContent = isCorrect
                ? "✅"
                : "❌";
            document.getElementById("ui-feedback-title").textContent = isCorrect
                ? "BENAR!"
                : "SALAH!";
            document.getElementById("ui-feedback-title").className =
                `feedback-title ${isCorrect ? "correct" : "wrong"}`;
            document.getElementById("ui-feedback-points").textContent =
                isCorrect ? `+${points} Poin` : "+0 Poin";
            document.getElementById("ui-feedback-explanation").textContent =
                sc.penjelasan || "Tidak ada penjelasan";
            document.getElementById("ui-feedback-pasal").textContent =
                sc.pasal || "";
            showScreen("feedback-screen");
        }, 800);
    }

    function nextScenario() {
        state.scenarioIndex++;
        showScreen("game-screen");
        loadScenario();
    }

    async function endGame() {
        clearInterval(state.timerInterval);

        // Hapus progress tersimpan karena game sudah selesai
        localStorage.removeItem('lajuaman_game_progress');

        const result = await API.endSession({
            mode: state.currentMode,
            session_score: state.sessionScore,
            correct_count: state.correctCount,
            total_questions: currentGameData.length,
        });
        if (result?.player_stats) {
            state.totalPoin = result.player_stats.total_poin;
            state.highScore = result.player_stats.high_score;
            state.currentLevel = result.player_stats.level;
            state.sessionCount = result.player_stats.session_count;
        }
        if (result?.new_badges?.length) {
            result.new_badges.forEach((b) => showBadgePopup(b.label));
        }
        document.getElementById("ui-result-name").textContent = state.nama;
        document.getElementById("ui-result-score").textContent =
            state.sessionScore;
        const acc =
            currentGameData.length > 0
                ? Math.round(
                      (state.correctCount / currentGameData.length) * 100,
                  )
                : 0;
        document.getElementById("ui-result-accuracy").textContent = `${acc}%`;
        document.getElementById("ui-result-rank").textContent =
            state.currentLevel;

        // Show new badges in result
        const badgesContainer = document.getElementById("ui-new-badges");
        if (result?.new_badges?.length) {
            badgesContainer.innerHTML =
                "<h4>🏅 Badge Baru!</h4>" +
                result.new_badges
                    .map((b) => `<span class="badge-tag">${b.label}</span>`)
                    .join("");
            badgesContainer.style.display = "block";
        } else {
            badgesContainer.style.display = "none";
        }

        showScreen("result-screen");
    }

    async function renderLeaderboard() {
        const data = await API.getLeaderboard();
        const list = document.getElementById("ui-leaderboard-list");
        list.innerHTML = "";
        if (data?.leaderboard) {
            const medals = ["🥇", "🥈", "🥉"];
            data.leaderboard.forEach((e, i) => {
                const li = document.createElement("li");
                li.innerHTML = `<span class="rank">${medals[i] || i + 1 + "."}</span> <span class="name">${e.nama}</span> <span class="score">${e.skor} ⭐</span>`;
                list.appendChild(li);
            });
        }
        const cur = document.getElementById("ui-leaderboard-current");
        cur.innerHTML = data?.current_player?.nama
            ? `<strong>Posisi Anda:</strong> ${data.current_player.nama} | Skor: ${data.current_player.high_score} | ${data.current_player.level}`
            : "Mainkan game untuk masuk Leaderboard!";
    }

    async function renderBadges() {
        const data = await API.getBadges();
        const grid = document.getElementById("ui-badge-grid");
        grid.innerHTML = "";
        if (data?.badges)
            data.badges.forEach((b) => {
                const div = document.createElement("div");
                div.className = `badge-card ${b.unlocked ? "" : "locked"}`;
                div.innerHTML = `<div class="badge-card-icon">${b.icon}</div><div class="badge-card-label">${b.name}</div><div class="badge-card-cond">${b.unlocked ? "✅ Terbuka" : b.condition_text}</div>`;
                grid.appendChild(div);
            });
    }

    async function showBelajar() {
        const signs = await API.getRoadSigns();
        const list = document.getElementById("ui-rambu-list");
        list.innerHTML = "";
        if (signs)
            signs.forEach((r) => {
                const div = document.createElement("div");
                div.className = "rambu-item";
                const imgSrc = r.gambar
                    ? r.gambar.startsWith("http")
                        ? r.gambar
                        : `/storage/${r.gambar}`
                    : "";
                div.innerHTML = `
                <div class="rambu-icon-container">
                    ${imgSrc ? `<img src="${imgSrc}" alt="${r.nama}" style="max-width:60px;max-height:60px;border-radius:8px;">` : r.ikon}
                </div>
                <div class="rambu-info">
                    <h4>${r.nama} ${r.ikon || ""}</h4>
                    <span class="rambu-tipe">${r.tipe || ""}</span>
                    <p>${r.deskripsi || ""}</p>
                </div>`;
                list.appendChild(div);
            });
        showScreen("belajar-screen");
    }

    async function showRangkumanUU() {
        const articles = await API.getLawArticles();
        window.PASAL_DATA = articles || [];
        document
            .querySelectorAll("#ui-uu-tabs .uu-tab-btn")
            .forEach((b, i) => b.classList.toggle("active", i === 0));
        renderUUList("semua");
        showScreen("uu-screen");
    }

    function renderUUList(cat) {
        const list = document.getElementById("ui-uu-list");
        if (!list) return;
        list.innerHTML = "";
        const data = window.PASAL_DATA || [];
        (cat === "semua"
            ? data
            : data.filter((p) => p.kategori === cat)
        ).forEach((p) => {
            const div = document.createElement("div");
            div.className = "uu-item";
            div.innerHTML = `<h4>📌 ${p.pasal}</h4><p>${p.isi}</p>`;
            list.appendChild(div);
        });
    }

    function filterUU(cat, btn) {
        document
            .querySelectorAll("#ui-uu-tabs .uu-tab-btn")
            .forEach((b) => b.classList.remove("active"));
        if (btn) btn.classList.add("active");
        renderUUList(cat);
    }

    // ===== INIT =====
    window.onload = async () => {
        setTimeout(async () => {
            await checkRegistration();
            if (typeof lucide !== "undefined") lucide.createIcons();
        }, 1200);

        // Handle loading screen
        setTimeout(() => {
            const loadingScreen = document.getElementById("loading-screen");
            if (loadingScreen) loadingScreen.classList.remove("active");
        }, 1500);
    };

    // Close popup when clicking outside (optional)
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('confirm-overlay')) {
            const overlay = e.target;
            if (overlay.id === 'exit-confirm-overlay') {
                // Jangan tutup popup pertama dengan klik luar
                return;
            }
            if (overlay.id === 'save-progress-overlay' || overlay.id === 'resume-progress-overlay') {
                overlay.remove();
                // Kembalikan timer jika perlu
                if (state.currentMode === 'tebak_rambu' && state.timerInterval === null) {
                    startTimer();
                }
            }
        }
    });

    return {
        showScreen,
        startGame,
        quitGame,
        nextScenario,
        showBelajar,
        showRangkumanUU,
        filterUU,
        toggleFullScreen,
        checkSavedProgress, // Export untuk debugging
        resumeGame, // Export untuk debugging
    };
})();
