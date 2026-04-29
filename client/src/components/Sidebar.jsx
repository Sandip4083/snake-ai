import { useState } from 'react';
import { ALGORITHM_INFO, LEVEL_INFO } from '../utils/gameUtils.js';

const DURATIONS = [{ v: 30, l: '30s' }, { v: 60, l: '60s' }, { v: 90, l: '90s' }];
const SPEEDS    = [{ v: 200, l: '🐢 Slow' }, { v: 130, l: '⚡ Normal' }, { v: 70, l: '🚀 Fast' }];

export function Sidebar({ onStart, isRunning }) {
  const [algo,     setAlgo]     = useState('bfs');
  const [level,    setLevel]    = useState('level0');
  const [duration, setDuration] = useState(30);
  const [speed,    setSpeed]    = useState(130);

  const info      = ALGORITHM_INFO[algo];
  const levelInfo = LEVEL_INFO[level];

  return (
    <div className="card sidebar-card">
      <h3 className="card-title">⚙️ Controls</h3>

      {/* Algorithm */}
      <div className="field">
        <label>Algorithm</label>
        <div className="algo-grid">
          {Object.entries(ALGORITHM_INFO).map(([k, v]) => (
            <button
              key={k}
              className={`algo-btn ${algo === k ? 'algo-btn--active' : ''}`}
              style={algo === k ? { borderColor: v.color, color: v.color, background: `${v.color}18` } : {}}
              onClick={() => setAlgo(k)}
              title={v.desc}
            >
              <span className="algo-emoji">{v.emoji}</span>
              <span className="algo-name">{v.short}</span>
            </button>
          ))}
        </div>
        {info && (
          <div className="algo-desc-box" style={{ borderColor: `${info.color}44`, background: `${info.color}0a` }}>
            <span style={{ color: info.color, fontWeight: 600 }}>{info.name}</span>
            <br />
            <span className="algo-desc-text">{info.desc}</span>
          </div>
        )}
      </div>

      {/* Difficulty */}
      <div className="field">
        <label>Difficulty</label>
        <div className="btn-group">
          {Object.entries(LEVEL_INFO).map(([k, v]) => (
            <button
              key={k}
              className={`tog-btn ${level === k ? 'active' : ''}`}
              onClick={() => setLevel(k)}
              title={v.desc}
            >
              {v.label}
            </button>
          ))}
        </div>
        {levelInfo && <p className="desc">{levelInfo.desc}</p>}
      </div>

      {/* Duration */}
      <div className="field">
        <label>Duration</label>
        <div className="btn-group">
          {DURATIONS.map(d => (
            <button key={d.v} className={`tog-btn ${duration === d.v ? 'active' : ''}`} onClick={() => setDuration(d.v)}>{d.l}</button>
          ))}
        </div>
      </div>

      {/* Speed */}
      <div className="field">
        <label>Speed</label>
        <div className="btn-group">
          {SPEEDS.map(s => (
            <button key={s.v} className={`tog-btn ${speed === s.v ? 'active' : ''}`} onClick={() => setSpeed(s.v)}>{s.l}</button>
          ))}
        </div>
      </div>

      <button
        className="start-btn"
        onClick={() => onStart({ algorithm: algo, level, gameDuration: duration, speed })}
      >
        {isRunning ? '🔄 Restart' : '▶ Start Game'}
      </button>
    </div>
  );
}
