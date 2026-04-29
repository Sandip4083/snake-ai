import { useRef, useState } from 'react';
import { useGameLoop } from './hooks/useGameLoop.js';
import { Sidebar } from './components/Sidebar.jsx';
import { HUD } from './components/HUD.jsx';
import { GameOver } from './components/GameOver.jsx';
import { Leaderboard } from './components/Leaderboard.jsx';

export default function App() {
  const canvasRef = useRef(null);
  const { score, timeLeft, gameOver, isRunning, isFetching, foodsEaten, curSettings, startGame } = useGameLoop(canvasRef);
  const [lbKey, setLbKey] = useState(0);

  const handleScoreSubmit = async (name) => {
    try {
      const res = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, score, algorithm: curSettings.algorithm, level: curSettings.level }),
      });
      if (res.ok) setLbKey(k => k + 1);
    } catch (e) {
      console.error('Score save failed:', e);
    }
  };

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="app-header">
        <div className="app-logo">
          <span className="logo-snake">🐍</span>
          <div>
            <h1 className="app-title">AI Snake Game</h1>
            <p className="app-sub">7 Algorithms · Python FastAPI · Real-time Pathfinding</p>
          </div>
        </div>
        <div className="app-header-right">
          <span className="badge badge-green">● Live</span>
          <a href="https://github.com/Sandip4083/snake-ai" target="_blank" rel="noreferrer" className="badge badge-ghost">⭐ GitHub</a>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="app-main">
        {/* Left panel */}
        <aside className="left-panel">
          <Sidebar onStart={startGame} isRunning={isRunning} />
          <HUD
            score={score}
            timeLeft={timeLeft}
            curSettings={curSettings}
            isFetching={isFetching}
            foodsEaten={foodsEaten}
          />
        </aside>

        {/* Canvas */}
        <div className="canvas-area">
          {/* Status bar above canvas */}
          <div className="canvas-status-bar">
            {isRunning && (
              <>
                <span className="status-dot status-dot--green" />
                <span className="status-text">
                  {isFetching ? '🤖 AI Computing Path…' : '▶ Running'}
                </span>
              </>
            )}
            {!isRunning && !gameOver && (
              <>
                <span className="status-dot status-dot--muted" />
                <span className="status-text">Waiting to start</span>
              </>
            )}
            {gameOver && (
              <>
                <span className="status-dot status-dot--red" />
                <span className="status-text">Game Over — Score: {score}</span>
              </>
            )}
            <span className="status-algo" style={{ marginLeft: 'auto' }}>
              {isRunning || gameOver ? `${curSettings.algorithm?.toUpperCase()} · Lv ${curSettings.level?.replace('level','')}` : ''}
            </span>
          </div>

          <canvas ref={canvasRef} width={500} height={500} className="game-canvas" />

          {/* Idle overlay */}
          {!isRunning && !gameOver && (
            <div className="canvas-overlay">
              <span className="overlay-snake">🐍</span>
              <h2 className="overlay-title">AI Snake</h2>
              <p className="overlay-hint">Pick an algorithm & press <strong>Start Game</strong></p>
              <div className="overlay-tips">
                <div className="tip-row">
                  <span className="tip-badge">🔵 BFS</span>
                  <span className="tip-text">Shortest path, always safe</span>
                </div>
                <div className="tip-row">
                  <span className="tip-badge">⭐ A*</span>
                  <span className="tip-text">Heuristic — fastest optimal</span>
                </div>
                <div className="tip-row">
                  <span className="tip-badge">🎲 Random</span>
                  <span className="tip-text">Chaotic fun with BFS safety net</span>
                </div>
                <div className="tip-row">
                  <span className="tip-badge">🔴 DFS</span>
                  <span className="tip-text">Deep dives, capped at 300 steps</span>
                </div>
              </div>
            </div>
          )}

          {/* Game Over overlay */}
          {gameOver && (
            <GameOver
              score={score}
              algorithm={curSettings.algorithm}
              level={curSettings.level}
              onSubmit={handleScoreSubmit}
              onRestart={() => startGame(curSettings)}
            />
          )}
        </div>
      </main>

      {/* ── Leaderboard ── */}
      <Leaderboard refreshKey={lbKey} />

      {/* ── Footer ── */}
      <footer className="app-footer">
        <span>🐍 Python FastAPI · ⚛️ React · 🍃 MongoDB · ▲ Vercel</span>
        <span className="footer-sep">·</span>
        <span>Built by <strong>Sandip Kumar Sah</strong></span>
      </footer>
    </div>
  );
}
