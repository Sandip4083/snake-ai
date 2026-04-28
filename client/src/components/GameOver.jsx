import { useState } from 'react';
import { ALGORITHM_INFO } from '../utils/gameUtils.js';

export function GameOver({ score, algorithm, level, onSubmit, onRestart }) {
  const [name,      setName]      = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading,   setLoading]   = useState(false);

  const info = ALGORITHM_INFO[algorithm] || {};

  const handleSubmit = async () => {
    if (!name.trim() || loading) return;
    setLoading(true);
    await onSubmit(name.trim());
    setSubmitted(true);
    setLoading(false);
  };

  return (
    <div className="gameover-overlay">
      <div className="gameover-card">
        <div className="go-emoji">💀</div>
        <h2 className="go-title">Game Over</h2>

        <div className="go-score">{score}</div>
        <p className="go-score-label">Final Score</p>

        <p className="go-meta">
          <span style={{ color: info.color }}>{info.name}</span> &nbsp;·&nbsp; {level}
        </p>

        {!submitted ? (
          <div className="go-form">
            <input
              className="go-input"
              placeholder="Your name for leaderboard…"
              value={name}
              maxLength={20}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
            <button className="go-save-btn" onClick={handleSubmit} disabled={loading || !name.trim()}>
              {loading ? '⏳ Saving…' : '🏆 Save Score'}
            </button>
          </div>
        ) : (
          <p className="go-saved">✅ Score saved to leaderboard!</p>
        )}

        <button className="go-restart-btn" onClick={onRestart}>▶ Play Again</button>
      </div>
    </div>
  );
}
