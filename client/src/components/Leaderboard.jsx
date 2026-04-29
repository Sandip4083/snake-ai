import { useEffect, useState } from 'react';
import { ALGORITHM_INFO } from '../utils/gameUtils.js';

const MEDALS = ['🥇', '🥈', '🥉'];

const ALGO_COLOR = (algo) => ALGORITHM_INFO[algo]?.color || '#aaa';

export function Leaderboard({ refreshKey }) {
  const [scores,   setScores]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [filter,   setFilter]   = useState('all');

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch('/api/scores')
      .then(r => { if (!r.ok) throw new Error('Failed'); return r.json(); })
      .then(data => { setScores(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => { setError('Could not load leaderboard'); setLoading(false); });
  }, [refreshKey]);

  const algos = ['all', ...Object.keys(ALGORITHM_INFO)];
  const filtered = filter === 'all' ? scores : scores.filter(s => s.algorithm === filter);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this score?")) return;
    try {
      const res = await fetch(`/api/scores?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setScores(prev => prev.filter(s => s._id !== id));
      } else {
        alert("Failed to delete score");
      }
    } catch (e) {
      console.error(e);
      alert("Error deleting score");
    }
  };

  return (
    <section className="leaderboard-section">
      <div className="lb-header">
        <h2 className="lb-title">🏆 Leaderboard</h2>
        <button className="lb-refresh-btn" onClick={() => setLoading(l => !l)} title="Refresh">
          🔄
        </button>
      </div>

      {/* Algorithm filter tabs */}
      <div className="lb-filters">
        {algos.map(a => (
          <button
            key={a}
            className={`lb-filter-btn ${filter === a ? 'active' : ''}`}
            style={filter === a && a !== 'all' ? { borderColor: ALGO_COLOR(a), color: ALGO_COLOR(a) } : {}}
            onClick={() => setFilter(a)}
          >
            {a === 'all' ? 'All' : ALGORITHM_INFO[a]?.short || a.toUpperCase()}
          </button>
        ))}
      </div>

      {loading && (
        <div className="lb-skeleton">
          {[...Array(5)].map((_, i) => <div key={i} className="lb-skeleton-row" />)}
        </div>
      )}
      {error   && <p className="lb-msg lb-error">⚠️ {error}</p>}
      {!loading && !error && filtered.length === 0 && (
        <p className="lb-msg">No scores yet — be the first! 🎮</p>
      )}

      {filtered.length > 0 && (
        <div className="lb-table-wrap">
          <table className="lb-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Player</th>
                <th>Score</th>
                <th>Algorithm</th>
                <th>Level</th>
                <th>Date</th>
                <th>Act</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <tr key={i} className={i < 3 ? `top-row top-${i + 1}` : 'lb-row'}>
                  <td className="lb-rank">{MEDALS[i] ?? <span className="lb-rank-num">{i + 1}</span>}</td>
                  <td className="lb-name">{s.name}</td>
                  <td className="lb-score">{s.score}</td>
                  <td>
                    <span className="lb-algo-tag" style={{ color: ALGO_COLOR(s.algorithm), borderColor: `${ALGO_COLOR(s.algorithm)}55` }}>
                      {ALGORITHM_INFO[s.algorithm]?.emoji} {ALGORITHM_INFO[s.algorithm]?.short || s.algorithm}
                    </span>
                  </td>
                  <td className="lb-level">{s.level?.replace('level', 'Lv ')}</td>
                  <td className="lb-date">{s.date ? new Date(s.date).toLocaleDateString() : '—'}</td>
                  <td>
                    <button onClick={() => handleDelete(s._id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', opacity: 0.7, fontSize: '14px' }} title="Delete score">❌</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
