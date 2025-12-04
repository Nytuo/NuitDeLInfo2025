<script setup lang="ts">
import ChatBot from '@/components/ChatBot.vue';
</script>

<template>
  <div class="nexus-page">
    <div class="background-effects">
      <div class="particle" v-for="i in 20" :key="i" :style="{ '--delay': i * 0.5 + 's', '--x': Math.random() * 100 + '%' }"></div>
    </div>
    
    <main class="main-content">
      <header class="page-header">
        <h1 class="title">
          <span class="icon">🌐</span>
          Le Nexus Connecté
          <span class="icon">🌐</span>
        </h1>
        <p class="subtitle">Portail d'Interaction Dynamique</p>
      </header>
      
      <ChatBot />
      
      <footer class="page-footer">
        <p>Propulsé par l'IA d'Axolotl 🦎 • Nuit de l'Info {{ new Date().getFullYear() }}</p>
      </footer>
    </main>
  </div>
</template>

<style scoped>
.nexus-page {
  min-height: 100vh;
  background-color: #050508;
  position: relative;
  overflow: hidden;
}

.background-effects {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background-color: #646cff;
  border-radius: 50%;
  left: var(--x);
  animation: rise 15s linear infinite;
  animation-delay: var(--delay);
  opacity: 0.3;
}

@keyframes rise {
  0% {
    bottom: -10px;
    opacity: 0;
  }
  10% {
    opacity: 0.3;
  }
  90% {
    opacity: 0.3;
  }
  100% {
    bottom: 100vh;
    opacity: 0;
  }
}

.main-content {
  position: relative;
  z-index: 1;
  padding: 20px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.page-header {
  text-align: center;
  margin-bottom: 20px;
}

.title {
  font-size: 2rem;
  color: #fff;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.title .icon {
  font-size: 1.5rem;
  animation: spin 10s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.subtitle {
  color: #00d9ff;
  margin: 8px 0 0;
  font-size: 1rem;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.page-footer {
  text-align: center;
  padding: 20px;
  color: #666;
  font-size: 0.85rem;
  margin-top: auto;
}

@media (max-width: 640px) {
  .title {
    font-size: 1.4rem;
  }
  
  .subtitle {
    font-size: 0.8rem;
  }
  
  .page-header {
    margin-bottom: 10px;
  }
}
</style>
