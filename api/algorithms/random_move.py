import random
from api.algorithms.bfs import bfs

DIRECTIONS = [(-1, 0), (1, 0), (0, -1), (0, 1)]


def random_move(start, goal, obstacles, rows, cols):
    path = []
    current = start

    for _ in range(60):
        valid = [
            (dx, dy) for dx, dy in DIRECTIONS
            if 0 <= current[0] + dx < rows
            and 0 <= current[1] + dy < cols
            and (current[0] + dx, current[1] + dy) not in obstacles
        ]
        if not valid:
            break
        dx, dy = random.choice(valid)
        path.append((dx, dy))
        current = (current[0] + dx, current[1] + dy)
        if current == goal:
            return path

    # Fallback to BFS
    return bfs(start, goal, obstacles, rows, cols)
