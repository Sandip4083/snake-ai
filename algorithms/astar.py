import heapq

DIRECTIONS = [(-1, 0), (1, 0), (0, -1), (0, 1)]


def astar(start, goal, obstacles, rows, cols):
    def h(pos):
        return abs(pos[0] - goal[0]) + abs(pos[1] - goal[1])

    pq = [(h(start), 0, start, [])]
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
            if 0 <= pos[0] < rows and 0 <= pos[1] < cols and pos not in obstacles and pos not in visited:
                g = cost + 1
                heapq.heappush(pq, (g + h(pos), g, pos, path + [(dx, dy)]))
    return []
