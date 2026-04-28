const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

export function bfs(start, goal, obstacles, rows, cols) {
  const queue = [[start, []]];
  const visited = new Set([`${start[0]},${start[1]}`]);

  while (queue.length > 0) {
    const [cur, path] = queue.shift();
    if (cur[0] === goal[0] && cur[1] === goal[1]) return path;

    for (const [dr, dc] of DIRS) {
      const nr = cur[0] + dr, nc = cur[1] + dc;
      const key = `${nr},${nc}`;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !obstacles.has(key) && !visited.has(key)) {
        visited.add(key);
        queue.push([[nr, nc], [...path, [dr, dc]]]);
      }
    }
  }
  return [];
}
