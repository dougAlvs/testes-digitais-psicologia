<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'

export interface MatchstickState {
  id: string
  x: number
  y: number
  angle: number
}

const props = defineProps<{
  sticks: MatchstickState[]
  interactive: boolean
  miniature?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:sticks', val: MatchstickState[]): void
  (e: 'interact'): void
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null

const localSticks = ref<MatchstickState[]>([])
const activeStickIndex = ref<number | null>(null)
const stickLength = 85
const stickWidth = 8
const headRadius = 10

let isDragging = false
let startX = 0
let startY = 0
let initialPinchAngle = 0
let initialPinchCenterX = 0
let initialPinchCenterY = 0
let initialStickX = 0
let initialStickY = 0
let initialStickAngle = 0
let isPinching = false

watch(() => props.sticks, (newSticks) => {
  localSticks.value = JSON.parse(JSON.stringify(newSticks))
  draw()
}, { deep: true, immediate: true })

onMounted(() => {
  if (canvasRef.value) {
    ctx = canvasRef.value.getContext('2d')
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    draw()
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeCanvas)
})

function resizeCanvas() {
  if (canvasRef.value) {
    const parent = canvasRef.value.parentElement
    if (parent) {
      canvasRef.value.width = parent.clientWidth
      canvasRef.value.height = parent.clientHeight
      draw()
    }
  }
}

function getOffsets() {
  if (!canvasRef.value) return { offsetX: 0, offsetY: 0, currentScale: 1 }

  if (props.miniature && localSticks.value.length > 0) {
    let minX = Infinity, maxX = -Infinity
    let minY = Infinity, maxY = -Infinity

    localSticks.value.forEach(s => {
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

    const padding = 20
    const contentWidth = maxX - minX
    const contentHeight = maxY - minY

    const scaleX = (canvasRef.value.width - padding * 2) / (contentWidth || 1)
    const scaleY = (canvasRef.value.height - padding * 2) / (contentHeight || 1)
    const currentScale = Math.min(scaleX, scaleY, 1)

    const centerX = (minX + maxX) / 2
    const centerY = (minY + maxY) / 2

    const offsetX = (canvasRef.value.width / 2) / currentScale - centerX
    const offsetY = (canvasRef.value.height / 2) / currentScale - centerY

    return { offsetX, offsetY, currentScale }
  }

  const currentScale = 1
  const offsetX = canvasRef.value.width / 2
  const offsetY = canvasRef.value.height / 2
  return { offsetX, offsetY, currentScale }
}

function draw() {
  if (!ctx || !canvasRef.value) return

  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)

  ctx.save()
  const { offsetX, offsetY, currentScale } = getOffsets()

  if (props.miniature) {
    ctx.scale(currentScale, currentScale)
  }

  localSticks.value.forEach((stick, index) => {
    ctx!.save()
    ctx!.translate(stick.x + offsetX, stick.y + offsetY)
    ctx!.rotate(((90 - stick.angle) * Math.PI) / 180)

    ctx!.fillStyle = '#d4a373'
    ctx!.beginPath()
    ctx!.roundRect(-stickWidth / 2, -stickLength / 2, stickWidth, stickLength, 5)
    ctx!.fill()
    ctx!.fillStyle = 'rgba(0,0,0,0.1)'
    ctx!.beginPath()
    ctx!.roundRect(-stickWidth / 2 + 2, -stickLength / 2 + 2, stickWidth - 4, stickLength - 4, 3)
    ctx!.fill()

    ctx!.fillStyle = '#e63946'
    ctx!.beginPath()
    ctx!.ellipse(0, -stickLength / 2 - 2, headRadius - 2, headRadius + 2, 0, 0, Math.PI * 2)
    ctx!.fill()

    ctx!.fillStyle = 'rgba(255,255,255,0.4)'
    ctx!.beginPath()
    ctx!.ellipse(-3, -stickLength / 2 - 4, headRadius / 3, headRadius / 2, 0, 0, Math.PI * 2)
    ctx!.fill()

    if (activeStickIndex.value === index && props.interactive) {
      ctx!.strokeStyle = '#007bff'
      ctx!.lineWidth = 2
      ctx!.strokeRect(-stickWidth / 2 - 5, -stickLength / 2 - headRadius - 5, stickWidth + 10, stickLength + headRadius + 10)
    }

    ctx!.restore()
  })
  ctx!.restore()
}



function getStickAtPosition(logicalX: number, logicalY: number, extraPadding = 0): number | null {
  for (let i = localSticks.value.length - 1; i >= 0; i--) {
    const stick = localSticks.value[i]

    const dx = logicalX - stick.x
    const dy = logicalY - stick.y
    const angleRad = ((90 - stick.angle) * Math.PI) / 180
    const localX = dx * Math.cos(-angleRad) - dy * Math.sin(-angleRad)
    const localY = dx * Math.sin(-angleRad) + dy * Math.cos(-angleRad)

    const padding = 25 + extraPadding

    if (
      localX >= -stickWidth / 2 - padding &&
      localX <= stickWidth / 2 + padding &&
      localY >= -stickLength / 2 - headRadius - padding &&
      localY <= stickLength / 2 + padding
    ) {
      return i
    }
  }
  return null
}

function handlePointerDown(e: PointerEvent | MouseEvent) {
  if (!props.interactive) return
  emit('interact')

  e.preventDefault()

  const { offsetX, offsetY } = getOffsets()

  let x = 'clientX' in e ? e.clientX : 0;
  let y = 'clientY' in e ? e.clientY : 0;

  if (e instanceof MouseEvent) {
    x = e.offsetX
    y = e.offsetY
  } else if (canvasRef.value) {
    const rect = canvasRef.value.getBoundingClientRect()
    x = ('clientX' in e ? e.clientX : 0) - rect.left
    y = ('clientY' in e ? e.clientY : 0) - rect.top
  }

  const logicalX = x - offsetX
  const logicalY = y - offsetY

  const clickedStick = getStickAtPosition(logicalX, logicalY)

  if (clickedStick !== null) {
    activeStickIndex.value = clickedStick
    isDragging = true
    startX = logicalX
    startY = logicalY

    const stick = localSticks.value.splice(clickedStick, 1)[0]
    localSticks.value.push(stick)
    activeStickIndex.value = localSticks.value.length - 1

    draw()
  } else {
    activeStickIndex.value = null
    draw()
  }
}

function handlePointerMove(e: PointerEvent | MouseEvent) {
  if (!props.interactive || !isDragging || activeStickIndex.value === null) return

  if (isPinching) return

  e.preventDefault()

  const { offsetX, offsetY } = getOffsets()

  let x = 'clientX' in e ? e.clientX : 0;
  let y = 'clientY' in e ? e.clientY : 0;

  if (e instanceof MouseEvent) {
    x = e.offsetX
    y = e.offsetY
  } else if (canvasRef.value) {
    const rect = canvasRef.value.getBoundingClientRect()
    x = ('clientX' in e ? e.clientX : 0) - rect.left
    y = ('clientY' in e ? e.clientY : 0) - rect.top
  }

  const logicalX = x - offsetX
  const logicalY = y - offsetY

  const dx = logicalX - startX
  const dy = logicalY - startY

  const stick = localSticks.value[activeStickIndex.value]

  if (e.shiftKey) {

    const cx = stick!.x
    const cy = stick!.y
    const angle1 = Math.atan2(startY - cy, startX - cx)
    const angle2 = Math.atan2(logicalY - cy, logicalX - cx)

    let deltaAngle = (angle2 - angle1) * (180 / Math.PI)

    while (deltaAngle <= -180) deltaAngle += 360
    while (deltaAngle > 180) deltaAngle -= 360

    const dist = Math.sqrt(Math.pow(startX - cx, 2) + Math.pow(startY - cy, 2))
    const maxDelta = dist < 20 ? 4 : 15

    if (deltaAngle > maxDelta) deltaAngle = maxDelta
    if (deltaAngle < -maxDelta) deltaAngle = -maxDelta

    stick!.angle -= deltaAngle

    startX = logicalX
    startY = logicalY
  } else {
    stick.x += dx
    stick.y += dy
    startX = logicalX
    startY = logicalY
  }

  draw()
}

function handlePointerUp() {
  if (!props.interactive) return
  isDragging = false
  emit('update:sticks', localSticks.value)
}

function handleTouchStart(e: TouchEvent) {
  if (!props.interactive) return
  emit('interact')

  if (e.touches.length === 2) {
    isPinching = true
    isDragging = false
    const t1 = e.touches[0]
    const t2 = e.touches[1]

    let stickIndex = activeStickIndex.value

    if (stickIndex === null && canvasRef.value) {
      const { offsetX, offsetY } = getOffsets()
      const rect = canvasRef.value.getBoundingClientRect()
      const cx = (t1.clientX + t2.clientX) / 2 - rect.left - offsetX
      const cy = (t1.clientY + t2.clientY) / 2 - rect.top - offsetY

      stickIndex = getStickAtPosition(cx, cy, 50)
      if (stickIndex !== null) {
        const stick = localSticks.value.splice(stickIndex, 1)[0]
        localSticks.value.push(stick)
        stickIndex = localSticks.value.length - 1
        activeStickIndex.value = stickIndex
        draw()
      }
    }

    if (stickIndex !== null) {
      initialPinchAngle = Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX) * 180 / Math.PI

      initialPinchCenterX = (t1.clientX + t2.clientX) / 2
      initialPinchCenterY = (t1.clientY + t2.clientY) / 2

      initialStickAngle = localSticks.value[stickIndex].angle
      initialStickX = localSticks.value[stickIndex].x
      initialStickY = localSticks.value[stickIndex].y
    } else {
      isPinching = false
    }
  } else if (e.touches.length === 1) {
    isPinching = false
    if (canvasRef.value) {
      const { offsetX, offsetY } = getOffsets()
      const rect = canvasRef.value.getBoundingClientRect()
      const logicalX = e.touches[0].clientX - rect.left - offsetX
      const logicalY = e.touches[0].clientY - rect.top - offsetY

      const clickedStick = getStickAtPosition(logicalX, logicalY)
      if (clickedStick !== null) {
        activeStickIndex.value = clickedStick
        isDragging = true
        startX = logicalX
        startY = logicalY
        const stick = localSticks.value.splice(clickedStick, 1)[0]
        localSticks.value.push(stick)
        activeStickIndex.value = localSticks.value.length - 1
        draw()
      } else {
        activeStickIndex.value = null
        draw()
      }
    }
  }
}

function handleTouchMove(e: TouchEvent) {
  if (!props.interactive) return
  e.preventDefault()

  if (e.touches.length === 2 && isPinching && activeStickIndex.value !== null) {
    const t1 = e.touches[0]
    const t2 = e.touches[1]
    const currAngle = Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX) * 180 / Math.PI
    let deltaAngle = currAngle - initialPinchAngle

    while (deltaAngle <= -180) deltaAngle += 360
    while (deltaAngle > 180) deltaAngle -= 360

    localSticks.value[activeStickIndex.value].angle = initialStickAngle - deltaAngle

    const currCenterX = (t1.clientX + t2.clientX) / 2
    const currCenterY = (t1.clientY + t2.clientY) / 2

    const dx = currCenterX - initialPinchCenterX
    const dy = currCenterY - initialPinchCenterY

    localSticks.value[activeStickIndex.value].x = initialStickX + dx
    localSticks.value[activeStickIndex.value].y = initialStickY + dy

    draw()
  } else if (e.touches.length === 1 && isDragging && activeStickIndex.value !== null) {
    if (canvasRef.value) {
      const { offsetX, offsetY } = getOffsets()
      const rect = canvasRef.value.getBoundingClientRect()
      const logicalX = e.touches[0].clientX - rect.left - offsetX
      const logicalY = e.touches[0].clientY - rect.top - offsetY

      const dx = logicalX - startX
      const dy = logicalY - startY
      localSticks.value[activeStickIndex.value].x += dx
      localSticks.value[activeStickIndex.value].y += dy
      startX = logicalX
      startY = logicalY
      draw()
    }
  }
}

function handleTouchEnd(e: TouchEvent) {
  if (!props.interactive) return
  if (e.touches.length < 2) {
    isPinching = false
  }
  if (e.touches.length === 0) {
    isDragging = false
    emit('update:sticks', localSticks.value)
  }
}

function handleWheel(e: WheelEvent) {
  if (!props.interactive || activeStickIndex.value === null) return
  e.preventDefault()
  emit('interact')

  const delta = Math.sign(e.deltaY) * 5
  localSticks.value[activeStickIndex.value].angle -= delta
  draw()
  emit('update:sticks', localSticks.value)
}

defineExpose({
  localSticks
})
</script>

<template>
  <div class="matchstick-widget">
    <div class="canvas-container" @mousedown="handlePointerDown" @mousemove="handlePointerMove"
      @mouseup="handlePointerUp" @mouseleave="handlePointerUp" @touchstart.passive="false"
      @touchstart="handleTouchStart" @touchmove.passive="false" @touchmove="handleTouchMove" @touchend="handleTouchEnd"
      @wheel.prevent="handleWheel">
      <canvas ref="canvasRef"></canvas>
    </div>

    <div v-if="interactive" class="controls-hint">
      <strong>Desktop:</strong> Arraste p/ Mover. <i>Scroll</i> ou <i>Shift+Arraste</i> p/ Rotacionar.<br />
      <strong>Mobile:</strong> 1 dedo p/ Mover. 2 dedos p/ Rotacionar.
    </div>
  </div>
</template>

<style scoped>
.matchstick-widget {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.canvas-container {
  flex-grow: 1;
  min-height: v-bind("miniature ? '100%' : '550px'");
  position: relative;
  background: white;
  touch-action: none;
}

canvas {
  width: 100%;
  height: 100%;
  cursor: grab;
}

canvas:active {
  cursor: grabbing;
}

.controls-hint {
  background: #eaeff5;
  padding: 10px;
  font-size: 0.9rem;
  color: #333;
  text-align: center;
  border-top: 1px solid #c8d4e3;
}
</style>
