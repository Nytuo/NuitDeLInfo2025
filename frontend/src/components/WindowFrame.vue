<template>
    <div
        v-show="isOpen"
        class="retro-window"
        :style="{
            left: x + 'px',
            top: y + 'px',
            width: w + 'px',
            height: h + 'px',
            zIndex: z,
        }"
        @mousedown="$emit('focus')"
    >
        <div
            class="title-bar"
            :class="isActive ? 'active' : 'inactive'"
            @mousedown="handleTitleBarMouseDown"
        >
            <div class="flex items-center gap-2">
                <span v-if="icon" class="text-yellow-300">{{ icon }}</span>
                <span>{{ title }}</span>
            </div>
            <button class="btn-close" @click.stop="$emit('close')">X</button>
        </div>

        <div class="window-content bg-white text-black relative">
            <slot></slot>
        </div>

        <div
            class="resize-handle resize-handle-e"
            @mousedown.stop="(e) => handleResizeMouseDown(e, 'e')"
        ></div>
        <div
            class="resize-handle resize-handle-s"
            @mousedown.stop="(e) => handleResizeMouseDown(e, 's')"
        ></div>
        <div
            class="resize-handle resize-handle-w"
            @mousedown.stop="(e) => handleResizeMouseDown(e, 'w')"
        ></div>
        <div
            class="resize-handle resize-handle-n"
            @mousedown.stop="(e) => handleResizeMouseDown(e, 'n')"
        ></div>
        <div
            class="resize-handle resize-handle-se"
            @mousedown.stop="(e) => handleResizeMouseDown(e, 'se')"
        ></div>
        <div
            class="resize-handle resize-handle-sw"
            @mousedown.stop="(e) => handleResizeMouseDown(e, 'sw')"
        ></div>
        <div
            class="resize-handle resize-handle-ne"
            @mousedown.stop="(e) => handleResizeMouseDown(e, 'ne')"
        ></div>
        <div
            class="resize-handle resize-handle-nw"
            @mousedown.stop="(e) => handleResizeMouseDown(e, 'nw')"
        ></div>
    </div>
</template>

<script setup>
const props = defineProps({
    id: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    icon: {
        type: String,
        default: null,
    },
    x: {
        type: Number,
        required: true,
    },
    y: {
        type: Number,
        required: true,
    },
    w: {
        type: Number,
        required: true,
    },
    h: {
        type: Number,
        required: true,
    },
    z: {
        type: Number,
        required: true,
    },
    isOpen: {
        type: Boolean,
        required: true,
    },
    isActive: {
        type: Boolean,
        default: false,
    },
});

const emit = defineEmits(["focus", "close", "start-drag", "start-resize"]);

const handleTitleBarMouseDown = (e) => {
    emit("start-drag", e);
};

const handleResizeMouseDown = (e, direction) => {
    emit("start-resize", { event: e, direction });
};
</script>

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
