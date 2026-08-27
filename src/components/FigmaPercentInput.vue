<script setup lang="ts">
import { ref, watch } from 'vue'

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

const draft = ref('')
const editing = ref(false)

function clamp(value: number) {
  const minimum = props.minimum ?? 0
  const maximum = props.maximum ?? 100
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

watch(
  () => props.modelValue,
  (value) => {
    if (!editing.value) syncDraft(value)
  },
  { immediate: true },
)
</script>

<template>
  <div class="figma-percent-input">
    <input
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
    <span aria-hidden="true">%</span>
  </div>
</template>

<style scoped>
.figma-percent-input {
  display: flex;
  width: 66px;
  height: 40px;
  min-width: 66px;
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

.figma-percent-input span {
  flex: 0 0 auto;
  padding: 0 2px;
  color: #8d8b91;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
}

.figma-percent-input:has(input:disabled) {
  cursor: not-allowed;
  opacity: 0.42;
}
</style>
