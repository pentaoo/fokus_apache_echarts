<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps<{
  modelValue: number
  label: string
  disabled?: boolean
  minimum?: number
  maximum?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const inputElement = ref<HTMLInputElement | null>(null)
const draft = ref('')
const editing = ref(false)
const scrubbing = ref(false)
let stopScrub: (() => void) | null = null

function clamp(value: number) {
  const minimum = Math.ceil(props.minimum ?? 0)
  const maximum = Math.floor(props.maximum ?? 100)
  return Math.min(maximum, Math.max(minimum, Math.round(value)))
}

function syncDraft(value: number) {
  draft.value = String(clamp(value))
}

function updateDraft(event: Event) {
  const input = event.target as HTMLInputElement
  const digits = input.value.replace(/\D/g, '').slice(0, 3)

  if (digits === '') {
    draft.value = ''
    return
  }

  const value = clamp(Number.parseInt(digits, 10))
  draft.value = String(value)
  emit('update:modelValue', value)
}

function finishEditing() {
  editing.value = false
  syncDraft(props.modelValue)
}

function setValue(value: number) {
  const nextValue = clamp(value)
  draft.value = String(nextValue)
  emit('update:modelValue', nextValue)
}

function startScrub(event: PointerEvent) {
  if (props.disabled || event.button !== 0 || !event.isPrimary) return

  event.preventDefault()
  stopScrub?.()

  const startX = event.clientX
  const startY = event.clientY
  const startValue = props.modelValue
  let didScrub = false

  const move = (moveEvent: PointerEvent) => {
    const horizontalDistance = moveEvent.clientX - startX
    const verticalDistance = startY - moveEvent.clientY
    const distance =
      Math.abs(horizontalDistance) >= Math.abs(verticalDistance)
        ? horizontalDistance
        : verticalDistance

    if (!didScrub && Math.abs(distance) < 3) return
    didScrub = true
    scrubbing.value = true
    setValue(startValue + distance / 5)
  }

  const finish = () => {
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', finish)
    window.removeEventListener('pointercancel', finish)
    stopScrub = null
    scrubbing.value = false

    if (!didScrub) {
      inputElement.value?.focus({ preventScroll: true })
      inputElement.value?.select()
    }
  }

  stopScrub = finish
  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', finish, { once: true })
  window.addEventListener('pointercancel', finish, { once: true })
}

function onScrubKeydown(event: KeyboardEvent) {
  if (props.disabled) return

  const step = event.shiftKey ? 10 : 1
  let nextValue: number | undefined
  if (event.key === 'ArrowRight' || event.key === 'ArrowUp') nextValue = props.modelValue + step
  else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') nextValue = props.modelValue - step
  else if (event.key === 'Home') nextValue = props.minimum ?? 0
  else if (event.key === 'End') nextValue = props.maximum ?? 100

  if (nextValue === undefined) return
  event.preventDefault()
  setValue(nextValue)
}

watch(
  () => props.modelValue,
  (value) => {
    if (!editing.value) syncDraft(value)
  },
  { immediate: true },
)

onBeforeUnmount(() => stopScrub?.())
</script>

<template>
  <div class="figma-percent-input" :class="{ scrubbing }">
    <input
      ref="inputElement"
      v-model="draft"
      type="text"
      inputmode="numeric"
      maxlength="3"
      autocomplete="off"
      :disabled="disabled"
      :aria-label="label"
      @focus="editing = true"
      @input="updateDraft"
      @blur="finishEditing"
      @keydown.enter.prevent="finishEditing"
    />
    <span
      class="figma-percent-scrubber"
      role="slider"
      :tabindex="disabled ? -1 : 0"
      :aria-label="`${label}: изменить перетаскиванием`"
      :aria-valuemin="Math.ceil(minimum ?? 0)"
      :aria-valuemax="Math.floor(maximum ?? 100)"
      :aria-valuenow="clamp(modelValue)"
      :aria-valuetext="`${clamp(modelValue)} процентов`"
      title="Потяните, чтобы изменить значение"
      @pointerdown="startScrub"
      @keydown="onScrubKeydown"
    >%</span>
  </div>
</template>

<style scoped>
.figma-percent-input {
  display: flex;
  width: 67px;
  height: 40px;
  min-width: 67px;
  align-items: center;
  justify-content: flex-end;
  gap: 0;
  padding: 0 8px;
  border: 1px solid #ececec;
  border-radius: 10px;
  background: transparent;
  line-height: 20px;
}

.figma-percent-input input {
  flex: 1 1 auto;
  width: 0;
  min-width: 0;
  height: 38px;
  min-height: 38px;
  padding: 0;
  border: 0;
  border-radius: 0;
  color: inherit;
  background: transparent;
  font-size: 16px;
  font-variant-numeric: tabular-nums;
  line-height: 20px;
  text-align: right;
}

.figma-percent-scrubber {
  position: relative;
  display: inline-flex;
  height: 20px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  padding: 0 2px;
  color: #8d8b91;
  cursor: ew-resize;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  touch-action: none;
  user-select: none;
}

.figma-percent-scrubber::after {
  position: absolute;
  inset: 8px -6px;
  content: "";
}

.figma-percent-scrubber:focus-visible {
  border-radius: 4px;
  outline: 2px solid #5500eb;
  outline-offset: 1px;
}

.figma-percent-input.scrubbing,
.figma-percent-input.scrubbing * {
  cursor: ew-resize;
}

.figma-percent-input:has(input:disabled) {
  cursor: not-allowed;
  opacity: 0.42;
}

.figma-percent-input:has(input:disabled) .figma-percent-scrubber {
  cursor: not-allowed;
}
</style>
