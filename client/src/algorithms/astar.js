const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const h = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);

export function astar(start, goal, obstacles, rows, cols) {
  let pq = [[h(start, goal), 0, start, []]];
  const visited = new Set();

  while (pq.length > 0) {
    pq.sort((a, b) => a[0] - b[0]);
    const [, g, cur, path] = pq.shift();
    const key = `${cur[0]},${cur[1]}`;
    if (visited.has(key)) continue;
    visited.add(key);
    if (cur[0] === goal[0] && cur[1] === goal[1]) return path;

    for (const [dr, dc] of DIRS) {
      const nr = cur[0] + dr, nc = cur[1] + dc;
      const nk = `${nr},${nc}`;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !obstacles.has(nk) && !visited.has(nk)) {
        const ng = g + 1;
        pq.push([ng + h([nr, nc], goal), ng, [nr, nc], [...path, [dr, dc]]]);
      }
    }
  }
  return [];
}
