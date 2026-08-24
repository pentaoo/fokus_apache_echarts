<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import FigmaColorInput from './FigmaColorInput.vue'
import type {
  BarArrangement,
  BarOrder,
  BarValuePosition,
  LabelAlignment,
  ResolvedChartStyle,
} from '../chartStyle'
import type { ChartType, PalettePresetId } from '../stylePresets'
import alignCenterIcon from '../assets/new-ui/align-center.svg'
import alignLeftIcon from '../assets/new-ui/align-left.svg'
import alignRightIcon from '../assets/new-ui/align-right.svg'
import clearIcon from '../assets/new-ui/clear-mark.svg'
import columnsIcon from '../assets/new-ui/columns-purple.svg'
import doughnutIcon from '../assets/new-ui/doughnut.svg'
import lineIcon from '../assets/new-ui/line.svg'
import orderRandomIcon from '../assets/new-ui/order-random.svg'
import orderReversedIcon from '../assets/new-ui/order-reversed.svg'
import pieIcon from '../assets/new-ui/pie.svg'
import randomIcon from '../assets/new-ui/random.svg'
import rowsIcon from '../assets/new-ui/rows.svg'

interface PaletteChoice {
  id: Exclude<PalettePresetId, 'custom'> | 'chalk'
  name: string
  colors: string[]
}

const props = defineProps<{
  settings: ResolvedChartStyle
  chartType: ChartType
  chartTitle: string
  selectedPaletteId: PalettePresetId | 'chalk'
}>()

const emit = defineEmits<{
  'update:chart-title': [value: string]
  'select-chart-type': [value: ChartType]
  'select-columns-bar': []
  'select-horizontal-bar': []
  'apply-palette': [id: PaletteChoice['id'], colors: string[]]
  'mark-palette-custom': []
  'randomize': []
  'clear': []
  close: []
}>()

const paletteChoices: PaletteChoice[] = [
  {
    id: 'mono',
    name: 'Одноцветная',
    colors: ['#f4f1ff', '#d8ccff', '#b5a0ff', '#8e6dff', '#6a38f0'],
  },
  {
    id: 'fokus',
    name: 'Яркая',
    colors: ['#7559ff', '#00b587', '#ffc548', '#f23f3a', '#fe76b4'],
  },
  {
    id: 'chalk',
    name: 'Мелки',
    colors: ['#71c1e3', '#82bb89', '#f9ea6e', '#f9b77d', '#fca4b5'],
  },
  {
    id: 'warm',
    name: 'Закат',
    colors: ['#3a0ca3', '#7308b8', '#f72586', '#f97f02', '#ffba0a'],
  },
  {
    id: 'contrast',
    name: 'Контрастная',
    colors: ['#101010', '#5500eb', '#00b587', '#ffc548', '#f23f3a'],
  },
]

const typeChoices: Array<{
  id: 'columns' | 'rows' | 'doughnut' | 'pie' | 'line'
  label: string
  icon: string
}> = [
  { id: 'columns', label: 'Колонки', icon: columnsIcon },
  { id: 'rows', label: 'Строки', icon: rowsIcon },
  { id: 'doughnut', label: 'Кольцо', icon: doughnutIcon },
  { id: 'pie', label: 'Круг', icon: pieIcon },
  { id: 'line', label: 'Линия', icon: lineIcon },
]

const activeType = computed(() => {
  if (props.chartType === 'bar') {
    return props.settings.barHorizontal || props.settings.barArrangement === 'horizontal'
      ? 'rows'
      : 'columns'
  }
  return props.chartType
})

const presetScroll = ref<HTMLElement | null>(null)
const presetDragging = ref(false)
const openPaletteIndex = ref<number | null>(null)
let presetPointerId: number | null = null
let presetDragStartX = 0
let presetDragStartScrollLeft = 0
let presetDidDrag = false
let presetLastX = 0
let presetLastTime = 0
let presetVelocity = 0
let presetInertiaFrame = 0

function stopPresetInertia() {
  if (!presetInertiaFrame) return
  window.cancelAnimationFrame(presetInertiaFrame)
  presetInertiaFrame = 0
}

function startPresetInertia() {
  const scroll = presetScroll.value
  presetVelocity = Math.min(0.65, Math.max(-0.65, presetVelocity))
  if (!scroll || Math.abs(presetVelocity) < 0.04) return
  let previousTime = performance.now()

  const animate = (currentTime: number) => {
    const elapsed = Math.min(32, currentTime - previousTime)
    previousTime = currentTime
    const previousScrollLeft = scroll.scrollLeft
    scroll.scrollLeft += presetVelocity * elapsed
    presetVelocity *= Math.pow(0.88, elapsed / 16.67)

    const reachedEdge = Math.abs(scroll.scrollLeft - previousScrollLeft) < 0.1
    if (reachedEdge || Math.abs(presetVelocity) < 0.04) {
      presetInertiaFrame = 0
      return
    }
    presetInertiaFrame = window.requestAnimationFrame(animate)
  }

  presetInertiaFrame = window.requestAnimationFrame(animate)
}

function startPresetDrag(event: PointerEvent) {
  if (event.button !== 0 || !presetScroll.value) return
  stopPresetInertia()
  presetPointerId = event.pointerId
  presetDragStartX = event.clientX
  presetDragStartScrollLeft = presetScroll.value.scrollLeft
  presetDidDrag = false
  presetLastX = event.clientX
  presetLastTime = performance.now()
  presetVelocity = 0
}

function movePresetDrag(event: PointerEvent) {
  const scroll = presetScroll.value
  if (!scroll || presetPointerId !== event.pointerId) return
  const offset = event.clientX - presetDragStartX
  if (!presetDidDrag && Math.abs(offset) < 4) return
  const currentTime = performance.now()
  if (!presetDidDrag) {
    presetDidDrag = true
    presetDragging.value = true
    scroll.setPointerCapture(event.pointerId)
    scroll.scrollLeft = presetDragStartScrollLeft - offset
    presetVelocity = -offset / Math.max(16, currentTime - presetLastTime)
  } else {
    const deltaX = event.clientX - presetLastX
    const elapsed = Math.max(4, currentTime - presetLastTime)
    scroll.scrollLeft -= deltaX
    const currentVelocity = -deltaX / elapsed
    presetVelocity = presetVelocity * 0.55 + currentVelocity * 0.45
  }
  presetLastX = event.clientX
  presetLastTime = currentTime
  event.preventDefault()
}

function finishPresetDrag(event: PointerEvent) {
  const scroll = presetScroll.value
  if (!scroll || presetPointerId !== event.pointerId) return
  if (scroll.hasPointerCapture(event.pointerId)) scroll.releasePointerCapture(event.pointerId)
  presetPointerId = null
  presetDragging.value = false
  if (presetDidDrag) {
    startPresetInertia()
    window.setTimeout(() => {
      presetDidDrag = false
    })
  }
}

function preventPresetClick(event: MouseEvent) {
  if (!presetDidDrag) return
  event.preventDefault()
  event.stopPropagation()
  presetDidDrag = false
}

onBeforeUnmount(stopPresetInertia)

function selectType(id: (typeof typeChoices)[number]['id']) {
  if (id === 'rows') {
    emit('select-horizontal-bar')
    return
  }
  if (id === 'columns') {
    emit('select-columns-bar')
    return
  }
  emit('select-chart-type', id)
}

function setPalette(choice: PaletteChoice) {
  emit('apply-palette', choice.id, choice.colors)
}

function updatePaletteColor(index: number, value: string) {
  props.settings.palette[index] = value
  emit('mark-palette-custom')
}

function updatePaletteOpacity(index: number, value: number) {
  props.settings.paletteOpacities[index] = value
  emit('mark-palette-custom')
}

function rangeStyle(value: number, minimum: number, maximum: number) {
  const progress = Math.min(
    1,
    Math.max(0, (value - minimum) / (maximum - minimum)),
  )
  const trackWidth = 176
  const thumbSize = 24
  const fillWidth = thumbSize / 2 + (trackWidth - thumbSize) * progress
  return { '--range-progress': `${fillWidth}px` }
}

function readPercent(event: Event, update: (value: number) => void) {
  const input = event.target as HTMLInputElement
  if (input.value === '') return
  const value = Number(input.value)
  if (!Number.isFinite(value)) return
  update(Math.min(100, Math.max(0, Math.round(value))))
}

function updateBarRadiusPercent(event: Event) {
  readPercent(event, (value) => {
    props.settings.barRadius = value * 1.2
  })
}

function updateBarWidthPercent(event: Event) {
  readPercent(event, (value) => {
    props.settings.barMaxWidth = 20 + value * 1.6
  })
}

function updateBarGapPercent(event: Event) {
  readPercent(event, (value) => {
    props.settings.barGapPercent = value
  })
}
</script>

<template>
  <section class="new-design-panel" aria-labelledby="new-design-title">
    <header class="new-design-heading">
      <h2 id="new-design-title">График</h2>
      <button
        class="new-design-clear"
        type="button"
        aria-label="Закрыть настройки графика"
        title="Закрыть настройки графика"
        @click="emit('close')"
      >
        <img :src="clearIcon" alt="" />
      </button>
    </header>

    <div class="new-design-title-field">
      <label for="new-chart-title">Название</label>
      <input
        id="new-chart-title"
        :value="chartTitle"
        type="text"
        @input="emit('update:chart-title', ($event.target as HTMLInputElement).value)"
      />
    </div>

    <section class="new-design-type-section">
      <div class="new-design-section-heading">
        <h3>Тип графика</h3>
        <button
          class="new-design-random"
          type="button"
          aria-label="Случайный стиль"
          title="Случайный стиль"
          @click="emit('randomize')"
        >
          <img :src="randomIcon" alt="" />
        </button>
      </div>
      <div class="new-design-types">
        <button
          v-for="typeChoice in typeChoices"
          :key="typeChoice.id"
          type="button"
          :class="{ active: activeType === typeChoice.id }"
          :aria-pressed="activeType === typeChoice.id"
          @click="selectType(typeChoice.id)"
        >
          <span aria-hidden="true"><img :src="typeChoice.icon" alt="" /></span>
          {{ typeChoice.label }}
        </button>
      </div>
    </section>

    <div class="new-design-divider" />

    <div class="new-design-settings">
      <section class="new-design-section colors-section">
        <h3>Палитра</h3>
        <div
          ref="presetScroll"
          class="new-design-preset-scroll"
          :class="{ dragging: presetDragging }"
          @pointerdown="startPresetDrag"
          @pointermove="movePresetDrag"
          @pointerup="finishPresetDrag"
          @pointercancel="finishPresetDrag"
          @click.capture="preventPresetClick"
        >
          <button
            v-for="choice in paletteChoices"
            :key="choice.id"
            type="button"
            class="new-design-preset"
            :class="{ active: selectedPaletteId === choice.id }"
            :aria-pressed="selectedPaletteId === choice.id"
            @click="setPalette(choice)"
          >
            <span>{{ choice.name }}</span>
            <span class="new-design-dots" aria-hidden="true">
              <i
                v-for="color in choice.colors"
                :key="color"
                :style="{ backgroundColor: color }"
              />
            </span>
          </button>
        </div>

        <div class="new-design-palette-card">
          <span>Цвета</span>
          <div class="new-design-palette-list">
            <FigmaColorInput
              v-for="(color, index) in settings.palette.slice(0, 5)"
              :key="index"
              :model-value="color"
              :opacity="settings.paletteOpacities[index] ?? 100"
              :label="`Цвет ${index + 1}`"
              :open="openPaletteIndex === index"
              :popover-offset-y="-index * 48"
              @open="openPaletteIndex = index"
              @close="openPaletteIndex = null"
              @update:model-value="updatePaletteColor(index, $event)"
              @update:opacity="updatePaletteOpacity(index, $event)"
            />
          </div>
        </div>
      </section>

      <section v-if="chartType === 'bar'" class="new-design-section">
        <h3>Колонки</h3>
        <div class="new-design-card-stack">
          <div class="new-design-range-row first">
            <span>Скругление</span>
            <input
              v-model.number="settings.barRadius"
              type="range"
              min="0"
              max="120"
              aria-label="Скругление колонок"
              :style="rangeStyle(settings.barRadius, 0, 120)"
            />
            <div class="new-design-percent-input">
              <input
                :value="Math.round((settings.barRadius / 120) * 100)"
                type="number"
                min="0"
                max="100"
                aria-label="Скругление колонок в процентах"
                @input="updateBarRadiusPercent"
              />
              <span>%</span>
            </div>
          </div>
          <div class="new-design-range-row">
            <span>Ширина</span>
            <input
              v-model.number="settings.barMaxWidth"
              type="range"
              min="20"
              max="180"
              aria-label="Ширина колонок"
              :style="rangeStyle(settings.barMaxWidth, 20, 180)"
            />
            <div class="new-design-percent-input">
              <input
                :value="Math.round(((settings.barMaxWidth - 20) / 160) * 100)"
                type="number"
                min="0"
                max="100"
                aria-label="Ширина колонок в процентах"
                @input="updateBarWidthPercent"
              />
              <span>%</span>
            </div>
          </div>
          <div class="new-design-range-row">
            <span>Расстояние между колонок</span>
            <input
              v-model.number="settings.barGapPercent"
              type="range"
              min="0"
              max="100"
              aria-label="Расстояние между колонками"
              :style="rangeStyle(settings.barGapPercent, 0, 100)"
            />
            <div class="new-design-percent-input">
              <input
                :value="settings.barGapPercent"
                type="number"
                min="0"
                max="100"
                aria-label="Расстояние между колонками в процентах"
                @input="updateBarGapPercent"
              />
              <span>%</span>
            </div>
          </div>
          <div class="new-design-control-row">
            <span>Порядок колонок</span>
            <div class="new-design-icon-tabs" aria-label="Порядок колонок">
              <button
                v-for="choice in [
                  { value: 'normal', icon: columnsIcon, label: 'Обычный порядок' },
                  { value: 'reverse', icon: orderReversedIcon, label: 'Обратный порядок' },
                  { value: 'value', icon: orderRandomIcon, label: 'По значению' },
                ]"
                :key="choice.value"
                type="button"
                :class="{ active: settings.barOrder === choice.value }"
                :aria-label="choice.label"
                :disabled="choice.value === 'value' && !settings.barHorizontal"
                :title="choice.value === 'value' && !settings.barHorizontal ? 'Сортировка по значению доступна для горизонтальных столбцов' : undefined"
                @click="settings.barOrder = choice.value as BarOrder"
              >
                <img :src="choice.icon" alt="" />
              </button>
            </div>
          </div>
          <div class="new-design-control-row last">
            <span>Расположение</span>
            <div class="new-design-text-tabs">
              <button
                type="button"
                :class="{ active: settings.barArrangement !== 'stacked' }"
                @click="settings.barArrangement = 'grouped'"
              >Рядом</button>
              <button
                type="button"
                :class="{ active: settings.barArrangement === 'stacked' }"
                @click="settings.barArrangement = 'stacked'"
              >Стопкой</button>
            </div>
          </div>
        </div>
      </section>

      <section class="new-design-section">
        <h3>Подписи и легенда</h3>
        <div class="new-design-card-stack">
          <div class="new-design-control-row first">
            <span>Выравнивание текста</span>
            <div class="new-design-icon-tabs" aria-label="Выравнивание текста">
              <button
                v-for="choice in [
                  { value: 'left', icon: alignLeftIcon, label: 'По левому краю' },
                  { value: 'center', icon: alignCenterIcon, label: 'По центру' },
                  { value: 'right', icon: alignRightIcon, label: 'По правому краю' },
                ]"
                :key="choice.value"
                type="button"
                :class="[`align-${choice.value}`, { active: settings.labelAlignment === choice.value }]"
                :aria-label="choice.label"
                @click="settings.labelAlignment = choice.value as LabelAlignment"
              >
                <img :src="choice.icon" alt="" />
              </button>
            </div>
          </div>
          <div v-if="chartType === 'bar'" class="new-design-control-row">
            <span>Значения</span>
            <div class="new-design-text-tabs">
              <button
                type="button"
                :class="{ active: settings.barValuePosition === 'top' }"
                @click="settings.barValuePosition = 'top' as BarValuePosition"
              >Снаружи</button>
              <button
                type="button"
                :class="{ active: settings.barValuePosition === 'inside' }"
                @click="settings.barValuePosition = 'inside' as BarValuePosition"
              >Внутри</button>
            </div>
          </div>
          <label class="new-design-switch-row">
            <span>Горизонтальные подписи</span>
            <input v-model="settings.showXAxisLabels" type="checkbox" />
            <i aria-hidden="true" />
          </label>
          <label class="new-design-switch-row">
            <span>Вертикальные подписи</span>
            <input v-model="settings.showYAxisLabels" type="checkbox" />
            <i aria-hidden="true" />
          </label>
          <label class="new-design-switch-row">
            <span>Легенда</span>
            <input v-model="settings.showLegend" type="checkbox" />
            <i aria-hidden="true" />
          </label>
          <label class="new-design-switch-row last">
            <span>Заголовок</span>
            <input v-model="settings.showTitle" type="checkbox" />
            <i aria-hidden="true" />
          </label>
        </div>
      </section>
    </div>
  </section>
</template>

<style scoped>
.new-design-panel {
  --new-ui-accent: #5500eb;
  width: 581px;
  min-height: 1676px;
  overflow: hidden;
  padding-bottom: 128px;
  color: #000;
  background: #f6f6f6;
  font-family: "ALS Hauss", Arial, Helvetica, sans-serif;
}

button,
input {
  font: inherit;
}

button:focus-visible,
input:focus-visible {
  outline: 3px solid color-mix(in srgb, var(--new-ui-accent) 34%, white);
  outline-offset: 2px;
}

.new-design-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  height: 88px;
  padding: 20px;
}

.new-design-heading h2 {
  margin: 0;
  font-size: 40px;
  font-weight: 900;
  line-height: 48px;
  letter-spacing: -1.5px;
}

.new-design-clear,
.new-design-random {
  display: grid;
  min-width: 0;
  padding: 0;
  border: 0;
  place-items: center;
  color: #000;
  background: transparent;
}

.new-design-clear {
  width: 32px;
  height: 32px;
  font-size: 30px;
  font-weight: 300;
  line-height: 1;
}

.new-design-clear img {
  width: 18px;
  height: 18px;
}

.new-design-clear:hover,
.new-design-random:hover {
  color: var(--new-ui-accent);
  background: transparent;
}

.new-design-title-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  height: 90px;
  padding: 10px 20px;
}

.new-design-title-field label {
  height: 14px;
  padding-left: 16px;
  color: #8d8b91;
  font-size: 12px;
  line-height: 14px;
}

.new-design-title-field input {
  width: 100%;
  height: 52px;
  min-height: 52px;
  padding: 13px 16px;
  border: 0;
  border-radius: 26px;
  color: #000;
  background: #fff;
  font-size: 16px;
  line-height: 24px;
}

.new-design-type-section {
  height: 172px;
  padding: 10px 20px;
}

.new-design-section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 24px;
  padding-left: 16px;
}

.new-design-section-heading h3,
.new-design-section > h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  line-height: 24px;
}

.new-design-random {
  width: 46px;
  height: 24px;
  border-radius: 999px;
  color: var(--new-ui-accent);
  font-size: 22px;
  line-height: 24px;
}

.new-design-random img {
  width: 46px;
  height: 24px;
}

.new-design-types {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
  margin-top: 16px;
}

.new-design-types button {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 52px;
  min-height: 52px;
  padding: 8px 16px;
  border: 0;
  border-radius: 26px;
  color: #000;
  background: #ececec;
  font-size: 16px;
  line-height: 24px;
  white-space: nowrap;
}

.new-design-types button:nth-child(1),
.new-design-types button:nth-child(2) {
  grid-column: span 3;
}

.new-design-types button:nth-child(n + 3) {
  grid-column: span 2;
}

.new-design-types button:hover {
  background: #e2e2e2;
}

.new-design-types button.active {
  color: #fff;
  background: var(--new-ui-accent);
  font-weight: 600;
}

.new-design-types button > span {
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  color: var(--new-ui-accent);
  font-size: 22px;
}

.new-design-types button > span img,
.new-design-icon-tabs button img {
  width: 18px;
  height: 16px;
  object-fit: contain;
}

.new-design-types button.active > span {
  color: #fff;
}

.new-design-types button.active > span img,
.new-design-icon-tabs button.active img {
  filter: brightness(0) invert(1);
}

.new-design-divider {
  height: 48px;
  margin: 0 36px;
  border-top: 1px solid transparent;
  background: linear-gradient(#ececec, #ececec) center / 100% 1px no-repeat;
}

.new-design-settings {
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding: 10px 20px 0;
}

.new-design-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.new-design-section > h3 {
  padding: 0 16px;
}

.new-design-preset-scroll {
  display: flex;
  gap: 4px;
  width: 541px;
  overflow-x: auto;
  overflow-y: hidden;
  border-radius: 4px;
  cursor: grab;
  scrollbar-width: none;
  touch-action: pan-y;
}

.new-design-preset-scroll.dragging,
.new-design-preset-scroll.dragging * {
  cursor: grabbing;
  user-select: none;
}

.new-design-preset-scroll::-webkit-scrollbar {
  display: none;
}

.new-design-preset {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 2px;
  height: 40px;
  min-height: 40px;
  padding: 10px;
  border: 0;
  border-radius: 41px;
  background: #fff;
  font-size: 14px;
  line-height: 16px;
}

.new-design-preset > span:first-child {
  padding: 2px 6px;
}

.new-design-preset:hover {
  background: #ececec;
}

.new-design-preset:hover .new-design-dots i {
  border-color: #ececec;
}

.new-design-preset.active {
  color: #fff;
  background: #000;
}

.new-design-preset.active .new-design-dots i {
  border-color: #000;
}

.new-design-preset:nth-child(1) {
  width: 223px;
}

.new-design-preset:nth-child(2) {
  width: 165px;
}

.new-design-preset:nth-child(3) {
  width: 170px;
}

.new-design-preset:nth-child(4) {
  width: 163px;
}

.new-design-preset:nth-child(5) {
  width: 210px;
}

.new-design-dots {
  display: flex;
  flex: 0 0 92px;
  align-items: center;
  width: 92px;
  height: 20px;
}

.new-design-dots i {
  display: block;
  flex: 0 0 20px;
  width: 20px;
  height: 20px;
  margin-right: -2px;
  border: 2px solid #fff;
  border-radius: 50%;
}

.new-design-dots i:last-child {
  margin-right: 0;
}

.new-design-palette-card {
  display: flex;
  min-height: 264px;
  justify-content: space-between;
  padding: 16px;
  border-radius: 26px;
  background: #fff;
  font-size: 16px;
  line-height: 20px;
}

.new-design-palette-card > span {
  padding-top: 10px;
}

.new-design-palette-list {
  display: flex;
  width: 224px;
  flex-direction: column;
  gap: 8px;
}

.new-design-color-row {
  display: grid;
  grid-template-columns: 145px 48px 16px;
  align-items: center;
  height: 40px;
  overflow: hidden;
  border: 1px solid #ececec;
  border-radius: 10px;
}

.new-design-color-row :deep(.hex-color-editor) {
  display: grid;
  grid-template-columns: 40px 1fr;
  gap: 0;
  height: 40px;
}

.new-design-color-row :deep(input[type="color"]) {
  width: 24px;
  min-width: 24px;
  height: 24px;
  min-height: 24px;
  margin: 7px 8px;
  padding: 0;
  overflow: hidden;
  border: 0;
  border-radius: 4px;
}

.new-design-color-row :deep(.hex-code-input) {
  width: 104px;
  height: 38px;
  min-height: 38px;
  padding: 8px 8px 8px 0;
  border: 0;
  font-family: inherit;
  font-size: 16px;
}

.new-design-color-row > input {
  width: 48px;
  height: 38px;
  min-height: 38px;
  padding: 8px 0 8px 5px;
  border-width: 0 0 0 1px;
  border-color: #ececec;
  border-radius: 0;
  font-size: 16px;
  text-align: right;
  appearance: textfield;
}

.new-design-color-row > input::-webkit-inner-spin-button {
  appearance: none;
}

.new-design-color-row > span {
  padding-right: 6px;
}

.new-design-card-stack {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.new-design-range-row,
.new-design-control-row,
.new-design-switch-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 176px 64px;
  align-items: center;
  min-height: 72px;
  padding: 16px;
  gap: 16px;
  background: #fff;
  font-size: 16px;
  line-height: 20px;
}

.new-design-range-row.first,
.new-design-control-row.first {
  border-radius: 26px 26px 4px 4px;
}

.new-design-range-row input[type="range"] {
  appearance: none;
  width: 176px;
  height: 24px;
  min-height: 24px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background:
    linear-gradient(var(--new-ui-accent), var(--new-ui-accent)) left center /
      var(--range-progress) 24px no-repeat,
    linear-gradient(#d8d8d8, #d8d8d8) center / 100% 2px no-repeat;
  cursor: pointer;
}

.new-design-range-row input[type="range"]::-webkit-slider-runnable-track {
  height: 24px;
  border: 0;
  background: transparent;
}

.new-design-range-row input[type="range"]::-webkit-slider-thumb {
  width: 24px;
  height: 24px;
  margin: 0;
  appearance: none;
  border: 3px solid var(--new-ui-accent);
  border-radius: 50%;
  background: #fff;
}

.new-design-range-row input[type="range"]::-moz-range-track {
  height: 24px;
  border: 0;
  background: transparent;
}

.new-design-range-row input[type="range"]::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border: 3px solid var(--new-ui-accent);
  border-radius: 50%;
  background: #fff;
}

.new-design-percent-input {
  display: flex;
  width: 64px;
  height: 40px;
  align-items: center;
  justify-content: center;
  border: 1px solid #ececec;
  border-radius: 10px;
  line-height: 20px;
}

.new-design-percent-input input {
  width: 3ch;
  height: 38px;
  min-height: 38px;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  font-variant-numeric: tabular-nums;
  line-height: 20px;
  text-align: right;
  appearance: textfield;
}

.new-design-percent-input input::-webkit-inner-spin-button {
  appearance: none;
}

.new-design-control-row {
  grid-template-columns: minmax(0, 1fr) 256px;
  gap: 8px;
}

.new-design-control-row.last,
.new-design-switch-row.last {
  border-radius: 4px 4px 26px 26px;
}

.new-design-icon-tabs,
.new-design-text-tabs {
  display: grid;
  width: 256px;
  height: 40px;
  grid-template-columns: repeat(3, 1fr);
  overflow: hidden;
  border-radius: 999px;
  background: #f6f6f6;
}

.new-design-icon-tabs button,
.new-design-text-tabs button {
  min-width: 0;
  min-height: 40px;
  padding: 0 8px;
  border: 0;
  border-radius: 999px;
  color: var(--new-ui-accent);
  background: transparent;
}

.new-design-icon-tabs button {
  display: grid;
  place-items: center;
}

.new-design-icon-tabs button.align-left {
  text-align: left;
}

.new-design-icon-tabs button.align-center {
  text-align: center;
}

.new-design-icon-tabs button.align-right {
  text-align: right;
}

.new-design-icon-tabs button.active,
.new-design-text-tabs button.active {
  color: #fff;
  background: var(--new-ui-accent);
}

.new-design-text-tabs button.active {
  font-weight: 500;
}

.new-design-icon-tabs button:disabled {
  cursor: not-allowed;
  opacity: 0.34;
}

.new-design-text-tabs {
  grid-template-columns: repeat(2, 1fr);
}

.new-design-text-tabs button {
  color: #8d8b91;
  font-size: 14px;
  line-height: 16px;
}

.new-design-switch-row {
  position: relative;
  min-height: 58px;
  grid-template-columns: minmax(0, 1fr) 52px;
  gap: 24px;
}

.new-design-switch-row input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
}

.new-design-switch-row i {
  position: relative;
  width: 52px;
  height: 26px;
  border-radius: 100px;
  background: #d8d8d8;
}

.new-design-switch-row i::after {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff;
  content: "";
  transition: transform 160ms ease;
}

.new-design-switch-row input:checked + i {
  background: var(--new-ui-accent);
}

.new-design-switch-row input:checked + i::after {
  transform: translateX(26px);
}

.new-design-switch-row input:focus-visible + i {
  outline: 3px solid color-mix(in srgb, var(--new-ui-accent) 34%, white);
  outline-offset: 2px;
}
</style>
