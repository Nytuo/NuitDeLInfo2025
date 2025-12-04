<!-- SystemAudioAnalyzer.vue -->
<template>
  <!-- composant "service" sans UI -->
  <div style="display: none;"></div>
</template>

<script setup>
import { reactive, ref, onBeforeUnmount } from 'vue'

const props = defineProps({
  fftSize: {
    type: Number,
    default: 2048,
  },
})

const emit = defineEmits(['frame', 'ready', 'started', 'stopped', 'error'])

const isCapturing = ref(false)

let audioCtx = null
let analyser = null
let sourceNode = null
let stream = null
let timeDomainArray = null
let freqArray = null
let animationId = null

// Métriques réactives exposées via @frame
const metrics = reactive({
  timeDomain: [],
  frequency: [],
  rms: 0,
  bassEnergy: 0,
  midEnergy: 0,
  trebleEnergy: 0,
})

/**
 * Méthode publique : à appeler depuis le parent.
 * Doit être appelée suite à un geste utilisateur (click, keydown…)
 */
async function start() {
  if (isCapturing.value) return
  try {
    // L'utilisateur choisit un écran/fenêtre/onglet avec audio (YouTube, Spotify Web, etc.)
    stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true,
    })

    const hasAudio = stream.getAudioTracks().length > 0
    if (!hasAudio) {
      emit('error', 'Aucune piste audio dans le flux capturé.')
      stop()
      return
    }

    await initAudio(stream)
    startLoop()
    isCapturing.value = true
    emit('started')
  } catch (e) {
    console.error(e)
    emit('error', 'Échec de la capture (permission refusée ou non supportée).')
  }
}

/**
 * Méthode publique : arrêter la capture
 */
function stop() {
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }

  if (stream) {
    stream.getTracks().forEach(t => t.stop())
    stream = null
  }

  if (sourceNode) {
    try { sourceNode.disconnect() } catch (_) {}
    sourceNode = null
  }

  if (audioCtx) {
    audioCtx.close()
    audioCtx = null
  }

  isCapturing.value = false
  emit('stopped')
}

async function initAudio(captureStream) {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  if (audioCtx.state === 'suspended') {
    await audioCtx.resume()
  }

  analyser = audioCtx.createAnalyser()
  analyser.fftSize = props.fftSize

  const bufferLength = analyser.frequencyBinCount
  timeDomainArray = new Uint8Array(bufferLength)
  freqArray = new Uint8Array(bufferLength)

  sourceNode = audioCtx.createMediaStreamSource(captureStream)
  sourceNode.connect(analyser)

  emit('ready', { audioCtx, analyser })
}

function startLoop() {
  if (!analyser || !audioCtx) return

  const bufferLength = analyser.frequencyBinCount
  const sampleRate = audioCtx.sampleRate

  const loop = () => {
    analyser.getByteTimeDomainData(timeDomainArray)
    analyser.getByteFrequencyData(freqArray)

    metrics.timeDomain = Array.from(timeDomainArray)
    metrics.frequency = Array.from(freqArray)

    computeVolumeMetrics(timeDomainArray)
    computeFrequencyMetrics(freqArray, sampleRate, bufferLength)

    emit('frame', { ...metrics })

    animationId = requestAnimationFrame(loop)
  }

  if (!animationId) loop()
}

function computeVolumeMetrics(timeArray) {
  let sumSquares = 0
  for (let i = 0; i < timeArray.length; i++) {
    const v = (timeArray[i] - 128) / 128
    sumSquares += v * v
  }
  metrics.rms = Math.sqrt(sumSquares / timeArray.length)
}

function computeFrequencyMetrics(freqArray, sampleRate, bufferLength) {
  let bass = 0
  let mid = 0
  let treble = 0

  for (let i = 0; i < bufferLength; i++) {
    const magnitude = freqArray[i]
    const freq = (i * sampleRate) / (2 * bufferLength)

    if (freq < 250) bass += magnitude
    else if (freq < 4000) mid += magnitude
    else treble += magnitude
  }

  metrics.bassEnergy = bass
  metrics.midEnergy = mid
  metrics.trebleEnergy = treble
}

onBeforeUnmount(() => {
  stop()
})

// On expose les méthodes pour que le parent puisse contrôler l’analyzer
defineExpose({
  start,
  stop,
  isCapturing,
})
</script>
