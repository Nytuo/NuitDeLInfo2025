<!-- Visualization.vue -->
<template>
  <div class="visualization-root">
    <button @click="startVisualization">
      Démarrer la visualisation audio système
    </button>

    <!-- Composant d'analyse totalement indépendant -->
    <SystemAudioAnalyzer
      ref="analyzerRef"
      @frame="onAudioFrame"
      @error="onError"
    />

    <p v-if="error" style="color:red;">{{ error }}</p>

    <!-- Scène 3D qui reçoit les métriques audio -->
    <AudioVisualizerScene :metrics="audioMetrics" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import SystemAudioAnalyzer from './SystemAudioAnalyzer.vue'
import AudioVisualizerScene from './AudioVisualizerScene.vue'

const analyzerRef = ref(null)
const error = ref('')

// métriques audio lues par SystemAudioAnalyzer et envoyées à la scène 3D
const audioMetrics = ref({
  rms: 0,
  bassEnergy: 0,
  midEnergy: 0,
  trebleEnergy: 0,
})

function startVisualization() {
  error.value = ''
  analyzerRef.value?.start()
}

function onError(msg) {
  error.value = msg
}

// Reçoit les valeurs calculées par SystemAudioAnalyzer
function onAudioFrame(m) {
  audioMetrics.value.rms = m.rms
  audioMetrics.value.bassEnergy = m.bassEnergy
  audioMetrics.value.midEnergy = m.midEnergy
  audioMetrics.value.trebleEnergy = m.trebleEnergy
}
</script>

<style scoped>
.visualization-root {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
