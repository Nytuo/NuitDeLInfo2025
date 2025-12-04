<template>
    <div
        class="h-screen w-screen relative overflow-hidden"
        @mousemove="onDrag"
        @mouseup="stopDrag"
    >
        <div class="scanlines"></div>

        <div class="absolute top-4 left-4 flex flex-col gap-6 z-0">
            <div class="desktop-icon" @click="openWindow('browser')">
                <svg
                    class="icon-img text-yellow-400 bg-blue-900 border-2 border-white p-1"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                >
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="2" y1="12" x2="22" y2="12"></line>
                    <path
                        d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
                    ></path>
                </svg>
                <span class="text-xs">LibreWeb</span>
            </div>

            <div class="desktop-icon" @click="openWindow('cve')">
                <svg
                    class="icon-img text-red-500 bg-gray-800 border-2 border-white p-1"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                >
                    <path
                        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                    ></path>
                </svg>
                <span class="text-xs">CVE Explorer</span>
            </div>

            <div class="desktop-icon" @click="openWindow('terminal')">
                <svg
                    class="icon-img text-green-400 bg-black border-2 border-white p-1"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                >
                    <polyline points="4 17 10 11 4 5"></polyline>
                    <line x1="12" y1="19" x2="20" y2="19"></line>
                </svg>
                <span class="text-xs">Terminal</span>
            </div>
        </div>

        <div
            v-for="win in windows"
            :key="win.id"
            v-show="win.isOpen"
            class="retro-window"
            :style="{
                left: win.x + 'px',
                top: win.y + 'px',
                width: win.w + 'px',
                height: win.h + 'px',
                zIndex: win.z,
            }"
            @mousedown="focusWindow(win.id)"
        >
            <div
                class="title-bar"
                :class="activeWindowId === win.id ? 'active' : 'inactive'"
                @mousedown="startDrag($event, win.id)"
            >
                <div class="flex items-center gap-2">
                    <span v-if="win.icon" class="text-yellow-300">{{
                        win.icon
                    }}</span>
                    <span>{{ win.title }}</span>
                </div>
                <button class="btn-close" @click.stop="closeWindow(win.id)">
                    X
                </button>
            </div>

            <div class="window-content bg-white text-black relative">
                <div v-if="win.type === 'browser'" class="h-full flex flex-col">
                    <div
                        class="bg-gray-200 p-1 border-b border-gray-400 flex gap-2 mb-1 text-xs"
                    >
                        <button
                            class="border border-gray-500 px-2 bg-gray-100 shadow-sm active:translate-y-0.5"
                            @click="
                                browserUrl =
                                    'https://nird.forge.apps.education.fr/'
                            "
                        >
                            Home
                        </button>
                        <input
                            type="text"
                            v-model="browserUrl"
                            class="flex-1 border border-gray-500 px-1 font-mono text-xs"
                            readonly
                        />
                    </div>
                    <iframe
                        :src="browserUrl"
                        class="w-full flex-1 border border-gray-500"
                        :class="{ 'pointer-events-none': isDragging }"
                    ></iframe>
                </div>

                <CVEExplorer v-if="win.type === 'cve'" />

                <div
                    v-if="win.type === 'terminal'"
                    class="bg-black text-green-500 h-full p-2 font-mono text-xs overflow-auto"
                >
                    <p>NIRD OS [Version 1.0.42]</p>
                    <p>(c) 2025 Resistance Corp. All rights reserved.</p>
                    <br />
                    <p>user@nird:~$ <span class="animate-pulse">_</span></p>
                    <p v-if="konamiTriggered" class="mt-4 text-yellow-400">
                        > SYSTEM OVERRIDE DETECTED...<br />
                        > LOADING TACTICAL ESPIONAGE MODULE...
                    </p>
                </div>

                <div
                    v-if="win.type === 'snake'"
                    class="bg-black h-full flex flex-col relative"
                    :key="'snake-content'"
                >
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
                                <div class="text-green-300 font-bold">
                                    SNAKE
                                </div>
                                <div>140.85</div>
                            </div>
                        </div>
                        <div class="text-right">
                            <div>MISSION: EAT THE DATA</div>
                            <div class="text-green-300">
                                SCORE: {{ snakeScore }}
                            </div>
                        </div>
                    </div>

                    <div
                        class="flex-1 relative bg-[#111] flex items-center justify-center overflow-hidden"
                        style="pointer-events: auto"
                    >
                        <canvas
                            ref="gameCanvas"
                            width="400"
                            height="300"
                            class="snake-canvas"
                            id="snakeGameCanvas"
                        ></canvas>

                        <div
                            v-if="!gameRunning"
                            class="snake-overlay"
                            style="pointer-events: auto"
                        >
                            <h1
                                class="text-xl text-red-500 mb-4 font-bold tracking-widest"
                            >
                                {{ gameMessage }}
                            </h1>
                            <button
                                @click.stop="handleStartClick"
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
                    </div>
                </div>
            </div>
        </div>

        <div
            class="absolute bottom-0 left-0 w-full h-10 bg-[#c0c0c0] border-t-2 border-white flex items-center px-2 shadow-[0_-2px_4px_rgba(0,0,0,0.2)] z-50"
        >
            <button
                class="flex items-center gap-2 px-2 py-1 border-2 border-t-white border-l-white border-b-black border-r-black active:border-t-black active:border-l-black active:border-b-white active:border-r-white bg-[#c0c0c0] mr-4 font-bold text-xs"
            >
                <div
                    class="w-4 h-4 bg-gradient-to-br from-green-500 to-blue-600"
                ></div>
                NIRD
            </button>

            <div class="flex gap-1 flex-1">
                <div
                    v-for="win in windows"
                    v-show="win.isOpen"
                    :key="win.id"
                    class="px-2 py-1 text-xs border-2 w-32 truncate cursor-pointer select-none"
                    :class="
                        activeWindowId === win.id
                            ? 'bg-[#e0e0e0] border-t-black border-l-black border-b-white border-r-white font-bold'
                            : 'bg-[#c0c0c0] border-t-white border-l-white border-b-black border-r-black'
                    "
                    @click="focusWindow(win.id)"
                >
                    {{ win.title }}
                </div>
            </div>

            <div
                class="border-2 border-t-gray-500 border-l-gray-500 border-b-white border-r-white px-2 py-1 text-xs bg-[#c0c0c0]"
            >
                {{ time }}
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick } from "vue";
import CVEExplorer from "./components/CVEExplorer.vue";

const activeWindowId = ref("browser");
const isDragging = ref(false);
const dragOffset = reactive({ x: 0, y: 0 });
const draggedWindowId = ref(null);
const browserUrl = ref("https://nird.forge.apps.education.fr/");
const time = ref("");
const konamiTriggered = ref(false);

const konamiCode = [
    "ArrowUp",
    "ArrowUp",
    "ArrowDown",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "ArrowLeft",
    "ArrowRight",
    "b",
    "a",
];
let konamiIndex = 0;

const windows = reactive([
    {
        id: "browser",
        title: "LibreWeb Navigator",
        x: 50,
        y: 40,
        w: 600,
        h: 450,
        isOpen: true,
        z: 1,
        type: "browser",
        icon: "🌐",
    },
    {
        id: "cve",
        title: "GAFAM Vulnerability DB",
        x: 150,
        y: 80,
        w: 600,
        h: 500,
        isOpen: false,
        z: 2,
        type: "cve",
        icon: "⚠️",
    },
    {
        id: "terminal",
        title: "Terminal",
        x: 300,
        y: 200,
        w: 400,
        h: 300,
        isOpen: false,
        z: 3,
        type: "terminal",
        icon: "💻",
    },
    {
        id: "snake",
        title: "TACTICAL ESPIONAGE ACTION",
        x: 200,
        y: 100,
        w: 500,
        h: 450,
        isOpen: false,
        z: 100,
        type: "snake",
        icon: "🐍",
    },
]);

const focusWindow = (id) => {
    activeWindowId.value = id;
    const maxZ = Math.max(...windows.map((w) => w.z));
    const win = windows.find((w) => w.id === id);
    if (win && win.z !== maxZ) {
        win.z = maxZ + 1;
    }
};

const closeWindow = (id) => {
    const win = windows.find((w) => w.id === id);
    if (win) {
        if (id === "snake") {
            gameRunning.value = false;
            if (gameLoop) clearInterval(gameLoop);
        }
        win.isOpen = false;
    }
};

const openWindow = (id) => {
    const win = windows.find((w) => w.id === id);
    if (win) {
        win.isOpen = true;
        focusWindow(id);
    }
};

const startDrag = (e, id) => {
    isDragging.value = true;
    draggedWindowId.value = id;
    focusWindow(id);

    const win = windows.find((w) => w.id === id);
    dragOffset.x = e.clientX - win.x;
    dragOffset.y = e.clientY - win.y;
};

const onDrag = (e) => {
    if (!isDragging.value || !draggedWindowId.value) return;

    const win = windows.find((w) => w.id === draggedWindowId.value);
    if (win) {
        win.x = e.clientX - dragOffset.x;
        win.y = e.clientY - dragOffset.y;
    }
};

const stopDrag = () => {
    isDragging.value = false;
    draggedWindowId.value = null;
};

const handleKeydown = (e) => {
    if (gameRunning.value) {
        handleSnakeInput(e);
    }

    if (e.key === konamiCode[konamiIndex]) {
        konamiIndex++;
        if (konamiIndex === konamiCode.length) {
            triggerKonami();
            konamiIndex = 0;
        }
    } else {
        konamiIndex = 0;
    }
};

const triggerKonami = () => {
    konamiTriggered.value = true;
    openWindow("terminal");
    setTimeout(() => {
        openWindow("snake");
    }, 1000);
};

const gameCanvas = ref(null);
const gameRunning = ref(false);
const snakeScore = ref(0);
const gameMessage = ref("TACTICAL MISSION START");
let ctx = null;
let gameLoop = null;

const gridSize = 20;
let snake = [];
let food = {};
let direction = "RIGHT";
let nextDirection = "RIGHT";
let startAttempts = 0;
const MAX_START_ATTEMPTS = 20;

const handleStartClick = () => {
    console.log("🔴 BUTTON CLICKED DIRECTLY!");
    startGame();
};

const getCanvasElement = () => {
    if (gameCanvas.value && gameCanvas.value instanceof HTMLCanvasElement) {
        console.log("✅ Canvas found via ref");
        return gameCanvas.value;
    }

    const byId = document.getElementById("snakeGameCanvas");
    if (byId && byId instanceof HTMLCanvasElement) {
        console.log("✅ Found canvas via ID");
        gameCanvas.value = byId;
        return byId;
    }

    const canvasEl = document.querySelector(".snake-canvas");
    if (canvasEl && canvasEl instanceof HTMLCanvasElement) {
        console.log("✅ Found canvas via querySelector");
        gameCanvas.value = canvasEl;
        return canvasEl;
    }

    console.error("❌ Canvas not found by any method");
    return null;
};

const waitForCanvas = async () => {
    const snakeWindow = windows.find((w) => w.id === "snake");
    if (!snakeWindow || !snakeWindow.isOpen) {
        console.error("❌ Snake window is not open!");
        return null;
    }

    console.log("✅ Snake window is open, searching for canvas...");

    for (let i = 0; i < MAX_START_ATTEMPTS; i++) {
        await nextTick();

        const canvas = getCanvasElement();
        if (canvas) {
            console.log("✅ Canvas ready after", i + 1, "attempts");
            return canvas;
        }

        console.log("⏳ Waiting for canvas... attempt", i + 1);
        await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.error("❌ Canvas not found after", MAX_START_ATTEMPTS, "attempts");
    return null;
};

const startGame = async () => {
    console.log("🎮 START GAME FUNCTION CALLED!");

    const canvas = await waitForCanvas();

    if (!canvas) {
        console.error("❌ Canvas not found after waiting");
        console.log("gameCanvas.value =", gameCanvas.value);
        console.log(
            "Snake window open?",
            windows.find((w) => w.id === "snake")?.isOpen,
        );
        console.log(
            "Canvas by ID:",
            document.getElementById("snakeGameCanvas"),
        );
        console.log(
            "Canvas by class:",
            document.querySelector(".snake-canvas"),
        );

        console.log("🔄 One final attempt with 500ms delay...");
        await new Promise((resolve) => setTimeout(resolve, 500));
        const finalCanvas = getCanvasElement();

        if (finalCanvas) {
            console.log("✅ Canvas found on final attempt!");
            return startGameWithCanvas(finalCanvas);
        }

        alert(
            "Error: Canvas not found. The Snake window may not be fully loaded.\n\nTry:\n1. Close the Snake window\n2. Wait 1 second\n3. Enter Konami Code again",
        );
        return;
    }

    return startGameWithCanvas(canvas);
};

const startGameWithCanvas = (canvas) => {
    console.log("✅ Canvas element found:", canvas);
    console.log("✅ Canvas dimensions:", canvas.width, "x", canvas.height);
    console.log("✅ Starting game...");

    try {
        ctx = canvas.getContext("2d");
        if (!ctx) {
            console.error("❌ Could not get 2D context!");
            alert("Error: Could not initialize game graphics.");
            return;
        }

        console.log("✅ Got 2D context:", ctx);

        ctx.imageSmoothingEnabled = false;

        snake = [
            { x: 5, y: 5 },
            { x: 4, y: 5 },
            { x: 3, y: 5 },
        ];
        direction = "RIGHT";
        nextDirection = "RIGHT";
        snakeScore.value = 0;
        gameRunning.value = true;
        spawnFood();

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawGame();

        if (gameLoop) clearInterval(gameLoop);
        gameLoop = setInterval(updateGame, 100);
        console.log("✅ Game started successfully! Snake is moving!");
    } catch (error) {
        console.error("❌ Error starting game:", error);
        console.error("Stack trace:", error.stack);
        alert("Error starting game: " + error.message);
    }
};

const spawnFood = () => {
    if (!gameCanvas.value) {
        console.error("❌ Cannot spawn food: canvas not found");
        return;
    }
    const cols = gameCanvas.value.width / gridSize;
    const rows = gameCanvas.value.height / gridSize;
    food = {
        x: Math.floor(Math.random() * cols),
        y: Math.floor(Math.random() * rows),
    };
};

const handleSnakeInput = (e) => {
    switch (e.key) {
        case "ArrowUp":
            if (direction !== "DOWN") nextDirection = "UP";
            break;
        case "ArrowDown":
            if (direction !== "UP") nextDirection = "DOWN";
            break;
        case "ArrowLeft":
            if (direction !== "RIGHT") nextDirection = "LEFT";
            break;
        case "ArrowRight":
            if (direction !== "LEFT") nextDirection = "RIGHT";
            break;
    }
};

const updateGame = () => {
    if (!gameCanvas.value || !ctx) {
        console.error("❌ Cannot update game: canvas or context not found");
        gameOver();
        return;
    }

    direction = nextDirection;
    const head = { ...snake[0] };

    if (direction === "UP") head.y--;
    if (direction === "DOWN") head.y++;
    if (direction === "LEFT") head.x--;
    if (direction === "RIGHT") head.x++;

    const cols = gameCanvas.value.width / gridSize;
    const rows = gameCanvas.value.height / gridSize;

    if (
        head.x < 0 ||
        head.x >= cols ||
        head.y < 0 ||
        head.y >= rows ||
        checkSelfCollision(head)
    ) {
        gameOver();
        return;
    }

    snake.unshift(head);

    console.log(
        "Before update - snake length:",
        snake.length,
        "positions:",
        snake,
    );

    if (head.x === food.x && head.y === food.y) {
        snakeScore.value += 10;
        spawnFood();
        console.log("🍎 Food eaten! New length:", snake.length);
    } else {
        const lengthBefore = snake.length;
        const removed = snake.pop();
        const lengthAfter = snake.length;
        console.log(
            "🐍 Pop called - Before:",
            lengthBefore,
            "After:",
            lengthAfter,
            "Removed:",
            removed,
        );
    }

    console.log("After update - snake length:", snake.length);
    console.log("Snake array:", JSON.stringify(snake));
    drawGame();
};

const checkSelfCollision = (head) => {
    return snake
        .slice(1)
        .some((segment) => segment.x === head.x && segment.y === head.y);
};

const drawGame = () => {
    if (!gameCanvas.value) {
        console.error("❌ No canvas in drawGame");
        return;
    }

    if (!ctx) {
        console.error("❌ No context in drawGame, trying to get it");
        ctx = gameCanvas.value.getContext("2d");
        if (!ctx) {
            console.error("❌ Failed to get context");
            return;
        }
    }

    console.log(
        "🎨 About to draw",
        snake.length,
        "segments at positions:",
        snake.slice(0, 3),
    );

    ctx.clearRect(0, 0, gameCanvas.value.width, gameCanvas.value.height);

    ctx.fillStyle = "#051005";
    ctx.fillRect(0, 0, gameCanvas.value.width, gameCanvas.value.height);

    ctx.strokeStyle = "#0f200f";
    ctx.lineWidth = 1;
    for (let i = 0; i < gameCanvas.value.width; i += gridSize) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, gameCanvas.value.height);
        ctx.stroke();
    }
    for (let i = 0; i < gameCanvas.value.height; i += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(gameCanvas.value.width, i);
        ctx.stroke();
    }

    console.log("🎨 Drawing loop - iterating over", snake.length, "segments");
    snake.forEach((seg, index) => {
        console.log(`  Segment ${index}: (${seg.x}, ${seg.y})`);
        ctx.fillStyle = index === 0 ? "#4ade80" : "#22c55e";
        ctx.fillRect(
            seg.x * gridSize + 1,
            seg.y * gridSize + 1,
            gridSize - 2,
            gridSize - 2,
        );

        if (index === 0) {
            ctx.fillStyle = "red";
            ctx.fillRect(
                seg.x * gridSize + 4,
                seg.y * gridSize + 4,
                gridSize - 8,
                4,
            );
        }
    });
    console.log("🎨 Finished drawing all segments");

    ctx.fillStyle = "#fbbf24";
    ctx.font = "20px monospace";
    ctx.fillText("!", food.x * gridSize + 5, food.y * gridSize + 18);
};

const gameOver = () => {
    gameRunning.value = false;
    gameMessage.value = "SNAKE? SNAKE! SNAKEEEEE!";
    if (gameLoop) clearInterval(gameLoop);
};

onMounted(() => {
    setInterval(() => {
        const now = new Date();
        time.value = now.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    }, 1000);

    window.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
    window.removeEventListener("keydown", handleKeydown);
    if (gameLoop) clearInterval(gameLoop);
});
</script>

<style scoped></style>
