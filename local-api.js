/**
 * local-api.js  —  local dev server for /api/scores
 * Mimics the Vercel serverless function so leaderboard works locally.
 * Uses only built-in Node.js http + mongodb (already installed).
 * Run: node local-api.js   (from project root)
 */

const http = require('http');
const { MongoClient } = require('mongodb');
const { readFileSync } = require('fs');
const { join } = require('path');

// Manual .env loader (no dotenv dependency needed)
try {
  readFileSync(join(__dirname, '.env'), 'utf-8')
    .split('\n')
    .forEach(line => {
      const eq = line.indexOf('=');
      if (eq > 0) {
        const key = line.slice(0, eq).trim();
        const val = line.slice(eq + 1).trim();
        if (key && !process.env[key]) process.env[key] = val;
      }
    });
} catch { /* .env not found — that's ok */ }

const PORT = 3001;
const uri  = process.env.MONGODB_URI;

if (!uri) {
  console.error('❌  MONGODB_URI not set in .env');
  process.exit(1);
}

let cachedClient = null;
async function getDb() {
  if (!cachedClient) {
    cachedClient = new MongoClient(uri);
    await cachedClient.connect();
    console.log('✅  Connected to MongoDB');
  }
  return cachedClient.db('snakeai');
}

// ── Request Handler ───────────────────────────────────────
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  if (req.url !== '/api/scores') {
    res.writeHead(404); res.end('Not found'); return;
  }

  const send = (status, data) => {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  };

  // GET — top 10 scores
  if (req.method === 'GET') {
    try {
      const db   = await getDb();
      const docs = await db.collection('scores')
        .find({}).sort({ score: -1 }).limit(10).toArray();
      send(200, docs.map(d => ({
        name: d.name, score: d.score,
        algorithm: d.algorithm, level: d.level, date: d.date,
      })));
    } catch (err) {
      console.error(err);
      send(500, { error: err.message });
    }
    return;
  }

  // POST — save score
  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { name, score, algorithm, level } = JSON.parse(body || '{}');
        const db = await getDb();
        await db.collection('scores').insertOne({
          name:      (name || 'Anonymous').slice(0, 20),
          score:     Number(score) || 0,
          algorithm: algorithm || 'unknown',
          level:     level     || 'level0',
          date:      new Date().toISOString(),
        });
        send(201, { ok: true });
      } catch (err) {
        console.error(err);
        send(500, { error: err.message });
      }
    });
    return;
  }

  send(405, { error: 'Method not allowed' });
});

server.listen(PORT, () => {
  console.log(`\n🎮  Local API  →  http://localhost:${PORT}/api/scores\n`);
});
