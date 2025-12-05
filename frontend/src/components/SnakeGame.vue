<template>
    <div class="h-full flex flex-col bg-black relative">
        <div
            class="codec-ui text-[10px] flex justify-between items-center h-16 shrink-0"
        >
            <div class="flex gap-2 items-center">
                <div
                    class="w-10 h-10 bg-green-900 border border-green-500 flex items-center justify-center overflow-hidden"
                >
                    <div
                        class="text-[8px] leading-none text-green-300 whitespace-pre font-mono"
                    >
                        .--.<br />|o_o |<br />|:_/ |<br />// \
                    </div>
                </div>
                <div>
                    <div class="text-green-300 font-bold">SNAKE</div>
                    <div>140.85</div>
                </div>
            </div>
            <div class="text-right">
                <div>MISSION: EAT THE DATA</div>
                <div class="text-green-300">SCORE: {{ score }}</div>
            </div>
        </div>

        <div
            class="flex-1 relative bg-[#111] flex items-center justify-center overflow-hidden"
            style="pointer-events: auto"
        >
            <canvas
                ref="canvasRef"
                :width="canvasWidth"
                :height="canvasHeight"
                class="snake-canvas"
            ></canvas>

            <div
                v-if="!isPlaying && !isGameOver"
                class="snake-overlay"
                style="pointer-events: auto"
            >
                <h1 class="text-xl text-red-500 mb-4 font-bold tracking-widest">
                    TACTICAL MISSION START
                </h1>
                <button
                    @click.stop="startGame"
                    @mousedown.prevent
                    class="px-4 py-2 border-2 border-green-500 text-green-500 hover:bg-green-900 hover:text-white transition-colors text-xs blink font-bold"
                    style="
                        pointer-events: auto !important;
                        cursor: pointer !important;
                        z-index: 1002 !important;
                        position: relative;
                        background: rgba(0, 50, 0, 0.5);
                    "
                >
                    ► PRESS START ◄
                </button>
            </div>

            <div
                v-if="isGameOver"
                class="snake-overlay"
                style="pointer-events: auto"
            >
                <h1
                    class="text-xl text-red-500 mb-4 font-bold tracking-widest animate-pulse"
                >
                    SNAKE? SNAKE! SNAKEEEEE!
                </h1>
                <button
                    @click.stop="restartGame"
                    @mousedown.prevent
                    class="px-4 py-2 border-2 border-green-500 text-green-500 hover:bg-green-900 hover:text-white transition-colors text-xs blink font-bold"
                    style="
                        pointer-events: auto !important;
                        cursor: pointer !important;
                        z-index: 1002 !important;
                        position: relative;
                        background: rgba(0, 50, 0, 0.5);
                    "
                >
                    RETRY MISSION
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from "vue";

const canvasWidth = 400;
const canvasHeight = 400;
const gridSize = 20;
const gridCols = canvasWidth / gridSize;
const gridRows = canvasHeight / gridSize;

const canvasRef = ref(null);
const isPlaying = ref(false);
const isGameOver = ref(false);
const score = ref(0);

let ctx = null;
let animationFrameId = null;
let lastUpdateTime = 0;
const updateInterval = 100;

let snake = [];
let food = { x: 0, y: 0 };
let direction = "RIGHT";
let nextDirection = "RIGHT";

const initGame = () => {
    snake = [
        { x: 5, y: 5 },
        { x: 4, y: 5 },
        { x: 3, y: 5 },
    ];

    direction = "RIGHT";
    nextDirection = "RIGHT";
    score.value = 0;
    isGameOver.value = false;

    spawnFood();
};

const spawnFood = () => {
    let newFood;
    let isOnSnake;

    do {
        newFood = {
            x: Math.floor(Math.random() * gridCols),
            y: Math.floor(Math.random() * gridRows),
        };

        isOnSnake = snake.some(
            (segment) => segment.x === newFood.x && segment.y === newFood.y,
        );
    } while (isOnSnake);

    food = newFood;
};

const startGame = async () => {
    await nextTick();

    if (!canvasRef.value) {
        console.error("Canvas not found!");
        return;
    }

    ctx = canvasRef.value.getContext("2d", { alpha: false });
    if (!ctx) {
        console.error("Could not get 2D context!");
        return;
    }

    ctx.imageSmoothingEnabled = false;

    initGame();
    isPlaying.value = true;
    lastUpdateTime = performance.now();

    gameLoop(performance.now());
};

const restartGame = () => {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    startGame();
};

const gameLoop = (currentTime) => {
    if (!isPlaying.value || isGameOver.value) {
        return;
    }

    animationFrameId = requestAnimationFrame(gameLoop);

    if (currentTime - lastUpdateTime >= updateInterval) {
        updateGame();
        lastUpdateTime = currentTime;
    }

    drawGame();
};

const updateGame = () => {
    if (!isPlaying.value || isGameOver.value) return;

    direction = nextDirection;

    const head = { ...snake[0] };

    switch (direction) {
        case "UP":
            head.y--;
            break;
        case "DOWN":
            head.y++;
            break;
        case "LEFT":
            head.x--;
            break;
        case "RIGHT":
            head.x++;
            break;
    }

    if (head.x < 0 || head.x >= gridCols || head.y < 0 || head.y >= gridRows) {
        endGame();
        return;
    }

    if (snake.some((segment) => segment.x === head.x && segment.y === head.y)) {
        endGame();
        return;
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        score.value += 10;
        spawnFood();
    } else {
        snake.pop();
    }
};

const drawGame = () => {
    if (!ctx || !canvasRef.value) return;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    ctx.fillStyle = "#051005";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    ctx.strokeStyle = "#0f200f";
    ctx.lineWidth = 1;

    for (let x = 0; x <= canvasWidth; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvasHeight);
        ctx.stroke();
    }

    for (let y = 0; y <= canvasHeight; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvasWidth, y);
        ctx.stroke();
    }

    snake.forEach((segment, index) => {
        const isHead = index === 0;

        ctx.fillStyle = isHead ? "#4ade80" : "#22c55e";
        ctx.fillRect(
            segment.x * gridSize + 1,
            segment.y * gridSize + 1,
            gridSize - 2,
            gridSize - 2,
        );

        if (isHead) {
            ctx.fillStyle = "#dc2626";
            ctx.fillRect(
                segment.x * gridSize + 4,
                segment.y * gridSize + 4,
                gridSize - 8,
                4,
            );
        }
    });

    ctx.fillStyle = "#fbbf24";
    ctx.font = "bold 18px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
        "!",
        food.x * gridSize + gridSize / 2,
        food.y * gridSize + gridSize / 2,
    );
};

const endGame = () => {
    isPlaying.value = false;
    isGameOver.value = true;

    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
};

const handleKeydown = (e) => {
    if (!isPlaying.value || isGameOver.value) return;

    switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
            if (direction !== "DOWN") nextDirection = "UP";
            e.preventDefault();
            break;
        case "ArrowDown":
        case "s":
        case "S":
            if (direction !== "UP") nextDirection = "DOWN";
            e.preventDefault();
            break;
        case "ArrowLeft":
        case "a":
        case "A":
            if (direction !== "RIGHT") nextDirection = "LEFT";
            e.preventDefault();
            break;
        case "ArrowRight":
        case "d":
        case "D":
            if (direction !== "LEFT") nextDirection = "RIGHT";
            e.preventDefault();
            break;
    }
};

onMounted(() => {
    window.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
    window.removeEventListener("keydown", handleKeydown);
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
});
</script>

<style scoped>
canvas {
    image-rendering: pixelated;
    image-rendering: crisp-edges;
}
</style>
