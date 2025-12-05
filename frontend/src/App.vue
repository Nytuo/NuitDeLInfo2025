<template>
    <div
        class="h-screen w-screen relative overflow-hidden"
        @mousemove="handleMouseMove"
        @mouseup="handleMouseUp"
    >
        <div class="scanlines"></div>

        <Desktop @open-window="openWindow" />

        <WindowFrame
            v-for="win in windows"
            :key="win.id"
            :id="win.id"
            :title="win.title"
            :icon="win.icon"
            :x="win.x"
            :y="win.y"
            :w="win.w"
            :h="win.h"
            :z="win.z"
            :is-open="win.isOpen"
            :is-active="activeWindowId === win.id"
            @focus="focusWindow(win.id)"
            @close="closeWindow(win.id)"
            @start-drag="startDrag($event, win.id)"
            @start-resize="startResize($event.event, win.id, $event.direction)"
        >
            <LibreWebBrowser
                v-if="win.type === 'browser'"
                v-model:url="browserUrl"
                :is-dragging="isDragging"
            />

            <CVEExplorer v-if="win.type === 'cve'" />

            <Terminal
                v-if="win.type === 'terminal'"
                :konami-triggered="konamiTriggered"
                @open-snake="openWindow('snake')"
            />

            <SnakeGame v-if="win.type === 'snake'" />
            <Visualizer v-if="win.type === 'visualizer'" />
        </WindowFrame>

        <!-- Taskbar -->
        <Taskbar
            :windows="windows"
            :active-window-id="activeWindowId"
            @focus-window="focusWindow"
        />

        <!-- Clippy-style Assistant -->
        <NexusClippy />
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from "vue";
import Desktop from "./components/Desktop.vue";
import WindowFrame from "./components/WindowFrame.vue";
import Taskbar from "./components/Taskbar.vue";
import LibreWebBrowser from "./components/LibreWebBrowser.vue";
import Terminal from "./components/Terminal.vue";
import CVEExplorer from "./components/CVEExplorer.vue";
import SnakeGame from "./components/SnakeGame.vue";
import SystemAudioAnalyzer from "./components/SystemAudioAnalyzer.vue";
import Visualizer from "./components/VisualizerCore.vue";
import NexusClippy from "./components/NexusClippy.vue";

const activeWindowId = ref("browser");
const isDragging = ref(false);
const dragOffset = reactive({ x: 0, y: 0 });
const draggedWindowId = ref(null);
const isResizing = ref(false);
const resizingWindowId = ref(null);
const resizeDirection = ref(null);
const resizeStart = reactive({ x: 0, y: 0, w: 0, h: 0, winX: 0, winY: 0 });

const browserUrl = ref("https://nird.forge.apps.education.fr/");
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
        title: "OpenWeb Navigator",
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
        title: "TempleOS2 Terminal",
        x: 250,
        y: 120,
        w: 500,
        h: 350,
        isOpen: false,
        z: 3,
        type: "terminal",
        icon: "💻",
    },
    {
        id: "snake",
        title: "TACTICAL_ESPIONAGE.exe",
        x: 350,
        y: 160,
        w: 420,
        h: 480,
        isOpen: false,
        z: 4,
        type: "snake",
        icon: "🐍",
    },
    {
        id: "visualizer",
        title: "Audio Visualizer",
        x: 200,
        y: 200,
        w: 700,
        h: 500,
        isOpen: false,
        z: 5,
        type: "visualizer",
        icon: "🎨",
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

        if (dir.includes("e")) {
            win.w = Math.max(minWidth, resizeStart.w + deltaX);
        }

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

        if (dir.includes("s")) {
            win.h = Math.max(minHeight, resizeStart.h + deltaY);
        }

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
    }, 500);
};

onMounted(() => {
    window.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
    window.removeEventListener("keydown", handleKeydown);
});
</script>

<style></style>
