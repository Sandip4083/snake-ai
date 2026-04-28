import { useState, useRef, useCallback, useEffect } from 'react';
import { ROWS, COLS, CELL_SIZE, generateObstacles, generateFood } from '../utils/gameUtils.js';

const PYTHON_API = import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:8000';

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
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameOver, setGameOver] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [curSettings, setCurSettings] = useState({
    algorithm: 'bfs', level: 'level0', gameDuration: 30, speed: 130,
  });

  const snakeRef   = useRef([[12, 12]]);
  const foodRef    = useRef([5, 5]);
  const obsRef     = useRef(new Set());
  const pathRef    = useRef([]);
  const scoreRef   = useRef(0);
  const tlRef      = useRef(30);
  const goRef      = useRef(false);
  const algoRef    = useRef('bfs');
  const fetchRef   = useRef(false);

  const gameIntRef  = useRef(null);
  const timerIntRef = useRef(null);
  const rafRef      = useRef(null);

  // ── Render ──────────────────────────────────────────────
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = COLS * CELL_SIZE, H = ROWS * CELL_SIZE;

    ctx.fillStyle = '#0A0E1A';
    ctx.fillRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
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
      ctx.fillStyle = '#1E2230';
      roundRect(ctx, c * CELL_SIZE + 1, r * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2, 3);
      ctx.fill();
      ctx.fillStyle = '#252840';
      ctx.fillRect(c * CELL_SIZE + 5, r * CELL_SIZE + 5, CELL_SIZE - 10, CELL_SIZE - 10);
    });

    // Path preview
    if (pathRef.current.length > 0) {
      let [r, c] = snakeRef.current[0];
      for (const [dr, dc] of pathRef.current) {
        r += dr; c += dc;
        ctx.fillStyle = 'rgba(0,150,255,0.15)';
        ctx.beginPath();
        ctx.arc(c * CELL_SIZE + CELL_SIZE / 2, r * CELL_SIZE + CELL_SIZE / 2, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Snake body
    const snake = snakeRef.current;
    for (let i = snake.length - 1; i >= 1; i--) {
      const [r, c] = snake[i];
      const t = i / snake.length;
      ctx.fillStyle = `rgb(0,${Math.floor(160 - t * 60)},60)`;
      roundRect(ctx, c * CELL_SIZE + 1, r * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2, 3);
      ctx.fill();
    }

    // Snake head
    if (snake.length > 0) {
      const [r, c] = snake[0];
      ctx.shadowBlur = 15; ctx.shadowColor = '#00FF88';
      ctx.fillStyle = '#00FF88';
      roundRect(ctx, c * CELL_SIZE + 1, r * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2, 4);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#0A0E1A';
      ctx.beginPath(); ctx.arc(c * CELL_SIZE + 6,  r * CELL_SIZE + 7, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(c * CELL_SIZE + 14, r * CELL_SIZE + 7, 2, 0, Math.PI * 2); ctx.fill();
    }

    // Food (pulsing)
    const [fr, fc] = foodRef.current;
    const pulse = (Math.sin(Date.now() / 250) + 1) / 2;
    ctx.shadowBlur = 15 + pulse * 8; ctx.shadowColor = '#FF4757';
    ctx.fillStyle = `rgb(255,${55 + Math.floor(pulse * 40)},${55 + Math.floor(pulse * 40)})`;
    ctx.beginPath();
    ctx.arc(fc * CELL_SIZE + CELL_SIZE / 2, fr * CELL_SIZE + CELL_SIZE / 2, CELL_SIZE / 2 - 2 + pulse * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
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
    try {
      const res = await fetch(`${PYTHON_API}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      return data.path || [];
    } catch (err) {
      console.error('Python API error:', err);
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
      // Game may have ended (timer) while fetch was in-flight — bail out
      if (goRef.current) return;
    }

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
      foodRef.current = generateFood(snake, obsRef.current, ROWS, COLS);
      pathRef.current = [];
    } else {
      snake.pop();
    }
  }, [computePath, endGame]);

  // ── Start Game ───────────────────────────────────────────
  const startGame = useCallback((s) => {
    clearInterval(gameIntRef.current);
    clearInterval(timerIntRef.current);
    stopRenderLoop();
    fetchRef.current = false;

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

  return { score, timeLeft, gameOver, isRunning, isFetching, curSettings, startGame };
}
