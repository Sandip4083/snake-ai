const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

export function dfs(start, goal, obstacles, rows, cols) {
  const stack = [[start, []]];
  const visited = new Set();

  while (stack.length > 0) {
    const [cur, path] = stack.pop();
    const key = `${cur[0]},${cur[1]}`;
    if (visited.has(key)) continue;
    visited.add(key);
    if (cur[0] === goal[0] && cur[1] === goal[1]) return path;

    for (const [dr, dc] of DIRS) {
      const nr = cur[0] + dr, nc = cur[1] + dc;
      const nk = `${nr},${nc}`;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !obstacles.has(nk) && !visited.has(nk)) {
        stack.push([[nr, nc], [...path, [dr, dc]]]);
      }
    }
  }
  return [];
}
