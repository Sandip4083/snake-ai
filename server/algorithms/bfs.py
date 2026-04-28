from collections import deque

DIRECTIONS = [(-1, 0), (1, 0), (0, -1), (0, 1)]


def bfs(start, goal, obstacles, rows, cols):
    queue = deque([(start, [])])
    visited = {start}

    while queue:
        current, path = queue.popleft()
        if current == goal:
            return path
        for dx, dy in DIRECTIONS:
            pos = (current[0] + dx, current[1] + dy)
            if 0 <= pos[0] < rows and 0 <= pos[1] < cols and pos not in obstacles and pos not in visited:
                visited.add(pos)
                queue.append((pos, path + [(dx, dy)]))
    return []
