from collections import deque

DIRECTIONS = [(-1, 0), (1, 0), (0, -1), (0, 1)]


def dfs(start, goal, obstacles, rows, cols):
    """
    Iterative DFS — explores deep paths first.
    Capped at 300 steps to prevent enormous paths that
    make the snake appear frozen for many seconds.
    """
    stack = [(start, [])]
    visited = set()
    MAX_PATH = 300  # cap path length so snake never freezes

    while stack:
        current, path = stack.pop()
        if current in visited:
            continue
        visited.add(current)

        if current == goal:
            return path

        # Prune paths that are already too long
        if len(path) >= MAX_PATH:
            continue

        for dx, dy in DIRECTIONS:
            pos = (current[0] + dx, current[1] + dy)
            if (0 <= pos[0] < rows and 0 <= pos[1] < cols
                    and pos not in obstacles and pos not in visited):
                stack.append((pos, path + [(dx, dy)]))

    # If DFS can't find a short path, fall back to BFS for shortest path
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
