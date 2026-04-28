import { useEffect, useState } from 'react';

const MEDALS = ['🥇', '🥈', '🥉'];

export function Leaderboard({ refreshKey }) {
  const [scores,  setScores]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch('/api/scores')
      .then(r => { if (!r.ok) throw new Error('Failed'); return r.json(); })
      .then(data => { setScores(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => { setError('Could not load leaderboard'); setLoading(false); });
  }, [refreshKey]);

  return (
    <section className="leaderboard-section">
      <h2 className="lb-title">🏆 Leaderboard</h2>

      {loading && <p className="lb-msg">Loading…</p>}
      {error   && <p className="lb-msg lb-error">{error}</p>}
      {!loading && !error && scores.length === 0 && (
        <p className="lb-msg">No scores yet — be the first!</p>
      )}

      {scores.length > 0 && (
        <div className="lb-table-wrap">
          <table className="lb-table">
            <thead>
              <tr>
                <th>#</th><th>Name</th><th>Score</th><th>Algorithm</th><th>Level</th><th>Date</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((s, i) => (
                <tr key={i} className={i < 3 ? `top-row top-${i + 1}` : ''}>
                  <td>{MEDALS[i] ?? i + 1}</td>
                  <td className="lb-name">{s.name}</td>
                  <td className="lb-score">{s.score}</td>
                  <td>{s.algorithm}</td>
                  <td>{s.level}</td>
                  <td className="lb-date">{s.date ? new Date(s.date).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
