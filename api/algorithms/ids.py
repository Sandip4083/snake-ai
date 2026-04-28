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
    max_depth = min(rows * cols, 120)
    for depth in range(max_depth):
        visited = {start}
        result = _dls(start, goal, obstacles, rows, cols, depth, [], visited)
        if result is not None:
            return result
    return []
