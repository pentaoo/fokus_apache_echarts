<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  active?: boolean
}>(), {
  active: false,
})

type ResizeDirection = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw'
type GestureMode = 'move' | 'resize'

interface NormalizedRect {
  x: number
  y: number
  width: number
  height: number
}

interface ActiveGesture {
  pointerId: number
  mode: GestureMode
  direction?: ResizeDirection
  startClientX: number
  startClientY: number
  startRect: NormalizedRect
  canvasWidth: number
  canvasHeight: number
}

const INITIAL_RECT: NormalizedRect = {
  x: 0.03,
  y: 0.053,
  width: 0.94,
  height: 0.894,
}
const MIN_WIDTH_PX = 120
const MIN_HEIGHT_PX = 90
const SNAP_DISTANCE_PX = 8

const handles: Array<{ direction: ResizeDirection; label: string }> = [
  { direction: 'nw', label: 'Изменить размер от левого верхнего угла' },
  { direction: 'n', label: 'Переместить верхнюю границу' },
  { direction: 'ne', label: 'Изменить размер от правого верхнего угла' },
  { direction: 'e', label: 'Переместить правую границу' },
  { direction: 'se', label: 'Изменить размер от правого нижнего угла' },
  { direction: 's', label: 'Переместить нижнюю границу' },
  { direction: 'sw', label: 'Изменить размер от левого нижнего угла' },
  { direction: 'w', label: 'Переместить левую границу' },
]

const canvasElement = ref<HTMLElement | null>(null)
const canvasSize = ref({ width: 1, height: 1 })
const rect = ref<NormalizedRect>({ ...INITIAL_RECT })
const isManipulating = ref(false)
let resizeObserver: ResizeObserver | null = null
let activeGesture: ActiveGesture | null = null

const objectStyle = computed(() => ({
  left: `${rect.value.x * 100}%`,
  top: `${rect.value.y * 100}%`,
  width: `${rect.value.width * 100}%`,
  height: `${rect.value.height * 100}%`,
}))

const pixelSize = computed(() => ({
  width: Math.round(rect.value.width * canvasSize.value.width),
  height: Math.round(rect.value.height * canvasSize.value.height),
}))

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(minimum, maximum), Math.max(minimum, value))
}

function snapToEdge(value: number, edge: number, canvasLength: number) {
  return Math.abs(value - edge) * canvasLength <= SNAP_DISTANCE_PX
    ? edge
    : value
}

function resizedRect(
  startRect: NormalizedRect,
  direction: ResizeDirection,
  deltaX: number,
  deltaY: number,
  canvasWidth: number,
  canvasHeight: number,
) {
  const next = { ...startRect }
  const minWidth = Math.min(1, MIN_WIDTH_PX / canvasWidth)
  const minHeight = Math.min(1, MIN_HEIGHT_PX / canvasHeight)
  const right = startRect.x + startRect.width
  const bottom = startRect.y + startRect.height

  if (direction.includes('w')) {
    next.x = clamp(startRect.x + deltaX, 0, right - minWidth)
    next.x = snapToEdge(next.x, 0, canvasWidth)
    next.width = right - next.x
  }
  if (direction.includes('e')) {
    let nextRight = clamp(right + deltaX, startRect.x + minWidth, 1)
    nextRight = snapToEdge(nextRight, 1, canvasWidth)
    next.width = nextRight - startRect.x
  }
  if (direction.includes('n')) {
    next.y = clamp(startRect.y + deltaY, 0, bottom - minHeight)
    next.y = snapToEdge(next.y, 0, canvasHeight)
    next.height = bottom - next.y
  }
  if (direction.includes('s')) {
    let nextBottom = clamp(bottom + deltaY, startRect.y + minHeight, 1)
    nextBottom = snapToEdge(nextBottom, 1, canvasHeight)
    next.height = nextBottom - startRect.y
  }

  return next
}

function startGesture(
  event: PointerEvent,
  mode: GestureMode,
  direction?: ResizeDirection,
) {
  if (!props.active || event.button !== 0 || activeGesture) return
  event.preventDefault()
  event.stopPropagation()

  const canvasBounds = canvasElement.value?.getBoundingClientRect()
  if (!canvasBounds || canvasBounds.width === 0 || canvasBounds.height === 0) return

  activeGesture = {
    pointerId: event.pointerId,
    mode,
    direction,
    startClientX: event.clientX,
    startClientY: event.clientY,
    startRect: { ...rect.value },
    canvasWidth: canvasBounds.width,
    canvasHeight: canvasBounds.height,
  }
  isManipulating.value = true
  window.addEventListener('pointermove', updateGesture)
  window.addEventListener('pointerup', finishGesture)
  window.addEventListener('pointercancel', finishGesture)
}

function updateGesture(event: PointerEvent) {
  const gesture = activeGesture
  if (!gesture || event.pointerId !== gesture.pointerId) return
  event.preventDefault()

  const deltaX = (event.clientX - gesture.startClientX) / gesture.canvasWidth
  const deltaY = (event.clientY - gesture.startClientY) / gesture.canvasHeight

  if (gesture.mode === 'move') {
    let x = clamp(
      gesture.startRect.x + deltaX,
      0,
      1 - gesture.startRect.width,
    )
    let y = clamp(
      gesture.startRect.y + deltaY,
      0,
      1 - gesture.startRect.height,
    )
    x = snapToEdge(x, 0, gesture.canvasWidth)
    x = snapToEdge(x + gesture.startRect.width, 1, gesture.canvasWidth) - gesture.startRect.width
    y = snapToEdge(y, 0, gesture.canvasHeight)
    y = snapToEdge(y + gesture.startRect.height, 1, gesture.canvasHeight) - gesture.startRect.height
    rect.value = { ...gesture.startRect, x, y }
    return
  }

  if (gesture.direction) {
    rect.value = resizedRect(
      gesture.startRect,
      gesture.direction,
      deltaX,
      deltaY,
      gesture.canvasWidth,
      gesture.canvasHeight,
    )
  }
}

function finishGesture(event: PointerEvent) {
  if (!activeGesture || event.pointerId !== activeGesture.pointerId) return
  activeGesture = null
  isManipulating.value = false
  window.removeEventListener('pointermove', updateGesture)
  window.removeEventListener('pointerup', finishGesture)
  window.removeEventListener('pointercancel', finishGesture)
}

function resizeWithKeyboard(direction: ResizeDirection, event: KeyboardEvent) {
  if (!props.active) return
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return
  event.preventDefault()
  event.stopPropagation()

  const step = event.shiftKey ? 16 : 4
  const horizontalDelta =
    event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0
  const verticalDelta =
    event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0

  rect.value = resizedRect(
    rect.value,
    direction,
    horizontalDelta / canvasSize.value.width,
    verticalDelta / canvasSize.value.height,
    canvasSize.value.width,
    canvasSize.value.height,
  )
}

function moveWithKeyboard(event: KeyboardEvent) {
  if (!props.active) return
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return
  event.preventDefault()
  const step = event.shiftKey ? 16 : 4
  const horizontalDelta =
    event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0
  const verticalDelta =
    event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0

  rect.value = {
    ...rect.value,
    x: clamp(
      rect.value.x + horizontalDelta / canvasSize.value.width,
      0,
      1 - rect.value.width,
    ),
    y: clamp(
      rect.value.y + verticalDelta / canvasSize.value.height,
      0,
      1 - rect.value.height,
    ),
  }
}

function resetRect(event?: Event) {
  event?.stopPropagation()
  rect.value = { ...INITIAL_RECT }
}

function stopGlobalListeners() {
  activeGesture = null
  isManipulating.value = false
  window.removeEventListener('pointermove', updateGesture)
  window.removeEventListener('pointerup', finishGesture)
  window.removeEventListener('pointercancel', finishGesture)
}

watch(
  () => props.active,
  (active) => {
    if (!active) stopGlobalListeners()
  },
)

onMounted(() => {
  if (!canvasElement.value) return
  resizeObserver = new ResizeObserver(([entry]) => {
    if (!entry) return
    canvasSize.value = {
      width: Math.max(1, entry.contentRect.width),
      height: Math.max(1, entry.contentRect.height),
    }
  })
  resizeObserver.observe(canvasElement.value)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  stopGlobalListeners()
})
</script>

<template>
  <div ref="canvasElement" class="chart-object-canvas">
    <div
      class="chart-object"
      :class="{
        'is-active': active,
        'is-manipulating': isManipulating,
      }"
      :style="objectStyle"
      role="group"
      :tabindex="active ? 0 : -1"
      :aria-label="active
        ? 'График. Перетаскивайте объект или используйте стрелки для перемещения'
        : 'График'"
      @pointerdown="startGesture($event, 'move')"
      @keydown="moveWithKeyboard"
    >
      <div class="chart-object-content">
        <slot />
      </div>

      <button
        v-for="handle in handles"
        v-if="active"
        :key="handle.direction"
        type="button"
        class="chart-resize-handle"
        :class="`is-${handle.direction}`"
        :aria-label="handle.label"
        @pointerdown="startGesture($event, 'resize', handle.direction)"
        @keydown="resizeWithKeyboard(handle.direction, $event)"
      />
    </div>

    <div
      v-if="active"
      class="chart-object-readout"
      :class="{ 'is-active': isManipulating }"
    >
      <output>{{ pixelSize.width }} × {{ pixelSize.height }}</output>
      <button type="button" aria-label="Вернуть исходный размер графика" @click="resetRect">
        Сбросить
      </button>
    </div>
  </div>
</template>

<style scoped>
.chart-object-canvas {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #fff;
}

.chart-object {
  position: absolute;
  z-index: 1;
  min-width: 0;
  min-height: 0;
  outline: none;
  cursor: default;
}

.chart-object.is-active {
  cursor: move;
  touch-action: none;
}

.chart-object.is-active::after {
  position: absolute;
  z-index: 2;
  inset: 0;
  border: 2px solid #5500eb;
  content: '';
  pointer-events: none;
}

.chart-object.is-active:focus-visible::after {
  box-shadow: 0 0 0 3px rgb(85 0 235 / 24%);
}

.chart-object-content {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.chart-object.is-active .chart-object-content {
  pointer-events: none;
}

.chart-resize-handle {
  position: absolute;
  z-index: 3;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  outline: none;
  background: transparent;
  touch-action: none;
}

.chart-resize-handle::after {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 9px;
  height: 9px;
  border: 2px solid #5500eb;
  border-radius: 50%;
  background: #fff;
  content: '';
  transform: translate(-50%, -50%);
}

.chart-resize-handle:focus-visible::after {
  box-shadow: 0 0 0 4px rgb(85 0 235 / 24%);
}

.chart-resize-handle.is-n,
.chart-resize-handle.is-s {
  left: 50%;
  cursor: ns-resize;
  transform: translateX(-50%);
}

.chart-resize-handle.is-e,
.chart-resize-handle.is-w {
  top: 50%;
  cursor: ew-resize;
  transform: translateY(-50%);
}

.chart-resize-handle.is-n { top: -12px; }
.chart-resize-handle.is-ne { top: -12px; right: -12px; cursor: nesw-resize; }
.chart-resize-handle.is-e { right: -12px; }
.chart-resize-handle.is-se { right: -12px; bottom: -12px; cursor: nwse-resize; }
.chart-resize-handle.is-s { bottom: -12px; }
.chart-resize-handle.is-sw { bottom: -12px; left: -12px; cursor: nesw-resize; }
.chart-resize-handle.is-w { left: -12px; }
.chart-resize-handle.is-nw { top: -12px; left: -12px; cursor: nwse-resize; }

.chart-object-readout {
  position: absolute;
  z-index: 4;
  right: 10px;
  bottom: 10px;
  display: flex;
  min-height: 30px;
  align-items: center;
  gap: 8px;
  padding: 4px 5px 4px 10px;
  border-radius: 999px;
  color: #fff;
  background: rgb(0 0 0 / 72%);
  font-size: 12px;
  line-height: 1;
  opacity: 0.72;
  transition: opacity 140ms ease;
}

.chart-object-readout.is-active,
.chart-object-readout:focus-within,
.chart-object-readout:hover {
  opacity: 1;
}

.chart-object-readout button {
  min-height: 22px;
  padding: 0 8px;
  border: 0;
  border-radius: 999px;
  color: #fff;
  background: rgb(255 255 255 / 18%);
  font: inherit;
}

.chart-object-readout button:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 1px;
}

@media (prefers-reduced-motion: reduce) {
  .chart-object-readout {
    transition: none;
  }
}
</style>
