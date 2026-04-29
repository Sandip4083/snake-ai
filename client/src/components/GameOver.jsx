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
        {/* Header */}
        <div className="go-skull">💀</div>
        <h2 className="go-title">Game Over</h2>

        {/* Score spotlight */}
        <div className="go-score-ring">
          <div className="go-score">{score}</div>
          <div className="go-score-label">FINAL SCORE</div>
        </div>

        {/* Meta */}
        <div className="go-meta">
          <span className="go-meta-badge" style={{ color: info.color, borderColor: `${info.color}44` }}>
            {info.emoji} {info.name}
          </span>
          <span className="go-meta-badge go-meta-level">
            📍 {level?.replace('level', 'Level ')}
          </span>
        </div>

        {/* Score form */}
        {!submitted ? (
          <div className="go-form">
            <input
              className="go-input"
              placeholder="Enter your name…"
              value={name}
              maxLength={20}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              autoFocus
            />
            <button className="go-save-btn" onClick={handleSubmit} disabled={loading || !name.trim()}>
              {loading ? '⏳ Saving…' : '🏆 Save to Leaderboard'}
            </button>
          </div>
        ) : (
          <p className="go-saved">✅ Score saved!</p>
        )}

        <button className="go-restart-btn" onClick={onRestart}>▶ Play Again</button>
      </div>
    </div>
  );
}
