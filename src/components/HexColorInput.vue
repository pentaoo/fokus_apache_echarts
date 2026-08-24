<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  label: string
  disabled?: boolean
}>()

const color = defineModel<string>({ required: true })
const draft = ref(color.value)
const editing = ref(false)

function normalizeHex(value: string, allowShort: boolean) {
  const trimmed = value.trim().replace(/^#?/, '#').toUpperCase()

  if (/^#[0-9A-F]{6}$/.test(trimmed)) return trimmed
  if (allowShort && /^#[0-9A-F]{3}$/.test(trimmed)) {
    return `#${trimmed
      .slice(1)
      .split('')
      .map((character) => character.repeat(2))
      .join('')}`
  }
  return null
}

function applyCompleteHex() {
  const normalized = normalizeHex(draft.value, false)
  if (!normalized) return

  color.value = normalized
  draft.value = normalized
}

function finishEditing() {
  const normalized = normalizeHex(draft.value, true)
  if (normalized) color.value = normalized

  draft.value = normalized ?? color.value
  editing.value = false
}

function updateFromPicker(event: Event) {
  const nextColor = (event.target as HTMLInputElement).value.toUpperCase()
  color.value = nextColor
  draft.value = nextColor
}

watch(color, (nextColor) => {
  if (!editing.value) draft.value = nextColor.toUpperCase()
})
</script>

<template>
  <div class="hex-color-editor">
    <input
      :value="color"
      type="color"
      :disabled="props.disabled"
      :aria-label="`${props.label}: выбрать цвет`"
      @input="updateFromPicker"
    />
    <input
      v-model="draft"
      class="hex-code-input"
      type="text"
      inputmode="text"
      autocomplete="off"
      spellcheck="false"
      maxlength="7"
      placeholder="#RRGGBB"
      :disabled="props.disabled"
      :aria-label="`${props.label}: HEX-код`"
      @focus="editing = true"
      @input="applyCompleteHex"
      @blur="finishEditing"
      @keydown.enter.prevent="finishEditing"
    />
  </div>
</template>

<style scoped>
.hex-color-editor {
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr);
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.hex-code-input {
  width: 100%;
  min-width: 0;
  min-height: 28px;
  height: 28px;
  padding: 4px 6px;
  font-family: "ALS Hauss", Arial, Helvetica, sans-serif;
  font-size: 0.68rem;
  text-transform: uppercase;
}

input[type="color"] {
  width: 30px;
  min-width: 30px;
  min-height: 28px;
  height: 28px;
  padding: 1px;
  border-color: #cfd3d7;
  border-radius: 4px;
  cursor: pointer;
}
</style>
