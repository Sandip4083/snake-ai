import random
from collections import deque
import heapq

# Directions (Up, Down, Left, Right)
DIRECTIONS = [(-1, 0), (1, 0), (0, -1), (0, 1)]


# -------------------------------
# Random movement algorithm
# -------------------------------
def random_move(start, goal, obstacles, rows, cols):
    path = []
    current = start

    for _ in range(1000):  # Limit to 1000 moves
        direction = random.choice(DIRECTIONS)
        new_pos = (current[0] + direction[0], current[1] + direction[1])

        if (
            0 <= new_pos[0] < rows
            and 0 <= new_pos[1] < cols
            and new_pos not in obstacles
        ):
            path.append(direction)
            current = new_pos

        if current == goal:
            return path

    return []  # If it takes too long, return empty path


# -------------------------------
# Breadth First Search (BFS)
# -------------------------------
def bfs(start, goal, obstacles, rows, cols):
    Q = deque([(start, [])])
    visited = set([start])

    while Q:
        current, path = Q.popleft()

        if current == goal:
            return path

        for dx, dy in DIRECTIONS:
            pos = (current[0] + dx, current[1] + dy)
            if (
                0 <= pos[0] < rows
                and 0 <= pos[1] < cols
                and pos not in obstacles
                and pos not in visited
            ):
                Q.append((pos, path + [(dx, dy)]))
                visited.add(pos)

    return []


# -------------------------------
# Depth First Search (DFS)
# -------------------------------
def dfs(start, goal, obstacles, rows, cols):
    stack = [(start, [])]
    visited = set()

    while stack:
        current, path = stack.pop()
        if current in visited:
            continue
        visited.add(current)

        if current == goal:
            return path

        for dx, dy in DIRECTIONS:
            new_pos = (current[0] + dx, current[1] + dy)
            if (
                0 <= new_pos[0] < rows
                and 0 <= new_pos[1] < cols
                and new_pos not in obstacles
                and new_pos not in visited
            ):
                stack.append((new_pos, path + [(dx, dy)]))

    return []


# -------------------------------
# Iterative Deepening Search (IDS)
# -------------------------------
def ids(start, goal, obstacles, rows, cols):
    def dls(node, depth, path, visited):
        if node == goal:
            return path
        if depth == 0:
            return None

        visited.add(node)
        for dx, dy in DIRECTIONS:
            new_pos = (node[0] + dx, node[1] + dy)
            if (
                0 <= new_pos[0] < rows
                and 0 <= new_pos[1] < cols
                and new_pos not in obstacles
                and new_pos not in visited
            ):
                result = dls(new_pos, depth - 1, path + [(dx, dy)], visited)
                if result:
                    return result
        return None

    max_depth = rows * cols
    for depth in range(max_depth):
        result = dls(start, depth, [], set())
        if result:
            return result
    return []  # ❌ if no path found


# -------------------------------
# Uniform Cost Search (UCS)
# -------------------------------
def ucs(start, goal, obstacles, rows, cols):
    pq = [(0, start, [])]
    visited = set()

    while pq:
        cost, current, path = heapq.heappop(pq)

        if current in visited:
            continue
        visited.add(current)

        if current == goal:
            return path

        for dx, dy in DIRECTIONS:
            pos = (current[0] + dx, current[1] + dy)
            if (
                0 <= pos[0] < rows
                and 0 <= pos[1] < cols
                and pos not in obstacles
                and pos not in visited
            ):
                heapq.heappush(pq, (cost + 1, pos, path + [(dx, dy)]))

    return []


# -------------------------------
# Greedy Best First Search
# -------------------------------
def greedy_bfs(start, goal, obstacles, rows, cols):
    pq = [(abs(goal[0] - start[0]) + abs(goal[1] - start[1]), start, [])]
    visited = set()

    while pq:
        _, current, path = heapq.heappop(pq)

        if current in visited:
            continue
        visited.add(current)

        if current == goal:
            return path

        for dx, dy in DIRECTIONS:
            pos = (current[0] + dx, current[1] + dy)
            if (
                0 <= pos[0] < rows
                and 0 <= pos[1] < cols
                and pos not in obstacles
                and pos not in visited
            ):
                h = abs(goal[0] - pos[0]) + abs(goal[1] - pos[1])
                heapq.heappush(pq, (h, pos, path + [(dx, dy)]))

    return []


# -------------------------------
# A* Search Algorithm
# -------------------------------
def astar(start, goal, obstacles, rows, cols):
    pq = [(0, 0, start, [])]
    visited = set()

    while pq:
        _, cost, current, path = heapq.heappop(pq)

        if current in visited:
            continue
        visited.add(current)

        if current == goal:
            return path

        for dx, dy in DIRECTIONS:
            pos = (current[0] + dx, current[1] + dy)
            if (
                0 <= pos[0] < rows
                and 0 <= pos[1] < cols
                and pos not in obstacles
                and pos not in visited
            ):
                g = cost + 1
                h = abs(goal[0] - pos[0]) + abs(goal[1] - pos[1])
                heapq.heappush(pq, (g + h, g, pos, path + [(dx, dy)]))

    return []
