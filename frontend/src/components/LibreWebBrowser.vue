<template>
    <div class="h-full flex flex-col">
        <div
            class="bg-gray-200 p-1 border-b border-gray-400 flex gap-2 mb-1 text-xs"
        >
            <button
                class="border border-gray-500 px-2 bg-gray-100 shadow-sm active:translate-y-0.5"
                @click="goHome"
            >
                Home
            </button>
            <input
                type="text"
                v-model="urlInput"
                @keyup.enter="navigate"
                class="flex-1 border border-gray-500 px-1 font-mono text-xs"
                placeholder="Enter URL..."
            />
            <button
                class="border border-gray-500 px-2 bg-gray-100 shadow-sm active:translate-y-0.5"
                @click="navigate"
            >
                Go
            </button>
        </div>
        <iframe
            :src="url"
            class="w-full flex-1 border border-gray-500"
            :class="{ 'pointer-events-none': isDragging }"
        ></iframe>
    </div>
</template>

<script setup>
import { ref, watch } from "vue";

const props = defineProps({
    url: {
        type: String,
        default: "https://nird.forge.apps.education.fr/",
    },
    isDragging: {
        type: Boolean,
        default: false,
    },
});

const emit = defineEmits(["update:url"]);

const urlInput = ref(props.url);

watch(
    () => props.url,
    (newUrl) => {
        urlInput.value = newUrl;
    },
    { immediate: true },
);

const navigate = () => {
    let targetUrl = urlInput.value.trim();

    if (targetUrl && !targetUrl.match(/^https?:\/\//i)) {
        targetUrl = "https://" + targetUrl;
    }

    if (targetUrl) {
        emit("update:url", targetUrl);
    }
};

const goHome = () => {
    urlInput.value = "https://nird.forge.apps.education.fr/";
    emit("update:url", "https://nird.forge.apps.education.fr/");
};
</script>

<style scoped></style>
