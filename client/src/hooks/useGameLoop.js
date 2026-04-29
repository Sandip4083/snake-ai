import { useState, useRef, useCallback, useEffect } from 'react';
import { ROWS, COLS, CELL_SIZE, generateObstacles, generateFood } from '../utils/gameUtils.js';
import { ALGO_FN } from '../utils/algorithms.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.arcTo(x+w, y, x+w, y+h, r);
  ctx.arcTo(x+w, y+h, x, y+h, r);
  ctx.arcTo(x, y+h, x, y, r);
  ctx.arcTo(x, y, x+w, y, r);
  ctx.closePath();
}

export function useGameLoop(canvasRef) {
  const [score,       setScore]       = useState(0);
  const [timeLeft,    setTimeLeft]    = useState(30);
  const [gameOver,    setGameOver]    = useState(false);
  const [isRunning,   setIsRunning]   = useState(false);
  const [isFetching,  setIsFetching]  = useState(false);
  const [foodsEaten,  setFoodsEaten]  = useState(0);
  const [curSettings, setCurSettings] = useState({
    algorithm: 'bfs', level: 'level0', gameDuration: 30, speed: 130,
  });

  const snakeRef     = useRef([[12,12]]);
  const foodRef      = useRef([5,5]);
  const obsRef       = useRef(new Set());
  const pathRef      = useRef([]);
  const scoreRef     = useRef(0);
  const tlRef        = useRef(30);
  const goRef        = useRef(false);
  const algoRef      = useRef('bfs');
  const particlesRef = useRef([]);

  const gameIntRef  = useRef(null);
  const timerIntRef = useRef(null);
  const rafRef      = useRef(null);
  const stepRef     = useRef(null);   // always latest step fn — no stale closure

  // ── Particles ────────────────────────────────────────────
  const addParticles = useCallback((r, c) => {
    const colors = ['#00FF88','#FFD700','#FF6B6B','#4ECDC4','#FFD93D','#A29BFE'];
    for (let i = 0; i < 10; i++) {
      const angle = (Math.PI*2*i)/10 + Math.random()*0.3;
      const speed = 2 + Math.random()*3;
      particlesRef.current.push({
        x: c*CELL_SIZE + CELL_SIZE/2, y: r*CELL_SIZE + CELL_SIZE/2,
        vx: Math.cos(angle)*speed, vy: Math.sin(angle)*speed,
        life: 1, color: colors[Math.floor(Math.random()*colors.length)],
        size: Math.random()*3+2,
      });
    }
  }, []);

  // ── Render ───────────────────────────────────────────────
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = COLS*CELL_SIZE, H = ROWS*CELL_SIZE;

    ctx.fillStyle = '#080C18';
    ctx.fillRect(0,0,W,H);

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.025)';
    ctx.lineWidth = 0.5;
    for (let r=0; r<=ROWS; r++) { ctx.beginPath(); ctx.moveTo(0,r*CELL_SIZE); ctx.lineTo(W,r*CELL_SIZE); ctx.stroke(); }
    for (let c=0; c<=COLS; c++) { ctx.beginPath(); ctx.moveTo(c*CELL_SIZE,0); ctx.lineTo(c*CELL_SIZE,H); ctx.stroke(); }

    // Obstacles
    obsRef.current.forEach(key => {
      const [r,c] = key.split(',').map(Number);
      const x=c*CELL_SIZE, y=r*CELL_SIZE;
      ctx.fillStyle='#1A1E2E'; roundRect(ctx,x+1,y+1,CELL_SIZE-2,CELL_SIZE-2,3); ctx.fill();
      ctx.fillStyle='#232740'; ctx.fillRect(x+4,y+4,CELL_SIZE-8,CELL_SIZE-8);
      ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.fillRect(x+4,y+4,CELL_SIZE-8,2);
    });

    // Path preview
    if (pathRef.current.length > 0) {
      let [r,c] = snakeRef.current[0];
      pathRef.current.forEach(([dr,dc],idx) => {
        r+=dr; c+=dc;
        const alpha = Math.max(0.04, 0.22 - idx*0.01);
        ctx.fillStyle = `rgba(0,180,255,${alpha})`;
        ctx.beginPath(); ctx.arc(c*CELL_SIZE+CELL_SIZE/2, r*CELL_SIZE+CELL_SIZE/2, 2.5, 0, Math.PI*2); ctx.fill();
      });
    }

    // Snake body
    const snake = snakeRef.current;
    for (let i=snake.length-1; i>=1; i--) {
      const [r,c]=snake[i], t=i/snake.length;
      ctx.fillStyle=`rgb(0,${Math.floor(175-t*75)},${Math.floor(55+t*25)})`;
      roundRect(ctx,c*CELL_SIZE+1,r*CELL_SIZE+1,CELL_SIZE-2,CELL_SIZE-2,3); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.05)';
      ctx.fillRect(c*CELL_SIZE+3,r*CELL_SIZE+2,CELL_SIZE-6,3);
    }

    // Snake head
    if (snake.length>0) {
      const [r,c]=snake[0];
      ctx.shadowBlur=18; ctx.shadowColor='#00FF88'; ctx.fillStyle='#00FF88';
      roundRect(ctx,c*CELL_SIZE+1,r*CELL_SIZE+1,CELL_SIZE-2,CELL_SIZE-2,5); ctx.fill();
      ctx.shadowBlur=0;
      ctx.fillStyle='#060A10';
      ctx.beginPath(); ctx.arc(c*CELL_SIZE+7,r*CELL_SIZE+7,2.5,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(c*CELL_SIZE+13,r*CELL_SIZE+7,2.5,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.9)';
      ctx.beginPath(); ctx.arc(c*CELL_SIZE+8,r*CELL_SIZE+6,1,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(c*CELL_SIZE+14,r*CELL_SIZE+6,1,0,Math.PI*2); ctx.fill();
    }

    // Food
    const [fr,fc]=foodRef.current;
    const pulse=(Math.sin(Date.now()/220)+1)/2;
    ctx.shadowBlur=18+pulse*12; ctx.shadowColor='#FF4757';
    ctx.fillStyle=`rgba(255,71,87,${0.1+pulse*0.1})`;
    ctx.beginPath(); ctx.arc(fc*CELL_SIZE+CELL_SIZE/2,fr*CELL_SIZE+CELL_SIZE/2,CELL_SIZE/2+2+pulse*2,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=`rgb(255,${45+Math.floor(pulse*55)},55)`;
    ctx.beginPath(); ctx.arc(fc*CELL_SIZE+CELL_SIZE/2,fr*CELL_SIZE+CELL_SIZE/2,CELL_SIZE/2-2,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.35)';
    ctx.beginPath(); ctx.arc(fc*CELL_SIZE+CELL_SIZE/2-2,fr*CELL_SIZE+CELL_SIZE/2-3,3,0,Math.PI*2); ctx.fill();
    ctx.shadowBlur=0;

    // Particles
    particlesRef.current = particlesRef.current.filter(p=>p.life>0);
    particlesRef.current.forEach(p=>{
      p.x+=p.vx; p.y+=p.vy; p.vx*=0.9; p.vy*=0.9; p.life-=0.035;
      ctx.globalAlpha=Math.max(0,p.life); ctx.shadowBlur=8; ctx.shadowColor=p.color;
      ctx.fillStyle=p.color; ctx.beginPath(); ctx.arc(p.x,p.y,p.size*p.life,0,Math.PI*2); ctx.fill();
      ctx.shadowBlur=0;
    });
    ctx.globalAlpha=1;
  }, [canvasRef]);

  const startRenderLoop = useCallback(() => {
    const loop=()=>{ render(); rafRef.current=requestAnimationFrame(loop); };
    rafRef.current=requestAnimationFrame(loop);
  }, [render]);

  const stopRenderLoop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  const endGame = useCallback(() => {
    goRef.current=true;
    setGameOver(true); setIsRunning(false);
    clearInterval(gameIntRef.current);
    clearInterval(timerIntRef.current);
  }, []);

  // ── Compute next path using JS algorithm (synchronous, instant) ──
  const computePath = useCallback(() => {
    const snake   = snakeRef.current;
    const head    = snake[0];
    const food    = foodRef.current;
    const blocked = new Set(obsRef.current);                        // obstacle keys
    snake.slice(1).forEach(b => blocked.add(`${b[0]},${b[1]}`));   // body keys

    const algoFn = ALGO_FN[algoRef.current] || ALGO_FN.bfs;
    return algoFn(head, food, blocked, ROWS, COLS);
  }, []);

  // ── Game Step (synchronous — no API, no async, no freeze) ────
  const step = useCallback(() => {
    if (goRef.current) return;
    const snake = snakeRef.current;

    // Get or compute path
    if (pathRef.current.length === 0) {
      const newPath = computePath();
      if (!newPath || newPath.length === 0) {
        // FAILSAFE: If no path to food, try ANY safe move to survive
        let survived = false;
        const DIRS = [[-1,0],[1,0],[0,-1],[0,1]];
        const head = snake[0];
        const blocked = new Set(obsRef.current);
        snake.slice(1).forEach(b => blocked.add(`${b[0]},${b[1]}`));
        for (const [dr, dc] of DIRS) {
          const nr = head[0]+dr, nc = head[1]+dc;
          if (nr>=0 && nr<ROWS && nc>=0 && nc<COLS && !blocked.has(`${nr},${nc}`)) {
            pathRef.current = [[dr, dc]];
            survived = true;
            break;
          }
        }
        if (!survived) {
          endGame();
          return;
        }
      } else {
        pathRef.current = newPath;
      }
    }

    const [dr,dc] = pathRef.current.shift();
    const nh  = [snake[0][0]+dr, snake[0][1]+dc];
    const nhk = `${nh[0]},${nh[1]}`;

    // Collision check
    if (
      nh[0]<0 || nh[0]>=ROWS || nh[1]<0 || nh[1]>=COLS ||
      obsRef.current.has(nhk) ||
      snake.slice(1).some(b=>b[0]===nh[0]&&b[1]===nh[1])
    ) { endGame(); return; }

    snake.unshift(nh);

    if (nh[0]===foodRef.current[0] && nh[1]===foodRef.current[1]) {
      // Ate food
      scoreRef.current++;
      setScore(scoreRef.current);
      setFoodsEaten(fe=>fe+1);
      addParticles(nh[0],nh[1]);
      foodRef.current = generateFood(snake, obsRef.current, ROWS, COLS);
      pathRef.current = [];   // recompute path to new food next tick
    } else {
      snake.pop();
    }
  }, [computePath, endGame, addParticles]);

  // Keep stepRef current
  useEffect(() => { stepRef.current = step; }, [step]);

  // ── Start Game ────────────────────────────────────────────
  const startGame = useCallback((s) => {
    clearInterval(gameIntRef.current);
    clearInterval(timerIntRef.current);
    stopRenderLoop();
    particlesRef.current = [];

    const start = [Math.floor(ROWS/2), Math.floor(COLS/2)];
    snakeRef.current    = [start];
    obsRef.current      = generateObstacles(s.level, start, ROWS, COLS);
    foodRef.current     = generateFood([start], obsRef.current, ROWS, COLS);
    pathRef.current     = [];
    scoreRef.current    = 0;
    tlRef.current       = s.gameDuration;
    goRef.current       = false;
    algoRef.current     = s.algorithm;

    setCurSettings(s);
    setScore(0); setFoodsEaten(0);
    setTimeLeft(s.gameDuration);
    setGameOver(false); setIsRunning(true); setIsFetching(false);

    startRenderLoop();

    // Use stepRef so interval always calls latest step
    gameIntRef.current = setInterval(() => stepRef.current?.(), s.speed);

    timerIntRef.current = setInterval(() => {
      tlRef.current--;
      setTimeLeft(tlRef.current);
      if (tlRef.current <= 0) endGame();
    }, 1000);
  }, [startRenderLoop, stopRenderLoop, endGame]);

  useEffect(() => () => {
    clearInterval(gameIntRef.current);
    clearInterval(timerIntRef.current);
    stopRenderLoop();
  }, [stopRenderLoop]);

  return { score, timeLeft, gameOver, isRunning, isFetching, foodsEaten, curSettings, startGame };
}
