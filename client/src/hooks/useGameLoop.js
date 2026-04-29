import { useState, useRef, useCallback, useEffect } from 'react';
import { ROWS, COLS, CELL_SIZE, generateObstacles, generateFood } from '../utils/gameUtils.js';

// Uses Vercel's automatic /api routing
const API_BASE = '/api';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
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

  const snakeRef    = useRef([[12, 12]]);
  const foodRef     = useRef([5, 5]);
  const obsRef      = useRef(new Set());
  const pathRef     = useRef([]);
  const scoreRef    = useRef(0);
  const tlRef       = useRef(30);
  const goRef       = useRef(false);
  const algoRef     = useRef('bfs');
  const fetchRef    = useRef(false);
  const particlesRef = useRef([]);

  const gameIntRef  = useRef(null);
  const timerIntRef = useRef(null);
  const rafRef      = useRef(null);

  // ── Particles ────────────────────────────────────────────
  const addParticles = useCallback((r, c) => {
    const colors = ['#00FF88', '#FFD700', '#FF6B6B', '#4ECDC4', '#FFD93D'];
    for (let i = 0; i < 8; i++) {
      particlesRef.current.push({
        x: c * CELL_SIZE + CELL_SIZE / 2,
        y: r * CELL_SIZE + CELL_SIZE / 2,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        life: 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 4 + 2,
      });
    }
  }, []);

  // ── Render ──────────────────────────────────────────────
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = COLS * CELL_SIZE, H = ROWS * CELL_SIZE;

    // Background
    ctx.fillStyle = '#080C18';
    ctx.fillRect(0, 0, W, H);

    // Subtle grid
    ctx.strokeStyle = 'rgba(255,255,255,0.025)';
    ctx.lineWidth = 0.5;
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath(); ctx.moveTo(0, r * CELL_SIZE); ctx.lineTo(W, r * CELL_SIZE); ctx.stroke();
    }
    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath(); ctx.moveTo(c * CELL_SIZE, 0); ctx.lineTo(c * CELL_SIZE, H); ctx.stroke();
    }

    // Obstacles — styled like walls/rocks
    obsRef.current.forEach(key => {
      const [r, c] = key.split(',').map(Number);
      const x = c * CELL_SIZE, y = r * CELL_SIZE;
      // Outer block
      ctx.fillStyle = '#1A1E2E';
      roundRect(ctx, x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2, 3);
      ctx.fill();
      // Inner bevel highlight
      ctx.fillStyle = '#232740';
      ctx.fillRect(x + 3, y + 3, CELL_SIZE - 8, CELL_SIZE - 8);
      // Top shine
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      ctx.fillRect(x + 3, y + 3, CELL_SIZE - 8, 3);
    });

    // Path preview dots
    if (pathRef.current.length > 0) {
      let [r, c] = snakeRef.current[0];
      pathRef.current.forEach(([dr, dc], idx) => {
        r += dr; c += dc;
        const alpha = Math.max(0.05, 0.25 - idx * 0.012);
        ctx.fillStyle = `rgba(0,180,255,${alpha})`;
        ctx.beginPath();
        ctx.arc(c * CELL_SIZE + CELL_SIZE / 2, r * CELL_SIZE + CELL_SIZE / 2, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Snake body — gradient from tail to neck
    const snake = snakeRef.current;
    for (let i = snake.length - 1; i >= 1; i--) {
      const [r, c] = snake[i];
      const t = i / snake.length;
      // Gradient: tail is dark, neck is bright
      const g = Math.floor(180 - t * 80);
      const b = Math.floor(60 + t * 20);
      ctx.fillStyle = `rgb(0,${g},${b})`;
      roundRect(ctx, c * CELL_SIZE + 1, r * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2, 3);
      ctx.fill();
      // Segment highlight
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(c * CELL_SIZE + 3, r * CELL_SIZE + 2, CELL_SIZE - 6, 3);
    }

    // Snake head — glowing
    if (snake.length > 0) {
      const [r, c] = snake[0];
      // Glow halo
      ctx.shadowBlur = 20; ctx.shadowColor = '#00FF88';
      ctx.fillStyle = '#00FF88';
      roundRect(ctx, c * CELL_SIZE + 1, r * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2, 5);
      ctx.fill();
      ctx.shadowBlur = 0;
      // Eyes
      ctx.fillStyle = '#0A0E1A';
      ctx.beginPath(); ctx.arc(c * CELL_SIZE + 7,  r * CELL_SIZE + 7,  2.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(c * CELL_SIZE + 13, r * CELL_SIZE + 7,  2.5, 0, Math.PI * 2); ctx.fill();
      // Eye shine
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.beginPath(); ctx.arc(c * CELL_SIZE + 8,  r * CELL_SIZE + 6,  1, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(c * CELL_SIZE + 14, r * CELL_SIZE + 6,  1, 0, Math.PI * 2); ctx.fill();
    }

    // Food — pulsing glowing apple
    const [fr, fc] = foodRef.current;
    const t = Date.now();
    const pulse = (Math.sin(t / 250) + 1) / 2;
    const glow = 20 + pulse * 15;
    ctx.shadowBlur = glow; ctx.shadowColor = '#FF4757';
    // Outer glow ring
    ctx.fillStyle = `rgba(255,71,87,${0.12 + pulse * 0.08})`;
    ctx.beginPath();
    ctx.arc(fc * CELL_SIZE + CELL_SIZE / 2, fr * CELL_SIZE + CELL_SIZE / 2, CELL_SIZE / 2 + 1 + pulse * 2, 0, Math.PI * 2);
    ctx.fill();
    // Apple body
    ctx.fillStyle = `rgb(255,${50 + Math.floor(pulse * 50)},60)`;
    ctx.beginPath();
    ctx.arc(fc * CELL_SIZE + CELL_SIZE / 2, fr * CELL_SIZE + CELL_SIZE / 2, CELL_SIZE / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    // Apple shine
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.arc(fc * CELL_SIZE + CELL_SIZE / 2 - 2, fr * CELL_SIZE + CELL_SIZE / 2 - 2, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Particles
    particlesRef.current = particlesRef.current.filter(p => p.life > 0);
    particlesRef.current.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.04;
      p.vx *= 0.92;
      p.vy *= 0.92;
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 6;
      ctx.shadowColor = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });
    ctx.globalAlpha = 1;
  }, [canvasRef]);

  const startRenderLoop = useCallback(() => {
    const loop = () => { render(); rafRef.current = requestAnimationFrame(loop); };
    rafRef.current = requestAnimationFrame(loop);
  }, [render]);

  const stopRenderLoop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  const endGame = useCallback(() => {
    goRef.current = true;
    setGameOver(true);
    setIsRunning(false);
    clearInterval(gameIntRef.current);
    clearInterval(timerIntRef.current);
  }, []);

  // ── Compute path via Python API ──────────────────────────
  const computePath = useCallback(async () => {
    const snake = snakeRef.current;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch(`${API_BASE}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          head: snake[0],
          food: foodRef.current,
          snake_body: snake,
          obstacles: Array.from(obsRef.current).map(k => k.split(',').map(Number)),
          algorithm: algoRef.current,
          rows: ROWS,
          cols: COLS,
        }),
      });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      return data.path || [];
    } catch (err) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        console.warn('⏱ AI path request timed out — ending game');
      } else {
        console.error('❌ Python API Error:', err.message);
      }
      return [];
    }
  }, []);

  // ── Game Step ────────────────────────────────────────────
  const step = useCallback(async () => {
    if (goRef.current || fetchRef.current) return;

    const snake = snakeRef.current;

    if (pathRef.current.length === 0) {
      fetchRef.current = true;
      setIsFetching(true);
      pathRef.current = await computePath();
      fetchRef.current = false;
      setIsFetching(false);
      if (goRef.current) return;
    }

    // No path found → snake is trapped → end game
    if (pathRef.current.length === 0) { endGame(); return; }

    const [dr, dc] = pathRef.current.shift();
    const nh = [snake[0][0] + dr, snake[0][1] + dc];
    const nhk = `${nh[0]},${nh[1]}`;

    if (
      nh[0] < 0 || nh[0] >= ROWS || nh[1] < 0 || nh[1] >= COLS ||
      obsRef.current.has(nhk) ||
      snake.slice(1).some(b => b[0] === nh[0] && b[1] === nh[1])
    ) { endGame(); return; }

    snake.unshift(nh);
    if (nh[0] === foodRef.current[0] && nh[1] === foodRef.current[1]) {
      scoreRef.current++;
      setScore(scoreRef.current);
      setFoodsEaten(fe => fe + 1);
      addParticles(nh[0], nh[1]);
      foodRef.current = generateFood(snake, obsRef.current, ROWS, COLS);
      pathRef.current = [];
    } else {
      snake.pop();
    }
  }, [computePath, endGame, addParticles]);

  // ── Start Game ───────────────────────────────────────────
  const startGame = useCallback((s) => {
    clearInterval(gameIntRef.current);
    clearInterval(timerIntRef.current);
    stopRenderLoop();
    fetchRef.current = false;
    particlesRef.current = [];

    const start = [Math.floor(ROWS / 2), Math.floor(COLS / 2)];
    snakeRef.current  = [start];
    obsRef.current    = generateObstacles(s.level, start, ROWS, COLS);
    foodRef.current   = generateFood([start], obsRef.current, ROWS, COLS);
    pathRef.current   = [];
    scoreRef.current  = 0;
    tlRef.current     = s.gameDuration;
    goRef.current     = false;
    algoRef.current   = s.algorithm;

    setCurSettings(s);
    setScore(0);
    setFoodsEaten(0);
    setTimeLeft(s.gameDuration);
    setGameOver(false);
    setIsRunning(true);
    setIsFetching(false);

    startRenderLoop();
    gameIntRef.current  = setInterval(step, s.speed);
    timerIntRef.current = setInterval(() => {
      tlRef.current--;
      setTimeLeft(tlRef.current);
      if (tlRef.current <= 0) endGame();
    }, 1000);
  }, [step, startRenderLoop, stopRenderLoop, endGame]);

  useEffect(() => () => {
    clearInterval(gameIntRef.current);
    clearInterval(timerIntRef.current);
    stopRenderLoop();
  }, [stopRenderLoop]);

  return { score, timeLeft, gameOver, isRunning, isFetching, foodsEaten, curSettings, startGame };
}
