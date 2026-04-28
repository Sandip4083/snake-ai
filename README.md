# 🐍 AI Snake Game — Python + MERN Stack

An AI-powered Snake game where **7 pathfinding algorithms** navigate the snake in real-time.

**Stack:** Python FastAPI · React · MongoDB · Vercel

---

## 🏗️ Architecture

```
Browser (React + Canvas)
   │ calls once per food item
   ▼
Python FastAPI (Render) ── /move ──► returns full path
   
Node.js Serverless (Vercel) ── /api/scores ──► MongoDB Atlas
```

---

## 🚀 Local Development

### 1. Python API Server
```bash
cd server
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 2. React Frontend
```bash
cd client
npm install
npm run dev
```

Open **http://localhost:5173**

---

## ☁️ Deployment

### Python Backend → Render (Free)
1. Push to GitHub
2. Create **Web Service** on [render.com](https://render.com)
3. Set:
   - **Root Directory:** `server`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Copy the Render URL (e.g. `https://snake-ai.onrender.com`)

### Frontend + Scores API → Vercel
1. In Vercel dashboard → **Environment Variables**:
   ```
   MONGODB_URI         = mongodb+srv://...
   VITE_PYTHON_API_URL = https://snake-ai.onrender.com
   ```
2. Push to GitHub → Vercel auto-deploys

---

## 🤖 Algorithms

| Algorithm  | Optimal | Speed | Notes |
|---|---|---|---|
| BFS        | ✅ Yes | Medium | Shortest path |
| DFS        | ❌ No  | Fast   | Deep-first exploration |
| A*         | ✅ Yes | Fast   | Heuristic guided |
| UCS        | ✅ Yes | Medium | Cost-based |
| IDS        | ✅ Yes | Slow   | Memory efficient |
| Greedy BFS | ❌ No  | Fast   | Heuristic only |
| Random     | ❌ No  | Varies | BFS fallback |

---

## 👨‍💻 Author
**Sandip Kumar Sah**
