const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
let cachedClient = null;

async function getDb() {
  if (cachedClient) {
    try {
      await cachedClient.db('admin').command({ ping: 1 });
      return cachedClient.db('snakeai');
    } catch (e) {
      cachedClient = null;
    }
  }
  cachedClient = new MongoClient(uri);
  await cachedClient.connect();
  return cachedClient.db('snakeai');
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const db = await getDb();
    const col = db.collection('scores');

    if (req.method === 'GET') {
      const docs = await col.find({}).sort({ score: -1 }).limit(10).toArray();
      return res.json(
        docs.map(d => ({
          _id: d._id,
          name: d.name,
          score: d.score,
          algorithm: d.algorithm,
          level: d.level,
          date: d.date,
        }))
      );
    }

    if (req.method === 'POST') {
      const { name, score, algorithm, level } = req.body;
      await col.insertOne({
        name: (name || 'Anonymous').slice(0, 20),
        score: Number(score) || 0,
        algorithm: algorithm || 'unknown',
        level: level || 'level0',
        date: new Date().toISOString(),
      });
      return res.status(201).json({ ok: true });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      const { ObjectId } = require('mongodb');
      if (!id) return res.status(400).json({ error: 'Missing id' });
      await col.deleteOne({ _id: new ObjectId(id) });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
