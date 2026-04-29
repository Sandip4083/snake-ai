import { useRef, useState } from 'react';
import { useGameLoop } from './hooks/useGameLoop.js';
import { Sidebar } from './components/Sidebar.jsx';
import { HUD } from './components/HUD.jsx';
import { GameOver } from './components/GameOver.jsx';
import { Leaderboard } from './components/Leaderboard.jsx';

export default function App() {
  const canvasRef = useRef(null);
  const {
    score, timeLeft, gameOver, isRunning,
    isFetching, foodsEaten, curSettings, startGame
  } = useGameLoop(canvasRef);
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

  const algoName = curSettings.algorithm?.toUpperCase();
  const lvlName  = curSettings.level?.replace('level', 'Lv ');

  return (
    <div className="page-shell">

      {/* ── Fixed game viewport ── */}
      <div className="app">

        {/* ── Header ── */}
        <header className="app-header">
          <div className="app-logo">
            <span className="logo-snake">🐍</span>
            <div>
              <h1 className="app-title">AI Snake Game</h1>
              <p className="app-sub">7 Algorithms · Pure JS Pathfinding</p>
            </div>
          </div>
          <div className="app-header-right">
            <span className="badge badge-green">● Live</span>
            <a href="https://github.com/Sandip4083/snake-ai" target="_blank" rel="noreferrer" className="badge badge-ghost">⭐ GitHub</a>
          </div>
        </header>

        {/* ── Main row ── */}
        <div className="main-row">

          {/* Left sidebar — scrollable */}
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

          {/* Right: canvas column */}
          <div className="canvas-col">
            {/* Status bar */}
            <div className="canvas-status-bar">
              {isRunning && (
                <>
                  <span className="status-dot status-dot--green" />
                  <span className="status-text">
                    {isFetching ? '🤖 AI Computing…' : '▶ Running'}
                  </span>
                </>
              )}
              {!isRunning && !gameOver && (
                <>
                  <span className="status-dot status-dot--muted" />
                  <span className="status-text">Ready to start</span>
                </>
              )}
              {gameOver && (
                <>
                  <span className="status-dot status-dot--red" />
                  <span className="status-text">Game Over — Score: {score}</span>
                </>
              )}
              {(isRunning || gameOver) && (
                <span className="status-algo">{algoName} · {lvlName}</span>
              )}
            </div>

            {/* Canvas wrapper */}
            <div className="canvas-wrap">
              <canvas ref={canvasRef} width={500} height={500} className="game-canvas" />

              {!isRunning && !gameOver && (
                <div className="canvas-overlay">
                  <span className="overlay-snake">🐍</span>
                  <h2 className="overlay-title">AI Snake</h2>
                  <p className="overlay-hint">Pick an algorithm &amp; press <strong>Start Game</strong></p>
                  <div className="overlay-tips">
                    <div className="tip-row"><span className="tip-badge">🔵 BFS</span><span className="tip-text">Shortest path, always safe</span></div>
                    <div className="tip-row"><span className="tip-badge">⭐ A*</span><span className="tip-text">Heuristic — fastest optimal</span></div>
                    <div className="tip-row"><span className="tip-badge">🎲 Random</span><span className="tip-text">Chaos with BFS safety net</span></div>
                    <div className="tip-row"><span className="tip-badge">🔷 IDS</span><span className="tip-text">Memory efficient deepening</span></div>
                  </div>
                </div>
              )}

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
          </div>
        </div>

      </div>{/* end .app */}

      {/* ── Scrollable area below the game ── */}
      <div className="below-game">
        <Leaderboard refreshKey={lbKey} />

        <footer className="app-footer">
          <span>🐍 Pure JS · ⚛️ React · 🍃 MongoDB · ▲ Vercel</span>
          <span className="footer-sep">·</span>
          <span>Built by <strong>Sandip Kumar Sah</strong></span>
        </footer>
      </div>

    </div>
  );
}
