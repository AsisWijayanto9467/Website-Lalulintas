// ============================================================
// LajuAman — Traffic Tap Puzzle
// ============================================================

const TrafficPuzzle = (function() {
    let canvas, ctx;
    let ui = {};
    let audioCtx;
    let soundEnabled = true;

    // Game State
    let gameActive = false;
    let isGameOver = false;
    let isPaused = false;
    let score = 0;
    let currentLevelIdx = 0;
    let totalLevelCars = 0;
    let clearedCarsCount = 0;
    
    let activeCars = [];
    let queues = { LEFT: [], RIGHT: [], TOP: [], BOTTOM: [] };
    let particles = [];
    let screenShake = 0;
    let lastTime = 0;
    let animationFrameId;

    let progress = { completed: [false,false,false,false,false,false,false,false,false,false] };

    // --- Dimensi Struktur Jalan ---
    const ROAD_WIDTH = 80;
    const HALF_ROAD = ROAD_WIDTH / 2;
    let CENTER_X = 400;
    let CENTER_Y = 300;
    let LANE_Y_L2R = CENTER_Y + 20; 
    let LANE_Y_R2L = CENTER_Y - 20; 
    let LANE_X_T2B = CENTER_X - 20; 
    let LANE_X_B2T = CENTER_X + 20; 

    // --- 10 Levels Logika Gurun ---
    const LEVELS = [
        { name: "Level 1", targetText: "Loloskan 2 Mobil", queues: { LEFT: ['STRAIGHT'], TOP: ['STRAIGHT'] } },
        { name: "Level 2", targetText: "Loloskan 2 Mobil", queues: { LEFT: ['RIGHT'], TOP: ['STRAIGHT'] } },
        { name: "Level 3", targetText: "Loloskan 3 Mobil", queues: { LEFT: ['STRAIGHT'], RIGHT: ['STRAIGHT'], BOTTOM: ['LEFT'] } },
        { name: "Level 4", targetText: "Loloskan 3 Mobil", queues: { LEFT: ['STRAIGHT', 'STRAIGHT'], TOP: ['STRAIGHT'] } },
        { name: "Level 5", targetText: "Loloskan 3 Mobil", queues: { LEFT: ['RIGHT'], RIGHT: ['RIGHT'], TOP: ['STRAIGHT'] } },
        { name: "Level 6", targetText: "Loloskan 4 Mobil", queues: { LEFT: ['LEFT'], RIGHT: ['LEFT'], TOP: ['LEFT'], BOTTOM: ['LEFT'] } },
        { name: "Level 7", targetText: "Loloskan 5 Mobil", queues: { LEFT: ['STRAIGHT', 'RIGHT'], RIGHT: ['STRAIGHT', 'LEFT'], TOP: ['STRAIGHT'] } },
        { name: "Level 8", targetText: "Loloskan 5 Mobil", queues: { LEFT: ['STRAIGHT', 'RIGHT', 'LEFT'], TOP: ['RIGHT', 'STRAIGHT'] } },
        { name: "Level 9", targetText: "Loloskan 8 Mobil", queues: { LEFT: ['LEFT', 'STRAIGHT'], RIGHT: ['RIGHT', 'STRAIGHT'], TOP: ['LEFT', 'STRAIGHT'], BOTTOM: ['RIGHT', 'STRAIGHT'] } },
        { name: "Level 10", targetText: "Loloskan 12 Mobil", queues: { LEFT: ['LEFT', 'RIGHT', 'STRAIGHT'], RIGHT: ['LEFT', 'RIGHT', 'STRAIGHT'], TOP: ['LEFT', 'RIGHT', 'STRAIGHT'], BOTTOM: ['LEFT', 'RIGHT', 'STRAIGHT'] } }
    ];

    // --- Audio System ---
    function playSound(type) {
        if (!soundEnabled) return;
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();

        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        if (type === 'click') {
            osc.type = 'triangle'; osc.frequency.setValueAtTime(450, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(160, audioCtx.currentTime + 0.08);
            gain.gain.setValueAtTime(0.12, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
            osc.start(); osc.stop(audioCtx.currentTime + 0.08);
        } else if (type === 'roll') {
            osc.type = 'sine'; osc.frequency.setValueAtTime(130, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(190, audioCtx.currentTime + 0.18);
            gain.gain.setValueAtTime(0.04, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.18);
            osc.start(); osc.stop(audioCtx.currentTime + 0.18);
        } else if (type === 'success') {
            osc.type = 'sine'; osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); 
            osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.07); 
            gain.gain.setValueAtTime(0.08, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.005, audioCtx.currentTime + 0.25);
            osc.start(); osc.stop(audioCtx.currentTime + 0.25);
        } else if (type === 'crash') {
            osc.type = 'sawtooth'; osc.frequency.setValueAtTime(140, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(25, audioCtx.currentTime + 0.7);
            gain.gain.setValueAtTime(0.35, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.7);
            
            const subOsc = audioCtx.createOscillator(); const subGain = audioCtx.createGain();
            subOsc.type = 'triangle'; subOsc.frequency.setValueAtTime(80, audioCtx.currentTime);
            subOsc.frequency.linearRampToValueAtTime(20, audioCtx.currentTime + 0.5);
            subGain.gain.setValueAtTime(0.25, audioCtx.currentTime); subGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
            subOsc.connect(subGain); subGain.connect(audioCtx.destination);
            
            osc.start(); subOsc.start();
            osc.stop(audioCtx.currentTime + 0.7); subOsc.stop(audioCtx.currentTime + 0.5);
        } else if (type === 'win') {
            const notes = [261.63, 329.63, 392.00, 523.25]; 
            notes.forEach((freq, idx) => {
                const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
                o.type = 'triangle'; o.frequency.setValueAtTime(freq, audioCtx.currentTime + idx * 0.1);
                g.gain.setValueAtTime(0.08, audioCtx.currentTime + idx * 0.1);
                g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + idx * 0.1 + 0.3);
                o.connect(g); g.connect(audioCtx.destination);
                o.start(audioCtx.currentTime + idx * 0.1); o.stop(audioCtx.currentTime + idx * 0.1 + 0.3);
            });
        }
    }

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

    class PuzzleCar {
        constructor(fromDir, turn, queueIndex) {
            this.fromDir = fromDir; 
            this.turn = turn; 
            this.queueIndex = queueIndex; 

            this.state = 'WAITING'; 
            this.width = 48;
            this.height = 24;
            this.currentSpeed = 0;
            this.maxSpeed = 3.8;

            const carPalette = ['#ca8a04', '#b45309', '#b91c1c', '#475569', '#854d0e', '#0f766e'];
            this.color = carPalette[Math.floor(Math.random() * carPalette.length)];

            this.x = 0;
            this.y = 0;
            this.targetX = 0;
            this.targetY = 0;
            this.angle = 0;
            
            this.updateQueueTargets(true); 

            this.waypoints = [];
            this.currentWaypointIndex = 0;
        }

        updateQueueTargets(instant = false) {
            const spacing = 58; 
            const stopOffset = 75; 

            if (this.fromDir === 'LEFT') {
                this.targetX = CENTER_X - stopOffset - (this.queueIndex * spacing);
                this.targetY = LANE_Y_L2R; this.angle = 0;
            } else if (this.fromDir === 'RIGHT') {
                this.targetX = CENTER_X + stopOffset + (this.queueIndex * spacing);
                this.targetY = LANE_Y_R2L; this.angle = Math.PI;
            } else if (this.fromDir === 'TOP') {
                this.targetX = LANE_X_T2B;
                this.targetY = CENTER_Y - stopOffset - (this.queueIndex * spacing); this.angle = Math.PI / 2;
            } else if (this.fromDir === 'BOTTOM') {
                this.targetX = LANE_X_B2T;
                this.targetY = CENTER_Y + stopOffset + (this.queueIndex * spacing); this.angle = -Math.PI / 2;
            }

            if (instant) {
                this.x = this.targetX; this.y = this.targetY;
                this.state = (this.queueIndex === 0) ? 'WAITING' : 'QUEUED';
            } else {
                this.state = 'ROLLING';
            }
        }

        startMoving() {
            this.state = 'MOVING';
            this.waypoints = [];
            this.waypoints.push({ x: this.x, y: this.y });

            if (this.fromDir === 'LEFT') {
                if (this.turn === 'STRAIGHT') this.waypoints.push({ x: canvas.width + 100, y: LANE_Y_L2R });
                else if (this.turn === 'LEFT') { this.waypoints.push({ x: LANE_X_B2T, y: LANE_Y_L2R }); this.waypoints.push({ x: LANE_X_B2T, y: -100 }); }
                else if (this.turn === 'RIGHT') { this.waypoints.push({ x: LANE_X_T2B, y: LANE_Y_L2R }); this.waypoints.push({ x: LANE_X_T2B, y: canvas.height + 100 }); }
            } else if (this.fromDir === 'RIGHT') {
                if (this.turn === 'STRAIGHT') this.waypoints.push({ x: -100, y: LANE_Y_R2L });
                else if (this.turn === 'LEFT') { this.waypoints.push({ x: LANE_X_T2B, y: LANE_Y_R2L }); this.waypoints.push({ x: LANE_X_T2B, y: canvas.height + 100 }); }
                else if (this.turn === 'RIGHT') { this.waypoints.push({ x: LANE_X_B2T, y: LANE_Y_R2L }); this.waypoints.push({ x: LANE_X_B2T, y: -100 }); }
            } else if (this.fromDir === 'TOP') {
                if (this.turn === 'STRAIGHT') this.waypoints.push({ x: LANE_X_T2B, y: canvas.height + 100 });
                else if (this.turn === 'LEFT') { this.waypoints.push({ x: LANE_X_T2B, y: LANE_Y_L2R }); this.waypoints.push({ x: canvas.width + 100, y: LANE_Y_L2R }); }
                else if (this.turn === 'RIGHT') { this.waypoints.push({ x: LANE_X_T2B, y: LANE_Y_R2L }); this.waypoints.push({ x: -100, y: LANE_Y_R2L }); }
            } else if (this.fromDir === 'BOTTOM') {
                if (this.turn === 'STRAIGHT') this.waypoints.push({ x: LANE_X_B2T, y: -100 });
                else if (this.turn === 'LEFT') { this.waypoints.push({ x: LANE_X_B2T, y: LANE_Y_R2L }); this.waypoints.push({ x: -100, y: LANE_Y_R2L }); }
                else if (this.turn === 'RIGHT') { this.waypoints.push({ x: LANE_X_B2T, y: LANE_Y_L2R }); this.waypoints.push({ x: canvas.width + 100, y: LANE_Y_L2R }); }
            }

            this.currentWaypointIndex = 1;
            this.currentSpeed = 1.5; 
        }

        update() {
            if (this.state === 'ROLLING') {
                const dx = this.targetX - this.x;
                const dy = this.targetY - this.y;
                const dist = Math.hypot(dx, dy);

                if (dist < 1.5) {
                    this.x = this.targetX; this.y = this.targetY;
                    this.state = (this.queueIndex === 0) ? 'WAITING' : 'QUEUED';
                } else {
                    let vx = dx * 0.08;
                    let vy = dy * 0.08;
                    const vDist = Math.hypot(vx, vy);
                    if (vDist > 2.5) {
                        vx = (vx / vDist) * 2.5;
                        vy = (vy / vDist) * 2.5;
                    }
                    this.x += vx;
                    this.y += vy;
                }
            } else if (this.state === 'MOVING') {
                const target = this.waypoints[this.currentWaypointIndex];
                if (!target) return;

                const dx = target.x - this.x; const dy = target.y - this.y;
                const dist = Math.hypot(dx, dy);

                if (this.currentSpeed < this.maxSpeed) this.currentSpeed += 0.15;

                if (dist < 6) {
                    this.currentWaypointIndex++;
                    if (this.currentWaypointIndex >= this.waypoints.length) {
                        this.state = 'CLEARED';
                        onCarCleared();
                    }
                } else {
                    const targetAngle = Math.atan2(dy, dx);
                    let angleDiff = targetAngle - this.angle;
                    angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
                    this.angle += angleDiff * 0.22;

                    this.x += Math.cos(this.angle) * this.currentSpeed;
                    this.y += Math.sin(this.angle) * this.currentSpeed;
                }

                if (Math.random() < 0.25) {
                    particles.push(new Particle(
                        this.x - Math.cos(this.angle) * 22,
                        this.y - Math.sin(this.angle) * 22,
                        'rgba(200, 180, 150, 0.4)',
                        1.2
                    ));
                }
            }
        }

        draw() {
            ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.angle);

            ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
            ctx.fillRect(-this.width/2 + 3, -this.height/2 + 5, this.width, this.height);

            if (this.state === 'WAITING' && this.queueIndex === 0) {
                ctx.save(); ctx.rotate(-this.angle); 
                ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2.5;
                ctx.shadowBlur = 10; ctx.shadowColor = '#f59e0b';
                ctx.beginPath();
                const pulse = 1 + Math.sin(Date.now() * 0.007) * 0.08;
                ctx.arc(0, 0, 32 * pulse, 0, Math.PI * 2);
                ctx.stroke(); ctx.restore();
            }

            ctx.fillStyle = this.color;
            drawRoundedRect(ctx, -this.width/2, -this.height/2, this.width, this.height, 6);
            ctx.fill();

            // Desert dust effect
            ctx.fillStyle = 'rgba(212, 178, 133, 0.3)';
            drawRoundedRect(ctx, -this.width/2, -this.height/2, 8, this.height, 2);
            ctx.fill();

            ctx.fillStyle = '#1e293b';
            drawRoundedRect(ctx, -this.width/4, -this.height/2+2, this.width/2+4, this.height-4, 3);
            ctx.fill();

            ctx.fillStyle = this.color;
            drawRoundedRect(ctx, -this.width/5, -this.height/2+4, this.width/3+2, this.height-8, 2);
            ctx.fill();

            ctx.fillStyle = '#0f172a';
            ctx.fillRect(this.width/6, -this.height/2+4, 4, this.height-8);

            ctx.fillStyle = '#fef08a'; 
            ctx.fillRect(this.width/2-2, -this.height/3, 2, 3); ctx.fillRect(this.width/2-2, this.height/3-3, 2, 3);

            ctx.fillStyle = '#dc2626'; 
            ctx.fillRect(-this.width/2, -this.height/3, 2, 3); ctx.fillRect(-this.width/2, this.height/3-3, 2, 3);

            ctx.save(); ctx.translate(-2, 0); 
            ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5; ctx.lineJoin = 'miter';

            if (this.turn === 'STRAIGHT') {
                ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(8, 0); ctx.moveTo(4, -4); ctx.lineTo(8, 0); ctx.lineTo(4, 4); ctx.stroke();
            } else if (this.turn === 'LEFT') {
                ctx.beginPath(); ctx.moveTo(-6, 2); ctx.lineTo(3, 2); ctx.lineTo(3, -5); ctx.moveTo(0, -2); ctx.lineTo(3, -5); ctx.lineTo(6, -2); ctx.stroke();
            } else if (this.turn === 'RIGHT') {
                ctx.beginPath(); ctx.moveTo(-6, -2); ctx.lineTo(3, -2); ctx.lineTo(3, 5); ctx.moveTo(0, 2); ctx.lineTo(3, 5); ctx.lineTo(6, 2); ctx.stroke();
            }
            ctx.restore(); ctx.restore();
        }

        getCollisionCircles() {
            const offset = 14, radius = 11; 
            return [
                { x: this.x + Math.cos(this.angle) * offset, y: this.y + Math.sin(this.angle) * offset, r: radius },
                { x: this.x - Math.cos(this.angle) * offset, y: this.y - Math.sin(this.angle) * offset, r: radius }
            ];
        }

        containsPoint(px, py) {
            const isVertical = (this.fromDir === 'TOP' || this.fromDir === 'BOTTOM');
            const halfW = (isVertical ? this.height : this.width) / 2;
            const halfH = (isVertical ? this.width : this.height) / 2;
            const padding = 4;
            return px >= this.x - halfW - padding && px <= this.x + halfW + padding &&
                   py >= this.y - halfH - padding && py <= this.y + halfH + padding;
        }
    }

    class Particle {
        constructor(x, y, color, speedScale = 1) {
            this.x = x; this.y = y; this.color = color;
            this.radius = Math.random() * 4 + 2;
            const angle = Math.random() * Math.PI * 2;
            const speed = (Math.random() * 2 + 1) * speedScale;
            this.vx = Math.cos(angle) * speed; this.vy = Math.sin(angle) * speed;
            this.alpha = 1; this.decay = Math.random() * 0.02 + 0.015;
        }
        update() { this.x += this.vx; this.y += this.vy; this.alpha -= this.decay; }
        draw() {
            ctx.save(); ctx.globalAlpha = this.alpha; ctx.fillStyle = this.color;
            ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }
    }

    // --- Game Map (Desert / Rust Theme) ---
    const DECORATIONS = {
        grass: [{x: 100, y: 150, s: 1}, {x: 150, y: 110, s: 0.8}, {x: 650, y: 120, s: 1.1}, {x: 720, y: 140, s: 0.9}, {x: 120, y: 480, s: 1.2}, {x: 230, y: 520, s: 0.7}, {x: 680, y: 450, s: 1.0}, {x: 580, y: 500, s: 0.8}],
        rocks: [{x: 130, y: 160, s: 1.2}, {x: 680, y: 150, s: 1}, {x: 110, y: 510, s: 0.9}, {x: 690, y: 480, s: 1.5}],
        barrels: [{x: 320, y: 220, angle: 0.4}, {x: 330, y: 240, angle: 0}, {x: 480, y: 210, angle: -0.2}, {x: 330, y: 380, angle: 1.5}, {x: 480, y: 370, angle: 0.6}],
        debris: [{x: 490, y: 230}, {x: 310, y: 390}, {x: 490, y: 390}]
    };

    function drawMap() {
        ctx.fillStyle = '#d4b285'; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const dx = CENTER_X - 400;
        const dy = CENTER_Y - 300;

        ctx.fillStyle = '#caa372';
        ctx.beginPath();
        ctx.arc(200 + dx, 120 + dy, 160, 0, Math.PI * 2);
        ctx.arc(650 + dx, 480 + dy, 180, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#2d3139';
        ctx.fillRect(0, CENTER_Y - HALF_ROAD, canvas.width, ROAD_WIDTH);
        ctx.fillRect(CENTER_X - HALF_ROAD, 0, ROAD_WIDTH, canvas.height);

        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(0, CENTER_Y - HALF_ROAD - 2, canvas.width, 2);
        ctx.fillRect(0, CENTER_Y + HALF_ROAD, canvas.width, 2);
        ctx.fillRect(CENTER_X - HALF_ROAD - 2, 0, 2, canvas.height);
        ctx.fillRect(CENTER_X + HALF_ROAD, 0, 2, canvas.height);

        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([12, 12]);
        ctx.beginPath(); ctx.moveTo(0, CENTER_Y); ctx.lineTo(canvas.width, CENTER_Y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(CENTER_X, 0); ctx.lineTo(CENTER_X, canvas.height); ctx.stroke();
        ctx.setLineDash([]); 

        drawMiniZebra(CENTER_X - HALF_ROAD - 14, CENTER_Y - HALF_ROAD, 6, ROAD_WIDTH, 'V');
        drawMiniZebra(CENTER_X + HALF_ROAD + 8, CENTER_Y - HALF_ROAD, 6, ROAD_WIDTH, 'V');
        drawMiniZebra(CENTER_X - HALF_ROAD, CENTER_Y - HALF_ROAD - 14, ROAD_WIDTH, 6, 'H');
        drawMiniZebra(CENTER_X - HALF_ROAD, CENTER_Y + HALF_ROAD + 8, ROAD_WIDTH, 6, 'H');

        DECORATIONS.grass.forEach(g => drawDryGrass(g.x + dx, g.y + dy, g.s));
        DECORATIONS.rocks.forEach(r => drawDesertRock(r.x + dx, r.y + dy, r.s));
        DECORATIONS.barrels.forEach(b => drawRustyBarrel(b.x + dx, b.y + dy, b.angle));
        
        ctx.fillStyle = '#57534e';
        DECORATIONS.debris.forEach(d => {
            ctx.save(); ctx.translate(d.x + dx, d.y + dy); ctx.rotate(0.5); ctx.fillRect(-8, -2, 16, 4); ctx.restore();
        });

        drawAbandonedCar(620 + dx, 180 + dy);
    }

    function drawMiniZebra(x, y, w, h, orient) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        const count = 4;
        if (orient === 'V') {
            const step = h / count;
            for (let i = 0; i < count; i++) ctx.fillRect(x, y + i * step + 2, w, step - 4);
        } else {
            const step = w / count;
            for (let i = 0; i < count; i++) ctx.fillRect(x + i * step + 2, y, step - 4, h);
        }
    }

    function drawDryGrass(x, y, scale) {
        ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
        ctx.strokeStyle = '#a16207'; ctx.lineWidth = 1.8;
        for (let i = 0; i < 5; i++) {
            const angle = -Math.PI / 6 - (i * (Math.PI / 1.5) / 4);
            const length = 12 + Math.random() * 6;
            ctx.beginPath(); ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(Math.cos(angle) * length * 0.5, Math.sin(angle) * length - 2, Math.cos(angle) * length, Math.sin(angle) * length);
            ctx.stroke();
        }
        ctx.restore();
    }

    function drawDesertRock(x, y, scale) {
        ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
        ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(0, 4, 12, 6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#78716c'; ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(-4, -8); ctx.lineTo(8, -6); ctx.lineTo(10, 2); ctx.lineTo(0, 6); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#a8a29e'; ctx.beginPath(); ctx.moveTo(-4, -8); ctx.lineTo(4, -10); ctx.lineTo(8, -6); ctx.lineTo(0, -2); ctx.closePath(); ctx.fill();
        ctx.restore();
    }

    function drawRustyBarrel(x, y, angle) {
        ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'; ctx.fillRect(-7, -10, 14, 20);
        ctx.fillStyle = '#9a3412'; ctx.fillRect(-6, -9, 12, 18);
        ctx.strokeStyle = '#431407'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-6, -4); ctx.lineTo(6, -4); ctx.moveTo(-6, 3); ctx.lineTo(6, 3); ctx.stroke();
        ctx.fillStyle = '#7c2d12'; ctx.beginPath(); ctx.ellipse(0, -9, 6, 2.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.restore();
    }

    function drawAbandonedCar(x, y) {
        ctx.save(); ctx.translate(x, y); ctx.rotate(-0.4);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'; ctx.fillRect(-22, -11, 44, 22);
        ctx.fillStyle = '#57534e'; ctx.beginPath(); ctx.roundRect(-20, -10, 40, 20, 5); ctx.fill();
        ctx.fillStyle = '#7c2d12'; ctx.fillRect(-10, -5, 12, 4); ctx.fillRect(4, 3, 8, 3);
        ctx.fillStyle = '#1c1917'; ctx.fillRect(-12, -7, 10, 14);
        ctx.restore();
    }

    // --- Game Logic ---
    function shiftQueueForward(direction) {
        queues[direction].shift();
        queues[direction].forEach((car, index) => {
            car.queueIndex = index;
            car.updateQueueTargets(false); 
        });
        playSound('roll');
    }

    function onCarCleared() {
        clearedCarsCount++;
        ui.score.textContent = `${clearedCarsCount}/${totalLevelCars}`;
        playSound('success');

        activeCars = activeCars.filter(car => car.state !== 'CLEARED');

        if (clearedCarsCount === totalLevelCars) {
            gameActive = false;
            playSound('win');
            
            progress.completed[currentLevelIdx] = true;
            saveProgress();
            
            if (typeof app !== 'undefined' && app.state) {
                const earned = 50 + (currentLevelIdx * 20);
                const saved = localStorage.getItem('lajuaman_player');
                if (saved) {
                    const p = JSON.parse(saved);
                    p.totalPoin = (p.totalPoin || 0) + earned;
                    localStorage.setItem('lajuaman_player', JSON.stringify(p));
                }
            }

            setTimeout(() => {
                ui.levelComplete.classList.remove('hidden');
            }, 800);
        }
    }

    function checkCollisions() {
        const carsToTest = [...activeCars];
        for (const dir in queues) {
            if (queues[dir].length > 0) carsToTest.push(queues[dir][0]);
        }

        for (let i = 0; i < carsToTest.length; i++) {
            const carA = carsToTest[i];
            if (carA.state === 'QUEUED') continue;

            const circlesA = carA.getCollisionCircles();

            for (let j = i + 1; j < carsToTest.length; j++) {
                const carB = carsToTest[j];
                if (carB.state === 'QUEUED') continue;
                if (carA.state === 'WAITING' && carB.state === 'WAITING') continue;
                if (carA.fromDir === carB.fromDir) continue;

                const circlesB = carB.getCollisionCircles();

                for (const circleA of circlesA) {
                    for (const circleB of circlesB) {
                        const dist = Math.hypot(circleA.x - circleB.x, circleA.y - circleB.y);
                        if (dist < (circleA.r + circleB.r)) {
                            triggerCrashExplosion(carA, carB);
                            return; 
                        }
                    }
                }
            }
        }
    }

    function triggerCrashExplosion(car1, car2) {
        gameActive = false;
        isGameOver = true;
        playSound('crash');
        screenShake = 24; 

        const crashX = (car1.x + car2.x) / 2;
        const crashY = (car1.y + car2.y) / 2;

        const explosionColors = ['#f97316', '#ef4444', '#f59e0b', '#7c2d12', '#44403c', '#e7e5e4'];
        for (let k = 0; k < 65; k++) {
            particles.push(new Particle(crashX + (Math.random() * 24 - 12), crashY + (Math.random() * 24 - 12), explosionColors[Math.floor(Math.random() * explosionColors.length)], 3.0));
        }

        setTimeout(() => {
            ui.gameOver.classList.remove('hidden');
            document.getElementById('pzl-final-score').textContent = clearedCarsCount;
        }, 850);
    }

    // --- Loop ---
    function gameLoop(timestamp) {
        if (!lastTime) lastTime = timestamp;
        const delta = timestamp - lastTime;
        lastTime = timestamp;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();

        if (screenShake > 0.1) {
            ctx.translate((Math.random()-0.5)*screenShake, (Math.random()-0.5)*screenShake);
            screenShake *= 0.88;
        }

        drawMap();

        if (!isPaused) {
            for (const dir in queues) {
                const queue = queues[dir];
                for (let i = queue.length - 1; i >= 0; i--) {
                    const car = queue[i];
                    if (gameActive) car.update();
                    car.draw();
                }
            }

            for (let i = activeCars.length - 1; i >= 0; i--) {
                const car = activeCars[i];
                if (gameActive) car.update();
                car.draw();
            }

            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.update();
                p.draw();
                if (p.alpha <= 0) particles.splice(i, 1);
            }

            if (gameActive && !isGameOver) checkCollisions();
        } else {
            for (const dir in queues) {
                const queue = queues[dir];
                for (let i = queue.length - 1; i >= 0; i--) queue[i].draw();
            }
            for (let i = activeCars.length - 1; i >= 0; i--) activeCars[i].draw();
            for (let i = particles.length - 1; i >= 0; i--) particles[i].draw();
        }

        ctx.restore();
        animationFrameId = requestAnimationFrame(gameLoop);
    }

    function handleInput(clientX, clientY) {
        if (!gameActive || isGameOver || isPaused) return;
        const rect = canvas.getBoundingClientRect();
        const tapX = ((clientX - rect.left) / rect.width) * canvas.width;
        const tapY = ((clientY - rect.top) / rect.height) * canvas.height;

        for (const dir in queues) {
            const queue = queues[dir];
            if (queue.length > 0) {
                const frontCar = queue[0];
                if (frontCar.state === 'WAITING' && frontCar.containsPoint(tapX, tapY)) {
                    frontCar.startMoving();
                    activeCars.push(frontCar);
                    shiftQueueForward(dir);
                    playSound('click');
                    break;
                }
            }
        }
    }

    // --- Progress & UI ---
    function loadProgress() {
        try {
            const s = localStorage.getItem('lajuaman_pzl_lvl');
            if (s) progress = JSON.parse(s);
        } catch(e){}
    }
    function saveProgress() {
        try { localStorage.setItem('lajuaman_pzl_lvl', JSON.stringify(progress)); } catch(e){}
    }

    function showLevelSelect() {
        loadProgress();
        document.querySelectorAll('.pzl-overlay').forEach(el => el.classList.add('hidden'));
        ui.levelSelect.classList.remove('hidden');

        const container = document.getElementById('pzl-levels-container');
        container.innerHTML = '';
        LEVELS.forEach((lv, i) => {
            const unlocked = i === 0 || progress.completed[i - 1];
            const completed = progress.completed[i];
            const btn = document.createElement('button');
            btn.className = 'pzl-level-btn' + (completed ? ' completed' : '');
            btn.disabled = !unlocked;
            btn.innerHTML = `${i+1}${completed ? '<span class="pzl-lvl-stars">⭐⭐⭐</span>' : ''}`;
            btn.onclick = () => {
                currentLevelIdx = i;
                document.getElementById('pzl-lvl-title').textContent = lv.name;
                
                document.querySelector('.pzl-guide').innerHTML = `
                    <div style="font-size:12px; margin-bottom:10px; width:100%; text-align:center;">
                        Atur lalu lintas dengan taktik presisi!<br>Ketuk mobil untuk berjalan keluar tanpa bertabrakan.
                    </div>
                    <div class="pzl-guide-item" style="border-color:#10b981">
                        <span style="font-size:20px;color:#10b981">↑</span><br>Lurus
                    </div>
                    <div class="pzl-guide-item" style="border-color:#3b82f6">
                        <span style="font-size:20px;color:#3b82f6">↰</span><br>Belok Kiri
                    </div>
                    <div class="pzl-guide-item" style="border-color:#f59e0b">
                        <span style="font-size:20px;color:#f59e0b">↱</span><br>Belok Kanan
                    </div>
                `;

                document.getElementById('pzl-lvl-desc').textContent = `Target: ${lv.targetText}`;
                ui.levelSelect.classList.add('hidden');
                ui.startMenu.classList.remove('hidden');
            };
            container.appendChild(btn);
        });
    }

    function startLevel() {
        const levelData = LEVELS[currentLevelIdx];
        activeCars = []; particles = [];
        queues = { LEFT: [], RIGHT: [], TOP: [], BOTTOM: [] };
        clearedCarsCount = 0;

        let total = 0;
        for (const direction in levelData.queues) {
            const turnsList = levelData.queues[direction];
            queues[direction] = turnsList.map((turn, index) => {
                total++;
                return new PuzzleCar(direction, turn, index);
            });
        }
        totalLevelCars = total;

        isGameOver = false; isPaused = false; gameActive = true;
        lastTime = 0; screenShake = 0;
        
        ui.score.textContent = `0/${totalLevelCars}`;
        ui.target.textContent = totalLevelCars;
        
        document.querySelectorAll('.pzl-overlay').forEach(el => el.classList.add('hidden'));
    }

    function togglePause() {
        if (!gameActive || isGameOver) return;
        isPaused = !isPaused;
        if (isPaused) ui.pauseMenu.classList.remove('hidden');
        else ui.pauseMenu.classList.add('hidden');
    }

    function recalculateLayout() {
        CENTER_X = canvas.width / 2;
        CENTER_Y = canvas.height / 2;
        LANE_Y_L2R = CENTER_Y + 20; 
        LANE_Y_R2L = CENTER_Y - 20; 
        LANE_X_T2B = CENTER_X - 20; 
        LANE_X_B2T = CENTER_X + 20; 
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
            activeCars.forEach(car => {
                if (car.state === 'MOVING') {
                    car.x += dx;
                    car.y += dy;
                    car.waypoints.forEach(wp => {
                        if (car.fromDir === 'LEFT' || car.fromDir === 'RIGHT') {
                            wp.y += dy;
                            if (wp.x > oldCenterX + 50) wp.x = canvas.width + 100;
                            else if (wp.x < -50) wp.x = -100;
                            else wp.x += dx;
                        } else {
                            wp.x += dx;
                            if (wp.y > oldCenterY + 50) wp.y = canvas.height + 100;
                            else if (wp.y < -50) wp.y = -100;
                            else wp.y += dy;
                        }
                    });
                } else {
                    car.updateQueueTargets(true);
                }
            });
            for (const dir in queues) {
                queues[dir].forEach(car => {
                    car.updateQueueTargets(true);
                });
            }
        }
    }

    function quit() {
        gameActive = false;
        window.removeEventListener('resize', resizeCanvas);
    }

    // --- Init ---
    function init() {
        if (!canvas) {
            canvas = document.getElementById('puzzleCanvas');
            ctx = canvas.getContext('2d');

            ui.target = document.getElementById('pzl-target');
            ui.score = document.getElementById('pzl-score');
            ui.levelSelect = document.getElementById('pzl-level-select');
            ui.startMenu = document.getElementById('pzl-start-menu');
            ui.gameOver = document.getElementById('pzl-game-over');
            ui.levelComplete = document.getElementById('pzl-level-complete');
            ui.pauseMenu = document.getElementById('pzl-pause-screen');

            document.getElementById('pzl-btn-play').onclick = startLevel;
            document.getElementById('pzl-btn-restart').onclick = startLevel;
            document.getElementById('pzl-btn-next').onclick = () => {
                if (currentLevelIdx < LEVELS.length - 1) currentLevelIdx++;
                startLevel();
            };
            
            document.getElementById('pzl-btn-pause').onclick = togglePause;
            document.getElementById('pzl-btn-resume').onclick = togglePause;
            
            document.getElementById('pzl-btn-sound').onclick = (e) => {
                soundEnabled = !soundEnabled;
                e.target.textContent = soundEnabled ? '🔊' : '🔇';
            };

            canvas.addEventListener('mousedown', e => handleInput(e.clientX, e.clientY));
            canvas.addEventListener('touchstart', e => {
                if (e.touches.length > 0) handleInput(e.touches[0].clientX, e.touches[0].clientY);
            }, { passive: true });

            gameLoop(performance.now());
        }

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        showLevelSelect();
    }

    return { init, showLevelSelect, quit };
})();
