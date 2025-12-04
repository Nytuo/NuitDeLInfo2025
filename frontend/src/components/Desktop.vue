<template>
    <div class="absolute top-4 left-4 flex flex-col gap-6 z-0">
        <div class="desktop-icon" @click="$emit('open-window', 'browser')">
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
            <span class="text-xs">OpenWeb</span>
        </div>

        <div class="desktop-icon" @click="$emit('open-window', 'cve')">
            <svg
                class="icon-img text-red-500 bg-gray-800 border-2 border-white p-1"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
            >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            <span class="text-xs">CVE Explorer</span>
        </div>

        <div class="desktop-icon" @click="$emit('open-window', 'terminal')">
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

        <div class="desktop-icon" @click="$emit('open-window', 'visualizer')">
            <svg
                class="icon-img text-purple-400 bg-gray-900 border-2 border-white p-1"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
            >
                <line x1="4"  y1="18" x2="4"  y2="10"></line>
                <line x1="9"  y1="18" x2="9"  y2="6"></line>
                <line x1="14" y1="18" x2="14" y2="12"></line>
                <line x1="19" y1="18" x2="19" y2="8"></line>
            </svg>
            <span class="text-xs">
                Audio
                Master
                2000
            </span>
        </div>
    </div>
</template>

<script setup>
defineEmits(["open-window"]);
</script>

<style scoped></style>
