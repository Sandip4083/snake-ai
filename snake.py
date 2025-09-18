import streamlit as st
import numpy as np
import random
import time
from search_algorithms import *

# -------------------------------
# Page Config & Styling
# -------------------------------
st.set_page_config(layout="centered")

# Thoda upar shift karne ke liye padding adjust
st.markdown(
    """
    <style>
        .block-container {
            padding-top: 1.3rem;
            padding-bottom: 0rem;
        }
    </style>
    """,
    unsafe_allow_html=True,
)

st.markdown(
    "<h1 style='text-align: left;'>🐍 AI Snake Game</h1>", unsafe_allow_html=True
)

# -------------------------------
# Game Settings
# -------------------------------
WIDTH, HEIGHT = 400, 400
CELL_SIZE = 20
ROWS, COLS = WIDTH // CELL_SIZE, HEIGHT // CELL_SIZE

LEVELS = {"level0": 0, "level1": 5, "level2": 10, "level3": 15}
ALGORITHMS = {
    "bfs": bfs,
    "dfs": dfs,
    "ucs": ucs,
    "ids": ids,
    "astar": astar,
    "random": random_move,
    "greedy_bfs": greedy_bfs,
}

# -------------------------------
# Sidebar controls
# -------------------------------
level = st.sidebar.selectbox("Choose Level", list(LEVELS.keys()), index=0)
algorithm = st.sidebar.selectbox("Choose Algorithm", list(ALGORITHMS.keys()), index=0)
game_time = st.sidebar.selectbox("Game Duration", [30, 60, 90], index=0)  # Timer select
start_button = st.sidebar.button("Start / Restart Game")

# -------------------------------
# Session State Init
# -------------------------------
if "snake_body" not in st.session_state or start_button:
    st.session_state.snake_body = [[ROWS // 2, COLS // 2]]
    st.session_state.score = 0
    st.session_state.start_time = time.time()
    st.session_state.path = []
    st.session_state.game_over = False
    st.session_state.game_time = game_time  # store selected time

    # Obstacles
    obstacles = set()
    OBSTACLE_COUNT = (ROWS * COLS * LEVELS[level]) // 100
    while len(obstacles) < OBSTACLE_COUNT:
        o = (random.randint(0, ROWS - 1), random.randint(0, COLS - 1))
        if o != tuple(st.session_state.snake_body[0]):
            obstacles.add(o)
    st.session_state.obstacles = obstacles

    # Food
    def generate_food():
        while True:
            pos = [random.randint(0, ROWS - 1), random.randint(0, COLS - 1)]
            blocked = st.session_state.obstacles.union(
                set(map(tuple, st.session_state.snake_body))
            )
            if tuple(pos) not in blocked:
                return pos

    st.session_state.food_pos = generate_food()


# -------------------------------
# Helper Functions
# -------------------------------
def generate_food():
    while True:
        pos = [random.randint(0, ROWS - 1), random.randint(0, COLS - 1)]
        blocked = st.session_state.obstacles.union(
            set(map(tuple, st.session_state.snake_body))
        )
        if tuple(pos) not in blocked:
            return pos


def step_game():
    snake_body = st.session_state.snake_body
    food_pos = st.session_state.food_pos
    obstacles = st.session_state.obstacles
    path = st.session_state.path

    snake_pos = snake_body[0]

    if not path:
        blocked = obstacles.union(set(map(tuple, snake_body[1:])))
        path = ALGORITHMS[algorithm](
            tuple(snake_pos), tuple(food_pos), blocked, ROWS, COLS
        )
        st.session_state.path = path

    if path:
        move = path.pop(0)
        new_head = [snake_pos[0] + move[0], snake_pos[1] + move[1]]
        snake_body.insert(0, new_head)

        if new_head == food_pos:
            st.session_state.score += 1
            st.session_state.food_pos = generate_food()
            st.session_state.path = []
        else:
            snake_body.pop()

        # Collision check
        head = snake_body[0]
        if (
            head[0] < 0
            or head[0] >= ROWS
            or head[1] < 0
            or head[1] >= COLS
            or tuple(head) in obstacles
            or head in snake_body[1:]
        ):
            st.session_state.game_over = True
            return


# -------------------------------
# Timer & Game Step
# -------------------------------
time_left = max(
    0, st.session_state.game_time - int(time.time() - st.session_state.start_time)
)

if time_left == 0:
    st.session_state.game_over = True
elif not st.session_state.game_over:
    step_game()

# -------------------------------
# Render Frame
# -------------------------------
frame = np.zeros((HEIGHT, WIDTH, 3), dtype=np.uint8)

# Snake = Green
for block in st.session_state.snake_body:
    r, c = block
    frame[r * CELL_SIZE : (r + 1) * CELL_SIZE, c * CELL_SIZE : (c + 1) * CELL_SIZE] = (
        0,
        255,
        0,
    )

# Food = Red
fr, fc = st.session_state.food_pos
frame[fr * CELL_SIZE : (fr + 1) * CELL_SIZE, fc * CELL_SIZE : (fc + 1) * CELL_SIZE] = (
    255,
    0,
    0,
)

# Obstacles = Gray
for obs in st.session_state.obstacles:
    r, c = obs
    frame[r * CELL_SIZE : (r + 1) * CELL_SIZE, c * CELL_SIZE : (c + 1) * CELL_SIZE] = (
        128,
        128,
        128,
    )

# Center align game frame
st.markdown(
    "<div style='text-align: center; position: relative;'>", unsafe_allow_html=True
)
st.image(frame, channels="RGB")

# Agar game over hai toh overlay show karo
if st.session_state.game_over:
    game_over_html = f"""
    <div style="
        position: absolute;
        top: 40%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: rgba(0,0,0,0.7);
        color: white;
        padding: 30px 50px;
        border-radius: 15px;
        font-size: 24px;
        font-weight: bold;
    ">
        Game Over! Final Score: {st.session_state.score}
    </div>
    """
    st.markdown(game_over_html, unsafe_allow_html=True)

st.markdown("</div>", unsafe_allow_html=True)

# -------------------------------
# HUD (Fixed Right Side)
# -------------------------------
hud_html = f"""
<div style="
    position: fixed;
    top: 50px;
    right: 20px;
    background-color: white;
    padding: 60px 60px;
    border-radius: 10px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.15);
    z-index: 9999;
    text-align: center;
">
    <div style="margin-bottom: 10px;">
        <h4 style="margin:0; color:#333;">Score</h4>
        <p style="margin:0; font-size:20px; font-weight:bold; color:green;">
            {st.session_state.score}
        </p>
    </div>
    <div style="margin-bottom: 10px;">
        <h4 style="margin:0; color:#333;">Time Left</h4>
        <p style="margin:0; font-size:20px; font-weight:bold; color:red;">
            {time_left}s
        </p>
    </div>
    <div>
        <h4 style="margin:0; color:#333;">Level</h4>
        <p style="margin:0; font-size:20px; font-weight:bold; color:blue;">
            {level}
        </p>
    </div>
</div>
"""

st.markdown(hud_html, unsafe_allow_html=True)

# -------------------------------
# Refresh Logic
# -------------------------------
if not st.session_state.game_over:
    time.sleep(0.2)  # snake ki speed control
    st.rerun()
