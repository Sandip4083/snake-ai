const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

export function ucs(start, goal, obstacles, rows, cols) {
  let pq = [[0, start, []]];
  const visited = new Set();

  while (pq.length > 0) {
    pq.sort((a, b) => a[0] - b[0]);
    const [cost, cur, path] = pq.shift();
    const key = `${cur[0]},${cur[1]}`;
    if (visited.has(key)) continue;
    visited.add(key);
    if (cur[0] === goal[0] && cur[1] === goal[1]) return path;

    for (const [dr, dc] of DIRS) {
      const nr = cur[0] + dr, nc = cur[1] + dc;
      const nk = `${nr},${nc}`;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !obstacles.has(nk) && !visited.has(nk)) {
        pq.push([cost + 1, [nr, nc], [...path, [dr, dc]]]);
      }
    }
  }
  return [];
}
