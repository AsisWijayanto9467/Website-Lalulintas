// ============================================================
// LajuAman — Traffic Tap Puzzle (Standalone)
// Memory Persistent via localStorage
// Level selesai = Biru, Terkunci = Abu-abu
// ============================================================

const TrafficPuzzle = (function() {
    let canvas, ctx;
    let audioCtx;
    let soundEnabled = true;

    // Game State
    let gameActive = false;
    let isGameOver = false;
    let isPaused = false;
    let currentLevelIdx = 0;
    let totalLevelCars = 0;
    let clearedCarsCount = 0;

    let activeCars = [];
    let queues = { LEFT: [], RIGHT: [], TOP: [], BOTTOM: [] };
    let particles = [];
    let screenShake = 0;
    let lastTime = 0;
    let animationFrameId;

    // Progress Persistent
    let progress = {
        completed: [false,false,false,false,false,false,false,false,false,false],
        currentLevel: 0
    };

    // --- Dimensi ---
    const ROAD_WIDTH = 80;
    const HALF_ROAD = ROAD_WIDTH / 2;
    let CENTER_X = 400, CENTER_Y = 300;
    let LANE_Y_L2R, LANE_Y_R2L, LANE_X_T2B, LANE_X_B2T;

    // --- 10 Levels ---
    const LEVELS = [
        { name: "Level 1: Pemanasan", target: 2, queues: { LEFT: ['STRAIGHT'], TOP: ['STRAIGHT'] } },
        { name: "Level 2: Putaran", target: 2, queues: { LEFT: ['RIGHT'], TOP: ['STRAIGHT'] } },
        { name: "Level 3: Tiga Cabang", target: 3, queues: { LEFT: ['STRAIGHT'], RIGHT: ['STRAIGHT'], BOTTOM: ['LEFT'] } },
        { name: "Level 4: Antrean", target: 3, queues: { LEFT: ['STRAIGHT','STRAIGHT'], TOP: ['STRAIGHT'] } },
        { name: "Level 5: Simpang Silang", target: 3, queues: { LEFT: ['RIGHT'], RIGHT: ['RIGHT'], TOP: ['STRAIGHT'] } },
        { name: "Level 6: Labirin", target: 4, queues: { LEFT: ['LEFT'], RIGHT: ['LEFT'], TOP: ['LEFT'], BOTTOM: ['LEFT'] } },
        { name: "Level 7: Silang Ganda", target: 5, queues: { LEFT: ['STRAIGHT','RIGHT'], RIGHT: ['STRAIGHT','LEFT'], TOP: ['STRAIGHT'] } },
        { name: "Level 8: Blokade", target: 5, queues: { LEFT: ['STRAIGHT','RIGHT','LEFT'], TOP: ['RIGHT','STRAIGHT'] } },
        { name: "Level 9: Arus Rumit", target: 8, queues: { LEFT: ['LEFT','STRAIGHT'], RIGHT: ['RIGHT','STRAIGHT'], TOP: ['LEFT','STRAIGHT'], BOTTOM: ['RIGHT','STRAIGHT'] } },
        { name: "Level 10: Master", target: 12, queues: { LEFT: ['LEFT','RIGHT','STRAIGHT'], RIGHT: ['LEFT','RIGHT','STRAIGHT'], TOP: ['LEFT','RIGHT','STRAIGHT'], BOTTOM: ['LEFT','RIGHT','STRAIGHT'] } }
    ];

    // ========== PROGRESS PERSISTENT ==========
    function loadProgress() {
        try {
            const saved = localStorage.getItem('lajuaman_puzzle_progress');
            if (saved) {
                const parsed = JSON.parse(saved);
                progress.completed = parsed.completed || progress.completed;
                progress.currentLevel = parsed.currentLevel || 0;
            }
        } catch(e) {}
    }

    function saveProgress() {
        try {
            localStorage.setItem('lajuaman_puzzle_progress', JSON.stringify(progress));
        } catch(e) {}
    }

    // ========== AUDIO ==========
    function playSound(type) {
        if (!soundEnabled) return;
        try {
            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            if (audioCtx.state === 'suspended') audioCtx.resume();
            const osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
            osc.connect(gain); gain.connect(audioCtx.destination);
            if (type === 'click') { osc.type='triangle'; osc.frequency.setValueAtTime(450,audioCtx.currentTime); osc.frequency.exponentialRampToValueAtTime(160,audioCtx.currentTime+0.08); gain.gain.setValueAtTime(0.12,audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01,audioCtx.currentTime+0.08); osc.start(); osc.stop(audioCtx.currentTime+0.08); }
            else if (type === 'success') { osc.type='sine'; osc.frequency.setValueAtTime(523,audioCtx.currentTime); osc.frequency.setValueAtTime(659,audioCtx.currentTime+0.07); gain.gain.setValueAtTime(0.08,audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.005,audioCtx.currentTime+0.25); osc.start(); osc.stop(audioCtx.currentTime+0.25); }
            else if (type === 'crash') { osc.type='sawtooth'; osc.frequency.setValueAtTime(140,audioCtx.currentTime); osc.frequency.exponentialRampToValueAtTime(25,audioCtx.currentTime+0.7); gain.gain.setValueAtTime(0.35,audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01,audioCtx.currentTime+0.7); osc.start(); osc.stop(audioCtx.currentTime+0.7); }
            else if (type === 'win') { [261,329,392,523].forEach((f,i)=>{ const o=audioCtx.createOscillator(),g=audioCtx.createGain(); o.type='triangle'; o.frequency.setValueAtTime(f,audioCtx.currentTime+i*0.1); g.gain.setValueAtTime(0.08,audioCtx.currentTime+i*0.1); g.gain.exponentialRampToValueAtTime(0.001,audioCtx.currentTime+i*0.1+0.3); o.connect(g); g.connect(audioCtx.destination); o.start(audioCtx.currentTime+i*0.1); o.stop(audioCtx.currentTime+i*0.1+0.3); }); }
        } catch(e) {}
    }

    // ========== DRAWING HELPERS ==========
    function drawRoundedRect(ctx, x, y, w, h, r) {
        ctx.beginPath(); ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r); ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h); ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r); ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
    }

    // ========== PUZZLE CAR ==========
    class PuzzleCar {
        constructor(fromDir, turn, queueIndex) {
            this.fromDir=fromDir; this.turn=turn; this.queueIndex=queueIndex;
            this.state='WAITING'; this.width=48; this.height=24;
            this.currentSpeed=0; this.maxSpeed=3.8;
            const colors=['#ca8a04','#b45309','#b91c1c','#475569','#854d0e','#0f766e'];
            this.color=colors[Math.floor(Math.random()*colors.length)];
            this.x=0;this.y=0;this.targetX=0;this.targetY=0;this.angle=0;
            this.waypoints=[];this.currentWaypointIndex=0;
            this.updateQueueTargets(true);
        }
        updateQueueTargets(instant=false) {
            const spacing=58, stopOffset=75;
            if(this.fromDir==='LEFT'){this.targetX=CENTER_X-stopOffset-(this.queueIndex*spacing);this.targetY=LANE_Y_L2R;this.angle=0;}
            else if(this.fromDir==='RIGHT'){this.targetX=CENTER_X+stopOffset+(this.queueIndex*spacing);this.targetY=LANE_Y_R2L;this.angle=Math.PI;}
            else if(this.fromDir==='TOP'){this.targetX=LANE_X_T2B;this.targetY=CENTER_Y-stopOffset-(this.queueIndex*spacing);this.angle=Math.PI/2;}
            else if(this.fromDir==='BOTTOM'){this.targetX=LANE_X_B2T;this.targetY=CENTER_Y+stopOffset+(this.queueIndex*spacing);this.angle=-Math.PI/2;}
            if(instant){this.x=this.targetX;this.y=this.targetY;this.state=(this.queueIndex===0)?'WAITING':'QUEUED';}
            else{this.state='ROLLING';}
        }
        startMoving() {
            this.state='MOVING'; this.waypoints=[{x:this.x,y:this.y}];
            const w=canvas.width, h=canvas.height;
            if(this.fromDir==='LEFT'){if(this.turn==='STRAIGHT')this.waypoints.push({x:w+100,y:LANE_Y_L2R});else if(this.turn==='LEFT'){this.waypoints.push({x:LANE_X_B2T,y:LANE_Y_L2R});this.waypoints.push({x:LANE_X_B2T,y:-100});}else if(this.turn==='RIGHT'){this.waypoints.push({x:LANE_X_T2B,y:LANE_Y_L2R});this.waypoints.push({x:LANE_X_T2B,y:h+100});}}
            else if(this.fromDir==='RIGHT'){if(this.turn==='STRAIGHT')this.waypoints.push({x:-100,y:LANE_Y_R2L});else if(this.turn==='LEFT'){this.waypoints.push({x:LANE_X_T2B,y:LANE_Y_R2L});this.waypoints.push({x:LANE_X_T2B,y:h+100});}else if(this.turn==='RIGHT'){this.waypoints.push({x:LANE_X_B2T,y:LANE_Y_R2L});this.waypoints.push({x:LANE_X_B2T,y:-100});}}
            else if(this.fromDir==='TOP'){if(this.turn==='STRAIGHT')this.waypoints.push({x:LANE_X_T2B,y:h+100});else if(this.turn==='LEFT'){this.waypoints.push({x:LANE_X_T2B,y:LANE_Y_L2R});this.waypoints.push({x:w+100,y:LANE_Y_L2R});}else if(this.turn==='RIGHT'){this.waypoints.push({x:LANE_X_T2B,y:LANE_Y_R2L});this.waypoints.push({x:-100,y:LANE_Y_R2L});}}
            else if(this.fromDir==='BOTTOM'){if(this.turn==='STRAIGHT')this.waypoints.push({x:LANE_X_B2T,y:-100});else if(this.turn==='LEFT'){this.waypoints.push({x:LANE_X_B2T,y:LANE_Y_R2L});this.waypoints.push({x:-100,y:LANE_Y_R2L});}else if(this.turn==='RIGHT'){this.waypoints.push({x:LANE_X_B2T,y:LANE_Y_L2R});this.waypoints.push({x:w+100,y:LANE_Y_L2R});}}
            this.currentWaypointIndex=1; this.currentSpeed=1.5;
        }
        update() {
            if(this.state==='ROLLING'){const dx=this.targetX-this.x,dy=this.targetY-this.y;if(Math.hypot(dx,dy)<1.5){this.x=this.targetX;this.y=this.targetY;this.state=(this.queueIndex===0)?'WAITING':'QUEUED';}else{this.x+=dx*0.08;this.y+=dy*0.08;}}
            else if(this.state==='MOVING'){const t=this.waypoints[this.currentWaypointIndex];if(!t)return;const dx=t.x-this.x,dy=t.y-this.y;const dist=Math.hypot(dx,dy);if(this.currentSpeed<this.maxSpeed)this.currentSpeed+=0.15;
            if(dist<6){this.currentWaypointIndex++;if(this.currentWaypointIndex>=this.waypoints.length){this.state='CLEARED';onCarCleared();}}
            else{const ta=Math.atan2(dy,dx);let ad=ta-this.angle;ad=Math.atan2(Math.sin(ad),Math.cos(ad));this.angle+=ad*0.22;this.x+=Math.cos(this.angle)*this.currentSpeed;this.y+=Math.sin(this.angle)*this.currentSpeed;}}
        }
        draw() {
            ctx.save();ctx.translate(this.x,this.y);ctx.rotate(this.angle);
            ctx.fillStyle='rgba(0,0,0,0.25)';ctx.fillRect(-this.width/2+3,-this.height/2+5,this.width,this.height);
            if(this.state==='WAITING'&&this.queueIndex===0){ctx.save();ctx.rotate(-this.angle);ctx.strokeStyle='#f59e0b';ctx.lineWidth=2.5;ctx.shadowBlur=10;ctx.shadowColor='#f59e0b';ctx.beginPath();ctx.arc(0,0,32*(1+Math.sin(Date.now()*0.007)*0.08),0,Math.PI*2);ctx.stroke();ctx.restore();}
            ctx.fillStyle=this.color;drawRoundedRect(ctx,-this.width/2,-this.height/2,this.width,this.height,6);ctx.fill();
            ctx.fillStyle='#1e293b';drawRoundedRect(ctx,-this.width/4,-this.height/2+2,this.width/2+4,this.height-4,3);ctx.fill();
            ctx.fillStyle='#fef08a';ctx.fillRect(this.width/2-2,-this.height/3,2,3);ctx.fillRect(this.width/2-2,this.height/3-3,2,3);
            ctx.fillStyle='#dc2626';ctx.fillRect(-this.width/2,-this.height/3,2,3);ctx.fillRect(-this.width/2,this.height/3-3,2,3);
            ctx.save();ctx.translate(-2,0);ctx.strokeStyle='#fff';ctx.lineWidth=2.5;
            if(this.turn==='STRAIGHT'){ctx.beginPath();ctx.moveTo(-6,0);ctx.lineTo(8,0);ctx.moveTo(4,-4);ctx.lineTo(8,0);ctx.lineTo(4,4);ctx.stroke();}
            else if(this.turn==='LEFT'){ctx.beginPath();ctx.moveTo(-6,2);ctx.lineTo(3,2);ctx.lineTo(3,-5);ctx.moveTo(0,-2);ctx.lineTo(3,-5);ctx.lineTo(6,-2);ctx.stroke();}
            else if(this.turn==='RIGHT'){ctx.beginPath();ctx.moveTo(-6,-2);ctx.lineTo(3,-2);ctx.lineTo(3,5);ctx.moveTo(0,2);ctx.lineTo(3,5);ctx.lineTo(6,2);ctx.stroke();}
            ctx.restore();ctx.restore();
        }
        getCollisionCircles(){const o=14,r=11;return[{x:this.x+Math.cos(this.angle)*o,y:this.y+Math.sin(this.angle)*o,r},{x:this.x-Math.cos(this.angle)*o,y:this.y-Math.sin(this.angle)*o,r}];}
        containsPoint(px,py){const iv=(this.fromDir==='TOP'||this.fromDir==='BOTTOM');const hw=(iv?this.height:this.width)/2,hh=(iv?this.width:this.height)/2,p=6;return px>=this.x-hw-p&&px<=this.x+hw+p&&py>=this.y-hh-p&&py<=this.y+hh+p;}
    }

    // ========== PARTICLE ==========
    class Particle {
        constructor(x,y,c,s=1){this.x=x;this.y=y;this.color=c;this.r=Math.random()*4+2;const a=Math.random()*Math.PI*2,sp=(Math.random()*2+1)*s;this.vx=Math.cos(a)*sp;this.vy=Math.sin(a)*sp;this.alpha=1;this.decay=Math.random()*0.02+0.015;}
        update(){this.x+=this.vx;this.y+=this.vy;this.alpha-=this.decay;}
        draw(){if(this.alpha<=0)return;ctx.save();ctx.globalAlpha=this.alpha;ctx.fillStyle=this.color;ctx.beginPath();ctx.arc(this.x,this.y,this.r,0,Math.PI*2);ctx.fill();ctx.restore();}
    }

    // ========== MAP ==========
    function drawMap() {
        ctx.fillStyle='#d4b285';ctx.fillRect(0,0,canvas.width,canvas.height);
        ctx.fillStyle='#2d3139';ctx.fillRect(0,CENTER_Y-HALF_ROAD,canvas.width,ROAD_WIDTH);ctx.fillRect(CENTER_X-HALF_ROAD,0,ROAD_WIDTH,canvas.height);
        ctx.fillStyle='#e2e8f0';ctx.fillRect(0,CENTER_Y-HALF_ROAD-2,canvas.width,2);ctx.fillRect(0,CENTER_Y+HALF_ROAD,canvas.width,2);ctx.fillRect(CENTER_X-HALF_ROAD-2,0,2,canvas.height);ctx.fillRect(CENTER_X+HALF_ROAD,0,2,canvas.height);
        ctx.strokeStyle='#f59e0b';ctx.lineWidth=2.5;ctx.setLineDash([12,12]);ctx.beginPath();ctx.moveTo(0,CENTER_Y);ctx.lineTo(canvas.width,CENTER_Y);ctx.stroke();ctx.beginPath();ctx.moveTo(CENTER_X,0);ctx.lineTo(CENTER_X,canvas.height);ctx.stroke();ctx.setLineDash([]);
    }

    // ========== GAME LOGIC ==========
    function shiftQueueForward(dir){queues[dir].shift();queues[dir].forEach((c,i)=>{c.queueIndex=i;c.updateQueueTargets(false);});}

    function onCarCleared(){
        clearedCarsCount++;
        const sc=document.getElementById('pzl-score');if(sc)sc.textContent=`${clearedCarsCount}/${totalLevelCars}`;
        playSound('success');
        activeCars=activeCars.filter(c=>c.state!=='CLEARED');
        if(clearedCarsCount===totalLevelCars){gameActive=false;playSound('win');
            progress.completed[currentLevelIdx]=true;
            if(currentLevelIdx+1>progress.currentLevel)progress.currentLevel=currentLevelIdx+1;
            saveProgress();
            setTimeout(()=>{const lc=document.getElementById('pzl-level-complete');if(lc)lc.classList.remove('hidden');},800);
        }
    }

    function checkCollisions(){
        const cars=[...activeCars];
        for(const d in queues){if(queues[d].length>0)cars.push(queues[d][0]);}
        for(let i=0;i<cars.length;i++){const a=cars[i];if(a.state==='QUEUED')continue;const ca=a.getCollisionCircles();
            for(let j=i+1;j<cars.length;j++){const b=cars[j];if(b.state==='QUEUED')continue;if(a.state==='WAITING'&&b.state==='WAITING')continue;if(a.fromDir===b.fromDir)continue;
                for(const c1 of ca){for(const c2 of b.getCollisionCircles()){if(Math.hypot(c1.x-c2.x,c1.y-c2.y)<(c1.r+c2.r)){triggerCrash(a,b);return;}}}}
        }
    }

    function triggerCrash(c1,c2){gameActive=false;isGameOver=true;playSound('crash');screenShake=24;
        const cx=(c1.x+c2.x)/2,cy=(c1.y+c2.y)/2;
        const cols=['#f97316','#ef4444','#f59e0b','#7c2d12'];
        for(let k=0;k<50;k++){particles.push(new Particle(cx+(Math.random()*24-12),cy+(Math.random()*24-12),cols[Math.floor(Math.random()*cols.length)],3));}
        setTimeout(()=>{const go=document.getElementById('pzl-game-over');if(go)go.classList.remove('hidden');},850);
    }

    // ========== LOOP ==========
    function gameLoop(ts){
        if(!lastTime)lastTime=ts;
        lastTime=ts;
        ctx.clearRect(0,0,canvas.width,canvas.height);
        ctx.save();
        if(screenShake>0.1){ctx.translate((Math.random()-0.5)*screenShake,(Math.random()-0.5)*screenShake);screenShake*=0.88;}
        drawMap();
        if(!isPaused){
            for(const d in queues){for(let i=queues[d].length-1;i>=0;i--){const c=queues[d][i];if(gameActive)c.update();c.draw();}}
            for(let i=activeCars.length-1;i>=0;i--){const c=activeCars[i];if(gameActive)c.update();c.draw();}
            for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.update();p.draw();if(p.alpha<=0)particles.splice(i,1);}
            if(gameActive&&!isGameOver)checkCollisions();
        }
        ctx.restore();
        animationFrameId=requestAnimationFrame(gameLoop);
    }

    function handleInput(cx,cy){
        if(!gameActive||isGameOver||isPaused)return;
        const r=canvas.getBoundingClientRect();
        const tx=((cx-r.left)/r.width)*canvas.width,ty=((cy-r.top)/r.height)*canvas.height;
        for(const d in queues){const q=queues[d];if(q.length>0){const c=q[0];if(c.state==='WAITING'&&c.containsPoint(tx,ty)){c.startMoving();activeCars.push(c);shiftQueueForward(d);playSound('click');break;}}}
    }

    // ========== UI & LEVEL SELECT ==========
    function showLevelSelect(){
        loadProgress();
        document.querySelectorAll('.pzl-overlay').forEach(el=>el.classList.add('hidden'));
        const ls=document.getElementById('pzl-level-select');if(ls)ls.classList.remove('hidden');
        const container=document.getElementById('pzl-levels-container');if(!container)return;
        container.innerHTML='';
        LEVELS.forEach((lv,i)=>{
            const unlocked=i===0||progress.completed[i-1];
            const completed=progress.completed[i];
            const btn=document.createElement('button');
            btn.style.cssText=`width:55px;height:55px;border-radius:12px;font-size:18px;font-weight:700;border:2px solid;margin:4px;cursor:pointer;transition:all 0.2s;`;
            if(completed){btn.style.background='#3b82f6';btn.style.color='#fff';btn.style.borderColor='#2563eb';btn.innerHTML=`${i+1}<span style="display:block;font-size:10px;">⭐⭐⭐</span>`;}
            else if(unlocked){btn.style.background='#fff';btn.style.color='#1e293b';btn.style.borderColor='#94a3b8';btn.innerHTML=i+1;}
            else{btn.style.background='#e2e8f0';btn.style.color='#94a3b8';btn.style.borderColor='#cbd5e1';btn.disabled=true;btn.innerHTML='🔒';btn.style.cursor='not-allowed';}
            if(unlocked){btn.onclick=()=>{currentLevelIdx=i;document.getElementById('pzl-lvl-title').textContent=lv.name;document.getElementById('pzl-lvl-desc').textContent=`Target: Loloskan ${lv.target} Mobil`;ls.classList.add('hidden');document.getElementById('pzl-start-menu').classList.remove('hidden');};}
            container.appendChild(btn);
        });
    }

    function startLevel(){
        const ld=LEVELS[currentLevelIdx];
        activeCars=[];particles=[];queues={LEFT:[],RIGHT:[],TOP:[],BOTTOM:[]};clearedCarsCount=0;
        let total=0;
        for(const d in ld.queues){queues[d]=ld.queues[d].map((t,i)=>{total++;return new PuzzleCar(d,t,i);});}
        totalLevelCars=total;
        isGameOver=false;isPaused=false;gameActive=true;lastTime=0;screenShake=0;
        const sc=document.getElementById('pzl-score');if(sc)sc.textContent=`0/${totalLevelCars}`;
        const tg=document.getElementById('pzl-target');if(tg)tg.textContent=totalLevelCars;
        document.querySelectorAll('.pzl-overlay').forEach(el=>el.classList.add('hidden'));
    }

    function togglePause(){if(!gameActive||isGameOver)return;isPaused=!isPaused;const pm=document.getElementById('pzl-pause-screen');if(pm){if(isPaused)pm.classList.remove('hidden');else pm.classList.add('hidden');}}

    function recalcLayout(){CENTER_X=canvas.width/2;CENTER_Y=canvas.height/2;LANE_Y_L2R=CENTER_Y+20;LANE_Y_R2L=CENTER_Y-20;LANE_X_T2B=CENTER_X-20;LANE_X_B2T=CENTER_X+20;}

    function resizeCanvas(){
        if(!canvas)return;
        const c=canvas.parentElement;if(!c)return;
        const r=c.getBoundingClientRect();
        canvas.width=r.width||800;canvas.height=r.height||600;
        recalcLayout();
    }

    function quit(){gameActive=false;window.removeEventListener('resize',resizeCanvas);}

    // ========== INIT ==========
    function init(){
        canvas=document.getElementById('puzzleCanvas');
        if(!canvas)return;
        ctx=canvas.getContext('2d');

        document.getElementById('pzl-btn-play').onclick=startLevel;
        document.getElementById('pzl-btn-restart').onclick=startLevel;
        document.getElementById('pzl-btn-next').onclick=()=>{if(currentLevelIdx<LEVELS.length-1)currentLevelIdx++;startLevel();};
        document.getElementById('pzl-btn-pause').onclick=togglePause;
        document.getElementById('pzl-btn-resume').onclick=togglePause;
        document.getElementById('pzl-btn-sound').onclick=function(){soundEnabled=!soundEnabled;this.textContent=soundEnabled?'🔊':'🔇';};

        canvas.addEventListener('mousedown',e=>handleInput(e.clientX,e.clientY));
        canvas.addEventListener('touchstart',e=>{if(e.touches.length>0)handleInput(e.touches[0].clientX,e.touches[0].clientY);},{passive:true});

        recalcLayout();
        resizeCanvas();
        window.addEventListener('resize',resizeCanvas);
        gameLoop(performance.now());
        showLevelSelect();
    }

    return { init, showLevelSelect, quit };
})();
