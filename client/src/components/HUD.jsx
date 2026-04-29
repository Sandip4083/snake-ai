import { ALGORITHM_INFO, LEVEL_INFO } from '../utils/gameUtils.js';

const LEVEL_LABELS = Object.fromEntries(Object.entries(LEVEL_INFO).map(([k, v]) => [k, v.label]));

export function HUD({ score, timeLeft, curSettings, isFetching, foodsEaten }) {
  const total     = curSettings.gameDuration || 30;
  const pct       = Math.max(0, (timeLeft / total) * 100);
  const info      = ALGORITHM_INFO[curSettings.algorithm] || {};
  const timerColor = timeLeft <= 10 ? '#FF4757' : timeLeft <= 20 ? '#FFD93D' : '#00FF88';
  const urgency    = timeLeft <= 10;

  return (
    <div className="card hud-card">
      <h3 className="card-title">📊 Live Stats</h3>

      <div className="stat-row">
        <span className="stat-label">Score</span>
        <span className="stat-val" style={{ color: '#00FF88' }}>{score}</span>
      </div>

      <div className="stat-row">
        <span className="stat-label">Apples Eaten</span>
        <span className="stat-val" style={{ color: '#FF9F43' }}>🍎 {foodsEaten}</span>
      </div>

      <div className="stat-row">
        <span className="stat-label">Time</span>
        <span className={`stat-val ${urgency ? 'blink-danger' : ''}`} style={{ color: timerColor }}>{timeLeft}s</span>
      </div>
      <div className="timer-bar-wrap">
        <div className="timer-bar-fill" style={{ width: `${pct}%`, background: timerColor }} />
      </div>

      <div className="stat-row">
        <span className="stat-label">Level</span>
        <span className="stat-val">{LEVEL_LABELS[curSettings.level] || '-'}</span>
      </div>

      <div className="stat-row">
        <span className="stat-label">Algorithm</span>
        <span className="stat-val" style={{ color: info.color || '#fff' }}>
          {info.emoji} {info.name || '-'}
        </span>
      </div>

      {isFetching && (
        <div className="hud-fetch-bar">
          <div className="hud-fetch-shimmer" />
        </div>
      )}
    </div>
  );
}
