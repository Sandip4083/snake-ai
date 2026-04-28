import { useRef, useState } from 'react';
import { useGameLoop } from './hooks/useGameLoop.js';
import { Sidebar } from './components/Sidebar.jsx';
import { HUD } from './components/HUD.jsx';
import { GameOver } from './components/GameOver.jsx';
import { Leaderboard } from './components/Leaderboard.jsx';

export default function App() {
  const canvasRef = useRef(null);
  const { score, timeLeft, gameOver, isRunning, isFetching, curSettings, startGame } = useGameLoop(canvasRef);
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
      <header className="app-header">
        <h1 className="app-title">🐍 AI Snake Game</h1>
        <p className="app-sub">7 AI algorithms compete in real-time · Python FastAPI + React</p>
      </header>

      <main className="app-main">
        {/* Left Panel */}
        <div className="left-panel">
          <Sidebar onStart={startGame} isRunning={isRunning} />
          <HUD
            score={score}
            timeLeft={timeLeft}
            curSettings={curSettings}
            isFetching={isFetching}
          />
        </div>

        {/* Canvas Area */}
        <div className="canvas-area">
          <canvas
            ref={canvasRef}
            width={500}
            height={500}
            className="game-canvas"
          />

          {!isRunning && !gameOver && (
            <div className="canvas-overlay">
              <span className="overlay-icon">🐍</span>
              <p>Configure settings &amp; press <strong>Start Game</strong></p>
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

      <Leaderboard refreshKey={lbKey} />
    </div>
  );
}
