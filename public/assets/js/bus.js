// ============================================================
// LajuAman — Bus Simulator Cilik
// ============================================================

const BusGame = (function() {

        // --- STREAMING_CHUNK: Mengaktifkan Audio Synthesizer... ---
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        let soundEnabled = true;

        // Generator suara mesin bus diesel dinamis
        let engineOsc = null;
        let engineGain = null;

        function startEngineSound() {
            if (!soundEnabled) return;
            try {
                if (audioCtx.state === 'suspended') {
                    audioCtx.resume();
                }
                stopEngineSound();

                engineOsc = audioCtx.createOscillator();
                engineGain = audioCtx.createGain();

                engineOsc.type = 'sawtooth';
                engineOsc.frequency.setValueAtTime(35, audioCtx.currentTime); 
                engineGain.gain.setValueAtTime(0.012, audioCtx.currentTime);

                const filter = audioCtx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(110, audioCtx.currentTime);

                engineOsc.connect(filter);
                filter.connect(engineGain);
                engineGain.connect(audioCtx.destination);
                engineOsc.start();
            } catch (e) {}
        }

        function updateEnginePitch(speedRatio, isGassing) {
            if (!soundEnabled || !engineOsc) return;
            const gasModifier = isGassing ? 15 : 0;
            const targetPitch = 35 + (speedRatio * 45) + gasModifier;
            engineOsc.frequency.setTargetAtTime(targetPitch, audioCtx.currentTime, 0.15);
            engineGain.gain.setTargetAtTime(0.012 + (speedRatio * 0.018), audioCtx.currentTime, 0.15);
        }

        function stopEngineSound() {
            try {
                if (engineOsc) {
                    engineOsc.stop();
                    engineOsc.disconnect();
                    engineOsc = null;
                }
            } catch(e) {}
        }

        // --- STREAMING_CHUNK: Membuat Efek Suara Lain... ---
        function playDriverSound(type) {
            if (!soundEnabled) return;
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }

            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);

            if (type === 'horn') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(320, audioCtx.currentTime);
                gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);

                const sub = audioCtx.createOscillator();
                const subGain = audioCtx.createGain();
                sub.type = 'triangle';
                sub.frequency.setValueAtTime(380, audioCtx.currentTime);
                subGain.gain.setValueAtTime(0.15, audioCtx.currentTime);
                subGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);

                sub.connect(subGain);
                subGain.connect(audioCtx.destination);

                osc.start();
                sub.start();
                osc.stop(audioCtx.currentTime + 0.35);
                sub.stop(audioCtx.currentTime + 0.35);
            }
            else if (type === 'brake-squeal') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
                osc.frequency.linearRampToValueAtTime(800, audioCtx.currentTime + 0.25);
                gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.25);
            }
            else if (type === 'camera') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(700, audioCtx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(2000, audioCtx.currentTime + 0.12);
                gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.12);
            }
            else if (type === 'warn') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(150, audioCtx.currentTime);
                osc.frequency.linearRampToValueAtTime(100, audioCtx.currentTime + 0.3);
                gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.3);
            }
            else if (type === 'score') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); 
                osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.08); 
                osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.16); 
                gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.3);
            }
            else if (type === 'siren') {
                // Suara Sirene Ambulans Gawat Darurat
                osc.type = 'sine';
                osc.frequency.setValueAtTime(600, audioCtx.currentTime);
                osc.frequency.linearRampToValueAtTime(900, audioCtx.currentTime + 0.4);
                gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.5);
            }
        }

        // --- STREAMING_CHUNK: Mengonfigurasi Canvas & Objek... ---
        const canvas = document.getElementById('busCanvas');
        const ctx = canvas.getContext('2d');

        // Elemen-elemen UI
        const scoreDisplay = document.getElementById('bus-score-display');
        const pointsDisplay = document.getElementById('bus-points-display');
        const speedoDisplay = document.getElementById('bus-speedo-display');
        const speedoContainer = document.getElementById('speedo-container');
        const startMenu = document.getElementById('bus-start-menu');
        const winScreen = document.getElementById('bus-win-screen');
        const loseScreen = document.getElementById('bus-lose-screen');
        const tutorialBubble = document.getElementById('bus-tutorial-bubble');
        const controlsPanel = document.getElementById('bus-controls-panel');

        const btnPlay = document.getElementById('bus-btn-play');
        const btnNext = document.getElementById('bus-btn-next');
        const btnRetry = document.getElementById('bus-btn-retry');
        const btnSound = document.getElementById('bus-btn-sound');
        const iconSound = document.getElementById('bus-icon-sound');

        const btnGas = document.getElementById('bus-btn-gas');
        const btnBrake = document.getElementById('bus-btn-brake');
        const btnHorn = document.getElementById('bus-btn-horn');
        const btnSteerLeft = document.getElementById('bus-btn-steer-left');

        // State Simulasi Utama
        let score = 0;
        let simPoints = 3;
        let gameActive = false;
        let lastTime = 0;

        // Input Pengendara
        let isGasPressed = false;
        let isBrakePressed = false;
        let isHornPressed = false;

        // Nilai lajur jalan (Lajur Kanan = 430, Lajur Kiri = 370)
        let LANE_LEFT = 370;
        let LANE_RIGHT = 430;
        let currentLane = 'right';

        // --- STREAMING_CHUNK: Menyiapkan Struktur Data Bus Halus... ---
        const BUS = {
            x: 430,      
            targetX: 430,
            y: 420,             
            width: 42,
            height: 90,
            speed: 0,
            maxSpeed: 4.8,
            currentMaxSpeed: 4.8,
            acceleration: 0.08,
            deceleration: 0.03,
            brakeForce: 0.22,
            passengers: 0,
            
            // Animasi suspensi halus
            suspensionOffset: 0,
            targetSuspension: 0,
            tiltAngle: 0,       
            targetTilt: 0
        };

        // Posisi Kamera Dunia (Infinite scrolling map)
        let worldY = 0; 

        // Rambu & Event di Jalan (Handcrafted Level Rute Lengkap)
        let roadEvents = [];
        const trackLength = 10000; // Jalur diperpanjang untuk memuat tantangan baru

        // Variabel Animasi
        let warningText = "";
        let warningTimer = 0;
        let flashCameraTimer = 0;
        let particles = [];

        // Penanda event khusus
        let ambulanceY = 0;
        let ambulanceActive = false;
        let ambulanceBypassed = false;
        let catActive = true;
        let catHomed = false;
        let catTimer = 0;

        // Menata halte bus, lampu lalu lintas, rintangan, ambulans, dan hewan secara dinamis
        function generateRoadTrack() {
            roadEvents = [];
            ambulanceActive = false;
            ambulanceBypassed = false;
            catActive = true;
            catHomed = false;
            catTimer = 0;
            
            // 1. Halte Pertama (Belajar berhenti halus)
            roadEvents.push({
                type: 'BUS_STOP',
                worldY: 1200, 
                hasActiveKids: true,
                kidsCount: 2,
                cleared: false,
                name: "Halte Sakura"
            });

            // 2. Lampu Merah-Hijau Pertama
            roadEvents.push({
                type: 'TRAFFIC_LIGHT',
                worldY: 2600,
                lightState: 'RED', 
                timer: 0,
                interval: 3500, 
                cleared: false
            });

            // 3. EVENT AMBULANS GAWAT DARURAT (Penyelamatan Prioritas!)
            roadEvents.push({
                type: 'AMBULANCE_WARN',
                worldY: 3600,
                cleared: false
            });

            // 4. Rambu Batas Kecepatan 30 km/jam + Kamera Tilang
            roadEvents.push({
                type: 'SPEED_LIMIT',
                worldY: 5300,
                limit: 4.6, // Setara 30 km/jam dalam unit speedometer game
                cleared: false
            });
            roadEvents.push({
                type: 'SPEED_CAMERA',
                worldY: 5600,
                limit: 4.6,
                cleared: false
            });

            // 5. EVENT PENYEBERANG SATWA LIAR (Kucing Gurun Lucu)
            roadEvents.push({
                type: 'ANIMAL_CROSSING',
                worldY: 6900,
                cleared: false
            });

            // 6. Rintangan Batang Pohon Tumbang di Lajur Kanan (Wajib swerve ke kiri!)
            roadEvents.push({
                type: 'OBSTACLE_LOG',
                worldY: 8200,
                lane: 'right',
                cleared: false
            });

            // 7. Halte Kedua
            roadEvents.push({
                type: 'BUS_STOP',
                worldY: 9200,
                hasActiveKids: true,
                kidsCount: 2,
                cleared: false,
                name: "Halte Melati"
            });

            // 8. Gerbang Sekolah Akhir Tujuan
            roadEvents.push({
                type: 'SCHOOL_GATE',
                worldY: 10400,
                cleared: false
            });
        }

        // --- STREAMING_CHUNK: Menggambar Latar Scene Canvas... ---
        function drawScene() {
            ctx.fillStyle = '#4c7c34';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const scrollOffset = (worldY % canvas.height);
            const centerX = canvas.width / 2;

            // Menggambar Detail Tekstur Rumput & Pohon
            ctx.fillStyle = '#416a2b';
            for (let i = -1; i < 2; i++) {
                const yPos = scrollOffset + i * canvas.height;
                
                drawTreeCluster(centerX - 320, yPos + 120, 48);
                drawTreeCluster(centerX - 340, yPos + 380, 42);
                drawTreeCluster(centerX + 320, yPos + 220, 50);
                drawTreeCluster(centerX + 340, yPos + 480, 44);

                ctx.fillStyle = '#7c2d12'; 
                drawRoundedRect(ctx, centerX - 290, yPos + 260, 24, 8, 3); ctx.fill();
                drawRoundedRect(ctx, centerX + 270, yPos + 350, 20, 7, 2); ctx.fill();
            }

            // --- STREAMING_CHUNK: Menggambar Jalan & Trotoar... ---
            ctx.fillStyle = '#cfb28a'; 
            ctx.fillRect(centerX - 90, 0, 180, canvas.height);

            ctx.fillStyle = '#2d5a27';
            ctx.fillRect(centerX - 90, 0, 12, canvas.height);
            ctx.fillRect(centerX + 78, 0, 12, canvas.height);

            ctx.fillStyle = '#475569';
            ctx.fillRect(centerX - 68, 0, 136, canvas.height);

            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(centerX - 72, 0, 4, canvas.height);
            ctx.fillRect(centerX + 68, 0, 4, canvas.height);

            ctx.strokeStyle = '#eab308';
            ctx.lineWidth = 3;
            ctx.setLineDash([20, 25]);
            ctx.beginPath();
            ctx.moveTo(centerX, scrollOffset - canvas.height);
            ctx.lineTo(centerX, scrollOffset + canvas.height * 2);
            ctx.stroke();
            ctx.setLineDash([]); 

            drawRoadEvents();
        }

        function drawTreeCluster(x, y, baseRadius) {
            ctx.save();
            ctx.fillStyle = 'rgba(11, 25, 6, 0.25)';
            ctx.beginPath();
            ctx.arc(x + 5, y + 8, baseRadius, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#1e3f20';
            ctx.beginPath();
            ctx.arc(x, y, baseRadius, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#2a5a27';
            ctx.beginPath();
            ctx.arc(x - baseRadius * 0.2, y - baseRadius * 0.2, baseRadius * 0.8, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#3f7c34';
            ctx.beginPath();
            ctx.arc(x + baseRadius * 0.1, y - baseRadius * 0.3, baseRadius * 0.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // --- STREAMING_CHUNK: Menggambar Event Rute... ---
        function drawRoadEvents() {
            const centerX = canvas.width / 2;
            roadEvents.forEach(ev => {
                const screenY = BUS.y - (ev.worldY - worldY);

                if (screenY > -200 && screenY < canvas.height + 200) {
                    
                    if (ev.type === 'BUS_STOP') {
                        ctx.fillStyle = 'rgba(234, 179, 8, 0.12)';
                        ctx.strokeStyle = '#eab308';
                        ctx.lineWidth = 3;
                        ctx.setLineDash([6, 6]);
                        ctx.fillRect(centerX + 10, screenY - 45, 60, 90);
                        ctx.strokeRect(centerX + 10, screenY - 45, 60, 90);
                        ctx.setLineDash([]);

                        ctx.fillStyle = '#334155';
                        ctx.fillRect(centerX + 84, screenY - 30, 6, 60); 
                        ctx.fillStyle = '#eab308';
                        ctx.beginPath(); ctx.arc(centerX + 87, screenY - 30, 12, 0, Math.PI * 2); ctx.fill();
                        
                        ctx.fillStyle = '#0f172a';
                        ctx.font = 'bold 8px Arial';
                        ctx.textAlign = 'center';
                        ctx.fillText("BUS", centerX + 87, screenY - 27);

                        if (ev.hasActiveKids) {
                            for (let k = 0; k < ev.kidsCount; k++) {
                                drawKidSilhouette(centerX + 95 + k * 12, screenY + 5);
                            }
                        }
                    }

                    else if (ev.type === 'TRAFFIC_LIGHT') {
                        ctx.fillStyle = '#f8fafc';
                        ctx.fillRect(centerX - 68, screenY + 50, 136, 6);

                        ctx.fillStyle = '#334155';
                        ctx.fillRect(centerX - 104, screenY - 40, 6, 110); 
                        ctx.fillStyle = '#0f172a';
                        drawRoundedRect(ctx, centerX - 116, screenY - 40, 30, 65, 8); ctx.fill();

                        ctx.fillStyle = (ev.lightState === 'RED') ? '#ef4444' : '#1e293b';
                        ctx.beginPath(); ctx.arc(centerX - 101, screenY - 25, 7, 0, Math.PI*2); ctx.fill();
                        if (ev.lightState === 'RED') {
                            ctx.shadowBlur = 15; ctx.shadowColor = '#ef4444';
                            ctx.fillStyle = '#f87171';
                            ctx.beginPath(); ctx.arc(centerX - 101, screenY - 25, 4, 0, Math.PI*2); ctx.fill();
                            ctx.shadowBlur = 0; 
                        }

                        ctx.fillStyle = (ev.lightState === 'YELLOW') ? '#eab308' : '#1e293b';
                        ctx.beginPath(); ctx.arc(centerX - 101, screenY - 8, 7, 0, Math.PI*2); ctx.fill();

                        ctx.fillStyle = (ev.lightState === 'GREEN') ? '#22c55e' : '#1e293b';
                        ctx.beginPath(); ctx.arc(centerX - 101, screenY + 9, 7, 0, Math.PI*2); ctx.fill();
                        if (ev.lightState === 'GREEN') {
                            ctx.shadowBlur = 15; ctx.shadowColor = '#22c55e';
                            ctx.fillStyle = '#4ade80';
                            ctx.beginPath(); ctx.arc(centerX - 101, screenY + 9, 4, 0, Math.PI*2); ctx.fill();
                            ctx.shadowBlur = 0;
                        }
                    }

                    else if (ev.type === 'SPEED_LIMIT') {
                        ctx.fillStyle = '#334155';
                        ctx.fillRect(centerX - 102, screenY - 40, 5, 80);
                        
                        ctx.fillStyle = '#ef4444';
                        ctx.beginPath(); ctx.arc(centerX - 100, screenY - 40, 18, 0, Math.PI*2); ctx.fill();
                        ctx.fillStyle = '#ffffff';
                        ctx.beginPath(); ctx.arc(centerX - 100, screenY - 40, 13, 0, Math.PI*2); ctx.fill();
                        
                        ctx.fillStyle = '#0f172a';
                        ctx.font = 'bold 11px Arial';
                        ctx.textAlign = 'center';
                        ctx.fillText("30", centerX - 100, screenY - 36);
                    }

                    else if (ev.type === 'SPEED_CAMERA') {
                        ctx.fillStyle = '#475569';
                        ctx.fillRect(centerX + 95, screenY - 40, 5, 80);
                        ctx.fillStyle = '#eab308';
                        drawRoundedRect(ctx, centerX + 85, screenY - 50, 24, 20, 4); ctx.fill();
                        ctx.fillStyle = '#0f172a';
                        ctx.beginPath(); ctx.arc(centerX + 97, screenY - 40, 5, 0, Math.PI*2); ctx.fill();

                        // Garis Sensor Deteksi Radar di Aspal
                        ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
                        ctx.lineWidth = 3;
                        ctx.setLineDash([5, 5]);
                        ctx.beginPath();
                        ctx.moveTo(centerX - 68, screenY);
                        ctx.lineTo(centerX + 68, screenY);
                        ctx.stroke();
                        ctx.setLineDash([]);
                    }

                    else if (ev.type === 'OBSTACLE_LOG') {
                        ctx.save();
                        const laneX = (ev.lane === 'left') ? LANE_LEFT : LANE_RIGHT;
                        ctx.translate(laneX, screenY);
                        ctx.fillStyle = 'rgba(0,0,0,0.2)';
                        ctx.fillRect(-22, 2, 44, 16);

                        ctx.fillStyle = '#78350f';
                        drawRoundedRect(ctx, -20, 0, 40, 14, 4); ctx.fill();

                        ctx.strokeStyle = '#451a03';
                        ctx.lineWidth = 1.5;
                        ctx.beginPath();
                        ctx.moveTo(-15, 4); ctx.lineTo(15, 4);
                        ctx.moveTo(-10, 9); ctx.lineTo(12, 9);
                        ctx.stroke();

                        ctx.fillStyle = '#b45309';
                        ctx.beginPath(); ctx.ellipse(-20, 7, 3, 7, 0, 0, Math.PI * 2); ctx.fill();
                        ctx.beginPath(); ctx.ellipse(20, 7, 3, 7, 0, 0, Math.PI * 2); ctx.fill();
                        ctx.restore();
                    }

                    else if (ev.type === 'ANIMAL_CROSSING') {
                        // Rambu Penyeberangan Hewan
                        ctx.fillStyle = '#334155';
                        ctx.fillRect(centerX - 102, screenY - 40, 5, 80);

                        ctx.fillStyle = '#eab308'; // Warna kuning rambu perhatian
                        ctx.save();
                        ctx.translate(centerX - 100, screenY - 40);
                        ctx.rotate(Math.PI / 4);
                        drawRoundedRect(ctx, -12, -12, 24, 24, 3);
                        ctx.fill();
                        ctx.restore();

                        ctx.fillStyle = '#0f172a';
                        ctx.font = '9px Arial';
                        ctx.textAlign = 'center';
                        ctx.fillText("🐈", centerX - 100, screenY - 37);

                        // Garis penyeberangan kaki binatang
                        ctx.fillStyle = 'rgba(244, 244, 245, 0.2)';
                        ctx.fillRect(centerX - 68, screenY - 10, 136, 20);

                        // Kucing gurun liar berdiri di tengah aspal (jika aktif)
                        if (catActive) {
                            drawDesertCat(catHomed ? LANE_LEFT - 50 : centerX + Math.sin(catTimer * 0.05) * 4, screenY);
                        }
                    }

                    else if (ev.type === 'SCHOOL_GATE') {
                        ctx.fillStyle = '#1e3a8a';
                        ctx.fillRect(centerX - 140, screenY - 30, 40, 60);
                        ctx.fillRect(centerX + 100, screenY - 30, 40, 60);

                        ctx.fillStyle = '#3b82f6';
                        ctx.fillRect(centerX - 140, screenY - 45, 280, 15);
                        
                        ctx.fillStyle = '#ffffff';
                        ctx.font = 'bold 9px Arial';
                        ctx.textAlign = 'center';
                        ctx.fillText("KOTA PANDU ELEMENTARY SCHOOL", centerX, screenY - 34);

                        ctx.fillStyle = '#22c55e';
                        ctx.fillRect(centerX - 68, screenY + 15, 136, 6);
                    }
                }
            });

            // Gambar mobil Ambulans Darurat jika sedang berjalan di rute
            if (ambulanceActive) {
                const screenAmbY = BUS.y - (ambulanceY - worldY);
                drawAmbulance(LANE_RIGHT, screenAmbY);
            }
        }

        // --- STREAMING_CHUNK: Menggambar Objek Baru... ---
        function drawDesertCat(x, y) {
            ctx.save();
            ctx.translate(x, y);

            // Bayangan Kucing
            ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
            ctx.beginPath();
            ctx.ellipse(0, 4, 8, 4, 0, 0, Math.PI * 2);
            ctx.fill();

            // Badan Kucing (Oranye Gurun)
            ctx.fillStyle = '#f97316';
            drawRoundedRect(ctx, -6, -4, 12, 8, 3);
            ctx.fill();

            // Kepala Bulat
            ctx.beginPath();
            ctx.arc(6, -2, 5, 0, Math.PI * 2);
            ctx.fill();

            // Telinga Segitiga
            ctx.beginPath();
            ctx.moveTo(3, -6); ctx.lineTo(5, -10); ctx.lineTo(7, -6);
            ctx.moveTo(7, -6); ctx.lineTo(9, -10); ctx.lineTo(11, -6);
            ctx.fill();

            // Ekor Melengkung
            ctx.strokeStyle = '#f97316';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-6, 0);
            ctx.quadraticCurveTo(-12, -4, -8, -10);
            ctx.stroke();

            // Mata Putih Bersinar
            ctx.fillStyle = '#ffffff';
            ctx.beginPath(); ctx.arc(5, -3, 1, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(8, -3, 1, 0, Math.PI*2); ctx.fill();

            ctx.restore();
        }

        function drawAmbulance(x, y) {
            ctx.save();
            ctx.translate(x, y);

            // Bayangan Drop
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fillRect(-18, -40, 36, 80);

            // Badan Ambulans Putih
            ctx.fillStyle = '#f8fafc';
            drawRoundedRect(ctx, -16, -36, 32, 72, 6);
            ctx.fill();

            // Garis Palang Merah & Striping Merah Samping
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(-16, -5, 32, 10);
            ctx.fillRect(-5, -16, 10, 32);

            // Kaca Kabin Depan Gelap
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(-12, -28, 24, 10);

            // Lampu Sirene Atas Berkedip Cepat (Biru-Merah Bergantian)
            const flash = Math.floor(Date.now() / 150) % 2;
            ctx.fillStyle = flash ? '#ef4444' : '#3b82f6';
            ctx.beginPath(); ctx.arc(0, -18, 6, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath(); ctx.arc(0, -18, 2, 0, Math.PI*2); ctx.fill();

            ctx.restore();
        }

        function drawKidSilhouette(x, y) {
            ctx.save();
            ctx.translate(x, y);

            ctx.fillStyle = '#fbcfe8';
            ctx.beginPath(); ctx.arc(0, -12, 4, 0, Math.PI*2); ctx.fill();

            ctx.fillStyle = '#ef4444';
            ctx.beginPath(); ctx.arc(0, -15, 4.5, Math.PI, 0); ctx.fill();
            ctx.fillRect(-5, -15, 10, 1);

            ctx.fillStyle = '#3b82f6';
            ctx.beginPath();
            ctx.moveTo(-4, -8); ctx.lineTo(4, -8);
            ctx.lineTo(3, 0); ctx.lineTo(-3, 0);
            ctx.closePath(); ctx.fill();

            ctx.fillStyle = '#334155';
            ctx.fillRect(-2, 0, 1.5, 3);
            ctx.fillRect(1, 0, 1.5, 3);

            ctx.restore();
        }

        function drawBus() {
            ctx.save();
            ctx.translate(BUS.x, BUS.y);
            ctx.rotate(BUS.tiltAngle);

            ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
            ctx.fillRect(-BUS.width/2 + 3, -BUS.height/2 + 5 + BUS.suspensionOffset, BUS.width, BUS.height);

            ctx.fillStyle = '#fbbf24';
            drawRoundedRect(ctx, -BUS.width/2, -BUS.height/2 + BUS.suspensionOffset, BUS.width, BUS.height, 8);
            ctx.fill();

            ctx.fillStyle = '#1e293b';
            ctx.fillRect(-BUS.width/2, -BUS.height/6 + BUS.suspensionOffset, 3, BUS.height/2.2);
            ctx.fillRect(BUS.width/2 - 3, -BUS.height/6 + BUS.suspensionOffset, 3, BUS.height/2.2);

            ctx.fillStyle = '#0f172a';
            ctx.fillRect(-BUS.width/2 + 4, -BUS.height/2 + 5 + BUS.suspensionOffset, BUS.width - 8, 14);
            ctx.fillStyle = 'rgba(14, 165, 233, 0.35)'; 
            ctx.beginPath();
            ctx.moveTo(-BUS.width/2 + 4, -BUS.height/2 + 5 + BUS.suspensionOffset);
            ctx.lineTo(-BUS.width/2 + 15, -BUS.height/2 + 5 + BUS.suspensionOffset);
            ctx.lineTo(-BUS.width/2 + 8, -BUS.height/2 + 19 + BUS.suspensionOffset);
            ctx.closePath(); ctx.fill();

            ctx.fillStyle = '#1e293b';
            for (let j = 0; j < 3; j++) {
                ctx.fillRect(-BUS.width/2 + 3, -BUS.height/2 + 25 + j * 16 + BUS.suspensionOffset, 2, 9);
                ctx.fillRect(BUS.width/2 - 5, -BUS.height/2 + 25 + j * 16 + BUS.suspensionOffset, 2, 9);
            }

            ctx.fillStyle = '#fef08a';
            ctx.beginPath(); ctx.arc(-BUS.width/2 + 6, -BUS.height/2 + 2 + BUS.suspensionOffset, 3, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(BUS.width/2 - 6, -BUS.height/2 + 2 + BUS.suspensionOffset, 3, 0, Math.PI*2); ctx.fill();

            ctx.fillStyle = isBrakePressed ? '#ef4444' : '#991b1b';
            ctx.fillRect(-BUS.width/2 + 3, BUS.height/2 - 3 + BUS.suspensionOffset, 5, 2);
            ctx.fillRect(BUS.width/2 - 8, BUS.height/2 - 3 + BUS.suspensionOffset, 5, 2);

            ctx.fillStyle = '#fbcfe8';
            for (let p = 0; p < BUS.passengers; p++) {
                const yOffset = -BUS.height/2 + 30 + p * 12 + BUS.suspensionOffset;
                ctx.beginPath();
                ctx.arc((p % 2 === 0) ? -10 : 10, yOffset, 2.5, 0, Math.PI*2);
                ctx.fill();
            }

            ctx.restore();
        }

        // --- STREAMING_CHUNK: Menggambar Partikel Asap... ---
        function drawParticles() {
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.y += BUS.speed; 
                p.alpha -= 0.015;
                p.radius += 0.25;

                ctx.save();
                ctx.globalAlpha = p.alpha;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI*2);
                ctx.fill();
                ctx.restore();

                if (p.alpha <= 0) {
                    particles.splice(i, 1);
                }
            }
        }

        // --- STREAMING_CHUNK: Update Fisika & Simulasi Halus... ---
        function updateGame(delta) {
            const dt = Math.min(delta, 100);

            // 1. Fisika Kecepatan & Akselerasi Bus
            if (isGasPressed && !isBrakePressed) {
                if (BUS.speed < BUS.currentMaxSpeed) {
                    BUS.speed += BUS.acceleration;
                } else {
                    BUS.speed -= BUS.deceleration; 
                }
                BUS.targetSuspension = 2; 
            } else if (isBrakePressed) {
                BUS.speed = Math.max(0, BUS.speed - BUS.brakeForce);
                BUS.targetSuspension = -3; 
            } else {
                BUS.speed = Math.max(0, BUS.speed - BUS.deceleration);
                BUS.targetSuspension = 0;
            }

            BUS.suspensionOffset += (BUS.targetSuspension - BUS.suspensionOffset) * 0.12;

            updateEnginePitch(BUS.speed / BUS.maxSpeed, isGasPressed);

            BUS.x += (BUS.targetX - BUS.x) * 0.12;

            const swerveDist = BUS.targetX - BUS.x;
            BUS.targetTilt = swerveDist * 0.0018; 
            BUS.tiltAngle += (BUS.targetTilt - BUS.tiltAngle) * 0.15;

            worldY += BUS.speed;

            // Spidometer Realistis
            const speedKmh = Math.round(BUS.speed * 6.5);
            speedoDisplay.textContent = `${speedKmh} km/h`;

            // Atur Warna Spidometer (Indikasi Edukatif Batas Kecepatan 30 km/h)
            if (BUS.currentMaxSpeed < BUS.maxSpeed) {
                // Di area batas kecepatan 30
                if (speedKmh > 30) {
                    speedoContainer.classList.remove('bg-slate-950/50', 'border-white/10');
                    speedoContainer.classList.add('bg-red-950/80', 'border-red-500/50');
                    speedoDisplay.classList.remove('text-emerald-400');
                    speedoDisplay.classList.add('text-red-400', 'animate-pulse');
                } else {
                    speedoContainer.classList.remove('bg-red-950/80', 'border-red-500/50');
                    speedoContainer.classList.add('bg-emerald-950/80', 'border-emerald-500/50');
                    speedoDisplay.classList.remove('text-red-400', 'animate-pulse');
                    speedoDisplay.classList.add('text-emerald-400');
                }
            } else {
                // Kecepatan normal
                speedoContainer.className = "bg-slate-950/50 px-3.5 py-1.5 rounded-2xl flex flex-col items-center justify-center border border-white/10 min-w-[85px] shadow-inner transition-colors duration-300";
                speedoDisplay.className = "text-xs md:text-sm text-emerald-400";
            }

            if (warningTimer > 0) warningTimer -= dt;
            if (flashCameraTimer > 0) flashCameraTimer -= dt;

            if (BUS.speed > 0.5 && Math.random() < 0.15) {
                particles.push({
                    x: BUS.x - 10 + Math.random() * 4,
                    y: BUS.y + BUS.height/2 + 2,
                    radius: 2,
                    alpha: 0.8,
                    color: 'rgba(148, 163, 184, 0.35)'
                });
            }

            // Update Logika Bergerak Ambulans Gawat Darurat
            if (ambulanceActive) {
                // Ambulans melaju sangat cepat dari belakang (worldY - 400 ke depan melampaui bus)
                ambulanceY += 6.5; 
                
                // Bunyikan sirene ambulans secara interaktif saat berdekatan
                if (Math.abs(ambulanceY - worldY) < 400 && Math.random() < 0.12) {
                    playDriverSound('siren');
                }

                // Deteksi ketika ambulans berpapasan melewati posisi bus
                if (ambulanceY >= worldY - 10 && !ambulanceBypassed) {
                    ambulanceBypassed = true;
                    // Cek Lajur: Jika bus menghalangi lajur kanan (LANE_RIGHT), bus kena tilang!
                    if (BUS.x === LANE_RIGHT) {
                        handlePenalty("🚑 MENGEBLOK AMBULANS DARURAT! POIN SIM -1");
                    } else {
                        score += 2;
                        scoreDisplay.textContent = `Bintang: ${score}`;
                        playDriverSound('score');
                        triggerBonusText("🚑 CEMERLANG! MEMBERI JALAN AMBULANS +2 BINTANG ⭐");
                    }
                }

                // Sembunyikan ambulans jika sudah lewat jauh di depan
                if (ambulanceY > worldY + 600) {
                    ambulanceActive = false;
                }
            }

            // Update Detik Animasi Bergerak Kucing
            if (catActive && !catHomed) {
                catTimer += dt;
            }

            // 2. Pemrosesan Event & Rambu Lalu Lintas Seiring Perjalanan
            processRoadEvents(dt);

            // Selesai Rute Sempurna di Gerbang Sekolah
            if (worldY >= 10400) {
                handleSuccessArrival();
            }
        }

        // --- STREAMING_CHUNK: Memproses Aturan Lalu Lintas... ---
        function processRoadEvents(dt) {
            roadEvents.forEach(ev => {
                if (ev.cleared) return;

                const distanceToBus = ev.worldY - worldY;

                // --- EVENT: HALTE BUS (Jemput Siswa) ---
                if (ev.type === 'BUS_STOP') {
                    const isStopInArea = (distanceToBus >= -10 && distanceToBus <= 30 && BUS.speed === 0);
                    
                    if (isStopInArea && ev.hasActiveKids) {
                        ev.hasActiveKids = false;
                        ev.cleared = true;
                        
                        BUS.passengers += ev.kidsCount;
                        score += 2;
                        scoreDisplay.textContent = `Bintang: ${score}`;
                        playDriverSound('score');

                        triggerBonusText("🎉 ANAK-ANAK NAIK BUS! +2 BINTANG");
                        
                        if (ev.name === "Halte Sakura") {
                            tutorialBubble.innerHTML = "💡 <span class='text-emerald-400 font-bubble'>Sinyal Lampu Merah:</span> Hati-hati, ada <b class='text-red-400'>Lampu Merah</b> menanti di depan. Berhentilah tepat sebelum garis putih!";
                        } else {
                            tutorialBubble.innerHTML = "💡 <span class='text-emerald-400 font-bubble'>Gerbang Sekolah:</span> Kerja luar biasa! Melajulah perlahan sampai tiba di pintu masuk gerbang sekolah 🏫!";
                        }
                    }
                }

                // --- EVENT: LAMPU MERAH-HIJAU LALU LINTAS ---
                else if (ev.type === 'TRAFFIC_LIGHT') {
                    ev.timer += dt;
                    if (ev.timer >= ev.interval) {
                        ev.lightState = (ev.lightState === 'RED') ? 'GREEN' : 'RED';
                        ev.timer = 0;
                    }

                    const isCrossingRed = (ev.lightState === 'RED' && distanceToBus <= 145 && distanceToBus >= -50);
                    if (isCrossingRed && BUS.speed > 0.5) {
                        ev.cleared = true; 
                        handlePenalty("❌ MENEROBOS LAMPU MERAH! POIN SIM -1");
                    }

                    if (distanceToBus < -100 && !ev.cleared) {
                        ev.cleared = true;
                        tutorialBubble.innerHTML = "💡 <span class='text-emerald-400 font-bubble'>Ambulans Belakang:</span> Dengarkan bunyi sirene! Berpindahlah ke <b class='text-emerald-400'>LAJUR KIRI</b> untuk memberi jalan bagi Ambulans Gawat Darurat!";
                    }
                }

                // --- EVENT: RADAR SIRENE AMBULANS ---
                else if (ev.type === 'AMBULANCE_WARN') {
                    if (distanceToBus <= 150) {
                        ev.cleared = true;
                        // Spawm Ambulans dari bawah layar
                        ambulanceY = worldY - 300;
                        ambulanceActive = true;
                        playDriverSound('siren');
                        triggerBonusText("🚨 AMBULANS DATANG DARI BELAKANG! PINDAH KE LAJUR KIRI!");
                    }
                }

                // --- EVENT: BATAS KECEPATAN (ZONA SEKOLAH) ---
                else if (ev.type === 'SPEED_LIMIT') {
                    if (distanceToBus <= 300 && distanceToBus >= -50) {
                        BUS.currentMaxSpeed = ev.limit; 
                        triggerBonusText("⚠️ ZONA TILANG ELEKTRONIK! KURANGI KECEPATAN < 30 KM/H! 🛑");
                        tutorialBubble.innerHTML = "💡 <span class='text-yellow-400 font-bubble'>Tips Kamera Tilang:</span> Kamera tilang tidak bisa dihindari dengan ganti lajur! Anda wajib mengerem di bawah <b>30 km/h</b>.";
                    }
                    if (distanceToBus < -150) {
                        ev.cleared = true;
                        BUS.currentMaxSpeed = BUS.maxSpeed; 
                    }
                }

                // --- EVENT: KAMERA TILANG RADAR ---
                else if (ev.type === 'SPEED_CAMERA') {
                    if (distanceToBus <= 30 && distanceToBus >= -30) {
                        ev.cleared = true;
                        const speedKmh = Math.round(BUS.speed * 6.5);
                        if (speedKmh > 30) {
                            flashCameraTimer = 160; 
                            playDriverSound('camera');
                            handlePenalty("📸 MAKSIMAL 30 KM/H! KAMU DIKIRIMI SURAT TILANG ELEKTRONIK!");
                        } else {
                            score += 2;
                            scoreDisplay.textContent = `Bintang: ${score}`;
                            playDriverSound('score');
                            triggerBonusText("📸 MENGEMUDI TERTIB LIMIT! +2 BINTANG ✨");
                        }
                    }
                }

                // --- EVENT: PENYEBERANG SATWA LIAR (Kucing Gurun) ---
                else if (ev.type === 'ANIMAL_CROSSING') {
                    if (distanceToBus <= 250 && !catHomed) {
                        tutorialBubble.innerHTML = "💡 <span class='text-yellow-400 font-bubble'>Penyelamat Satwa:</span> Ada anak kucing di jalan! Bunyikan <b class='text-blue-400'>KLAKSON</b> agar ia lari atau berhenti total!";
                    }

                    // Deteksi Tabrakan dengan Kucing
                    const catDist = Math.abs(distanceToBus);
                    if (catDist < 40 && catActive && !catHomed) {
                        catActive = false;
                        ev.cleared = true;
                        handlePenalty("💥 ADUH! KAMU MENABRAK KUCING! BIASAKAN WASPADA!");
                    }

                    // Selesaikan event saat bus sudah melintas jauh
                    if (distanceToBus < -150) {
                        ev.cleared = true;
                        tutorialBubble.innerHTML = "💡 <span class='text-emerald-400 font-bubble'>Rintangan Kayu:</span> Ada pohon tumbang menutup lajur kanan di depan. Kemudikan bus ke <b class='text-yellow-400'>LAJUR KIRI</b>!";
                    }
                }

                // --- EVENT: RINTANGAN BATANG KAYU (Lajur Kanan) ---
                else if (ev.type === 'OBSTACLE_LOG') {
                    const laneX = (ev.lane === 'left') ? LANE_LEFT : LANE_RIGHT;
                    const isColliding = (Math.abs(BUS.x - laneX) < 20 && Math.abs(distanceToBus) < 50);
                    if (isColliding) {
                        ev.cleared = true;
                        handlePenalty("💥 MENABRAK BATANG POHON! POIN SIM -1");
                    }

                    if (distanceToBus < -100 && !ev.cleared) {
                        ev.cleared = true;
                        tutorialBubble.innerHTML = "💡 <span class='text-emerald-400 font-bubble'>Swerve Sukses:</span> Refleks luar biasa! Anda berhasil bergeser lajur menghindari hambatan jalan.";
                    }
                }
            });
        }

        // --- STREAMING_CHUNK: Penanganan Tilang & Poin... ---
        function handlePenalty(text) {
            simPoints--;
            pointsDisplay.textContent = `Poin SIM: ${simPoints}`;
            playDriverSound('warn');
            triggerBonusText(text);

            if (simPoints <= 0) {
                gameActive = false;
                stopEngineSound();
                loseScreen.classList.remove('hidden');
                lockControlsPanel(true);
            }
        }

        function triggerBonusText(text) {
            warningText = text;
            warningTimer = 4000; // Tampilkan teks selama 4 detik agar edukasi terbaca jelas
        }

        // Menampilkan teks tilang di layar dengan gaya mengapung lembut
        function drawOverlayFeedback() {
            if (warningTimer > 0 && warningText) {
                ctx.save();
                ctx.font = 'bold 13px Quicksand';
                ctx.textAlign = 'center';
                const centerX = canvas.width / 2;
                const boxWidth = Math.min(canvas.width - 40, 500);
                const boxX = centerX - boxWidth / 2;

                if (warningText.includes("POIN") || warningText.includes("MENABRAK") || warningText.includes("TILANG")) {
                    ctx.fillStyle = '#f87171'; // Merah bahaya
                    // Gambarkan kotak latar belakang agar tulisan mudah terbaca di rumput
                    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
                    drawRoundedRect(ctx, boxX, 160, boxWidth, 50, 12); ctx.fill();
                    ctx.fillStyle = '#f87171';
                    ctx.fillText(warningText, centerX, 190);
                } else {
                    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
                    drawRoundedRect(ctx, boxX, 160, boxWidth, 50, 12); ctx.fill();
                    ctx.fillStyle = '#34d399'; // Hijau prestasi
                    ctx.fillText(warningText, centerX, 190);
                }
                ctx.restore();
            }

            // Kilatan lembut Blitz Kamera Tilang Elektronik
            if (flashCameraTimer > 0) {
                ctx.fillStyle = `rgba(255, 255, 255, ${flashCameraTimer / 160})`;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
        }

        function handleSuccessArrival() {
            gameActive = false;
            stopEngineSound();
            playDriverSound('score');
            
            let winText = "";
            if (BUS.passengers >= 4) {
                score += 5; 
                winText = "LUAR BIASA SUPIR TELADAN! Anda sukses menjemput semua anak sekolah, tertib menaati limit tilang 30 km/h, dan menyelamatkan hewan jalanan. Poin bonus +5 Bintang! 🌟";
            } else {
                score += 2;
                winText = "Perjalanan selesai! Di rute selanjutnya, pastikan Anda berhenti dengan lembut di setiap halte bus agar tidak ada anak sekolah yang tertinggal ya! 😊";
            }

            scoreDisplay.textContent = `Bintang: ${score}`;
            document.getElementById('bus-win-description').textContent = winText;
            winScreen.classList.remove('hidden');
            lockControlsPanel(true);
        }

        // --- STREAMING_CHUNK: Game Loop Utama Canvas... ---
        function gameLoop(timestamp) {
            if (!lastTime) lastTime = timestamp;
            const delta = timestamp - lastTime;
            lastTime = timestamp;

            drawScene();
            drawParticles();
            drawBus();

            if (gameActive) {
                updateGame(delta);
            }

            drawOverlayFeedback();
            requestAnimationFrame(gameLoop);
        }

        function lockControlsPanel(shouldLock) {
            if (shouldLock) {
                controlsPanel.classList.add('opacity-40', 'cursor-not-allowed', 'pointer-events-none');
            } else {
                controlsPanel.classList.remove('opacity-40', 'cursor-not-allowed', 'pointer-events-none');
            }
        }

        // --- STREAMING_CHUNK: Integrasi Tombol & Setir... ---
        function pressGas() {
            if (!gameActive) return;
            isGasPressed = true;
            isBrakePressed = false;
        }

        function releaseGas() {
            isGasPressed = false;
        }

        function pressBrake() {
            if (!gameActive) return;
            isBrakePressed = true;
            isGasPressed = false;
            playDriverSound('brake-squeal');
        }

        function releaseBrake() {
            isBrakePressed = false;
        }

        function toggleSteer() {
            if (!gameActive) return;
            if (currentLane === 'right') {
                currentLane = 'left';
                btnSteerLeft.innerHTML = `
                    <i data-lucide="chevron-right" class="w-5 h-5"></i>
                    <span>▶ LAJUR KANAN</span>
                    <span class="text-[7px] font-sans font-bold text-slate-400 uppercase">Ganti Lajur</span>
                `;
            } else {
                currentLane = 'right';
                btnSteerLeft.innerHTML = `
                    <i data-lucide="chevron-left" class="w-5 h-5"></i>
                    <span>◀ LAJUR KIRI</span>
                    <span class="text-[7px] font-sans font-bold text-slate-400 uppercase">Ganti Lajur</span>
                `;
            }
            BUS.targetX = (currentLane === 'left') ? LANE_LEFT : LANE_RIGHT;
            lucide.createIcons();
            playDriverSound('score');
        }

        function triggerHorn() {
            if (!gameActive) return;
            isHornPressed = true;
            playDriverSound('horn');

            // Logika Edukasi Menyelamatkan Kucing dengan Klakson
            const catEvent = roadEvents.find(e => e.type === 'ANIMAL_CROSSING');
            if (catEvent && !catEvent.cleared && !catHomed) {
                const distanceToCat = catEvent.worldY - worldY;
                if (distanceToCat < 300 && distanceToCat > -40) {
                    catHomed = true;
                    score += 2;
                    scoreDisplay.textContent = `Bintang: ${score}`;
                    playDriverSound('score');
                    triggerBonusText("🐈 HEBAT! KLAKSON KAMU MENYELAMATKAN KUCING! +2 BINTANG ⭐");
                }
            }
        }

        // Integrasi Event Listener Sentuh & Mouse
        btnGas.addEventListener('mousedown', pressGas);
        btnGas.addEventListener('mouseup', releaseGas);
        btnGas.addEventListener('mouseleave', releaseGas);

        btnBrake.addEventListener('mousedown', pressBrake);
        btnBrake.addEventListener('mouseup', releaseBrake);
        btnBrake.addEventListener('mouseleave', releaseBrake);

        btnGas.addEventListener('touchstart', (e) => { e.preventDefault(); pressGas(); });
        btnGas.addEventListener('touchend', (e) => { e.preventDefault(); releaseGas(); });

        btnBrake.addEventListener('touchstart', (e) => { e.preventDefault(); pressBrake(); });
        btnBrake.addEventListener('touchend', (e) => { e.preventDefault(); releaseBrake(); });

        btnSteerLeft.addEventListener('click', toggleSteer);
        btnHorn.addEventListener('click', triggerHorn);

        // Dukungan Keyboard Desktop (Arrow Keys untuk Gas, Rem, Setir)
        window.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') pressGas();
            if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') pressBrake();
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'a' || e.key === 'd') {
                toggleSteer();
            }
            if (e.key === ' ' || e.key === 'h' || e.key === 'H') triggerHorn(); 
        });

        window.addEventListener('keyup', (e) => {
            if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') releaseGas();
            if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') releaseBrake();
        });

        // --- STREAMING_CHUNK: Inisialisasi Perjalanan... ---
        function initNewDrivingRoute() {
            worldY = 0;
            BUS.speed = 0;
            BUS.passengers = 0;
            currentLane = 'right';
            
            // Recalculate layout
            resizeCanvas();
            
            BUS.targetX = LANE_RIGHT;
            BUS.x = LANE_RIGHT;
            BUS.currentMaxSpeed = BUS.maxSpeed;

            simPoints = 3;
            pointsDisplay.textContent = `Poin SIM: 3`;

            isGasPressed = false;
            isBrakePressed = false;

            warningText = "";
            warningTimer = 0;
            flashCameraTimer = 0;
            particles = [];

            generateRoadTrack();

            startMenu.classList.add('hidden');
            winScreen.classList.add('hidden');
            loseScreen.classList.add('hidden');

            tutorialBubble.innerHTML = "💡 <span class='text-emerald-400 font-bubble'>Misi Utama:</span> Tekan tombol <b class='text-emerald-400'>GAS</b> untuk jalan. Kurangi kecepatan di bawah <b class='text-yellow-400'>30 km/h</b> saat melewati rambu radar!";

            gameActive = true;
            lockControlsPanel(false);
            
            startEngineSound();
            playDriverSound('score');
        }

        btnPlay.addEventListener('click', initNewDrivingRoute);
        btnNext.addEventListener('click', initNewDrivingRoute);
        btnRetry.addEventListener('click', initNewDrivingRoute);

        // Pengatur Toggle Suara
        btnSound.addEventListener('click', () => {
            soundEnabled = !soundEnabled;
            if (soundEnabled) {
                iconSound.setAttribute('data-lucide', 'volume-2');
                iconSound.classList.remove('text-red-400');
                startEngineSound();
            } else {
                iconSound.setAttribute('data-lucide', 'volume-x');
                iconSound.classList.add('text-red-400');
                stopEngineSound();
            }
            lucide.createIcons();
        });

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

        function resizeCanvas() {
            const container = canvas.parentElement;
            if (!container) return;
            const rect = container.getBoundingClientRect();
            
            const oldCenterX = canvas.width / 2 || 400;
            canvas.width = rect.width || 800;
            canvas.height = rect.height || 600;
            
            const centerX = canvas.width / 2;
            LANE_LEFT = centerX - 30;
            LANE_RIGHT = centerX + 30;
            
            if (BUS.x !== undefined) {
                const offsetFromCenter = BUS.x - oldCenterX;
                BUS.x = centerX + offsetFromCenter;
            } else {
                BUS.x = LANE_RIGHT;
            }
            
            BUS.targetX = (currentLane === 'left') ? LANE_LEFT : LANE_RIGHT;
            BUS.y = canvas.height * 0.7;
        }

        // Memulai Render Loop Game
        requestAnimationFrame(gameLoop);
        lucide.createIcons();
    

    return {
        init: () => {
            gameActive = false;
            startMenu.classList.remove('hidden');
            winScreen.classList.add('hidden');
            loseScreen.classList.add('hidden');
            controlsPanel.classList.add('opacity-40', 'cursor-not-allowed', 'pointer-events-none');
            
            // Generate track if needed
            generateRoadTrack();
            resizeCanvas();
            window.addEventListener('resize', resizeCanvas);
            
            BUS.x = LANE_RIGHT;
            BUS.y = canvas.height * 0.7;
            BUS.speed = 0;
            BUS.passengers = 0;
            worldY = 0;
            score = 0;
            simPoints = 3;
            currentLane = 'right';
            
            if (!lastTime) requestAnimationFrame(gameLoop);
        },
        quit: () => {
            gameActive = false;
            stopEngineSound();
            window.removeEventListener('resize', resizeCanvas);
        }
    };
})();
