import { useState } from 'react';
import { ALGORITHM_INFO } from '../utils/gameUtils.js';

const LEVELS   = { level0: 'No Obstacles', level1: '5% Obstacles', level2: '10% Obstacles', level3: '15% Obstacles' };
const DURATIONS = [{ v: 30, l: '30s' }, { v: 60, l: '60s' }, { v: 90, l: '90s' }];
const SPEEDS    = [{ v: 200, l: '🐢 Slow' }, { v: 130, l: '⚡ Normal' }, { v: 70, l: '🚀 Fast' }];

export function Sidebar({ onStart, isRunning }) {
  const [algo,     setAlgo]     = useState('bfs');
  const [level,    setLevel]    = useState('level0');
  const [duration, setDuration] = useState(30);
  const [speed,    setSpeed]    = useState(130);

  const info = ALGORITHM_INFO[algo];

  return (
    <div className="card sidebar-card">
      <h3 className="card-title">⚙️ Controls</h3>

      <div className="field">
        <label>Algorithm</label>
        <select value={algo} onChange={e => setAlgo(e.target.value)}>
          {Object.entries(ALGORITHM_INFO).map(([k, v]) => (
            <option key={k} value={k}>{v.name}</option>
          ))}
        </select>
        {info && <p className="desc" style={{ color: info.color }}>{info.desc}</p>}
      </div>

      <div className="field">
        <label>Difficulty</label>
        <select value={level} onChange={e => setLevel(e.target.value)}>
          {Object.entries(LEVELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      <div className="field">
        <label>Duration</label>
        <div className="btn-group">
          {DURATIONS.map(d => (
            <button key={d.v} className={`tog-btn ${duration === d.v ? 'active' : ''}`} onClick={() => setDuration(d.v)}>{d.l}</button>
          ))}
        </div>
      </div>

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
