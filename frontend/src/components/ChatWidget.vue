<script setup lang="ts">
import { ref } from 'vue';
import ChatBot from './ChatBot.vue';

const isOpen = ref(false);
const isMinimized = ref(false);

function toggleChat() {
  if (isMinimized.value) {
    isMinimized.value = false;
  } else {
    isOpen.value = !isOpen.value;
  }
}

function minimizeChat() {
  isMinimized.value = true;
}

function closeChat() {
  isOpen.value = false;
  isMinimized.value = false;
}
</script>

<template>
  <div class="chat-widget">
    <!-- Bouton flottant -->
    <button 
      class="chat-toggle-button"
      :class="{ 'is-open': isOpen && !isMinimized }"
      @click="toggleChat"
      aria-label="Ouvrir le chat"
    >
      <span class="button-icon" v-if="!isOpen || isMinimized">🦎</span>
      <span class="button-icon close-icon" v-else>✕</span>
      <span class="button-pulse"></span>
      <span class="notification-badge" v-if="!isOpen">1</span>
    </button>

    <!-- Fenêtre de chat -->
    <Transition name="chat-window">
      <div 
        v-if="isOpen" 
        class="chat-window"
        :class="{ 'is-minimized': isMinimized }"
      >
        <!-- Header de la fenêtre -->
        <div class="window-header">
          <div class="window-title">
            <span class="window-icon">🦎</span>
            <span>Axolotl - Support</span>
          </div>
          <div class="window-controls">
            <button class="control-btn minimize-btn" @click="minimizeChat" aria-label="Réduire">
              <span>─</span>
            </button>
            <button class="control-btn close-btn" @click="closeChat" aria-label="Fermer">
              <span>✕</span>
            </button>
          </div>
        </div>

        <!-- Contenu du chat -->
        <div class="window-content" v-show="!isMinimized">
          <ChatBot :widget-mode="true" />
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.chat-widget {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
  font-family: 'Segoe UI', system-ui, sans-serif;
}

/* Bouton flottant */
.chat-toggle-button {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: #646cff;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: 0 4px 20px rgba(100, 108, 255, 0.4);
  transition: all 0.3s ease;
}

.chat-toggle-button:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 30px rgba(100, 108, 255, 0.5);
}

.chat-toggle-button.is-open {
  background-color: #1a1a2e;
}

.button-icon {
  font-size: 1.8rem;
  z-index: 2;
}

.close-icon {
  font-size: 1.4rem;
  color: #fff;
}

.button-pulse {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 2px solid #646cff;
  animation: pulse-animation 2s ease-out infinite;
}

@keyframes pulse-animation {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(1.4);
    opacity: 0;
  }
}

.notification-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  width: 22px;
  height: 22px;
  background-color: #ff4757;
  color: #fff;
  font-size: 0.75rem;
  font-weight: bold;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #050508;
  animation: bounce-badge 1s ease infinite;
}

@keyframes bounce-badge {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

/* Fenêtre de chat */
.chat-window {
  position: absolute;
  bottom: 80px;
  right: 0;
  width: 380px;
  height: 600px;
  background-color: #0a0a0f;
  border: 2px solid #1a1a2e;
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 50px rgba(0, 0, 0, 0.5);
}

.chat-window.is-minimized {
  height: auto;
}

/* Header de la fenêtre */
.window-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: #0f0f1a;
  border-bottom: 1px solid #1a1a2e;
  cursor: move;
}

.window-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #fff;
  font-weight: 600;
  font-size: 0.95rem;
}

.window-icon {
  font-size: 1.4rem;
}

.window-controls {
  display: flex;
  gap: 8px;
}

.control-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  transition: all 0.2s ease;
}

.minimize-btn {
  background-color: #ffd93d;
  color: #000;
}

.minimize-btn:hover {
  background-color: #ffcc00;
}

.close-btn {
  background-color: #ff4757;
  color: #fff;
}

.close-btn:hover {
  background-color: #ff3344;
}

/* Contenu */
.window-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.window-content :deep(.chatbot-container) {
  height: 100%;
  max-height: none;
  border: none;
  border-radius: 0;
  box-shadow: none;
}

.window-content :deep(.chatbot-header) {
  display: none;
}

/* Animations */
.chat-window-enter-active {
  animation: window-in 0.3s ease;
}

.chat-window-leave-active {
  animation: window-out 0.2s ease;
}

@keyframes window-in {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes window-out {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
}

/* Responsive */
@media (max-width: 480px) {
  .chat-widget {
    bottom: 10px;
    right: 10px;
  }

  .chat-window {
    position: fixed;
    bottom: 0;
    right: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: 0;
    border: none;
  }

  .chat-toggle-button {
    width: 55px;
    height: 55px;
  }
}
</style>
