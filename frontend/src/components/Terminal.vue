<template>
    <div
        class="bg-black text-green-500 h-full flex flex-col font-mono text-xs overflow-hidden"
        @click="focusInput"
    >
        <div class="flex-1 overflow-auto p-2" ref="outputContainer">
            <p>TempleOS2 OS [Version 1.0.42]</p>
            <p>(c) 2025 Resistance Corp. All rights reserved.</p>
            <br />

            <div v-if="konamiTriggered" class="mb-4 text-yellow-400">
                > SYSTEM OVERRIDE DETECTED...<br />
                > LOADING TACTICAL ESPIONAGE MODULE...
            </div>

            <div v-for="(entry, index) in history" :key="index" class="mb-1">
                <div class="text-green-500">
                    <span class="text-cyan-400">user@TempleOS2</span>:<span
                        class="text-blue-400"
                        >~</span
                    >$ {{ entry.command }}
                </div>
                <div v-html="entry.output" class="whitespace-pre-wrap"></div>
            </div>

            <div class="flex items-center">
                <span class="text-cyan-400">user@TempleOS2</span>:<span
                    class="text-blue-400"
                    >~</span
                >$
                <input
                    ref="inputField"
                    v-model="currentCommand"
                    @keydown.enter="executeCommand"
                    @keydown.up="navigateHistory(-1)"
                    @keydown.down="navigateHistory(1)"
                    @keydown.tab.prevent="autocomplete"
                    class="flex-1 bg-transparent outline-none text-green-500 ml-1"
                    type="text"
                    spellcheck="false"
                />
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, nextTick, onMounted, watch } from "vue";

const props = defineProps({
    konamiTriggered: {
        type: Boolean,
        default: false,
    },
});

const emit = defineEmits(["open-snake"]);

const currentCommand = ref("");
const history = ref([]);
const commandHistory = ref([]);
const historyIndex = ref(-1);
const inputField = ref(null);
const outputContainer = ref(null);

const fileSystem = {
    "README.md": `# Welcome to TempleOS2

This is a retro-futuristic operating system running in your browser.

## Features
- Multi-window management
- CVE Explorer
- Audio Visualizer
- Secret Snake Game (Konami Code: ↑↑↓↓←→←→BA)

Made with ❤️ for Nuit de l'Info 2025
`,
    "secrets.txt": `TOP SECRET - LEVEL 5 CLEARANCE

KONAMI CODE: ↑↑↓↓←→←→BA

This will unlock TACTICAL_ESPIONAGE.exe

Alternative: Type 'snake' command in terminal
`,
    "about.txt": `TempleOS2 OS Version 1.0.42
Built on Vue.js 3 + Vite
Resistance Corp (c) 2025

All your windows are belong to us.
`,
};

const commands = {
    help: () => {
        return `<span class="text-yellow-400">Available Commands:</span>

  <span class="text-cyan-400">help</span>       - Display this help message
  <span class="text-cyan-400">ls</span>         - List files in current directory
  <span class="text-cyan-400">cat</span> [file] - Display contents of a file
  <span class="text-cyan-400">clear</span>      - Clear the terminal screen
  <span class="text-cyan-400">date</span>       - Display current date and time
  <span class="text-cyan-400">echo</span> [text]- Print text to terminal
  <span class="text-cyan-400">neofetch</span>   - Display system information
  <span class="text-cyan-400">snake</span>      - Launch TACTICAL_ESPIONAGE.exe

<span class="text-gray-500">Tip: Use TAB for autocomplete, ↑↓ for command history</span>`;
    },

    ls: () => {
        const files = Object.keys(fileSystem);
        return files
            .map((file) => `<span class="text-blue-300">${file}</span>`)
            .join("  ");
    },

    cat: (args) => {
        if (!args[0]) {
            return '<span class="text-red-400">Error: cat requires a filename</span>\nUsage: cat [filename]';
        }
        const filename = args[0];
        if (fileSystem[filename]) {
            return `<span class="text-gray-300">${fileSystem[filename].replace(/\n/g, "<br>")}</span>`;
        } else {
            return `<span class="text-red-400">Error: File '${filename}' not found</span>\nTry 'ls' to see available files`;
        }
    },

    clear: () => {
        history.value = [];
        return null;
    },

    date: () => {
        const now = new Date();
        return `<span class="text-purple-300">${now.toString()}</span>`;
    },

    echo: (args) => {
        return args.join(" ");
    },

    neofetch: () => {
        return `<span class="text-cyan-400">
   _____                 _      ___  _____ ___
  |_   _|__ _ __  _ __ | | ___|   \\/ ____|_  )
    | |/ _ \\ '_ \\| '_ \\| |/ _ \\ |\\/| \\__ \\ / /
    | |  __/ | | | |_) | |  __/ |  | |__) / /_
    |_|\\___|_| |_| .__/|_|\\___|_|  |_|____/____|
                 |_|
</span>
<span class="text-yellow-400">OS:</span>        TempleOS2 1.0.42
<span class="text-yellow-400">Kernel:</span>    Vue.js 3.5.24
<span class="text-yellow-400">Shell:</span>     TempleOS2 Terminal
<span class="text-yellow-400">Resolution:</span> ${window.innerWidth}x${window.innerHeight}
<span class="text-yellow-400">DE:</span>        TempleOS2-NotWayland
<span class="text-yellow-400">Terminal:</span>  VT100 Compatible
<span class="text-yellow-400">CPU:</span>       JavaScript V8 Engine
<span class="text-yellow-400">Memory:</span>    ${navigator.deviceMemory ? navigator.deviceMemory + " GB" : "Unknown"}
<span class="text-yellow-400">Uptime:</span>    ${Math.floor(performance.now() / 1000)} seconds

<span class="text-green-400">████</span><span class="text-red-400">████</span><span class="text-yellow-400">████</span><span class="text-blue-400">████</span><span class="text-purple-400">████</span><span class="text-cyan-400">████</span>`;
    },

    snake: () => {
        emit("open-snake");
        return `<span class="text-green-400">
> Initializing TACTICAL_ESPIONAGE.exe...
> Loading assets...
> ████████████████████ 100%
> Launch successful!
</span>`;
    },
};

const executeCommand = () => {
    const cmd = currentCommand.value.trim();
    if (!cmd) return;

    commandHistory.value.push(cmd);
    historyIndex.value = commandHistory.value.length;

    const [command, ...args] = cmd.split(" ");

    let output = "";
    if (commands[command]) {
        const result = commands[command](args);
        if (result !== null) {
            output = result;
        }
    } else if (command) {
        output = `<span class="text-red-400">Command not found: ${command}</span>\nType 'help' for available commands`;
    }

    if (command !== "clear") {
        history.value.push({
            command: cmd,
            output: output,
        });
    }

    currentCommand.value = "";
    scrollToBottom();
};

const navigateHistory = (direction) => {
    if (commandHistory.value.length === 0) return;

    historyIndex.value += direction;
    if (historyIndex.value < 0) {
        historyIndex.value = 0;
    } else if (historyIndex.value >= commandHistory.value.length) {
        historyIndex.value = commandHistory.value.length;
        currentCommand.value = "";
        return;
    }

    currentCommand.value = commandHistory.value[historyIndex.value] || "";
};

const autocomplete = () => {
    const partial = currentCommand.value.toLowerCase();
    if (!partial) return;

    const matches = Object.keys(commands).filter((cmd) =>
        cmd.startsWith(partial),
    );

    if (matches.length === 1) {
        currentCommand.value = matches[0];
    } else if (matches.length > 1) {
        history.value.push({
            command: currentCommand.value,
            output: matches
                .map((m) => `<span class="text-cyan-400">${m}</span>`)
                .join("  "),
        });
        scrollToBottom();
    }
};

const focusInput = () => {
    inputField.value?.focus();
};

const scrollToBottom = () => {
    nextTick(() => {
        if (outputContainer.value) {
            outputContainer.value.scrollTop =
                outputContainer.value.scrollHeight;
        }
    });
};

onMounted(() => {
    focusInput();
});

watch(
    () => props.konamiTriggered,
    (newVal) => {
        if (newVal) {
            nextTick(() => {
                scrollToBottom();
            });
        }
    },
);
</script>

<style scoped>
input {
    caret-color: #10b981;
}

input::selection {
    background-color: #10b981;
    color: black;
}
</style>
