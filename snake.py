import pygame
import random
import time
import sys
from search_algorithms import *

# -------------------------------
# Command-line arguments
# -------------------------------
if len(sys.argv) != 3:
    print("Usage: python snake.py <level> <search_algorithm>")
    sys.exit(1)

level = sys.argv[1].lower()
search_algorithm = sys.argv[2].lower()

# Levels (% of grid as obstacles)
LEVELS = {"level0": 0, "level1": 5, "level2": 10, "level3": 15}
if level not in LEVELS:
    print("Invalid level! Choose from: level0, level1, level2, level3")
    sys.exit(1)

# Algorithms mapping
ALGORITHMS = {
    "bfs": bfs,
    "dfs": dfs,
    "ucs": ucs,
    "ids": ids,
    "astar": astar,  # ✅ safe name
    "random": random_move,
    "greedy_bfs": greedy_bfs,
}
if search_algorithm not in ALGORITHMS:
    print(
        "Invalid search algorithm! Choose from: bfs, dfs, ucs, ids, astar, random, greedy_bfs"
    )
    sys.exit(1)

# -------------------------------
# Pygame setup
# -------------------------------
pygame.init()

WIDTH, HEIGHT = 500, 500
CELL_SIZE = 20
WHITE, BLACK, GREEN, RED, GRAY = (
    (255, 255, 255),
    (0, 0, 0),
    (0, 255, 0),
    (255, 0, 0),
    (128, 128, 128),
)
FONT = pygame.font.Font(None, 36)

ROWS, COLS = WIDTH // CELL_SIZE, HEIGHT // CELL_SIZE

# Snake starting position
snake_body = [[ROWS // 2, COLS // 2]]

# Obstacles
obstacles = set()
OBSTACLE_COUNT = (ROWS * COLS * LEVELS[level]) // 100
while len(obstacles) < OBSTACLE_COUNT:
    obstacle = (random.randint(0, ROWS - 1), random.randint(0, COLS - 1))
    if obstacle != tuple(snake_body[0]):
        obstacles.add(obstacle)


# Food position generator
def generate_food():
    while True:
        pos = [random.randint(0, ROWS - 1), random.randint(0, COLS - 1)]
        blocked = obstacles.union(set(map(tuple, snake_body)))
        if tuple(pos) not in blocked:
            return pos


# Initial food
food_pos = generate_food()

# Timer
TIME_LIMIT = 30
start_time = time.time()

# Pygame window
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption(
    f"AI Snake Game ({search_algorithm.upper()} - {level.upper()})"
)

clock = pygame.time.Clock()
score = 0


# -------------------------------
# Game Over function
# -------------------------------
def game_over():
    my_font = pygame.font.SysFont("times new roman", 50)
    game_over_surface = my_font.render("Your Score is : " + str(score), True, RED)
    game_over_rect = game_over_surface.get_rect()
    game_over_rect.midtop = (WIDTH / 2, HEIGHT / 4)
    screen.blit(game_over_surface, game_over_rect)
    pygame.display.flip()
    print("Score: ", score)
    time.sleep(1)
    pygame.quit()
    quit()


# -------------------------------
# Main loop
# -------------------------------
running = True
path = []

while running:
    screen.fill(BLACK)

    # Timer
    elapsed_time = time.time() - start_time
    time_left = max(0, TIME_LIMIT - int(elapsed_time))
    if time_left == 0:
        running = False
        game_over()

    snake_pos = snake_body[0]

    # Pathfinding
    if not path:
        # Snake body (except head) + obstacles treated as walls
        blocked = obstacles.union(set(map(tuple, snake_body[1:])))
        path = ALGORITHMS[search_algorithm](
            tuple(snake_pos), tuple(food_pos), blocked, ROWS, COLS
        )

    # Snake movement
    if path:
        move = path.pop(0)
        new_head = [snake_pos[0] + move[0], snake_pos[1] + move[1]]
        snake_body.insert(0, new_head)

        if new_head == food_pos:
            # Ate food → grow
            score += 1
            food_pos = generate_food()
            path = []  # reset path
        else:
            # Normal move → remove tail
            snake_body.pop()

    # Collision check
    head = snake_body[0]
    if (
        head[0] < 0
        or head[0] >= ROWS
        or head[1] < 0
        or head[1] >= COLS
        or tuple(head) in obstacles
        or head in snake_body[1:]  # hit itself
    ):
        running = False
        game_over()

    # Draw snake
    for block in snake_body:
        pygame.draw.rect(
            screen,
            GREEN,
            (block[1] * CELL_SIZE, block[0] * CELL_SIZE, CELL_SIZE, CELL_SIZE),
        )

    # Draw food
    pygame.draw.rect(
        screen,
        RED,
        (food_pos[1] * CELL_SIZE, food_pos[0] * CELL_SIZE, CELL_SIZE, CELL_SIZE),
    )

    # Draw obstacles
    for obs in obstacles:
        pygame.draw.rect(
            screen, GRAY, (obs[1] * CELL_SIZE, obs[0] * CELL_SIZE, CELL_SIZE, CELL_SIZE)
        )

    # HUD
    timer_text = FONT.render(f"Time Left: {time_left}s", True, WHITE)
    score_text = FONT.render(f"Score: {score}", True, WHITE)
    screen.blit(timer_text, (20, 20))
    screen.blit(score_text, (20, 50))

    pygame.display.update()
    clock.tick(7)  # speed

    # Events
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
            game_over()

pygame.quit()
print("Score: ", score)
