<template>
    <div
        class="absolute bottom-0 left-0 w-full h-10 bg-[#c0c0c0] border-t-2 border-white flex items-center px-2 shadow-[0_-2px_4px_rgba(0,0,0,0.2)] z-50"
    >
        <button
            class="flex items-center gap-2 px-2 py-1 border-2 border-t-white border-l-white border-b-black border-r-black active:border-t-black active:border-l-black active:border-b-white active:border-r-white bg-[#c0c0c0] mr-4 font-bold text-xs"
        >
            <div
                class="w-4 h-4 bg-gradient-to-br from-green-500 to-blue-600"
            ></div>
            TempleOS2
        </button>

        <div class="flex gap-1 flex-1">
            <div
                v-for="win in openWindows"
                :key="win.id"
                class="px-2 py-1 text-xs border-2 w-32 truncate cursor-pointer select-none"
                :class="
                    activeWindowId === win.id
                        ? 'bg-[#e0e0e0] border-t-black border-l-black border-b-white border-r-white font-bold'
                        : 'bg-[#c0c0c0] border-t-white border-l-white border-b-black border-r-black'
                "
                @click="$emit('focus-window', win.id)"
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
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";

const props = defineProps({
    windows: {
        type: Array,
        required: true,
    },
    activeWindowId: {
        type: String,
        default: null,
    },
});

defineEmits(["focus-window"]);

const time = ref("");

const openWindows = computed(() => {
    return props.windows.filter((w) => w.isOpen);
});

let timeInterval = null;

const updateTime = () => {
    const now = new Date();
    time.value = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });
};

onMounted(() => {
    updateTime();
    timeInterval = setInterval(updateTime, 1000);
});

onUnmounted(() => {
    if (timeInterval) {
        clearInterval(timeInterval);
    }
});
</script>

<style scoped></style>
