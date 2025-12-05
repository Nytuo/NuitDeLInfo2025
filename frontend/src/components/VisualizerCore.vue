<!-- Visualization.vue -->
<template>
  <div class="visualization-root">
    <button
      class="visualization-button"
      @click="startVisualization"
    >
      Selection de la source
    </button>

    <SystemAudioAnalyzer
      ref="analyzerRef"
      @frame="onAudioFrame"
      @error="onError"
    />

    <p v-if="error" style="color:red;">{{ error }}</p>

    
    <AudioVisualizerScene :metrics="audioMetrics" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import SystemAudioAnalyzer from './SystemAudioAnalyzer.vue'
import AudioVisualizerScene from './AudioVisualizerScene.vue'

const analyzerRef = ref(null)
const error = ref('')

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

.visualization-button {
  border: 2px solid #333;     
  border-radius: 6px;          
  padding: 8px 16px;
  max-width: 260px;            
  width: 100%;                 
  background: #fff;
  cursor: pointer;
}
</style>
