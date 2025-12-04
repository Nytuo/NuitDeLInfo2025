<template>
  <!-- Conteneur dans lequel Three.js va injecter son canvas -->
  <div ref="containerEl" class="viz-3d-container"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as THREE from 'three'

// Props : métriques audio venant du parent
const props = defineProps({
  metrics: {
    type: Object,
    required: true,
  },
})

const containerEl = ref(null)

// Three.js
let scene, camera, renderer
let heroGroup, heroGeometry, heroMaterial
let heroBlobs = []       // blobs qui composent le "fluide"
let basePositions = null // positions de base de la géométrie
let spheres = []         // autres boules
let animationId = null
let clock
let lastTime = 0

// pour le parallax
const pointer = { x: 0, y: 0 }

// pour détecter les "impacts" de musique
let previousRms = 0

// paramètres du tunnel / cône
const TUNNEL_Z_FAR = -40   // début du tunnel (loin)
const TUNNEL_Z_NEAR = -8   // zone proche de la boule avant de passer devant
const CONE_RADIUS_FAR = 2.5      // rayon du cône loin derrière
const CONE_RADIUS_AT_HERO = 4.0  // rayon minimal autour de la boule centrale (ne la touche pas)
const CONE_RADIUS_NEAR = 8.0     // rayon du cône vers la caméra (très écarté)

// rayon "de base" de la boule centrale (géométrie)
const HERO_BASE_RADIUS = 1.2

// --- système de formes procédurales pour le coeur --- //
const SHAPES = ['circle', 'triangle', 'square']
let currentShapeIndex = 0      // 0 = circle
let nextShapeIndex = 0         // cible pendant la transition
let shapeBlend = 0             // interpolation 0..1 entre current & next
let shapeTransitioning = false
let shapeTransitionDuration = 3.5
let shapeHoldTime = 0          // temps passé dans la forme actuelle (hors transition)
let intensitySmooth = 0        // intensité lissée (pour la logique de forme)

// "burst" global déclenché par les beats pour renforcer les déformations
let beatBurst = 0

// --- état de "fluid split" --- //
let splitAmount = 0    // 0 = une seule masse, 1 = blobs pleinement séparés
let splitTarget = 0
let splitCooldown = 0  // évite de repasser instantanément en mode "fusion"

// --- paramètres pixel art --- //
const PIXEL_SCALE = 0.2 // 0.3–0.5 = plus ou moins gros pixels

function randomRange(min, max) {
  return min + Math.random() * (max - min)
}

// quantification simple (pour limiter la palette)
function quantize(v, steps) {
  return Math.round(v * steps) / steps
}

// calcule le rayon idéal du cône pour une profondeur z
function getConeRadiusForZ(z) {
  // entre TUNNEL_Z_FAR et 0 (plan de la boule)
  if (z <= 0) {
    const t = THREE.MathUtils.clamp(
      (z - TUNNEL_Z_FAR) / (0 - TUNNEL_Z_FAR),
      0,
      1
    )
    return THREE.MathUtils.lerp(CONE_RADIUS_FAR, CONE_RADIUS_AT_HERO, t)
  }

  // entre 0 et la zone proche de la caméra
  const cameraMaxZ = (camera?.position.z ?? 6) + 2
  const t = THREE.MathUtils.clamp(z / cameraMaxZ, 0, 1)
  return THREE.MathUtils.lerp(CONE_RADIUS_AT_HERO, CONE_RADIUS_NEAR, t)
}

/**
 * Facteur de forme procédural en fonction du type (circle, triangle, square)
 * On travaille en coordonnées polaires dans le plan XZ (autour de l'axe Y).
 * nx, ny, nz = direction normalisée du sommet (à partir de basePositions).
 */
function shapeRadiusFactor(shape, nx, ny, nz, t, intensity, burst) {
  const angle = Math.atan2(nz, nx) // [-π, π]
  const a = angle + t * 0.3       // légère rotation continue

  if (shape === 'circle') {
    // cercle organique : légères ondulations radiales
    const wobble =
      0.05 * Math.sin(5 * a + t * 2) +
      0.03 * Math.sin(11 * a - t * 1.3)
    return 1 + wobble * (0.5 + intensity) + burst * 0.1
  }

  if (shape === 'triangle') {
    // "triangle" / 3 lobes : symétrie d'ordre 3
    const k = 3
    const s = Math.cos(k * a)
    const tri = Math.abs(s) // 3 bosses
    const edges =
      0.25 * Math.sin(k * a * 2 + t * 3) * (0.5 + intensity + burst)
    return 0.8 + 0.45 * tri + edges
  }

  if (shape === 'square') {
    // "carré" / 4 lobes : symétrie d'ordre 4
    const k = 4
    const c = Math.abs(Math.cos(k * a))
    const s = Math.abs(Math.sin(k * a))
    const sq = Math.max(c, s) // 4 grands lobes
    const chamfer =
      0.15 * Math.sin(k * a * 1.5 - t * 2.2) * (0.5 + intensity) // coin chanfreiné
    return 0.85 + 0.4 * sq + chamfer + burst * 0.15
  }

  return 1
}

// renvoie l'index de forme souhaité en fonction de l'intensité lissée
function getDesiredShapeIndex(intensity) {
  if (intensity < 0.25) return 0 // circle
  if (intensity < 0.6) return 1  // triangle
  return 2                       // square
}

// met à jour l'état de forme (changement circle->triangle->square de manière logique)
function updateShapeState(dt, intensitySmoothed) {
  const desired = getDesiredShapeIndex(intensitySmoothed)

  if (!shapeTransitioning) {
    // temps passé dans la forme actuelle
    shapeHoldTime += dt

    // durée minimale par forme pour être lisible
    const minHoldPerShape = [5, 4, 3] // circle, triangle, square
    const minHold = minHoldPerShape[currentShapeIndex]

    // si l'intensité veut une nouvelle forme et qu'on a respecté la durée mini
    if (desired !== currentShapeIndex && shapeHoldTime > minHold) {
      shapeTransitioning = true
      shapeBlend = 0
      nextShapeIndex = desired
    }
  } else {
    // interpolation dans le temps
    shapeBlend = THREE.MathUtils.clamp(
      shapeBlend + dt / shapeTransitionDuration,
      0,
      1
    )

    // courbe d'easing douce (in-out)
    const eased = shapeBlend * shapeBlend * (3 - 2 * shapeBlend)
    shapeBlend = eased

    if (shapeBlend >= 0.999) {
      // fin de transition
      currentShapeIndex = nextShapeIndex
      shapeTransitioning = false
      shapeBlend = 0
      shapeHoldTime = 0
    }
  }
}

/**
 * Initialisation Three.js
 */
function initThree() {
  const container = containerEl.value
  if (!container) return

  const width = container.clientWidth || 800
  const height = container.clientHeight || 400

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x050509)

  // Caméra un peu en retrait, regardant le centre (où se trouve la grosse boule)
  camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100)
  camera.position.z = 6
  camera.lookAt(0, 0, 0)

  // --- RENDERER STYLE PIXEL ART --- //
  renderer = new THREE.WebGLRenderer({
    antialias: false,      // pas de lissage
    powerPreference: 'high-performance',
  })
  // expo globale un peu réduite pour un rendu moins "cramé"
  renderer.toneMappingExposure = 0.85

  renderer.setPixelRatio(1) // on garde le contrôle de la "résolution"
  // résolution interne plus basse pour des gros pixels
  renderer.setSize(width * PIXEL_SCALE, height * PIXEL_SCALE, false)
  renderer.domElement.style.width = width + 'px'
  renderer.domElement.style.height = height + 'px'
  renderer.domElement.style.imageRendering = 'pixelated'
  renderer.domElement.style.imageRendering = 'crisp-edges'
  container.appendChild(renderer.domElement)

  // --- Éclairage plus sombre & rétro --- //
  const ambientLight = new THREE.AmbientLight(0x101020, 0.18)
  scene.add(ambientLight)

  const keyLight = new THREE.DirectionalLight(0xffe2b0, 0.65)
  keyLight.position.set(3, 4, 6)
  scene.add(keyLight)

  const rimLight = new THREE.DirectionalLight(0x3b5bff, 0.35)
  rimLight.position.set(-4, 2, -3)
  scene.add(rimLight)

  const pointLight = new THREE.PointLight(0xfff4d0, 0.25)
  pointLight.position.set(0, 0, 4)
  scene.add(pointLight)

  // --- Boule centrale organique multi-blobs (fluide) --- //
  heroGeometry = new THREE.IcosahedronGeometry(HERO_BASE_RADIUS, 3) // low-poly
  basePositions = heroGeometry.attributes.position.array.slice()

  heroMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0x88ccff),
    roughness: 0.4,
    metalness: 0.2,
    flatShading: true, // faces bien visibles
  })

  heroGroup = new THREE.Group()
  heroBlobs = []

  const BLOB_COUNT = 3 // nombre de "morceaux" possibles du fluide

  for (let i = 0; i < BLOB_COUNT; i++) {
    const blob = new THREE.Mesh(heroGeometry, heroMaterial)
    heroBlobs.push(blob)
    heroGroup.add(blob)
  }

  scene.add(heroGroup)

  // --- Création de plusieurs boules dans un "cône" autour du centre --- //
  const SPHERE_COUNT = 40

  for (let i = 0; i < SPHERE_COUNT; i++) {
    const radius = 0.2 + Math.random() * 0.6
    // moins de segments pour un look plus rétro
    const geo = new THREE.SphereGeometry(radius, 12, 12)

    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0xffffff),
      roughness: 0.6,
      metalness: 0.1,
      flatShading: true,
      emissive: new THREE.Color(0x050510),
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 1,
    })

    const mesh = new THREE.Mesh(geo, mat)

    // Position initiale : profondeur aléatoire dans le tunnel
    const z = TUNNEL_Z_FAR + Math.random() * (TUNNEL_Z_NEAR - TUNNEL_Z_FAR)
    const baseConeRadius = getConeRadiusForZ(z)

    const angle = Math.random() * Math.PI * 2
    const radialFactor = 0.8 + Math.random() * 0.4  // 80% à 120% du rayon du cône
    const radial = baseConeRadius * radialFactor

    const x = Math.cos(angle) * radial
    const y = Math.sin(angle) * radial * 0.6

    mesh.position.set(x, y, z)

    // Données pour l'animation
    mesh.userData = {
      baseRadius: radius,
      speed: 10 + Math.random() * 10, // unités par seconde
      angle,
      radialFactor,
      spinSpeed: (Math.random() - 0.5) * 0.5,
      state: 'idle',              // 'idle' | 'exploding'
      explodeStartTime: 0,
      explodeDuration: 0.5 + Math.random() * 0.3,
      currentRadius: radius,      // rayon courant (mis à jour avec le scale)
    }

    spheres.push(mesh)
    scene.add(mesh)
  }

  clock = new THREE.Clock()
  lastTime = clock.getElapsedTime()

  window.addEventListener('resize', onResize)
  container.addEventListener('pointermove', onPointerMove)

  animate()
}

function onPointerMove(event) {
  const container = containerEl.value
  if (!container) return

  const rect = container.getBoundingClientRect()
  const x = (event.clientX - rect.left) / rect.width
  const y = (event.clientY - rect.top) / rect.height

  // Normalisation -1..1
  pointer.x = (x - 0.5) * 2
  pointer.y = (y - 0.5) * 2
}

function onResize() {
  if (!renderer || !camera || !containerEl.value) return
  const width = containerEl.value.clientWidth || 800
  const height = containerEl.value.clientHeight || 400

  camera.aspect = width / height
  camera.updateProjectionMatrix()

  renderer.setPixelRatio(1)
  renderer.setSize(width * PIXEL_SCALE, height * PIXEL_SCALE, false)
  renderer.domElement.style.width = width + 'px'
  renderer.domElement.style.height = height + 'px'
}

// Respawn d'une boule tout au fond du cône (loin & encore écartée du centre)
function respawnSphere(mesh) {
  const z = TUNNEL_Z_FAR + Math.random() * (TUNNEL_Z_NEAR - TUNNEL_Z_FAR)
  const baseConeRadius = getConeRadiusForZ(z)

  const angle = Math.random() * Math.PI * 2
  const radialFactor = 0.8 + Math.random() * 0.4
  const radial = baseConeRadius * radialFactor

  const x = Math.cos(angle) * radial
  const y = Math.sin(angle) * radial * 0.6

  mesh.position.set(x, y, z)
  mesh.userData.angle = angle
  mesh.userData.radialFactor = radialFactor
  mesh.userData.speed = 10 + Math.random() * 10
  mesh.userData.state = 'idle'
  mesh.userData.explodeDuration = 0.5 + Math.random() * 0.3
  mesh.scale.setScalar(1)
  mesh.userData.currentRadius = mesh.userData.baseRadius
  mesh.material.opacity = 1
  mesh.visible = true
}

/**
 * Boucle d’animation 3D
 */
function animate() {
  animationId = requestAnimationFrame(animate)

  if (!clock) return

  const t = clock.getElapsedTime()
  const dt = t - lastTime
  lastTime = t

  const { rms, bassEnergy, midEnergy, trebleEnergy } = props.metrics

  // Intensité globale (0–1)
  const intensity = Math.min(rms * 3, 1)

  // Intensité lissée pour des transitions plus stables
  const smoothing = 0.03
  intensitySmooth += (intensity - intensitySmooth) * smoothing

  // Détection d'un "beat" simple : montée rapide du RMS
  const rmsDelta = rms - previousRms
  const isBeat = rms > 0.15 && rmsDelta > 0.06
  previousRms = rms

  // --- Gestion du "burst" (évènements forts) ---
  if (isBeat) {
    beatBurst = Math.min(1, beatBurst + 0.35 * (0.3 + intensity))
  }
  // décroissance douce dans le temps
  const decay = Math.exp(-dt * 3.0)
  beatBurst *= decay

  // --- Gestion des transitions de formes de façon logique ---
  updateShapeState(dt, intensitySmooth)

  // --- Parallax : caméra qui suit doucement la souris ---
  const parallaxStrength = 1
  const targetX = pointer.x * parallaxStrength
  const targetY = -pointer.y * parallaxStrength

  camera.position.x += (targetX - camera.position.x) * 0.06
  camera.position.y += (targetY - camera.position.y) * 0.06
  camera.lookAt(0, 0, 0)

  // --- Boule principale / fluide : forme procédurale + déformation organique ---
  let heroScale = 1
  if (heroGeometry && basePositions) {
    const geom = heroGeometry
    const positions = geom.attributes.position.array

    const bass = Math.min(bassEnergy / 200000, 1)
    const mid = Math.min(midEnergy / 200000, 1)
    const treb = Math.min(trebleEnergy / 200000, 1)

    const bassInfluence = 0.5 * bass
    const midInfluence = 0.3 * mid
    const trebInfluence = 0.25 * treb

    const currentShape = SHAPES[currentShapeIndex]
    const targetShape = SHAPES[nextShapeIndex]

    for (let i = 0; i < positions.length; i += 3) {
      const ox = basePositions[i]
      const oy = basePositions[i + 1]
      const oz = basePositions[i + 2]

      const r = Math.sqrt(ox * ox + oy * oy + oz * oz) || 1
      const nx = ox / r
      const ny = oy / r
      const nz = oz / r

      // déformation organique multi-fréquences
      const wave =
        Math.sin(r * 3 + t * (1 + intensity * 3)) * bassInfluence +
        Math.sin((ox + t * 1.5) * 2) * midInfluence +
        Math.sin((oz - t * 2.0) * 4) * trebInfluence +
        Math.sin((nx + ny + nz) * 6 + t * 4) * 0.1 * (beatBurst + intensity)

      // facteur de forme (circle / triangle / square) interpolé
      const fCurrent = shapeRadiusFactor(
        currentShape,
        nx,
        ny,
        nz,
        t,
        intensitySmooth,
        beatBurst
      )
      const fTarget = shapeRadiusFactor(
        targetShape,
        nx,
        ny,
        nz,
        t,
        intensitySmooth,
        beatBurst
      )
      const fShape = THREE.MathUtils.lerp(fCurrent, fTarget, shapeBlend)

      const organicAmount = 0.25 + intensity * 0.6 + beatBurst * 0.45
      let radius = HERO_BASE_RADIUS * fShape + wave * organicAmount

      // sécurité : évite de trop rentrer ou exploser
      radius = THREE.MathUtils.clamp(radius, 0.4, 3.5)

      positions[i] = nx * radius
      positions[i + 1] = ny * radius
      positions[i + 2] = nz * radius
    }

    geom.attributes.position.needsUpdate = true
    geom.computeVertexNormals()
    geom.attributes.normal.needsUpdate = true

    // Respiration de la masse principale
    heroScale = 1 + intensity * 0.7 + beatBurst * 0.3

    if (heroGroup) {
      heroGroup.scale.set(heroScale, heroScale, heroScale)
    }
  }

  // --- Logique de split / fusion des blobs (effet fluide) ---
  {
    // quand l'énergie est forte, on vise le split
    if (intensitySmooth > 0.55 || beatBurst > 0.4) {
      splitTarget = 1
      splitCooldown = 1.5 // on garde un peu le split même si l'énergie retombe
    } else {
      if (splitCooldown > 0) {
        splitCooldown -= dt
        if (splitCooldown <= 0) {
          splitTarget = 0
        }
      }
    }

    const splitLerpSpeed = 1.5
    splitAmount += (splitTarget - splitAmount) * Math.min(1, splitLerpSpeed * dt)
    splitAmount = THREE.MathUtils.clamp(splitAmount, 0, 1)

    // placement des blobs autour du centre
    const blobCount = heroBlobs.length
    const baseRadius = 0.8 // rayon max de séparation
    const dynamicRadius =
      baseRadius * (0.3 + 0.7 * intensitySmooth) * splitAmount

    for (let i = 0; i < blobCount; i++) {
      const blob = heroBlobs[i]
      const angle = (i / blobCount) * Math.PI * 2 + t * 0.6 * (0.6 + intensitySmooth)
      const radius = dynamicRadius

      const x = Math.cos(angle) * radius
      const y = Math.sin(angle * 0.9) * radius * 0.7
      const z = Math.sin(angle * 1.7) * 0.25 * splitAmount

      blob.position.set(x, y, z)

      // chaque blob légèrement plus petit quand ils sont séparés, pour un côté fluide
      const localScale = 1 - splitAmount * 0.25
      blob.scale.setScalar(localScale)
    }
  }

  // Rotation : plus agressif quand ça tape fort
  if (heroGroup) {
    const baseRotSpeed = 0.01
    const extraRotSpeed = 0.06 * (intensity + beatBurst)
    heroGroup.rotation.x += baseRotSpeed + extraRotSpeed
    heroGroup.rotation.y += baseRotSpeed * 0.8 + extraRotSpeed * 0.7
  }

  // --- Couleurs globales : mix bass/mid/treble ---
  const totalEnergy = bassEnergy + midEnergy + trebleEnergy || 1
  const bassRatio = bassEnergy / totalEnergy
  const midRatio = midEnergy / totalEnergy
  const trebRatio = trebleEnergy / totalEnergy

  let hue = 0.08 * bassRatio + 0.55 * trebRatio + 0.25 * midRatio
  let saturation = 0.5 + 0.3 * (intensity + 0.5 * beatBurst)
  let lightness = 0.35 + 0.12 * (1 - intensity)

  // 🎨 quantification de la palette pour le look rétro
  hue = quantize(hue, 8)
  saturation = quantize(saturation, 4)
  lightness = quantize(lightness, 4)

  heroMaterial.color.setHSL(hue, saturation, lightness)

  // rayon effectif de la boule centrale, avec un petit padding de sécurité
  const heroEffectiveRadius = HERO_BASE_RADIUS * heroScale * 1.2

  // --- Boules du tunnel : avancent vers l'utilisateur + explosions ---
  const toRespawn = []

  spheres.forEach(mesh => {
    const ud = mesh.userData
    const mat = mesh.material

    // Explosion déclenchée uniquement sur beat + 30% de proba pour chaque boule idle
    if (isBeat && ud.state === 'idle' && Math.random() < 0.3) {
      ud.state = 'exploding'
      ud.explodeStartTime = t
    }

    if (ud.state === 'exploding') {
      const progress = (t - ud.explodeStartTime) / ud.explodeDuration

      if (progress >= 1) {
        // Fin de l'explosion : on respawn la boule au fond du tunnel
        respawnSphere(mesh)
      } else {
        const p = progress
        // Scale qui gonfle puis se dissipe
        const explosionScale =
          1 + (2.5 + intensity * 2) * Math.sin(p * Math.PI)
        mesh.scale.setScalar(explosionScale)
        ud.currentRadius = ud.baseRadius * explosionScale

        // Légère poussée radiale
        const dir = mesh.position.clone().normalize()
        mesh.position.addScaledVector(dir, 0.5 * p)

        // Glow + fade out
        let localHue = (hue + ud.explodeStartTime * 0.1) % 1
        localHue = quantize(localHue, 8)
        const lSat = quantize(saturation, 4)
        const lLight = quantize(lightness + 0.2, 4)

        mat.color.setHSL(localHue, lSat, lLight)
        mat.emissive.setHSL(localHue, 1, 0.6 + 0.3 * intensity)
        mat.emissiveIntensity = 0.6 + 0.8 * intensity
        mat.opacity = 1 - p * 0.9
      }
      return
    }

    // État normal : la boule avance vers la caméra
    const speed = ud.speed * (0.4 + intensity * 1.6) // plus rapide quand ça tape
    mesh.position.z += speed * dt

    // Rayon du cône à cette profondeur
    const baseConeRadius = getConeRadiusForZ(mesh.position.z)

    // Légère rotation autour de l'axe du tunnel (effet spirale)
    ud.angle += ud.spinSpeed * dt
    const radial = baseConeRadius * ud.radialFactor
    mesh.position.x = Math.cos(ud.angle) * radial
    mesh.position.y = Math.sin(ud.angle) * radial * 0.6

    // Mise à l'échelle en fonction de la profondeur (perspective renforcée)
    const depthFactor = THREE.MathUtils.clamp(
      (mesh.position.z - TUNNEL_Z_FAR) /
        ((camera.position.z + 2) - TUNNEL_Z_FAR),
      0,
      1.5
    )
    const baseScale = ud.baseRadius / 0.4
    const scale = baseScale * (0.5 + depthFactor * 1.8)
    mesh.scale.setScalar(scale)
    ud.currentRadius = ud.baseRadius * scale

    // Couleur / glow qui suit le spectre (quantifié aussi)
    let localHue = (hue + ud.angle * 0.05) % 1
    localHue = quantize(localHue, 8)
    const lSat2 = quantize(saturation * 0.9, 4)
    const lLight2 = quantize(lightness * 1.1, 4)

    mat.color.setHSL(localHue, lSat2, lLight2)
    mat.emissive.setHSL(localHue, 0.6, 0.35 + intensity * 0.35)
    mat.emissiveIntensity = 0.15 + intensity * 0.45
    mat.opacity = 1

    // Respawn uniquement quand la boule est passée clairement derrière la caméra
    if (mesh.position.z > camera.position.z + 1.0) {
      toRespawn.push(mesh)
    }
  })

  // 1) Évite les collisions avec la boule centrale (en XY)
  const centerPadding = 0.15
  spheres.forEach(mesh => {
    const ud = mesh.userData
    const r = ud.currentRadius ?? ud.baseRadius
    const minDist = heroEffectiveRadius + r + centerPadding

    const pos = mesh.position
    const dXY = Math.sqrt(pos.x * pos.x + pos.y * pos.y)

    if (dXY < minDist) {
      const nx = dXY > 0 ? pos.x / dXY : Math.random() - 0.5
      const ny = dXY > 0 ? pos.y / dXY : Math.random() - 0.5
      pos.x = nx * minDist
      pos.y = ny * minDist
    }
  })

  // 2) Évite les superpositions entre bulles (petit système de répulsion)
  const pairPadding = 0.08
  for (let i = 0; i < spheres.length; i++) {
    const a = spheres[i]
    const ua = a.userData
    const ra = ua.currentRadius ?? ua.baseRadius

    for (let j = i + 1; j < spheres.length; j++) {
      const b = spheres[j]
      const ub = b.userData
      const rb = ub.currentRadius ?? ub.baseRadius

      const dx = b.position.x - a.position.x
      const dy = b.position.y - a.position.y
      const dz = b.position.z - a.position.z
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
      const minDist = ra + rb + pairPadding

      if (dist > 0 && dist < minDist) {
        const overlap = (minDist - dist) * 0.5
        const nx = dx / dist
        const ny = dy / dist
        const nz = dz / dist

        a.position.x -= nx * overlap
        a.position.y -= ny * overlap
        a.position.z -= nz * overlap

        b.position.x += nx * overlap
        b.position.y += ny * overlap
        b.position.z += nz * overlap
      } else if (dist === 0) {
        const nx = Math.random() - 0.5
        const ny = Math.random() - 0.5
        const nz = Math.random() - 0.5
        a.position.x += nx * ra
        a.position.y += ny * ra
        a.position.z += nz * ra
        b.position.x -= nx * rb
        b.position.y -= ny * rb
        b.position.z -= nz * rb
      }
    }
  }

  // Respawn après les corrections de position
  toRespawn.forEach(mesh => respawnSphere(mesh))

  renderer.render(scene, camera)
}

onMounted(() => {
  initThree()
})

onBeforeUnmount(() => {
  if (animationId) cancelAnimationFrame(animationId)
  window.removeEventListener('resize', onResize)

  const container = containerEl.value
  if (container) {
    container.removeEventListener('pointermove', onPointerMove)
  }

  spheres.forEach(mesh => {
    mesh.geometry?.dispose?.()
    mesh.material?.dispose?.()
  })
  spheres = []

  heroBlobs = []
  heroGroup = null
  if (heroGeometry) {
    heroGeometry.dispose()
    heroGeometry = null
  }
  if (heroMaterial) {
    heroMaterial.dispose()
    heroMaterial = null
  }

  if (renderer) {
    renderer.dispose()
    renderer = null
  }

  if (scene) {
    scene.traverse(obj => {
      if (obj.isMesh) {
        obj.geometry?.dispose?.()
        obj.material?.dispose?.()
      }
    })
  }
})
</script>

<style scoped>
.viz-3d-container {
  width: 800px;
  height: 400px;
  max-width: 100%;
  border-radius: 16px;
  overflow: hidden;
  background: radial-gradient(circle at top, #111325, #050509);
  cursor: grab;
}
</style>
