<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import MatchstickCanvas from './MatchstickCanvas.vue'
import type { MatchstickState } from './MatchstickCanvas.vue'
import { evaluatePhase } from '@/utils/matchstickLogic'

const emit = defineEmits<{
  (e: 'finish', results: any): void
}>()


const phases = [
  {
    id: 'quadrado',
    name: 'Figura de quatro lados',
    target: [
      {
        "id": "1",
        "x": 8,
        "y": 82,
        "angle": 0
      },
      {
        "id": "4",
        "x": 52,
        "y": 24,
        "angle": 90
      },
      {
        "id": "3",
        "x": 16,
        "y": -40,
        "angle": 180
      },
      {
        "id": "2",
        "x": -29,
        "y": 18,
        "angle": -90
      },
    ]
  },
  {
    id: 'triangulo',
    name: 'Figura de três lados',
    target: [
      {
        "id": "2",
        "x": -37,
        "y": -11,
        "angle": 300
      },
      {
        "id": "3",
        "x": 19,
        "y": -2,
        "angle": 60
      },
      {
        "id": "1",
        "x": -2,
        "y": -57,
        "angle": 180
      },
      {
        "id": "4",
        "x": -6,
        "y": -114,
        "angle": 90
      }
    ]
  },
  {
    id: 'v',
    name: 'Forma de V',
    target: [
      {
        "id": "1",
        "x": -83,
        "y": 1,
        "angle": 120
      },
      {
        "id": "2",
        "x": -37,
        "y": -11,
        "angle": 300
      },
      {
        "id": "3",
        "x": 50,
        "y": -11,
        "angle": 240
      },
      {
        "id": "4",
        "x": 94,
        "y": 1,
        "angle": 60
      }
    ]
  },
  {
    id: 'arvore',
    name: 'Árvore',
    target: [
      {
        "id": "3",
        "x": 3,
        "y": 86,
        "angle": 90
      },

      {
        "id": "1",
        "x": -37,
        "y": -9,
        "angle": 130
      },
      {
        "id": "2",
        "x": 3,
        "y": -18,
        "angle": 90
      },
      {
        "id": "4",
        "x": 42,
        "y": -9,
        "angle": 50
      },
    ]
  }
]

const currentPhaseIndex = ref(0)
const phaseState = ref<'animating' | 'waiting-start' | 'playing'>('animating')

const defaultSticks: MatchstickState[] = [
  { id: '1', x: -75, y: 192, angle: 90 },
  { id: '2', x: -25, y: 192, angle: 90 },
  { id: '3', x: 25, y: 192, angle: 90 },
  { id: '4', x: 75, y: 192, angle: 90 },
]

const sticks = ref<MatchstickState[]>([...defaultSticks])
const targetSticks = ref<MatchstickState[]>([])

const timer = ref(0)
let timerInterval: number | null = null

const phaseResults = ref<any[]>([])

function normalizeTarget(rawSticks: MatchstickState[]): MatchstickState[] {
  if (!rawSticks || rawSticks.length === 0) return []

  const stickLength = 85
  let minX = Infinity, maxX = -Infinity
  let minY = Infinity, maxY = -Infinity

  rawSticks.forEach(s => {
    const rad = (90 - s.angle) * Math.PI / 180

    const headX = s.x + (stickLength / 2) * Math.sin(rad)
    const headY = s.y - (stickLength / 2) * Math.cos(rad)
    const tailX = s.x - (stickLength / 2) * Math.sin(rad)
    const tailY = s.y + (stickLength / 2) * Math.cos(rad)

    minX = Math.min(minX, headX, tailX)
    maxX = Math.max(maxX, headX, tailX)
    minY = Math.min(minY, headY, tailY)
    maxY = Math.max(maxY, headY, tailY)
  })

  const centerX = (minX + maxX) / 2
  const centerY = (minY + maxY) / 2

  const targetX = 0
  const targetY = -40

  const dx = targetX - centerX
  const dy = targetY - centerY

  return rawSticks.map(s => ({
    ...s,
    x: s.x + dx,
    y: s.y + dy
  }))
}

const currentPhase = computed(() => {
  const basePhase = phases[currentPhaseIndex.value]
  return {
    ...basePhase,
    target: normalizeTarget(basePhase.target)
  }
})

const isDev = import.meta.env.DEV
const sticksJSON = ref('')

function updateJSON() {
  const cleanSticks = sticks.value.map(s => ({
    id: s.id, x: Math.round(s.x), y: Math.round(s.y), angle: Math.round(s.angle)
  }))
  sticksJSON.value = JSON.stringify(cleanSticks, null, 2)
}

function loadFromJSON() {
  try {
    const parsed = JSON.parse(sticksJSON.value)
    if (Array.isArray(parsed) && parsed.length > 0) {
      sticks.value = parsed
    }
  } catch (e) {
    alert('JSON inválido')
  }
}

watch(currentPhaseIndex, () => {
  startAnimation()
})

onMounted(() => {
  startAnimation()
})

function startAnimation() {
  phaseState.value = 'animating'
  targetSticks.value = []

  sticks.value = JSON.parse(JSON.stringify(defaultSticks))
  sticksJSON.value = ''

  setTimeout(() => {
    animateSequential(0)
  }, 1000)
}

function animateSequential(stickIndex: number) {
  if (!currentPhase.value.target || stickIndex >= currentPhase.value.target.length || stickIndex >= sticks.value.length) {
    phaseState.value = 'waiting-start'
    return
  }

  const s = sticks.value[stickIndex]
  const t = currentPhase.value.target[stickIndex]

  let progress = 0
  const durationMsec = 600
  const intervalMsec = 30
  const steps = durationMsec / intervalMsec

  const dx = (t.x - s.x) / steps
  const dy = (t.y - s.y) / steps
  const da = (t.angle - s.angle) / steps

  const animInterval = setInterval(() => {
    progress++
    s.x += dx
    s.y += dy
    s.angle += da

    if (progress % 3 === 0) {
      sticks.value = [...sticks.value]
    }

    if (progress >= steps) {
      clearInterval(animInterval)
      s.x = t.x
      s.y = t.y
      s.angle = t.angle
      sticks.value = [...sticks.value]

      setTimeout(() => animateSequential(stickIndex + 1), 300)
    }
  }, intervalMsec)
}

function handleFirstInteraction() {
  if (phaseState.value === 'waiting-start') {
    sticks.value = JSON.parse(JSON.stringify(defaultSticks))
    phaseState.value = 'playing'
    timer.value = 0
    timerInterval = window.setInterval(() => {
      timer.value += 100
    }, 100)
  }
}

function finishPhase() {
  if (timerInterval) clearInterval(timerInterval)

  const evalResult = evaluatePhase(currentPhase.value.id, sticks.value)

  phaseResults.value.push({
    name: currentPhase.value.name,
    phase: currentPhase.value.id,
    timeMs: timer.value,
    finalSticks: JSON.parse(JSON.stringify(sticks.value)),
    evalResult
  })

  if (currentPhaseIndex.value < phases.length - 1) {
    currentPhaseIndex.value++
  } else {
    emit('finish', phaseResults.value)
  }
}

const formattedTime = computed(() => {
  const seconds = (timer.value / 1000).toFixed(1)
  return `${seconds}s`
})
</script>

<template>
  <div class="test-container card-base fade-in">
    <div class="header">
      <h2>Etapa {{ currentPhaseIndex + 1 }} de {{ phases.length }}</h2>
    </div>

    <div v-if="phaseState === 'animating'" class="animation-view">
      <div class="status-bar">
        <span class="hint blink">Observe a construção da figura...</span>
      </div>
      <div class="canvas-wrapper">
        <MatchstickCanvas :sticks="sticks" :interactive="false" />
      </div>
    </div>

    <div v-else class="game-view">
      <div class="status-bar">
        <span v-if="phaseState === 'waiting-start'" class="hint blink">Clique em 'Iniciar Montagem' abaixo</span>
        <span v-else class="timer">⏱️ {{ formattedTime }}</span>
      </div>

      <div class="canvas-wrapper" style="position: relative;">
        <div v-if="phaseState === 'waiting-start'" class="overlay-start" @click="handleFirstInteraction">
          <div class="overlay-card">
            <h3>Você observou a montagem!</h3>
            <p>Agora é com você. Toque aqui para desmanchar os palitos e iniciar o cronômetro.</p>
            <button class="btn btn-primary">Começar Minha Montagem</button>
          </div>
        </div>

        <MatchstickCanvas :sticks="sticks" :interactive="phaseState === 'playing' || isDev"
          @update:sticks="sticks = $event" @interact="() => { }" />
      </div>

      <div class="actions">
        <button v-show="phaseState === 'playing'" class="btn btn-success" @click="finishPhase">
          Finalizar Construção
        </button>
      </div>

      <div v-if="isDev" class="dev-panel card-base">
        <h4>🛠️ Dev Mode: Copiar / Carregar Coordenadas</h4>
        <p>Monte a figura idealmente e copie os dados, ou cole coordenadas e carregue no canvas.</p>
        <div style="display: flex; gap: 10px; margin-bottom: 10px;">
          <button class="btn btn-secondary" @click="updateJSON">Atualizar Textarea com Canvas</button>
          <button class="btn btn-secondary" @click="loadFromJSON">Carregar Textarea no Canvas</button>
        </div>
        <textarea v-model="sticksJSON" rows="6" style="width:100%; font-family: monospace;"></textarea>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay-start {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.85);
  z-index: 10;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  text-align: center;
}

.overlay-card {
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.overlay-card h3 {
  margin-bottom: 5px;
  color: #1a237e;
}

.overlay-card .btn {
  margin-top: 15px;
}

.dev-panel {
  margin-top: 30px;
  padding: 20px;
  background: #fdfbf7;
  border: 1px dashed #dca;
}

.test-container {
  max-width: 900px;
  width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
}

.header {
  text-align: center;
  margin-bottom: 20px;
}

.phase-name {
  font-size: 1.2rem;
  color: #555;
  font-weight: 500;
}

.animation-view,
.game-view {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.status-bar {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 40px;
  font-size: 1.2rem;
  font-weight: bold;
}

.hint {
  color: #1a237e;
}

.timer {
  color: #d32f2f;
}

.blink {
  animation: blinker 1.5s linear infinite;
}

@keyframes blinker {
  50% {
    opacity: 0;
  }
}

.canvas-wrapper {
  flex-grow: 1;
  border: 4px solid #3949ab;
  border-radius: 12px;
  overflow: hidden;
  background: white;
}

.actions {
  display: flex;
  justify-content: center;
  margin-top: 10px;
}

.btn-success {
  background: #2e7d32;
  font-size: 1.1rem;
  padding: 12px 24px;
}

.btn-success:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.fade-in {
  animation: fadeIn 0.4s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}
</style>
