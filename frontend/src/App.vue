<style scoped>
.resize-handle {
    position: absolute;
    z-index: 10;
}

.resize-handle-e {
    right: -4px;
    top: 0;
    width: 8px;
    height: 100%;
    cursor: ew-resize;
}

.resize-handle-w {
    left: -4px;
    top: 0;
    width: 8px;
    height: 100%;
    cursor: ew-resize;
}

.resize-handle-n {
    left: 0;
    top: -4px;
    width: 100%;
    height: 8px;
    cursor: ns-resize;
}

.resize-handle-s {
    left: 0;
    bottom: -4px;
    width: 100%;
    height: 8px;
    cursor: ns-resize;
}

.resize-handle-se {
    right: -4px;
    bottom: -4px;
    width: 12px;
    height: 12px;
    cursor: nwse-resize;
}

.resize-handle-sw {
    left: -4px;
    bottom: -4px;
    width: 12px;
    height: 12px;
    cursor: nesw-resize;
}

.resize-handle-ne {
    right: -4px;
    top: -4px;
    width: 12px;
    height: 12px;
    cursor: nesw-resize;
}

.resize-handle-nw {
    left: -4px;
    top: -4px;
    width: 12px;
    height: 12px;
    cursor: nwse-resize;
}
</style>

<template>
    <div
        class="h-screen w-screen relative overflow-hidden"
        @mousemove="handleMouseMove"
        @mouseup="handleMouseUp"
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
                    class="h-full"
                    :key="'snake-content'"
                >
                    <SnakeGame />
                </div>
            </div>

            <!-- Resize Handles -->
            <div
                class="resize-handle resize-handle-e"
                @mousedown.stop="startResize($event, win.id, 'e')"
            ></div>
            <div
                class="resize-handle resize-handle-s"
                @mousedown.stop="startResize($event, win.id, 's')"
            ></div>
            <div
                class="resize-handle resize-handle-w"
                @mousedown.stop="startResize($event, win.id, 'w')"
            ></div>
            <div
                class="resize-handle resize-handle-n"
                @mousedown.stop="startResize($event, win.id, 'n')"
            ></div>
            <div
                class="resize-handle resize-handle-se"
                @mousedown.stop="startResize($event, win.id, 'se')"
            ></div>
            <div
                class="resize-handle resize-handle-sw"
                @mousedown.stop="startResize($event, win.id, 'sw')"
            ></div>
            <div
                class="resize-handle resize-handle-ne"
                @mousedown.stop="startResize($event, win.id, 'ne')"
            ></div>
            <div
                class="resize-handle resize-handle-nw"
                @mousedown.stop="startResize($event, win.id, 'nw')"
            ></div>
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
import SnakeGame from "./components/SnakeGame.vue";

const activeWindowId = ref("browser");
const isDragging = ref(false);
const dragOffset = reactive({ x: 0, y: 0 });
const draggedWindowId = ref(null);
const isResizing = ref(false);
const resizingWindowId = ref(null);
const resizeDirection = ref(null);
const resizeStart = reactive({ x: 0, y: 0, w: 0, h: 0, winX: 0, winY: 0 });
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
    if (isResizing.value) return;
    isDragging.value = true;
    draggedWindowId.value = id;
    focusWindow(id);

    const win = windows.find((w) => w.id === id);
    dragOffset.x = e.clientX - win.x;
    dragOffset.y = e.clientY - win.y;
};

const startResize = (e, id, direction) => {
    isResizing.value = true;
    resizingWindowId.value = id;
    resizeDirection.value = direction;
    focusWindow(id);

    const win = windows.find((w) => w.id === id);
    resizeStart.x = e.clientX;
    resizeStart.y = e.clientY;
    resizeStart.w = win.w;
    resizeStart.h = win.h;
    resizeStart.winX = win.x;
    resizeStart.winY = win.y;
};

const handleMouseMove = (e) => {
    if (isDragging.value && draggedWindowId.value) {
        const win = windows.find((w) => w.id === draggedWindowId.value);
        if (win) {
            win.x = e.clientX - dragOffset.x;
            win.y = e.clientY - dragOffset.y;
        }
    } else if (isResizing.value && resizingWindowId.value) {
        const win = windows.find((w) => w.id === resizingWindowId.value);
        if (!win) return;

        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;
        const minWidth = 300;
        const minHeight = 200;

        const dir = resizeDirection.value;

        // East (right edge)
        if (dir.includes("e")) {
            win.w = Math.max(minWidth, resizeStart.w + deltaX);
        }

        // West (left edge)
        if (dir.includes("w")) {
            const newWidth = Math.max(minWidth, resizeStart.w - deltaX);
            if (newWidth > minWidth) {
                win.w = newWidth;
                win.x = resizeStart.winX + deltaX;
            } else {
                win.w = minWidth;
                win.x = resizeStart.winX + resizeStart.w - minWidth;
            }
        }

        // South (bottom edge)
        if (dir.includes("s")) {
            win.h = Math.max(minHeight, resizeStart.h + deltaY);
        }

        // North (top edge)
        if (dir.includes("n")) {
            const newHeight = Math.max(minHeight, resizeStart.h - deltaY);
            if (newHeight > minHeight) {
                win.h = newHeight;
                win.y = resizeStart.winY + deltaY;
            } else {
                win.h = minHeight;
                win.y = resizeStart.winY + resizeStart.h - minHeight;
            }
        }
    }
};

const handleMouseUp = () => {
    isDragging.value = false;
    draggedWindowId.value = null;
    isResizing.value = false;
    resizingWindowId.value = null;
    resizeDirection.value = null;
};

const handleKeydown = (e) => {
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

// Snake game is now a separate component (SnakeGame.vue)

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
