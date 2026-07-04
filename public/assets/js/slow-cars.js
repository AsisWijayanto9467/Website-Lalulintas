// ============================================================
// LajuAman — Slow Cars Puzzle
// ============================================================

const SlowCars = (function() {

        // --- SYNTHESIZER AUDIO WEB AUDIO API ---
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        let soundEnabled = true;

        function playSound(type) {
            if (!soundEnabled) return;
            // Aktifkan AudioContext jika tertidur karena kebijakan browser
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }

            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);

            if (type === 'click') {
                // Suara klik mobil (Blip naik singkat)
                osc.type = 'sine';
                osc.frequency.setValueAtTime(300, audioCtx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.1);
                gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.12);
            }
            else if (type === 'score') {
                // Suara mobil lolos dengan selamat (Harmoni ceria)
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
                osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.08); // E5
                osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.16); // G5
                gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.3);
            }
            else if (type === 'crash') {
                // Suara tabrakan gemuruh dramatis
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(120, audioCtx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.8);
                gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);

                // Tambahkan distorsi sedikit via modulator kedua
                const subOsc = audioCtx.createOscillator();
                const subGain = audioCtx.createGain();
                subOsc.type = 'triangle';
                subOsc.frequency.setValueAtTime(80, audioCtx.currentTime);
                subOsc.frequency.linearRampToValueAtTime(10, audioCtx.currentTime + 0.6);
                subGain.gain.setValueAtTime(0.3, audioCtx.currentTime);
                subGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);

                subOsc.connect(subGain);
                subGain.connect(audioCtx.destination);

                osc.start();
                subOsc.start();
                osc.stop(audioCtx.currentTime + 0.8);
                subOsc.stop(audioCtx.currentTime + 0.6);
            }
            else if (type === 'spawn') {
                // Suara lembut mobil baru masuk area terowongan
                osc.type = 'sine';
                osc.frequency.setValueAtTime(180, audioCtx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(220, audioCtx.currentTime + 0.15);
                gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.2);
            }
        }

        // --- SISTEM GAME TRAFFIC ---
        const canvas = document.getElementById('slowCarsCanvas');
        const ctx = canvas.getContext('2d');

        // Elemen-elemen UI
        const scoreDisplay = document.getElementById('slw-score-display');
        const highscoreDisplay = document.getElementById('slw-highscore-display');
        const finalScore = document.getElementById('slw-final-score');
        const finalHighScore = document.getElementById('slw-final-highscore');

        const startMenu = document.getElementById('slw-start-menu');
        const gameOverScreen = document.getElementById('slw-game-over-screen');
        const pauseScreen = document.getElementById('slw-pause-screen');

        const btnPlay = document.getElementById('slw-btn-play');
        const btnRestart = document.getElementById('slw-btn-restart');
        const btnPause = document.getElementById('slw-btn-pause');
        const btnSound = document.getElementById('slw-btn-sound');
        const iconPause = document.getElementById('slw-icon-pause');
        const iconSound = document.getElementById('slw-icon-sound');
        const btnResume = document.getElementById('slw-btn-resume');

        // Variabel-variabel State Game
        let gameActive = false;
        let isPaused = false;
        let score = 0;
        let highScore = localStorage.getItem('slowcars_high_score') || 0;
        highscoreDisplay.textContent = highScore;

        let cars = [];
        let particles = [];
        let screenShake = 0;

        let spawnTimer = 0;
        let spawnInterval = 1800; // milidetik antar kemunculan mobil baru
        let lastTime = 0;
        let difficultyMultiplier = 1.0;

        // Dimensi Struktur Jalan (Canvas standar 800x600)
        const ROAD_WIDTH = 110;
        const HALF_ROAD = ROAD_WIDTH / 2;
        let CENTER_X = canvas.width / 2;
        let CENTER_Y = canvas.height / 2;

        // Kecepatan Mobil
        const SPEED_MODES = {
            STOPPED: 0,
            NORMAL: 2.2,
            FAST: 5.5
        };

        // Warna-warna Cerah Mobil Sporty
        const CAR_COLORS = [
            '#ef4444', // Merah
            '#3b82f6', // Biru
            '#10b981', // Hijau
            '#f59e0b', // Amber/Kuning
            '#8b5cf6', // Ungu
            '#ec4899', // Pink
            '#06b6d4', // Cyan
        ];

        // Definisi Jalur Pergerakan (Masing-masing memiliki titik Mulai, Arah, dan Batas)
        // Jalur berpusat agar mobil mengalir dengan indah dari 4 arah mata angin
        const PATHS = [
            // Jalur 1: Dari KIRI ke KANAN (Melaju di lajur bawah jalan horizontal)
            {
                id: 'L2R',
                startX: -60,
                startY: CENTER_Y + 28,
                dirX: 1,
                dirY: 0,
                angle: 0,
                spawnWeight: 1
            },
            // Jalur 2: Dari KANAN ke KIRI (Melaju di lajur atas jalan horizontal)
            {
                id: 'R2L',
                startX: canvas.width + 60,
                startY: CENTER_Y - 28,
                dirX: -1,
                dirY: 0,
                angle: Math.PI,
                spawnWeight: 1
            },
            // Jalur 3: Dari ATAS ke BAWAH (Melaju di lajur kanan jalan vertikal)
            {
                id: 'T2B',
                startX: CENTER_X + 28,
                startY: -60,
                dirX: 0,
                dirY: 1,
                angle: Math.PI / 2,
                spawnWeight: 1
            },
            // Jalur 4: Dari BAWAH ke ATAS (Melaju di lajur kiri jalan vertikal)
            {
                id: 'B2T',
                startX: CENTER_X - 28,
                startY: canvas.height + 60,
                dirX: 0,
                dirY: -1,
                angle: -Math.PI / 2,
                spawnWeight: 1
            }
        ];

        // --- KELAS MOBIL (CAR) ---
        class Car {
            constructor(path) {
                this.path = path;
                this.x = path.startX;
                this.y = path.startY;

                // Dimensi mobil (panjang 52px, lebar 28px)
                this.width = 52;
                this.height = 28;

                // Rotasi berdasarkan arah jalur
                this.angle = path.angle;

                // Mode awal mobil adalah NORMAL
                this.speedMode = 'NORMAL';
                this.currentSpeed = SPEED_MODES.NORMAL;
                this.targetSpeed = SPEED_MODES.NORMAL;

                // Visual mobil
                this.color = CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)];
                this.id = Math.random().toString(36).substring(2, 9);

                // Penanda apakah sudah dihitung skornya saat keluar area
                this.escaped = false;

                // Animasi ban berputar
                this.wheelRotation = 0;
            }

            getSpeed() {
                return SPEED_MODES[this.speedMode];
            }

            update() {
                // Transisi akselerasi/deselerasi agar gerakan terasa mulus
                const target = this.getSpeed();
                this.currentSpeed += (target - this.currentSpeed) * 0.12;

                // Update Posisi
                this.x += this.path.dirX * this.currentSpeed;
                this.y += this.path.dirY * this.currentSpeed;

                // Putar ban saat berjalan
                if (this.currentSpeed > 0.1) {
                    this.wheelRotation += this.currentSpeed * 0.15;
                }

                // Cek apakah mobil sudah berhasil melewati persimpangan dan keluar layar
                if (!this.escaped) {
                    const isOutside =
                        (this.path.dirX === 1 && this.x > canvas.width + 40) ||
                        (this.path.dirX === -1 && this.x < -40) ||
                        (this.path.dirY === 1 && this.y > canvas.height + 40) ||
                        (this.path.dirY === -1 && this.y < -40);

                    if (isOutside) {
                        this.escaped = true;
                        handleScore();
                    }
                }

                // Tambahkan efek partikel tipis jika melaju sangat CEPAT
                if (this.speedMode === 'FAST' && Math.random() < 0.25) {
                    particles.push(new Particle(
                        this.x - this.path.dirX * 20,
                        this.y - this.path.dirY * 20,
                        '#fbbf24',
                        1.5
                    ));
                }
            }

            draw() {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.angle);

                // --- 1. GAMBAR BODY MOBIL ---
                // Bayangan mobil agar tampak 3D timbul
                ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
                ctx.fillRect(-this.width / 2 + 2, -this.height / 2 + 4, this.width, this.height);

                // Warna Utama Mobil (Badan Mobil)
                ctx.fillStyle = this.color;
                drawRoundedRect(ctx, -this.width / 2, -this.height / 2, this.width, this.height, 8);
                ctx.fill();

                // Atap Mobil (Bagian Atas Sedikit Lebih Gelap/Terang)
                ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
                drawRoundedRect(ctx, -this.width / 4, -this.height / 2 + 3, this.width / 2, this.height - 6, 4);
                ctx.fill();

                // --- 2. JENDELA DAN KACA DEPAN ---
                ctx.fillStyle = '#1e293b'; // Kaca gelap
                // Kaca Depan
                ctx.fillRect(this.width / 6, -this.height / 2 + 4, 6, this.height - 8);
                // Kaca Belakang
                ctx.fillRect(-this.width / 4, -this.height / 2 + 4, 4, this.height - 8);
                // Kaca Samping
                ctx.fillRect(-this.width / 8, -this.height / 2 + 2, this.width / 4, 1.5);
                ctx.fillRect(-this.width / 8, this.height / 2 - 3.5, this.width / 4, 1.5);

                // --- 3. DETAIL RODA (BAN) ---
                ctx.fillStyle = '#1e293b';
                // Ban Kiri Depan
                ctx.fillRect(this.width / 4 - 5, -this.height / 2 - 2, 10, 3);
                // Ban Kanan Depan
                ctx.fillRect(this.width / 4 - 5, this.height / 2 - 1, 10, 3);
                // Ban Kiri Belakang
                ctx.fillRect(-this.width / 4 - 5, -this.height / 2 - 2, 10, 3);
                // Ban Kanan Belakang
                ctx.fillRect(-this.width / 4 - 5, this.height / 2 - 1, 10, 3);

                // --- 4. LAMPU UTAMA & LAMPU REM ---
                // Lampu Depan (Kuning Terang)
                ctx.fillStyle = '#fef08a';
                ctx.beginPath();
                ctx.arc(this.width / 2, -this.height / 3, 2.5, 0, Math.PI * 2);
                ctx.arc(this.width / 2, this.height / 3, 2.5, 0, Math.PI * 2);
                ctx.fill();

                // Lampu Rem Belakang (Merah)
                ctx.fillStyle = this.speedMode === 'STOPPED' ? '#ff0000' : '#b91c1c'; // Menyala merah menyala jika sedang rem/berhenti
                ctx.fillRect(-this.width / 2, -this.height / 3 - 1, 2, 3);
                ctx.fillRect(-this.width / 2, this.height / 3 - 2, 2, 3);

                // Tambahkan pancaran sinar rem jika sedang BERHENTI
                if (this.speedMode === 'STOPPED') {
                    ctx.save();
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = '#ff3333';
                    ctx.fillStyle = '#ff3333';
                    ctx.fillRect(-this.width / 2 - 1, -this.height / 3 - 1, 2, 3);
                    ctx.fillRect(-this.width / 2 - 1, this.height / 3 - 2, 2, 3);
                    ctx.restore();
                }

                // --- 5. INDIKATOR MODE DI ATAS MOBIL ---
                ctx.restore();

                // Tampilkan ikon mengapung di atas mobil jika tidak melaju normal
                if (this.speedMode !== 'NORMAL') {
                    ctx.save();
                    ctx.translate(this.x, this.y - 28);

                    if (this.speedMode === 'STOPPED') {
                        // Gambar Lingkaran Stop Merah
                        ctx.fillStyle = '#ef4444';
                        ctx.beginPath();
                        ctx.arc(0, 0, 9, 0, Math.PI * 2);
                        ctx.fill();
                        // Garis putih stop sign
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(-5, -1.5, 10, 3);
                    } else if (this.speedMode === 'FAST') {
                        // Gambar Ikon Kilat/Turbo Kuning
                        ctx.fillStyle = '#f59e0b';
                        ctx.beginPath();
                        ctx.moveTo(-1, -10);
                        ctx.lineTo(5, -2);
                        ctx.lineTo(1, -2);
                        ctx.lineTo(3, 8);
                        ctx.lineTo(-4, 0);
                        ctx.lineTo(0, 0);
                        ctx.closePath();
                        ctx.fill();
                    }
                    ctx.restore();
                }
            }

            // Dapatkan Bounding Box Terorientasi (AABB sederhana karena jalan lurus rata tegak lurus)
            getBounds() {
                // Untuk menghitung tabrakan dengan akurat
                const isVertical = this.angle === Math.PI / 2 || this.angle === -Math.PI / 2;
                const halfW = (isVertical ? this.height : this.width) / 2;
                const halfH = (isVertical ? this.width : this.height) / 2;

                // Mengecilkan hit-box sedikit saja demi kelonggaran permainan yang seru
                return {
                    minX: this.x - halfW + 3,
                    maxX: this.x + halfW - 3,
                    minY: this.y - halfH + 3,
                    maxY: this.y + halfH - 3
                };
            }

            // Fungsi untuk memeriksa apakah titik klik berada di dalam badan mobil
            containsPoint(px, py) {
                const isVertical = this.angle === Math.PI / 2 || this.angle === -Math.PI / 2;
                const w = isVertical ? this.height : this.width;
                const h = isVertical ? this.width : this.height;

                // Memberikan sedikit batas ekstra agar lebih mudah diklik di HP/Layar Sentuh
                const clickBuffer = 12;

                return px >= this.x - w/2 - clickBuffer &&
                       px <= this.x + w/2 + clickBuffer &&
                       py >= this.y - h/2 - clickBuffer &&
                       py <= this.y + h/2 + clickBuffer;
            }

            // Siklus perubahan kecepatan saat disentuh
            toggleSpeed() {
                if (this.speedMode === 'NORMAL') {
                    this.speedMode = 'FAST';
                } else if (this.speedMode === 'FAST') {
                    this.speedMode = 'STOPPED';
                } else {
                    this.speedMode = 'NORMAL';
                }
                playSound('click');
            }
        }

        // --- KELAS PARTIKEL EFEK (LEDAKAN / ASAP) ---
        class Particle {
            constructor(x, y, color, speedScale = 1) {
                this.x = x;
                this.y = y;
                this.color = color;
                this.radius = Math.random() * 4 + 2;

                const angle = Math.random() * Math.PI * 2;
                const speed = (Math.random() * 4 + 1) * speedScale;
                this.vx = Math.cos(angle) * speed;
                this.vy = Math.sin(angle) * speed;

                this.alpha = 1;
                this.decay = Math.random() * 0.03 + 0.015;
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;
                this.alpha -= this.decay;
            }

            draw() {
                ctx.save();
                ctx.globalAlpha = this.alpha;
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }

        // --- DEKORASI LANSKAP PERSIMPANGAN ---
        function drawMap() {
            // 1. Latar Belakang Taman Hijau Segar
            ctx.fillStyle = '#4f772d';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const mapX = (x) => (x > 400 ? x + (canvas.width - 800) : x);
            const mapY = (y) => (y > 300 ? y + (canvas.height - 600) : y);

            // Detil Tekstur Rumput (Pola melingkar halus)
            ctx.fillStyle = '#3f5e26';
            const grassSpots = [
                {x: 100, y: 100, r: 40}, {x: 120, y: 120, r: 30},
                {x: 680, y: 110, r: 50}, {x: 720, y: 90, r: 35},
                {x: 150, y: 500, r: 60}, {x: 110, y: 460, r: 45},
                {x: 650, y: 480, r: 55}, {x: 690, y: 510, r: 35}
            ];
            grassSpots.forEach(spot => {
                ctx.beginPath();
                ctx.arc(mapX(spot.x), mapY(spot.y), spot.r, 0, Math.PI*2);
                ctx.fill();
            });

            // 2. Menggambar Trotoar Jalan Abu-abu Terang
            ctx.fillStyle = '#94a3b8';
            // Blok trotoar Horizontal
            ctx.fillRect(0, CENTER_Y - HALF_ROAD - 8, canvas.width, ROAD_WIDTH + 16);
            // Blok trotoar Vertikal
            ctx.fillRect(CENTER_X - HALF_ROAD - 8, 0, ROAD_WIDTH + 16, canvas.height);

            // Pola Garis Tepi Trotoar (Merah/Putih khas pembatas jalan aman)
            ctx.fillStyle = '#e2e8f0';
            // Horizontal Trotoar atas & bawah
            ctx.fillRect(0, CENTER_Y - HALF_ROAD - 4, canvas.width, 4);
            ctx.fillRect(0, CENTER_Y + HALF_ROAD, canvas.width, 4);
            // Vertikal Trotoar kiri & kanan
            ctx.fillRect(CENTER_X - HALF_ROAD - 4, 0, 4, canvas.height);
            ctx.fillRect(CENTER_X + HALF_ROAD, 0, 4, canvas.height);

            // 3. Menggambar Badan Jalan Utama (Aspal Abu-abu Gelap)
            ctx.fillStyle = '#334155';
            ctx.fillRect(0, CENTER_Y - HALF_ROAD, canvas.width, ROAD_WIDTH);
            ctx.fillRect(CENTER_X - HALF_ROAD, 0, ROAD_WIDTH, canvas.height);

            // 4. Markah Jalan (Garis Putih Putus-putus)
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 3;
            ctx.setLineDash([15, 15]);

            // Garis tengah horizontal
            ctx.beginPath();
            ctx.moveTo(0, CENTER_Y);
            ctx.lineTo(CENTER_X - HALF_ROAD - 10, CENTER_Y);
            ctx.moveTo(CENTER_X + HALF_ROAD + 10, CENTER_Y);
            ctx.lineTo(canvas.width, CENTER_Y);
            ctx.stroke();

            // Garis tengah vertikal
            ctx.beginPath();
            ctx.moveTo(CENTER_X, 0);
            ctx.lineTo(CENTER_X, CENTER_Y - HALF_ROAD - 10);
            ctx.moveTo(CENTER_X, CENTER_Y + HALF_ROAD + 10);
            ctx.lineTo(CENTER_X, canvas.height);
            ctx.stroke();

            ctx.setLineDash([]); // Reset line dash

            // 5. Zebra Cross (Penyeberangan Pejalan Kaki di 4 Sudut Persimpangan)
            drawZebraCross(CENTER_X - HALF_ROAD - 30, CENTER_Y - HALF_ROAD, 20, ROAD_WIDTH, 'V'); // Kiri
            drawZebraCross(CENTER_X + HALF_ROAD + 10, CENTER_Y - HALF_ROAD, 20, ROAD_WIDTH, 'V'); // Kanan
            drawZebraCross(CENTER_X - HALF_ROAD, CENTER_Y - HALF_ROAD - 30, ROAD_WIDTH, 20, 'H'); // Atas
            drawZebraCross(CENTER_X - HALF_ROAD, CENTER_Y + HALF_ROAD + 10, ROAD_WIDTH, 20, 'H'); // Bawah

            // 6. Dekorasi Pohon Rimbun Indah (Pojok-pojok Taman)
            const trees = [
                {x: 120, y: 90}, {x: 230, y: 150},
                {x: 670, y: 100}, {x: 580, y: 130},
                {x: 100, y: 520}, {x: 210, y: 470},
                {x: 700, y: 500}, {x: 590, y: 460}
            ];
            trees.forEach(t => {
                const tx = mapX(t.x);
                const ty = mapY(t.y);
                // Batang
                ctx.fillStyle = '#78350f';
                ctx.fillRect(tx - 4, ty, 8, 16);
                // Daun berlapis-lapis
                ctx.fillStyle = '#31572c';
                ctx.beginPath(); ctx.arc(tx, ty - 12, 22, 0, Math.PI*2); ctx.fill();
                ctx.fillStyle = '#3f6e3a';
                ctx.beginPath(); ctx.arc(tx - 8, ty - 18, 16, 0, Math.PI*2); ctx.fill();
                ctx.fillStyle = '#4f772d';
                ctx.beginPath(); ctx.arc(tx + 8, ty - 20, 14, 0, Math.PI*2); ctx.fill();
            });

            // 7. Terowongan / Jembatan di Tepi Layar (Efek Masuk-Keluar Mobil)
            // Kiri
            drawTunnel(0, CENTER_Y - HALF_ROAD - 4, 30, ROAD_WIDTH + 8, 'R');
            // Kanan
            drawTunnel(canvas.width - 30, CENTER_Y - HALF_ROAD - 4, 30, ROAD_WIDTH + 8, 'L');
            // Atas
            drawTunnel(CENTER_X - HALF_ROAD - 4, 0, ROAD_WIDTH + 8, 30, 'B');
            // Bawah
            drawTunnel(CENTER_X - HALF_ROAD - 4, canvas.height - 30, ROAD_WIDTH + 8, 30, 'T');
        }

        // Pembantu: Gambar Zebra Cross
        function drawZebraCross(x, y, w, h, orient) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
            const count = 5;
            if (orient === 'V') {
                const step = h / count;
                for (let i = 0; i < count; i++) {
                    if (i % 2 === 0) {
                        ctx.fillRect(x, y + i * step, w, step);
                    }
                }
            } else {
                const step = w / count;
                for (let i = 0; i < count; i++) {
                    if (i % 2 === 0) {
                        ctx.fillRect(x + i * step, y, step, h);
                    }
                }
            }
        }

        // Pembantu: Gambar Terowongan Gerbang Layar
        function drawTunnel(x, y, w, h, dir) {
            ctx.fillStyle = '#1e293b'; // Bagian dalam terowongan gelap gulita
            ctx.fillRect(x, y, w, h);

            ctx.fillStyle = '#64748b'; // Struktur gerbang beton abu-abu kokoh
            if (dir === 'R') {
                ctx.fillRect(x + w - 8, y, 8, h);
                ctx.fillStyle = '#475569';
                ctx.fillRect(x, y, w - 8, 4);
                ctx.fillRect(x, y + h - 4, w - 8, 4);
            } else if (dir === 'L') {
                ctx.fillRect(x, y, 8, h);
                ctx.fillStyle = '#475569';
                ctx.fillRect(x + 8, y, w - 8, 4);
                ctx.fillRect(x + 8, y + h - 4, w - 8, 4);
            } else if (dir === 'B') {
                ctx.fillRect(x, y + h - 8, w, 8);
                ctx.fillStyle = '#475569';
                ctx.fillRect(x, y, 4, h - 8);
                ctx.fillRect(x + w - 4, y, 4, h - 8);
            } else if (dir === 'T') {
                ctx.fillRect(x, y, w, 8);
                ctx.fillStyle = '#475569';
                ctx.fillRect(x, y + 8, 4, h - 8);
                ctx.fillRect(x + w - 4, y + 8, 4, h - 8);
            }
        }

        // Pembantu: Menggambar Persegi Panjang Bulat (Rounded Rectangle)
        function drawRoundedRect(ctx, x, y, width, height, radius) {
            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + width - radius, y);
            ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
            ctx.lineTo(x + width, y + height - radius);
            ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
            ctx.lineTo(x + radius, y + height);
            ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.closePath();
        }

        // --- SISTEM PENJADWALAN KEMUNCULAN MOBIL (SPAWNING) ---
        function spawnCar() {
            // Pilih jalur acak berdasarkan bobot
            const availablePaths = [...PATHS];

            // Filter agar mobil tidak muncul bertumpuk langsung di titik spawn yang sama
            const safePaths = availablePaths.filter(path => {
                return !cars.some(car => {
                    const distToSpawn = Math.hypot(car.x - path.startX, car.y - path.startY);
                    return distToSpawn < 130; // Jarak aman antar mobil baru muncul
                });
            });

            if (safePaths.length > 0) {
                const chosenPath = safePaths[Math.floor(Math.random() * safePaths.length)];
                const newCar = new Car(chosenPath);
                cars.push(newCar);
                playSound('spawn');
            }
        }

        // --- LOGIKA TABRAKAN (COLLISION CHECKING) ---
        function checkCollisions() {
            for (let i = 0; i < cars.length; i++) {
                const boundsA = cars[i].getBounds();

                for (let j = i + 1; j < cars.length; j++) {
                    const boundsB = cars[j].getBounds();

                    // Cek Tumpang Tindih Kotak Batas (AABB)
                    const isColliding = !(
                        boundsA.maxX < boundsB.minX ||
                        boundsA.minX > boundsB.maxX ||
                        boundsA.maxY < boundsB.minY ||
                        boundsA.minY > boundsB.maxY
                    );

                    if (isColliding) {
                        triggerCrash(cars[i], cars[j]);
                        return; // Hentikan loop saat terjadi tabrakan pertama
                    }
                }
            }
        }

        // Pemicu Kejadian Tabrakan Hebat
        function triggerCrash(car1, car2) {
            gameActive = false;
            playSound('crash');

            // Guncangan layar dramatis
            screenShake = 22;

            // Koordinat titik tengah tabrakan
            const crashX = (car1.x + car2.x) / 2;
            const crashY = (car1.y + car2.y) / 2;

            // Ledakan partikel api & debu
            const colors = ['#f97316', '#ef4444', '#fbbf24', '#78350f', '#475569', '#ffffff'];
            for (let k = 0; k < 60; k++) {
                const color = colors[Math.floor(Math.random() * colors.length)];
                particles.push(new Particle(
                    crashX + (Math.random() * 20 - 10),
                    crashY + (Math.random() * 20 - 10),
                    color,
                    2.5
                ));
            }

            // Simpan Rekor Tertinggi Baru
            if (score > highScore) {
                highScore = score;
                localStorage.setItem('slowcars_high_score', highScore);
                highscoreDisplay.textContent = highScore;
            }

            // Tampilkan Layar Game Over
            setTimeout(() => {
                finalScore.textContent = score;
                finalHighScore.textContent = highScore;
                gameOverScreen.classList.remove('hidden');
            }, 800);
        }

        // Berikan Skor untuk Mobil yang Sukses Keluar Layar
        function handleScore() {
            score++;
            scoreDisplay.textContent = score;
            playSound('score');

            // Tambah tingkat kesulitan seiring peningkatan skor
            difficultyMultiplier = 1.0 + (score * 0.05);
            // Percepat interval kemunculan mobil agar makin menantang
            spawnInterval = Math.max(900, 1800 - (score * 40));
        }

        // --- GAME LOOP UTAMA ---
        function gameLoop(timestamp) {
            if (!lastTime) lastTime = timestamp;
            const delta = timestamp - lastTime;
            lastTime = timestamp;

            // Clear Screen
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Efek Screen Shake jika ada
            ctx.save();
            if (screenShake > 0.1) {
                const dx = (Math.random() - 0.5) * screenShake;
                const dy = (Math.random() - 0.5) * screenShake;
                ctx.translate(dx, dy);
                screenShake *= 0.9; // Reduksi perlahan
            }

            // 1. Gambar Seluruh Peta Jalan Raya
            drawMap();

            // 2. Spawn Mobil Baru Berdasarkan Timer
            if (gameActive && !isPaused) {
                spawnTimer += delta;
                if (spawnTimer >= spawnInterval) {
                    spawnCar();
                    spawnTimer = 0;
                }
            }

            // 3. Update & Gambar Mobil
            for (let i = cars.length - 1; i >= 0; i--) {
                const car = cars[i];
                if (!isPaused && gameActive) {
                    car.update();
                }
                car.draw();

                // Bersihkan mobil yang sudah jauh meninggalkan layar
                if (car.escaped && (
                    car.x > canvas.width + 100 ||
                    car.x < -100 ||
                    car.y > canvas.height + 100 ||
                    car.y < -100
                )) {
                    cars.splice(i, 1);
                }
            }

            // 4. Update & Gambar Partikel Ledakan
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                if (!isPaused) p.update();
                p.draw();
                if (p.alpha <= 0) {
                    particles.splice(i, 1);
                }
            }

            // 5. Cek Tabrakan jika game masih berjalan
            if (gameActive && !isPaused) {
                checkCollisions();
            }

            ctx.restore();
            requestAnimationFrame(gameLoop);
        }

        // --- SISTEM DETEKSI KLIK / SENTUHAN PADA MOBIL ---
        function handleInput(clientX, clientY) {
            if (!gameActive || isPaused) return;

            // Hitung rasio resolusi kanvas sesungguhnya
            const rect = canvas.getBoundingClientRect();
            const clickX = ((clientX - rect.left) / rect.width) * canvas.width;
            const clickY = ((clientY - rect.top) / rect.height) * canvas.height;

            // Deteksi mobil mana yang diklik
            // Memeriksa dari mobil teranyar (paling atas tumpukan)
            for (let i = cars.length - 1; i >= 0; i--) {
                if (cars[i].containsPoint(clickX, clickY) && !cars[i].escaped) {
                    cars[i].toggleSpeed();
                    break; // Hanya berinteraksi dengan satu mobil per klik
                }
            }
        }

        canvas.addEventListener('mousedown', (e) => {
            handleInput(e.clientX, e.clientY);
        });

        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Mencegah scrolling browser
            if (e.touches.length > 0) {
                handleInput(e.touches[0].clientX, e.touches[0].clientY);
            }
        }, { passive: false });

        // --- PENGENDALI TOMBOL UI ---

        // Memulai Game Baru
        function initNewGame() {
            cars = [];
            particles = [];
            score = 0;
            spawnTimer = 0;
            spawnInterval = 1800;
            difficultyMultiplier = 1.0;
            scoreDisplay.textContent = '0';

            startMenu.classList.add('hidden');
            gameOverScreen.classList.add('hidden');
            pauseScreen.classList.add('hidden');

            isPaused = false;
            gameActive = true;
            lastTime = 0;

            // Spawn mobil pertama secara instan
            spawnCar();
        }

        btnPlay.addEventListener('click', initNewGame);
        btnRestart.addEventListener('click', initNewGame);

        // Toggle Jeda Game
        function togglePause() {
            if (!gameActive) return;
            isPaused = !isPaused;
            if (isPaused) {
                pauseScreen.classList.remove('hidden');
                iconPause.setAttribute('data-lucide', 'play');
            } else {
                pauseScreen.classList.add('hidden');
                iconPause.setAttribute('data-lucide', 'pause');
            }
            lucide.createIcons(); // Memperbarui ikon Lucide secara dinamis
        }

        btnPause.addEventListener('click', togglePause);
        btnResume.addEventListener('click', togglePause);

        // Toggle Suara Game
        btnSound.addEventListener('click', () => {
            soundEnabled = !soundEnabled;
            if (soundEnabled) {
                iconSound.setAttribute('data-lucide', 'volume-2');
                iconSound.classList.remove('text-red-400');
            } else {
                iconSound.setAttribute('data-lucide', 'volume-x');
                iconSound.classList.add('text-red-400');
            }
            lucide.createIcons();
        });

        function recalculateLayout() {
            CENTER_X = canvas.width / 2;
            CENTER_Y = canvas.height / 2;

            // Update PATHS values
            PATHS[0].startY = CENTER_Y + 28;

            PATHS[1].startX = canvas.width + 60;
            PATHS[1].startY = CENTER_Y - 28;

            PATHS[2].startX = CENTER_X + 28;

            PATHS[3].startX = CENTER_X - 28;
            PATHS[3].startY = canvas.height + 60;
        }

        function resizeCanvas() {
            if (!canvas) return;
            const container = canvas.parentElement;
            if (!container) return;
            const rect = container.getBoundingClientRect();

            const oldCenterX = CENTER_X;
            const oldCenterY = CENTER_Y;

            canvas.width = rect.width || 800;
            canvas.height = rect.height || 600;

            recalculateLayout();

            const dx = CENTER_X - oldCenterX;
            const dy = CENTER_Y - oldCenterY;

            if (gameActive) {
                cars.forEach(car => {
                    if (car.path.id === 'L2R' || car.path.id === 'R2L') {
                        car.y += dy;
                        car.path.startY = CENTER_Y + (car.path.id === 'L2R' ? 28 : -28);
                        car.path.startX = (car.path.id === 'L2R' ? -60 : canvas.width + 60);
                        car.x += dx;
                    } else {
                        car.x += dx;
                        car.path.startX = CENTER_X + (car.path.id === 'T2B' ? 28 : -28);
                        car.path.startY = (car.path.id === 'T2B' ? -60 : canvas.height + 60);
                        car.y += dy;
                    }
                });
            }
        }

        // --- PRE-FLIGHT CHECK / RUN LOOP ONCE ---
        // Jalankan game loop pertama kali untuk menggambar peta background
        requestAnimationFrame(gameLoop);
        lucide.createIcons(); // Tampilkan ikon Lucide pertama kali


    // API
    return {
        init: () => {
            startMenu.classList.remove('hidden');
            gameOverScreen.classList.add('hidden');
            pauseScreen.classList.add('hidden');
            highscoreDisplay.textContent = highScore;

            resizeCanvas();
            window.addEventListener('resize', resizeCanvas);

            if(!lastTime) requestAnimationFrame(gameLoop);
        },
        quit: () => {
            gameActive = false;
            isPaused = true;
            window.removeEventListener('resize', resizeCanvas);
        }
    };
})();
