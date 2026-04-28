import { ALGORITHM_INFO } from '../utils/gameUtils.js';

const LEVEL_LABELS = { level0: 'Level 0', level1: 'Level 1', level2: 'Level 2', level3: 'Level 3' };

export function HUD({ score, timeLeft, curSettings, isFetching }) {
  const total = curSettings.gameDuration || 30;
  const pct   = Math.max(0, (timeLeft / total) * 100);
  const info  = ALGORITHM_INFO[curSettings.algorithm] || {};
  const timerColor = timeLeft <= 10 ? '#FF4757' : timeLeft <= 20 ? '#FFD93D' : '#00FF88';

  return (
    <div className="card hud-card">
      <h3 className="card-title">📊 Live Stats</h3>

      <div className="stat-row">
        <span className="stat-label">Score</span>
        <span className="stat-val" style={{ color: '#00FF88' }}>{score}</span>
      </div>

      <div className="stat-row">
        <span className="stat-label">Time</span>
        <span className="stat-val" style={{ color: timerColor }}>{timeLeft}s</span>
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
        <span className="stat-val" style={{ color: info.color || '#fff' }}>{info.name || '-'}</span>
      </div>

    </div>
  );
}
