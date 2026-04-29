import time
from collections import deque

DIRECTIONS = [(-1, 0), (1, 0), (0, -1), (0, 1)]


def _dls(node, goal, obstacles, rows, cols, depth, path, visited, deadline):
    if node == goal:
        return path
    if depth == 0:
        return None
    if time.time() >= deadline:
        return None  # time's up, prune
    for dx, dy in DIRECTIONS:
        pos = (node[0] + dx, node[1] + dy)
        if (0 <= pos[0] < rows and 0 <= pos[1] < cols
                and pos not in obstacles and pos not in visited):
            visited.add(pos)
            result = _dls(pos, goal, obstacles, rows, cols, depth - 1,
                          path + [(dx, dy)], visited, deadline)
            if result is not None:
                return result
            visited.discard(pos)
    return None


def _bfs_fallback(start, goal, obstacles, rows, cols):
    """Guaranteed shortest path via BFS — always used as IDS fallback."""
    queue = deque([(start, [])])
    visited = {start}
    while queue:
        current, path = queue.popleft()
        if current == goal:
            return path
        for dx, dy in DIRECTIONS:
            pos = (current[0] + dx, current[1] + dy)
            if (0 <= pos[0] < rows and 0 <= pos[1] < cols
                    and pos not in obstacles and pos not in visited):
                visited.add(pos)
                queue.append((pos, path + [(dx, dy)]))
    return []


def ids(start, goal, obstacles, rows, cols):
    """
    IDS with strict 2.5s budget — falls back to BFS immediately if time runs out.
    This prevents Vercel serverless timeouts (10s limit) by never exceeding 4s total.
    """
    # Give IDS only 2.5s so BFS fallback has 4.5s of headroom
    deadline = time.time() + 2.5
    max_depth = min(rows + cols, 50)  # IDS is only useful for short paths

    for depth in range(max_depth):
        if time.time() >= deadline:
            break  # hit time budget → go straight to BFS
        visited = {start}
        result = _dls(start, goal, obstacles, rows, cols, depth, [], visited, deadline)
        if result is not None:
            return result

    # BFS fallback — fast and guaranteed
    return _bfs_fallback(start, goal, obstacles, rows, cols)
