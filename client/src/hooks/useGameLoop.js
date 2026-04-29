import { useState, useRef, useCallback, useEffect } from 'react';
import { ROWS, COLS, CELL_SIZE, generateObstacles, generateFood } from '../utils/gameUtils.js';

const API_BASE = '/api';
const FETCH_TIMEOUT_MS = 7000; // 7 second timeout per request

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

  // Game state refs (avoid stale closures)
  const snakeRef      = useRef([[12, 12]]);
  const foodRef       = useRef([5, 5]);
  const obsRef        = useRef(new Set());
  const pathRef       = useRef([]);          // current path being executed
  const nextPathRef   = useRef(null);        // pre-fetched next path (lookahead)
  const scoreRef      = useRef(0);
  const tlRef         = useRef(30);
  const goRef         = useRef(false);
  const algoRef       = useRef('bfs');
  const fetchRef      = useRef(false);       // is a fetch in-flight?
  const particlesRef  = useRef([]);

  const gameIntRef  = useRef(null);
  const timerIntRef = useRef(null);
  const rafRef      = useRef(null);

  // ── Particles ──────────────────────────────────────────
  const addParticles = useCallback((r, c) => {
    const colors = ['#00FF88', '#FFD700', '#FF6B6B', '#4ECDC4', '#FFD93D', '#A29BFE'];
    for (let i = 0; i < 10; i++) {
      const angle = (Math.PI * 2 * i) / 10 + Math.random() * 0.3;
      const speed = 2 + Math.random() * 3;
      particlesRef.current.push({
        x: c * CELL_SIZE + CELL_SIZE / 2,
        y: r * CELL_SIZE + CELL_SIZE / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 3 + 2,
      });
    }
  }, []);

  // ── Render ──────────────────────────────────────────────
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = COLS * CELL_SIZE, H = ROWS * CELL_SIZE;

    ctx.fillStyle = '#080C18';
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.025)';
    ctx.lineWidth = 0.5;
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath(); ctx.moveTo(0, r * CELL_SIZE); ctx.lineTo(W, r * CELL_SIZE); ctx.stroke();
    }
    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath(); ctx.moveTo(c * CELL_SIZE, 0); ctx.lineTo(c * CELL_SIZE, H); ctx.stroke();
    }

    // Obstacles
    obsRef.current.forEach(key => {
      const [r, c] = key.split(',').map(Number);
      const x = c * CELL_SIZE, y = r * CELL_SIZE;
      ctx.fillStyle = '#1A1E2E';
      roundRect(ctx, x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2, 3);
      ctx.fill();
      ctx.fillStyle = '#232740';
      ctx.fillRect(x + 4, y + 4, CELL_SIZE - 8, CELL_SIZE - 8);
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      ctx.fillRect(x + 4, y + 4, CELL_SIZE - 8, 2);
    });

    // Path preview (current + next/lookahead)
    const displayPath = pathRef.current.length > 0 ? pathRef.current
                      : nextPathRef.current ?? [];
    if (displayPath.length > 0) {
      let [r, c] = snakeRef.current[0];
      displayPath.forEach(([dr, dc], idx) => {
        r += dr; c += dc;
        const alpha = Math.max(0.04, 0.22 - idx * 0.01);
        ctx.fillStyle = `rgba(0,180,255,${alpha})`;
        ctx.beginPath();
        ctx.arc(c * CELL_SIZE + CELL_SIZE / 2, r * CELL_SIZE + CELL_SIZE / 2, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Snake body
    const snake = snakeRef.current;
    for (let i = snake.length - 1; i >= 1; i--) {
      const [r, c] = snake[i];
      const t = i / snake.length;
      const g = Math.floor(175 - t * 75);
      const b = Math.floor(55 + t * 25);
      ctx.fillStyle = `rgb(0,${g},${b})`;
      roundRect(ctx, c * CELL_SIZE + 1, r * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2, 3);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.fillRect(c * CELL_SIZE + 3, r * CELL_SIZE + 2, CELL_SIZE - 6, 3);
    }

    // Snake head
    if (snake.length > 0) {
      const [r, c] = snake[0];
      ctx.shadowBlur = 18; ctx.shadowColor = '#00FF88';
      ctx.fillStyle = '#00FF88';
      roundRect(ctx, c * CELL_SIZE + 1, r * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2, 5);
      ctx.fill();
      ctx.shadowBlur = 0;
      // Eyes
      ctx.fillStyle = '#060A10';
      ctx.beginPath(); ctx.arc(c * CELL_SIZE + 7,  r * CELL_SIZE + 7,  2.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(c * CELL_SIZE + 13, r * CELL_SIZE + 7,  2.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath(); ctx.arc(c * CELL_SIZE + 8,  r * CELL_SIZE + 6,  1, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(c * CELL_SIZE + 14, r * CELL_SIZE + 6,  1, 0, Math.PI * 2); ctx.fill();
    }

    // Food — pulsing
    const [fr, fc] = foodRef.current;
    const pulse = (Math.sin(Date.now() / 220) + 1) / 2;
    ctx.shadowBlur = 18 + pulse * 12; ctx.shadowColor = '#FF4757';
    ctx.fillStyle = `rgba(255,71,87,${0.1 + pulse * 0.1})`;
    ctx.beginPath();
    ctx.arc(fc * CELL_SIZE + CELL_SIZE / 2, fr * CELL_SIZE + CELL_SIZE / 2, CELL_SIZE / 2 + 2 + pulse * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgb(255,${45 + Math.floor(pulse * 55)},55)`;
    ctx.beginPath();
    ctx.arc(fc * CELL_SIZE + CELL_SIZE / 2, fr * CELL_SIZE + CELL_SIZE / 2, CELL_SIZE / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.arc(fc * CELL_SIZE + CELL_SIZE / 2 - 2, fr * CELL_SIZE + CELL_SIZE / 2 - 3, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Particles
    particlesRef.current = particlesRef.current.filter(p => p.life > 0);
    particlesRef.current.forEach(p => {
      p.x  += p.vx;
      p.y  += p.vy;
      p.vx *= 0.9;
      p.vy *= 0.9;
      p.life -= 0.035;
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.shadowBlur = 8;
      ctx.shadowColor = p.color;
      ctx.fillStyle = p.color;
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

  // ── Fetch path from Python API ────────────────────────────
  const fetchPath = useCallback(async (snakeSnapshot, foodPos) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(`${API_BASE}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          head:       snakeSnapshot[0],
          food:       foodPos,
          snake_body: snakeSnapshot,
          obstacles:  Array.from(obsRef.current).map(k => k.split(',').map(Number)),
          algorithm:  algoRef.current,
          rows: ROWS,
          cols: COLS,
        }),
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      return data.path || [];
    } catch (err) {
      clearTimeout(timer);
      if (err.name !== 'AbortError') {
        console.error('❌ API error:', err.message);
      }
      return null; // null = definitive failure (not "empty path")
    }
  }, []);

  // ── Background pre-fetch (lookahead) ──────────────────────
  // Called as soon as we start executing a new path segment,
  // so the next path is READY before the current one runs out.
  const prefetch = useCallback(async () => {
    if (fetchRef.current || goRef.current) return;
    fetchRef.current = true;
    setIsFetching(true);

    // Snapshot state at the time of request
    const snakeSnap = snakeRef.current.map(s => [...s]);
    const foodPos   = [...foodRef.current];

    const result = await fetchPath(snakeSnap, foodPos);

    fetchRef.current = false;
    setIsFetching(false);

    if (goRef.current) return; // game ended during fetch

    if (result === null) {
      // Network/server failure — end gracefully
      endGame();
      return;
    }

    // Store as next path (may be [] if algorithm found no path)
    nextPathRef.current = result;
  }, [fetchPath, endGame]);

  // ── Game Step ─────────────────────────────────────────────
  const step = useCallback(async () => {
    if (goRef.current) return;

    const snake = snakeRef.current;

    // ── Case 1: Current path still has steps — just move ──
    if (pathRef.current.length > 0) {
      // While we still have path, kick off pre-fetch when path gets short
      // so it's ready before we run out (lookahead trigger at ≤ 3 steps)
      if (pathRef.current.length <= 3 && nextPathRef.current === null && !fetchRef.current) {
        prefetch();
      }

      const [dr, dc] = pathRef.current.shift();
      const nh  = [snake[0][0] + dr, snake[0][1] + dc];
      const nhk = `${nh[0]},${nh[1]}`;

      if (
        nh[0] < 0 || nh[0] >= ROWS || nh[1] < 0 || nh[1] >= COLS ||
        obsRef.current.has(nhk) ||
        snake.slice(1).some(b => b[0] === nh[0] && b[1] === nh[1])
      ) { endGame(); return; }

      snake.unshift(nh);
      if (nh[0] === foodRef.current[0] && nh[1] === foodRef.current[1]) {
        // Ate food!
        scoreRef.current++;
        setScore(scoreRef.current);
        setFoodsEaten(fe => fe + 1);
        addParticles(nh[0], nh[1]);
        foodRef.current  = generateFood(snake, obsRef.current, ROWS, COLS);
        pathRef.current  = [];         // need a fresh path to new food
        nextPathRef.current = null;    // discard lookahead (food moved)
        // Start fetching immediately for new food target
        prefetch();
      } else {
        snake.pop();
      }
      return;
    }

    // ── Case 2: Path exhausted — try to use pre-fetched path ──
    if (nextPathRef.current !== null) {
      const next = nextPathRef.current;
      nextPathRef.current = null;

      if (next.length === 0) {
        // Algorithm says trapped — end game
        endGame();
        return;
      }

      pathRef.current = next;
      // Immediately trigger next prefetch
      prefetch();
      return; // step will fire again on next interval tick
    }

    // ── Case 3: No path and no pre-fetch result yet — wait ──
    // (fetchRef is true, fetch is in-flight — snake pauses ONE tick max)
    // This is now a rare edge case since we pre-fetch early
    if (fetchRef.current) return;

    // ── Case 4: Nothing — trigger a fresh fetch ──
    prefetch();
  }, [prefetch, endGame, addParticles]);

  // ── Start Game ────────────────────────────────────────────
  const startGame = useCallback((s) => {
    clearInterval(gameIntRef.current);
    clearInterval(timerIntRef.current);
    stopRenderLoop();
    fetchRef.current  = false;
    particlesRef.current = [];

    const start = [Math.floor(ROWS / 2), Math.floor(COLS / 2)];
    snakeRef.current    = [start];
    obsRef.current      = generateObstacles(s.level, start, ROWS, COLS);
    foodRef.current     = generateFood([start], obsRef.current, ROWS, COLS);
    pathRef.current     = [];
    nextPathRef.current = null;
    scoreRef.current    = 0;
    tlRef.current       = s.gameDuration;
    goRef.current       = false;
    algoRef.current     = s.algorithm;

    setCurSettings(s);
    setScore(0);
    setFoodsEaten(0);
    setTimeLeft(s.gameDuration);
    setGameOver(false);
    setIsRunning(true);
    setIsFetching(false);

    startRenderLoop();

    // Kick off initial path fetch immediately
    setTimeout(() => {
      if (!goRef.current) prefetch();
    }, 50);

    gameIntRef.current = setInterval(step, s.speed);
    timerIntRef.current = setInterval(() => {
      tlRef.current--;
      setTimeLeft(tlRef.current);
      if (tlRef.current <= 0) endGame();
    }, 1000);
  }, [step, startRenderLoop, stopRenderLoop, endGame, prefetch]);

  useEffect(() => () => {
    clearInterval(gameIntRef.current);
    clearInterval(timerIntRef.current);
    stopRenderLoop();
  }, [stopRenderLoop]);

  return { score, timeLeft, gameOver, isRunning, isFetching, foodsEaten, curSettings, startGame };
}
