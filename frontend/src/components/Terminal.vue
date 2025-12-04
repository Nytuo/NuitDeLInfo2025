<template>
    <div
        class="bg-black text-green-500 h-full p-2 font-mono text-xs overflow-auto"
    >
        <p>TempleOS2 OS [Version 1.0.42]</p>
        <p>(c) 2025 Resistance Corp. All rights reserved.</p>
        <br />
        <p>user@TempleOS2:~$ <span class="animate-pulse">_</span></p>
        <p v-if="konamiTriggered" class="mt-4 text-yellow-400">
            > SYSTEM OVERRIDE DETECTED...<br />
            > LOADING TACTICAL ESPIONAGE MODULE...
        </p>
    </div>
</template>

<script setup>
defineProps({
    konamiTriggered: {
        type: Boolean,
        default: false,
    },
});
</script>

<style scoped></style>
