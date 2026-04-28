export const ROWS = 25;
export const COLS = 25;
export const CELL_SIZE = 20;

export const LEVELS = { level0: 0, level1: 5, level2: 10, level3: 15 };

export function generateObstacles(level, snakeStart, rows, cols) {
  const obstacles = new Set();
  const count = Math.floor((rows * cols * LEVELS[level]) / 100);
  while (obstacles.size < count) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    if (r !== snakeStart[0] || c !== snakeStart[1]) {
      obstacles.add(`${r},${c}`);
    }
  }
  return obstacles;
}

export function generateFood(snakeBody, obstacles, rows, cols) {
  const bodySet = new Set(snakeBody.map(b => `${b[0]},${b[1]}`));
  for (let i = 0; i < 2000; i++) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    const key = `${r},${c}`;
    if (!bodySet.has(key) && !obstacles.has(key)) return [r, c];
  }
  return [0, 0];
}

export const ALGORITHM_INFO = {
  bfs:       { name: 'BFS',        desc: 'Breadth First Search — shortest path guaranteed', color: '#00FF88' },
  dfs:       { name: 'DFS',        desc: 'Depth First Search — explores deep paths first',  color: '#FF6B6B' },
  astar:     { name: 'A*',         desc: 'A* Search — optimal heuristic pathfinding',        color: '#FFD93D' },
  ucs:       { name: 'UCS',        desc: 'Uniform Cost Search — minimum cost path',          color: '#6BCB77' },
  ids:       { name: 'IDS',        desc: 'Iterative Deepening — memory efficient',           color: '#4ECDC4' },
  greedy_bfs:{ name: 'Greedy BFS', desc: 'Greedy Best First — fast but not always optimal',  color: '#FF9F43' },
  random:    { name: 'Random',     desc: 'Random moves with BFS fallback',                   color: '#A29BFE' },
};
