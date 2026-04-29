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
      await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, score, algorithm: curSettings.algorithm, level: curSettings.level }),
      });
      setLbKey(k => k + 1);
    } catch (e) {
      console.error('Score save failed:', e);
    }
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="app-logo">
          <span className="logo-snake">🐍</span>
          <div>
            <h1 className="app-title">AI Snake Game</h1>
            <p className="app-sub">7 Algorithms · Python FastAPI · Real-time Pathfinding</p>
          </div>
        </div>
        <div className="app-header-badges">
          <span className="badge badge-green">● Live</span>
          <a href="https://github.com/Sandip4083/snake-ai" target="_blank" rel="noreferrer" className="badge badge-ghost">GitHub</a>
        </div>
      </header>

      {/* Main */}
      <main className="app-main">
        {/* Left panel */}
        <div className="left-panel">
          <Sidebar onStart={startGame} isRunning={isRunning} />
          <HUD score={score} timeLeft={timeLeft} curSettings={curSettings} isFetching={isFetching} foodsEaten={foodsEaten} />
        </div>

        {/* Canvas */}
        <div className="canvas-area">
          <canvas ref={canvasRef} width={500} height={500} className="game-canvas" />

          {!isRunning && !gameOver && (
            <div className="canvas-overlay">
              <span className="overlay-snake">🐍</span>
              <h2 className="overlay-title">AI Snake</h2>
              <p className="overlay-hint">Select an algorithm & press <strong>Start Game</strong></p>
              <div className="overlay-tips">
                <span className="tip-badge">🔵 BFS = Shortest path</span>
                <span className="tip-badge">⭐ A* = Fastest optimal</span>
                <span className="tip-badge">🎲 Random = Chaos mode</span>
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
      </main>

      {/* Leaderboard */}
      <Leaderboard refreshKey={lbKey} />

      {/* Footer */}
      <footer className="app-footer">
        <p>Built with 🐍 Python FastAPI · ⚛️ React · 🍃 MongoDB · ▲ Vercel</p>
        <p className="footer-author">By <strong>Sandip Kumar Sah</strong></p>
      </footer>
    </div>
  );
}
