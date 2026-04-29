export const ROWS = 25;
export const COLS = 25;
export const CELL_SIZE = 20;

export const LEVELS = { level0: 0, level1: 5, level2: 10, level3: 15 };

export function generateObstacles(level, snakeStart, rows, cols) {
  const obstacles = new Set();
  const count = Math.floor((rows * cols * LEVELS[level]) / 100);
  let attempts = 0;
  while (obstacles.size < count && attempts < 5000) {
    attempts++;
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    // Keep a safe zone around the snake start
    const distR = Math.abs(r - snakeStart[0]);
    const distC = Math.abs(c - snakeStart[1]);
    if (distR > 2 || distC > 2) {
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
  bfs:        { name: 'BFS',        short: 'BFS', desc: 'Breadth First Search — shortest path guaranteed', color: '#00FF88', emoji: '🔵' },
  dfs:        { name: 'DFS',        short: 'DFS', desc: 'Depth First Search — explores deep paths first',  color: '#FF6B6B', emoji: '🔴' },
  astar:      { name: 'A*',         short: 'A*',  desc: 'A* Search — optimal with heuristic speed boost',  color: '#FFD93D', emoji: '⭐' },
  ucs:        { name: 'UCS',        short: 'UCS', desc: 'Uniform Cost Search — minimum cost path',          color: '#6BCB77', emoji: '🟢' },
  ids:        { name: 'IDS',        short: 'IDS', desc: 'Iterative Deepening — memory efficient',           color: '#4ECDC4', emoji: '🔷' },
  greedy_bfs: { name: 'Greedy BFS', short: 'GBF', desc: 'Greedy Best First — fast but not always optimal',  color: '#FF9F43', emoji: '🟠' },
  random:     { name: 'Random',     short: 'RND', desc: 'Random moves with BFS fallback',                   color: '#A29BFE', emoji: '🎲' },
};

export const LEVEL_INFO = {
  level0: { label: 'Clean',     desc: 'No obstacles — pure pathfinding' },
  level1: { label: 'Easy',      desc: '5% obstacles — slight challenge'  },
  level2: { label: 'Medium',    desc: '10% obstacles — moderate maze'    },
  level3: { label: 'Hard',      desc: '15% obstacles — dense labyrinth'  },
};
