/**
 * All 7 Snake AI algorithms — pure JS, runs in-browser.
 * Each returns a path: [[dr,dc], ...] from head toward food.
 */

const DIRS = [[-1,0],[1,0],[0,-1],[0,1]];

function inBounds(r, c, rows, cols) {
  return r >= 0 && r < rows && c >= 0 && c < cols;
}

// ── BFS ──────────────────────────────────────────────────────
export function bfs(head, food, blocked, rows, cols) {
  const queue = [[head, []]];
  const visited = new Set([`${head[0]},${head[1]}`]);
  while (queue.length > 0) {
    const [cur, path] = queue.shift();
    if (cur[0] === food[0] && cur[1] === food[1]) return path;
    for (const [dr, dc] of DIRS) {
      const nr = cur[0]+dr, nc = cur[1]+dc, k = `${nr},${nc}`;
      if (inBounds(nr,nc,rows,cols) && !visited.has(k) && !blocked.has(k)) {
        visited.add(k);
        queue.push([[nr,nc], [...path,[dr,dc]]]);
      }
    }
  }
  return [];
}

// ── DFS ──────────────────────────────────────────────────────
export function dfs(head, food, blocked, rows, cols) {
  const MAX = 200;
  const stack = [[head, []]];
  const visited = new Set([`${head[0]},${head[1]}`]);
  while (stack.length > 0) {
    const [cur, path] = stack.pop();
    if (cur[0] === food[0] && cur[1] === food[1]) return path;
    if (path.length >= MAX) continue;
    for (const [dr, dc] of DIRS) {
      const nr = cur[0]+dr, nc = cur[1]+dc, k = `${nr},${nc}`;
      if (inBounds(nr,nc,rows,cols) && !visited.has(k) && !blocked.has(k)) {
        visited.add(k);
        stack.push([[nr,nc], [...path,[dr,dc]]]);
      }
    }
  }
  // fallback to BFS
  return bfs(head, food, blocked, rows, cols);
}

// ── A* ───────────────────────────────────────────────────────
export function astar(head, food, blocked, rows, cols) {
  const h = (r,c) => Math.abs(r-food[0]) + Math.abs(c-food[1]);
  // min-heap via sorted array (small grid, fine for 25x25)
  const open = [{ r:head[0], c:head[1], g:0, f:h(head[0],head[1]), path:[] }];
  const visited = new Set();
  while (open.length > 0) {
    open.sort((a,b) => a.f - b.f);
    const { r, c, g, path } = open.shift();
    const k = `${r},${c}`;
    if (r === food[0] && c === food[1]) return path;
    if (visited.has(k)) continue;
    visited.add(k);
    for (const [dr,dc] of DIRS) {
      const nr=r+dr, nc=c+dc, nk=`${nr},${nc}`;
      if (inBounds(nr,nc,rows,cols) && !visited.has(nk) && !blocked.has(nk)) {
        const ng = g+1;
        open.push({ r:nr, c:nc, g:ng, f:ng+h(nr,nc), path:[...path,[dr,dc]] });
      }
    }
  }
  return [];
}

// ── UCS ──────────────────────────────────────────────────────
export function ucs(head, food, blocked, rows, cols) {
  // Same as BFS on uniform grid
  return bfs(head, food, blocked, rows, cols);
}

// ── Greedy BFS ───────────────────────────────────────────────
export function greedy_bfs(head, food, blocked, rows, cols) {
  const h = (r,c) => Math.abs(r-food[0]) + Math.abs(c-food[1]);
  const open = [{ r:head[0], c:head[1], f:h(head[0],head[1]), path:[] }];
  const visited = new Set([`${head[0]},${head[1]}`]);
  while (open.length > 0) {
    open.sort((a,b) => a.f - b.f);
    const { r, c, path } = open.shift();
    if (r === food[0] && c === food[1]) return path;
    for (const [dr,dc] of DIRS) {
      const nr=r+dr, nc=c+dc, k=`${nr},${nc}`;
      if (inBounds(nr,nc,rows,cols) && !visited.has(k) && !blocked.has(k)) {
        visited.add(k);
        open.push({ r:nr, c:nc, f:h(nr,nc), path:[...path,[dr,dc]] });
      }
    }
  }
  return bfs(head, food, blocked, rows, cols);
}

// ── IDS ──────────────────────────────────────────────────────
function dls(node, food, blocked, rows, cols, depth, path, visited) {
  if (node[0]===food[0] && node[1]===food[1]) return path;
  if (depth === 0) return null;
  for (const [dr,dc] of DIRS) {
    const nr=node[0]+dr, nc=node[1]+dc, k=`${nr},${nc}`;
    if (inBounds(nr,nc,rows,cols) && !visited.has(k) && !blocked.has(k)) {
      visited.add(k);
      const res = dls([nr,nc], food, blocked, rows, cols, depth-1, [...path,[dr,dc]], visited);
      if (res !== null) return res;
      visited.delete(k);
    }
  }
  return null;
}

export function ids(head, food, blocked, rows, cols) {
  const maxDepth = Math.min(rows+cols, 50);
  for (let d = 0; d <= maxDepth; d++) {
    const visited = new Set([`${head[0]},${head[1]}`]);
    const res = dls(head, food, blocked, rows, cols, d, [], visited);
    if (res !== null) return res;
  }
  return bfs(head, food, blocked, rows, cols);
}

// ── Random ───────────────────────────────────────────────────
export function random_move(head, food, blocked, rows, cols) {
  // Try a random direction; fall back to BFS if stuck
  const shuffled = [...DIRS].sort(() => Math.random()-0.5);
  for (const [dr,dc] of shuffled) {
    const nr=head[0]+dr, nc=head[1]+dc, k=`${nr},${nc}`;
    if (inBounds(nr,nc,rows,cols) && !blocked.has(k)) return [[dr,dc]];
  }
  return bfs(head, food, blocked, rows, cols);
}

// ── Dispatcher ───────────────────────────────────────────────
export const ALGO_FN = {
  bfs, dfs, astar, ucs, ids, greedy_bfs, random: random_move,
};
