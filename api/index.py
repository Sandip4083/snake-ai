import sys
import os

# ── CRITICAL: Add project root to sys.path so Vercel finds algorithms/ ──
# api/index.py lives in /api/ — parent dir is the project root
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

from algorithms.bfs import bfs
from algorithms.dfs import dfs
from algorithms.astar import astar
from algorithms.ucs import ucs
from algorithms.ids import ids
from algorithms.greedy_bfs import greedy_bfs
from algorithms.random_move import random_move

app = FastAPI(title="Snake AI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ALGORITHMS = {
    "bfs":        bfs,
    "dfs":        dfs,
    "astar":      astar,
    "ucs":        ucs,
    "ids":        ids,
    "greedy_bfs": greedy_bfs,
    "random":     random_move,
}


class MoveRequest(BaseModel):
    head:       List[int]
    food:       List[int]
    snake_body: List[List[int]]
    obstacles:  List[List[int]]
    algorithm:  str = "bfs"
    rows:       int = 25
    cols:       int = 25


@app.get("/")
def root():
    return {"status": "ok", "message": "Snake AI API is running"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/move")
@app.post("/move")
def get_move(req: MoveRequest):
    algo = ALGORITHMS.get(req.algorithm, bfs)
    blocked = set(map(tuple, req.obstacles))
    blocked.update(map(tuple, req.snake_body[1:]))

    path = algo(
        tuple(req.head),
        tuple(req.food),
        blocked,
        req.rows,
        req.cols,
    )
    return {"path": path, "algorithm": req.algorithm, "found": len(path) > 0}
