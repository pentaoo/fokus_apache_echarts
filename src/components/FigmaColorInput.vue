<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import colorizeIcon from '../assets/new-ui/colorize.svg'

interface EyeDropperResult {
  sRGBHex: string
}

interface EyeDropperInstance {
  open: (options?: { signal?: AbortSignal }) => Promise<EyeDropperResult>
}

type EyeDropperConstructor = new () => EyeDropperInstance

const props = withDefaults(defineProps<{
  modelValue: string
  opacity: number
  label: string
  open: boolean
  showOpacity?: boolean
}>(), {
  showOpacity: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:opacity': [value: number]
  open: []
  close: []
}>()

const root = ref<HTMLElement | null>(null)
const popover = ref<HTMLElement | null>(null)
const saturationField = ref<HTMLElement | null>(null)
const opacityInput = ref<HTMLInputElement | null>(null)
const draft = ref(props.modelValue.replace('#', '').toUpperCase())
const opacityDraft = ref(String(Math.round(clamp(props.opacity))))
const editingOpacity = ref(false)
const hue = ref(196)
const saturation = ref(50)
const brightness = ref(88)
const pendingInternalColor = ref<string | null>(null)
const popoverPosition = ref({ left: -181, top: -5 })
const eyeDropperSupported = ref(false)
const pickingScreenColor = ref(false)
let positionObserver: ResizeObserver | null = null
let eyeDropperAbortController: AbortController | null = null
let stopOpacityScrub: (() => void) | null = null

function clamp(value: number, minimum = 0, maximum = 100) {
  return Math.min(maximum, Math.max(minimum, value))
}

function normalizeHex(value: string) {
  const normalized = value.trim().replace(/^#?/, '#')
  return /^#[\da-f]{6}$/i.test(normalized) ? normalized.toUpperCase() : null
}

function hexToHsv(hex: string) {
  const normalized = normalizeHex(hex) ?? '#71C1E3'
  const red = Number.parseInt(normalized.slice(1, 3), 16) / 255
  const green = Number.parseInt(normalized.slice(3, 5), 16) / 255
  const blue = Number.parseInt(normalized.slice(5, 7), 16) / 255
  const maximum = Math.max(red, green, blue)
  const minimum = Math.min(red, green, blue)
  const delta = maximum - minimum
  let nextHue = 0

  if (delta !== 0) {
    if (maximum === red) nextHue = 60 * (((green - blue) / delta) % 6)
    else if (maximum === green) nextHue = 60 * ((blue - red) / delta + 2)
    else nextHue = 60 * ((red - green) / delta + 4)
  }

  hue.value = (nextHue + 360) % 360
  saturation.value = maximum === 0 ? 0 : (delta / maximum) * 100
  brightness.value = maximum * 100
}

function hsvToHex(nextHue: number, nextSaturation: number, nextBrightness: number) {
  const chroma = (nextBrightness / 100) * (nextSaturation / 100)
  const hueSection = nextHue / 60
  const secondary = chroma * (1 - Math.abs((hueSection % 2) - 1))
  const offset = nextBrightness / 100 - chroma
  const channels =
    hueSection < 1 ? [chroma, secondary, 0]
      : hueSection < 2 ? [secondary, chroma, 0]
        : hueSection < 3 ? [0, chroma, secondary]
          : hueSection < 4 ? [0, secondary, chroma]
            : hueSection < 5 ? [secondary, 0, chroma]
              : [chroma, 0, secondary]

  return `#${channels.map((channel) => Math.round((channel + offset) * 255).toString(16).padStart(2, '0')).join('')}`.toUpperCase()
}

function emitHsvColor() {
  const color = hsvToHex(hue.value, saturation.value, brightness.value)
  draft.value = color.slice(1)
  pendingInternalColor.value = color
  emit('update:modelValue', color)
  void nextTick(() => {
    if (pendingInternalColor.value === color) pendingInternalColor.value = null
  })
}

function updateSaturation(event: PointerEvent) {
  const field = saturationField.value
  if (!field) return
  const bounds = field.getBoundingClientRect()
  saturation.value = clamp(((event.clientX - bounds.left) / bounds.width) * 100)
  brightness.value = clamp(100 - ((event.clientY - bounds.top) / bounds.height) * 100)
  emitHsvColor()
}

function startSaturationDrag(event: PointerEvent) {
  updateSaturation(event)
  const move = (moveEvent: PointerEvent) => updateSaturation(moveEvent)
  const finish = () => {
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', finish)
  }
  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', finish, { once: true })
}

function applyDraft() {
  const color = normalizeHex(draft.value)
  if (!color) {
    draft.value = props.modelValue.replace('#', '').toUpperCase()
    return
  }
  emit('update:modelValue', color)
  hexToHsv(color)
}

function updateOpacityDraft(event: Event) {
  const input = event.target as HTMLInputElement
  const digits = input.value.replace(/\D/g, '').slice(0, 3)

  if (digits === '') {
    opacityDraft.value = ''
    return
  }

  const value = clamp(Number.parseInt(digits, 10))
  opacityDraft.value = String(value)
  emit('update:opacity', value)
}

function setOpacity(value: number) {
  const nextValue = Math.round(clamp(value))
  opacityDraft.value = String(nextValue)
  emit('update:opacity', nextValue)
}

function startOpacityScrub(event: PointerEvent) {
  if (event.button !== 0 || !event.isPrimary) return

  event.preventDefault()
  stopOpacityScrub?.()

  const startX = event.clientX
  const startY = event.clientY
  const startOpacity = props.opacity
  let isScrubbing = false

  const move = (moveEvent: PointerEvent) => {
    const horizontalDistance = moveEvent.clientX - startX
    const verticalDistance = startY - moveEvent.clientY
    const distance =
      Math.abs(horizontalDistance) >= Math.abs(verticalDistance)
        ? horizontalDistance
        : verticalDistance

    if (!isScrubbing && Math.abs(distance) < 3) return
    isScrubbing = true
    setOpacity(startOpacity + distance / 5)
  }

  const finish = () => {
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', finish)
    window.removeEventListener('pointercancel', finish)
    stopOpacityScrub = null

    if (!isScrubbing) {
      opacityInput.value?.focus({ preventScroll: true })
      opacityInput.value?.select()
    }
  }

  stopOpacityScrub = finish
  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', finish, { once: true })
  window.addEventListener('pointercancel', finish, { once: true })
}

function finishOpacityEditing() {
  if (opacityDraft.value === '') {
    opacityDraft.value = String(Math.round(clamp(props.opacity)))
  }
  editingOpacity.value = false
}

function closeOutside(event: PointerEvent) {
  const target = event.target
  if (target instanceof Element && target.closest('.figma-color-input')) return
  if (props.open) emit('close')
}

function toggleOpen() {
  if (props.open) emit('close')
  else emit('open')
}

function getEyeDropperConstructor() {
  return (window as Window & { EyeDropper?: EyeDropperConstructor }).EyeDropper
}

async function pickColorFromScreen() {
  const EyeDropper = getEyeDropperConstructor()
  if (!EyeDropper || pickingScreenColor.value) return

  eyeDropperAbortController?.abort()
  eyeDropperAbortController = new AbortController()
  pickingScreenColor.value = true

  try {
    const result = await new EyeDropper().open({
      signal: eyeDropperAbortController.signal,
    })
    const color = normalizeHex(result.sRGBHex)
    if (!color) return
    draft.value = color.slice(1)
    pendingInternalColor.value = color
    hexToHsv(color)
    emit('update:modelValue', color)
  } catch (error) {
    if (!(error instanceof DOMException && error.name === 'AbortError')) {
      console.warn('Не удалось выбрать цвет с экрана.', error)
    }
  } finally {
    pickingScreenColor.value = false
    eyeDropperAbortController = null
  }
}

function updatePopoverPosition() {
  const rootElement = root.value
  const popoverElement = popover.value
  const paletteCard = rootElement?.closest<HTMLElement>('.new-design-palette-card')
  if (!rootElement || !popoverElement || !paletteCard) return

  const rootBounds = rootElement.getBoundingClientRect()
  const popoverBounds = popoverElement.getBoundingClientRect()
  const cardBounds = paletteCard.getBoundingClientRect()
  const cardInset = 16
  const popoverGap = 9
  const minimumLeft = cardBounds.left + cardInset
  const maximumLeft = Math.max(
    minimumLeft,
    cardBounds.right - cardInset - popoverBounds.width,
  )
  const preferredLeft = rootBounds.left - popoverBounds.width - popoverGap
  const absoluteLeft = Math.min(
    maximumLeft,
    Math.max(minimumLeft, preferredLeft),
  )
  const paletteList = rootElement.closest<HTMLElement>('.new-design-palette-list')
  const hasExtendedPalette =
    (paletteList?.querySelectorAll('.figma-color-input').length ?? 0) > 5
  const minimumTop = cardBounds.top + cardInset
  const maximumTop = Math.max(
    minimumTop,
    cardBounds.bottom - cardInset - popoverBounds.height,
  )
  const preferredTop = hasExtendedPalette
    ? rootBounds.top
    : minimumTop
  const absoluteTop = Math.min(
    maximumTop,
    Math.max(minimumTop, preferredTop),
  )

  popoverPosition.value = {
    left: absoluteLeft - rootBounds.left,
    top: absoluteTop - rootBounds.top,
  }
}

const pureHue = computed(() => `hsl(${hue.value} 100% 50%)`)
const sliderThumbRadius = 12
const sliderThumbInset = sliderThumbRadius
const hueTrackWidth = 124
const alphaTrackWidth = 164
const hueTrackPosition = computed(
  () =>
    sliderThumbInset +
    ((360 - hue.value) / 360) *
      (hueTrackWidth - sliderThumbInset * 2),
)
const alphaTrackPosition = computed(
  () =>
    sliderThumbInset +
    (props.opacity / 100) *
      (alphaTrackWidth - sliderThumbInset * 2),
)
const transparentColor = computed(() => {
  const normalized = normalizeHex(props.modelValue) ?? '#71C1E3'
  const red = Number.parseInt(normalized.slice(1, 3), 16)
  const green = Number.parseInt(normalized.slice(3, 5), 16)
  const blue = Number.parseInt(normalized.slice(5, 7), 16)
  return `rgb(${red} ${green} ${blue} / 0)`
})
const alphaTrack = computed(
  () => `linear-gradient(90deg, ${transparentColor.value} 0%, ${props.modelValue} 90%), linear-gradient(#fff, #fff)`,
)
const alphaThumb = computed(
  () => `linear-gradient(90deg, ${props.modelValue} 0 50%, #fff 50% 100%)`,
)

watch(
  () => props.modelValue,
  (value) => {
    draft.value = value.replace('#', '').toUpperCase()
    const normalized = normalizeHex(value)
    if (normalized && normalized === pendingInternalColor.value) {
      pendingInternalColor.value = null
      return
    }
    pendingInternalColor.value = null
    hexToHsv(value)
  },
  { immediate: true },
)

watch(
  () => props.opacity,
  (value) => {
    if (!editingOpacity.value) {
      opacityDraft.value = String(Math.round(clamp(value)))
    }
  },
)

watch(
  () => props.open,
  async (open) => {
    if (!open) return
    await nextTick()
    updatePopoverPosition()
  },
)

onMounted(() => {
  eyeDropperSupported.value = Boolean(getEyeDropperConstructor())
  document.addEventListener('pointerdown', closeOutside)
  window.addEventListener('resize', updatePopoverPosition)
  positionObserver = new ResizeObserver(updatePopoverPosition)
  if (root.value) {
    positionObserver.observe(root.value)
    const paletteCard = root.value.closest<HTMLElement>('.new-design-palette-card')
    if (paletteCard) positionObserver.observe(paletteCard)
  }
})

onBeforeUnmount(() => {
  stopOpacityScrub?.()
  eyeDropperAbortController?.abort()
  document.removeEventListener('pointerdown', closeOutside)
  window.removeEventListener('resize', updatePopoverPosition)
  positionObserver?.disconnect()
})
</script>

<template>
  <div
    ref="root"
    class="figma-color-input"
    :class="{ open, 'without-opacity': !showOpacity }"
  >
    <div class="figma-color-main">
      <button
        class="figma-color-swatch"
        type="button"
        :style="{ backgroundColor: modelValue }"
        :aria-label="`${label}: открыть выбор цвета`"
        :aria-expanded="open"
        @click="toggleOpen"
      />
      <input
        v-model="draft"
        type="text"
        maxlength="6"
        :aria-label="`${label}: HEX-код`"
        @blur="applyDraft"
        @keydown.enter.prevent="applyDraft"
      />
    </div>
    <div
      v-if="showOpacity"
      class="figma-color-opacity"
      title="Потяните, чтобы изменить непрозрачность"
      @pointerdown="startOpacityScrub"
    >
      <input
        ref="opacityInput"
        v-model="opacityDraft"
        type="text"
        inputmode="numeric"
        maxlength="3"
        autocomplete="off"
        :aria-label="`${label}: непрозрачность`"
        @focus="editingOpacity = true"
        @input="updateOpacityDraft"
        @blur="finishOpacityEditing"
        @keydown.enter.prevent="finishOpacityEditing"
      />
      <span>%</span>
    </div>

    <div
      v-if="open"
      ref="popover"
      class="figma-color-popover"
      :style="{
        left: `${popoverPosition.left}px`,
        top: `${popoverPosition.top}px`,
      }"
    >
      <div
        ref="saturationField"
        class="figma-saturation-field"
        :style="{ backgroundColor: pureHue }"
        @pointerdown.prevent="startSaturationDrag"
      >
        <i
          :style="{
            left: `${saturation}%`,
            top: `${100 - brightness}%`,
          }"
        />
      </div>
      <div class="figma-hue-row">
        <button
          class="figma-eyedropper"
          type="button"
          :disabled="!eyeDropperSupported || pickingScreenColor"
          :aria-label="pickingScreenColor ? 'Выбор цвета с экрана' : 'Взять цвет с экрана'"
          :title="eyeDropperSupported ? 'Взять цвет с экрана' : 'Пипетка не поддерживается браузером'"
          @click="pickColorFromScreen"
        >
          <img :src="colorizeIcon" alt="" />
        </button>
        <label
          class="figma-hue-track"
          :style="{
            '--thumb-position': `${hueTrackPosition}px`,
            '--thumb-background': pureHue,
          }"
        >
          <span class="visually-hidden">Оттенок</span>
          <input
            v-model.number="hue"
            type="range"
            min="0"
            max="360"
            @input="emitHsvColor"
          />
        </label>
      </div>
      <label
        v-if="showOpacity"
        class="figma-alpha-track"
        :style="{
          '--thumb-position': `${alphaTrackPosition}px`,
          '--track-background': alphaTrack,
          '--thumb-background': alphaThumb,
        }"
      >
        <span class="visually-hidden">Непрозрачность</span>
        <input
          :value="opacity"
          type="range"
          min="0"
          max="100"
          @input="emit('update:opacity', Number(($event.target as HTMLInputElement).value))"
        />
      </label>
    </div>
  </div>
</template>

<style scoped>
.figma-color-input {
  position: relative;
  display: grid;
  width: 219px;
  height: 40px;
  grid-template-columns: 152px 67px;
  border: 1px solid #ececec;
  border-radius: 10px;
  color: #000;
  background: #fff;
}

.figma-color-input.open {
  z-index: 5;
  border-color: #2f2f2f;
  color: #fff;
  background: #000;
}

.figma-color-input.without-opacity {
  grid-template-columns: 1fr;
}

.figma-color-input.without-opacity .figma-color-main {
  width: 100%;
  grid-template-columns: 40px 1fr;
}

.figma-color-input.without-opacity .figma-color-popover {
  height: 204px;
}

.figma-color-main {
  display: grid;
  width: 152px;
  grid-template-columns: 40px 112px;
  align-items: center;
}

.figma-color-swatch {
  width: 24px;
  min-width: 24px;
  height: 24px;
  min-height: 24px;
  margin: 0 8px;
  padding: 0;
  border: 0;
  border-radius: 4px;
}

.figma-color-main input,
.figma-color-opacity input {
  width: 100%;
  height: 38px;
  min-height: 38px;
  padding: 8px 0;
  border: 0;
  border-radius: 0;
  color: inherit;
  background: transparent;
  font-size: 16px;
  line-height: 20px;
  appearance: textfield;
}

.figma-color-main input {
  padding-right: 10px;
}

.figma-color-opacity {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0;
  min-width: 0;
  padding: 0 8px;
  border-left: 1px solid #ececec;
  cursor: ew-resize;
  touch-action: none;
}

.open .figma-color-opacity {
  border-color: #2f2f2f;
}

.figma-color-opacity input {
  flex: 1 1 auto;
  width: 0;
  min-width: 0;
  padding: 0;
  text-align: right;
  font-variant-numeric: tabular-nums;
  cursor: ew-resize;
}

.figma-color-opacity span {
  flex: 0 0 auto;
  padding: 0 2px;
  color: #8d8b91;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
}

.figma-color-main input::-webkit-inner-spin-button,
.figma-color-opacity input::-webkit-inner-spin-button {
  appearance: none;
}

.figma-color-popover {
  position: absolute;
  display: flex;
  width: 172px;
  height: 236px;
  flex-direction: column;
  gap: 8px;
  padding: 4px;
  border-radius: 16px;
  background: #000;
  z-index: 6;
}

.figma-saturation-field {
  position: relative;
  width: 164px;
  height: 164px;
  overflow: hidden;
  border-radius: 12px;
  background-image:
    linear-gradient(to top, #000, transparent),
    linear-gradient(to right, #fff, transparent);
  cursor: crosshair;
  touch-action: none;
}

.figma-saturation-field i {
  position: absolute;
  width: 24px;
  height: 24px;
  border: 2px solid #fff;
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.figma-hue-track,
.figma-alpha-track {
  position: relative;
  display: block;
  width: 164px;
  height: 24px;
  flex: 0 0 24px;
}

.figma-hue-row {
  display: flex;
  width: 164px;
  height: 24px;
  flex: 0 0 24px;
  align-items: center;
  gap: 8px;
  padding: 0 6px;
}

.figma-eyedropper {
  display: grid;
  width: 20px;
  height: 20px;
  min-width: 20px;
  min-height: 20px;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
}

.figma-eyedropper img {
  display: block;
  width: 20px;
  height: 20px;
}

.figma-eyedropper:hover:not(:disabled) {
  background: rgb(255 255 255 / 14%);
}

.figma-eyedropper:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 2px;
}

.figma-eyedropper:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.figma-hue-track {
  width: 124px;
}

.figma-hue-track::before,
.figma-alpha-track::before {
  position: absolute;
  top: 6px;
  left: 6px;
  width: 152px;
  height: 12px;
  border-radius: 999px;
  content: "";
}

.figma-hue-track::before {
  left: 0;
  width: 124px;
  background: linear-gradient(270deg, #f00, #ffae00 10%, #bfff00 20%, #00ff26 30%, #00ff99 40%, #00ffd9 50%, #006aff 60%, #5500ff 70%, #b200ff 80%, #ff00ae 90%, #ff0004);
}

.figma-alpha-track::before {
  background: var(--track-background);
}

.figma-hue-track::after,
.figma-alpha-track::after {
  position: absolute;
  top: 50%;
  left: var(--thumb-position);
  box-sizing: border-box;
  width: 24px;
  height: 24px;
  border: 2px solid #fff;
  border-radius: 50%;
  background: var(--thumb-background, #00b3ff);
  content: "";
  pointer-events: none;
  transform: translate(-50%, -50%);
}

.figma-hue-track input,
.figma-alpha-track input {
  position: absolute;
  inset: 0;
  width: 164px;
  min-height: 24px;
  margin: 0;
  padding: 0;
  border: 0;
  opacity: 0;
  cursor: pointer;
  touch-action: none;
}

.figma-hue-track input {
  width: 124px;
  direction: rtl;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
</style>
