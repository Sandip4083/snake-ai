DIRECTIONS = [(-1, 0), (1, 0), (0, -1), (0, 1)]


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
            pos = (current[0] + dx, current[1] + dy)
            if 0 <= pos[0] < rows and 0 <= pos[1] < cols and pos not in obstacles and pos not in visited:
                stack.append((pos, path + [(dx, dy)]))
    return []
