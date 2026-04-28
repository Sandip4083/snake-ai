# 🐍 AI Snake Game — Python + MERN Stack

An AI-powered Snake game where **7 pathfinding algorithms** navigate the snake in real-time.

**Stack:** Python FastAPI · React · MongoDB · Vercel

---

## 🏗️ Architecture

This project is fully unified and deploys entirely on Vercel as a single application without needing separate backend servers.

```text
Browser (React + HTML5 Canvas)
   │
   ├─► Python FastAPI (Vercel Serverless) ── /api/move ──► Calculates full AI path
   │
   └─► Node.js (Vercel Serverless)        ── /api/scores ──► Saves/Loads MongoDB Leaderboard
```

---

## 🚀 Local Development

To run both the Python backend and Node.js backend locally:

### 1. Install Dependencies
```bash
# Install Python dependencies
pip install -r requirements.txt

# Install Node and React dependencies
npm run setup
```

### 2. Configure Environment Variables
Create a `.env` file in the root of your project:
```env
MONGODB_URI=mongodb+srv://<your_username>:<your_password>@cluster0...
```

### 3. Start Local Servers
We run 3 servers for local development (Python API, Node API, Vite Frontend).
Open 3 separate terminals:

**Terminal 1 (Node API):**
```bash
npm run dev:api
```

**Terminal 2 (Python API):**
```bash
uvicorn api.index:app --reload --port 8000
```

**Terminal 3 (React Client):**
```bash
npm run dev:client
```
Open **http://localhost:5173**

---

## ☁️ One-Click Deployment to Vercel

This application is configured for "Zero-Config" deployment on Vercel.

1. Push your code to GitHub.
2. Log in to [Vercel](https://vercel.com) and click **Add New Project**.
3. Import your GitHub repository.
4. Expand the **Environment Variables** section and add your `MONGODB_URI`.
5. Click **Deploy**.

Vercel will automatically build the React app, detect `requirements.txt` to install the Python dependencies, and route the `/api` endpoints automatically based on our `vercel.json` config.

---

## 🤖 Algorithms

| Algorithm  | Optimal | Speed | Notes |
|---|---|---|---|
| BFS        | ✅ Yes | Medium | Shortest path guaranteed |
| DFS        | ❌ No  | Fast   | Deep-first exploration |
| A*         | ✅ Yes | Fast   | Heuristic guided |
| UCS        | ✅ Yes | Medium | Cost-based (Uniform Cost Search) |
| IDS        | ✅ Yes | Slow   | Memory efficient (Iterative Deepening) |
| Greedy BFS | ❌ No  | Fast   | Heuristic only |
| Random     | ❌ No  | Varies | Picks valid adjacent moves |

---

## 👨‍💻 Author
**Sandip Kumar Sah**
