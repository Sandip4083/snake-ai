import time

DIRECTIONS = [(-1, 0), (1, 0), (0, -1), (0, 1)]


def _dls(node, goal, obstacles, rows, cols, depth, path, visited):
    if node == goal:
        return path
    if depth == 0:
        return None
    for dx, dy in DIRECTIONS:
        pos = (node[0] + dx, node[1] + dy)
        if (0 <= pos[0] < rows and 0 <= pos[1] < cols
                and pos not in obstacles and pos not in visited):
            visited.add(pos)
            result = _dls(pos, goal, obstacles, rows, cols, depth - 1, path + [(dx, dy)], visited)
            if result is not None:
                return result
            visited.discard(pos)
    return None


def ids(start, goal, obstacles, rows, cols):
    """
    IDS capped at 3.5s wall-clock to prevent Vercel serverless timeout.
    Falls back to BFS if time runs out to always return a valid path.
    """
    from collections import deque

    max_depth = min(rows * cols, 80)  # reduced from 120
    deadline = time.time() + 3.5

    for depth in range(max_depth):
        if time.time() >= deadline:
            break
        visited = {start}
        result = _dls(start, goal, obstacles, rows, cols, depth, [], visited)
        if result is not None:
            return result

    # BFS fallback — always returns valid path if one exists
    queue = deque([(start, [])])
    visited_bfs = {start}
    while queue:
        current, path = queue.popleft()
        if current == goal:
            return path
        for dx, dy in DIRECTIONS:
            pos = (current[0] + dx, current[1] + dy)
            if (0 <= pos[0] < rows and 0 <= pos[1] < cols
                    and pos not in obstacles and pos not in visited_bfs):
                visited_bfs.add(pos)
                queue.append((pos, path + [(dx, dy)]))
    return []
