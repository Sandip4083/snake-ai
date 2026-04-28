import heapq

DIRECTIONS = [(-1, 0), (1, 0), (0, -1), (0, 1)]


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
            if 0 <= pos[0] < rows and 0 <= pos[1] < cols and pos not in obstacles and pos not in visited:
                heapq.heappush(pq, (cost + 1, pos, path + [(dx, dy)]))
    return []
