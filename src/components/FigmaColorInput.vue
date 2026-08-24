<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps<{
  modelValue: string
  opacity: number
  label: string
  open: boolean
  popoverOffsetY?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:opacity': [value: number]
  open: []
  close: []
}>()

const root = ref<HTMLElement | null>(null)
const saturationField = ref<HTMLElement | null>(null)
const draft = ref(props.modelValue.replace('#', '').toUpperCase())
const hue = ref(196)
const saturation = ref(50)
const brightness = ref(88)
const pendingInternalColor = ref<string | null>(null)

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

function closeOutside(event: PointerEvent) {
  const target = event.target
  if (target instanceof Element && target.closest('.figma-color-input')) return
  if (props.open) emit('close')
}

function toggleOpen() {
  if (props.open) emit('close')
  else emit('open')
}

const pureHue = computed(() => `hsl(${hue.value} 100% 50%)`)
const sliderThumbRadius = 12
const sliderThumbInset = sliderThumbRadius
const sliderThumbTravel = 164 - sliderThumbInset * 2
const hueTrackPosition = computed(
  () => sliderThumbInset + ((360 - hue.value) / 360) * sliderThumbTravel,
)
const alphaTrackPosition = computed(
  () => sliderThumbInset + (props.opacity / 100) * sliderThumbTravel,
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

onMounted(() => document.addEventListener('pointerdown', closeOutside))
onBeforeUnmount(() => document.removeEventListener('pointerdown', closeOutside))
</script>

<template>
  <div ref="root" class="figma-color-input" :class="{ open }">
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
    <div class="figma-color-opacity">
      <input
        :value="opacity"
        type="number"
        min="0"
        max="100"
        :style="{ width: `${String(Math.round(opacity)).length}ch` }"
        :aria-label="`${label}: непрозрачность`"
        @input="emit('update:opacity', clamp(Number(($event.target as HTMLInputElement).value) || 0))"
      />
      <span>%</span>
    </div>

    <div
      v-if="open"
      class="figma-color-popover"
      :style="{ top: `${-5 + (popoverOffsetY ?? 0)}px` }"
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
      <label
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
  width: 224px;
  height: 40px;
  grid-template-columns: 152px 72px;
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
  justify-content: center;
  gap: 8px;
  padding: 0;
  border-left: 1px solid #ececec;
}

.open .figma-color-opacity {
  border-color: #2f2f2f;
}

.figma-color-opacity input {
  flex: 0 0 auto;
  min-width: 1ch;
  padding: 0;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.figma-color-opacity span {
  flex: 0 0 auto;
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
  left: -181px;
  display: flex;
  width: 172px;
  height: 236px;
  flex-direction: column;
  gap: 8px;
  padding: 4px;
  border-radius: 16px;
  background: #000;
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
