<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import FigmaColorInput from './FigmaColorInput.vue'
import FigmaPercentInput from './FigmaPercentInput.vue'
import type {
  BarArrangement,
  BarOrder,
  BarValuePosition,
  LabelAlignment,
  LineShape,
  LineStyleType,
  ResolvedChartStyle,
} from '../chartStyle'
import {
  getMinimumPieThicknessPercent,
  getPieInnerRadius,
  getPieThicknessPercent,
  MAX_LINE_WIDTH_PX,
  MAX_PIE_RING_THICKNESS_PERCENT,
  MIN_LINE_WIDTH_PX,
  MIN_PIE_RING_THICKNESS_PX,
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
import rowsIcon from '../assets/new-ui/rows.svg'

interface PaletteChoice {
  id: Exclude<PalettePresetId, 'custom'> | 'chalk'
  name: string
  colors: string[]
}

interface PanelSeries {
  id: number
  name: string
}

const props = defineProps<{
  settings: ResolvedChartStyle
  chartType: ChartType
  chartTitle: string
  selectedPaletteId: PalettePresetId | 'chalk'
  series: PanelSeries[]
  dataRowCount: number
  pieWarnings: string[]
  pieMaximumRadiusPx: number
  barGapMaximum: number
}>()

const emit = defineEmits<{
  'update:chart-title': [value: string]
  'select-chart-type': [value: ChartType]
  'select-columns-bar': []
  'select-horizontal-bar': []
  'apply-palette': [id: PaletteChoice['id'], colors: string[]]
  'mark-palette-custom': []
  'add-palette-color': []
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

const circular = computed(
  () => props.chartType === 'pie' || props.chartType === 'doughnut',
)

const valuesVisible = computed({
  get: () =>
    circular.value
      ? props.settings.showPiePercentages
      : props.settings.showValueLabels,
  set: (value: boolean) => {
    if (circular.value) {
      props.settings.showPiePercentages = value
      return
    }
    props.settings.showValueLabels = value
  },
})

const axisElementsVisible = computed(
  () =>
    props.settings.showGridLines ||
    props.settings.showAxisLines ||
    props.settings.showAxisTicks,
)

const pieThicknessPercent = computed(() =>
  getPieThicknessPercent(
    props.settings.pieInnerRadius,
    props.settings.pieOuterRadius,
  ),
)

const pieMinimumThicknessPx = computed(() =>
  Math.max(MIN_PIE_RING_THICKNESS_PX, props.settings.valueLabelSize + 16),
)

const pieMinimumThicknessPercent = computed(() =>
  getMinimumPieThicknessPercent(
    props.pieMaximumRadiusPx * (props.settings.pieOuterRadius / 100),
    pieMinimumThicknessPx.value,
  ),
)

const requiredColorCount = computed(() =>
  props.chartType === 'line' ? props.series.length : props.dataRowCount,
)

const paletteEntries = computed(() =>
  Array.from(
    { length: Math.max(5, props.settings.palette.length) },
    (_, index) => ({
      index,
      label:
        props.chartType === 'line' && props.series[index]
          ? props.series[index]!.name || `Линия ${index + 1}`
          : `Цвет ${index + 1}`,
    }),
  ),
)

const canAddPaletteColor = computed(
  () => props.settings.palette.length < requiredColorCount.value,
)

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
  const fallback = props.settings.palette[0] ?? '#5500EB'
  while (props.settings.palette.length <= index) {
    props.settings.palette.push(fallback)
  }
  props.settings.palette[index] = value
  emit('mark-palette-custom')
}

function updatePaletteOpacity(index: number, value: number) {
  while (props.settings.paletteOpacities.length <= index) {
    props.settings.paletteOpacities.push(100)
  }
  props.settings.paletteOpacities[index] = value
  emit('mark-palette-custom')
}

function paletteColor(index: number) {
  const palette = props.settings.palette
  return palette[index] ?? palette[index % Math.max(1, palette.length)] ?? '#5500EB'
}

function paletteOpacity(index: number) {
  return props.settings.paletteOpacities[index] ?? 100
}

function rangeStyle(value: number, minimum: number, maximum: number) {
  const span = maximum - minimum
  const progress = Math.min(
    1,
    Math.max(0, span > 0 ? (value - minimum) / span : 0),
  )
  const thumbWidth = 6
  const progressPercent = progress * 100
  const thumbCorrection = thumbWidth * progress
  return {
    '--range-progress': `calc(${thumbWidth / 2}px + ${progressPercent}% - ${thumbCorrection}px)`,
  }
}

function updateBarRadiusPercent(value: number) {
  props.settings.barRadius = value * 1.2
}

function updateBarWidthPercent(value: number) {
  props.settings.barMaxWidth = 20 + value * 1.6
}

function updateBarGapPercent(value: number) {
  props.settings.barGapPercent = Math.min(props.barGapMaximum, value)
}

function updatePieOuterRadius(value: number) {
  const nextOuterRadius = Math.min(100, Math.max(30, value))
  if (props.chartType === 'pie') {
    props.settings.pieOuterRadius = nextOuterRadius
    props.settings.pieInnerRadius = 0
  } else {
    const minimumThickness = getMinimumPieThicknessPercent(
      props.pieMaximumRadiusPx * (nextOuterRadius / 100),
    )
    const thickness = Math.min(
      MAX_PIE_RING_THICKNESS_PERCENT,
      Math.max(minimumThickness, pieThicknessPercent.value),
    )
    props.settings.pieOuterRadius = nextOuterRadius
    props.settings.pieInnerRadius = getPieInnerRadius(
      nextOuterRadius,
      thickness,
    )
  }
}

function updatePieThickness(value: number) {
  const thickness = Math.min(
    MAX_PIE_RING_THICKNESS_PERCENT,
    Math.max(pieMinimumThicknessPercent.value, value),
  )
  props.settings.pieInnerRadius = getPieInnerRadius(
    props.settings.pieOuterRadius,
    thickness,
  )
}

function updatePieGap(value: number) {
  props.settings.piePadAngle = Math.round(value * 0.12 * 10) / 10
}

function updatePieRadius(value: number) {
  props.settings.pieBorderRadius = Math.round(value * 0.8)
}

function setPieRadiusByValue(enabled: boolean) {
  props.settings.pieRoseType = enabled ? 'radius' : 'none'
}

function updatePieLabelSize(value: number) {
  props.settings.pieLabelSize = Math.round((10 + value * 0.38) * 10) / 10
}

function updateValueLabelSize(value: number) {
  props.settings.valueLabelSize = Math.round((10 + value * 0.38) * 10) / 10
}

function setLineShape(shape: LineShape) {
  props.settings.lineShape = shape
  props.settings.smoothLines = shape === 'smooth'
  props.settings.lineStep = shape === 'step' ? 'middle' : 'none'
}

function setShowLines(show: boolean) {
  props.settings.showLines = show
}

function setShowLineSymbols(show: boolean) {
  props.settings.showLineSymbols = show
}

function updateLineWidth(value: number) {
  const width =
    MIN_LINE_WIDTH_PX +
    (value / 100) * (MAX_LINE_WIDTH_PX - MIN_LINE_WIDTH_PX)
  props.settings.lineWidth = Math.round(width * 10) / 10
}

function updateLinePointSize(value: number) {
  const size = 2 + (value / 100) * (MAX_LINE_WIDTH_PX - 2)
  props.settings.lineSymbolSize = Math.round(size * 10) / 10
}

function setPieNames(show: boolean) {
  props.settings.showPieLabels = show
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
          aria-label="Случайный график"
          title="Случайный график"
          @click="emit('randomize')"
        >
          Случайный
        </button>
      </div>
      <div class="new-design-types">
        <button
          v-for="typeChoice in typeChoices"
          :key="typeChoice.id"
          type="button"
          :class="[
            { active: activeType === typeChoice.id },
            `chart-type-${typeChoice.id}`,
          ]"
          :aria-pressed="activeType === typeChoice.id"
          @click="selectType(typeChoice.id)"
        >
          <span aria-hidden="true"><img :src="typeChoice.icon" alt="" /></span>
          {{ typeChoice.label }}
        </button>
      </div>
    </section>

    <section class="new-design-data-section">
      <h3>Данные</h3>
      <slot name="data-editor" />
    </section>

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

        <div class="new-design-palette-stack">
          <div
            class="new-design-palette-card"
            :class="{ 'has-gradient-toggle': chartType === 'bar' }"
          >
            <span>Цвета</span>
            <div class="new-design-palette-list">
              <div
                v-for="entry in paletteEntries"
                :key="entry.index"
              >
                <FigmaColorInput
                  :model-value="paletteColor(entry.index)"
                  :opacity="paletteOpacity(entry.index)"
                  :label="entry.label"
                  :open="openPaletteIndex === entry.index"
                  @open="openPaletteIndex = entry.index"
                  @close="openPaletteIndex = null"
                  @update:model-value="updatePaletteColor(entry.index, $event)"
                  @update:opacity="updatePaletteOpacity(entry.index, $event)"
                />
              </div>
              <button
                v-if="canAddPaletteColor"
                class="new-design-add-color"
                type="button"
                @click="emit('add-palette-color')"
              >
                <span aria-hidden="true">＋</span>
                Добавить цвет
              </button>
            </div>
          </div>
          <label v-if="chartType === 'bar'" class="new-design-switch-row last">
            <span>Градиентная заливка</span>
            <input v-model="settings.gradientBars" type="checkbox" />
            <i aria-hidden="true" />
          </label>
        </div>
      </section>

      <section v-if="circular" class="new-design-section">
        <h3>{{ chartType === 'doughnut' ? 'Кольцо' : 'Круг' }}</h3>
        <div class="new-design-card-stack">
          <div class="new-design-range-row first">
            <span>Размер</span>
            <input
              :value="settings.pieOuterRadius"
              type="range"
              min="30"
              max="100"
              aria-label="Размер круга"
              :style="rangeStyle(settings.pieOuterRadius, 30, 100)"
              @input="updatePieOuterRadius(Number(($event.target as HTMLInputElement).value))"
            />
            <FigmaPercentInput
              :model-value="settings.pieOuterRadius"
              label="Размер круга в процентах"
              :minimum="30"
              @update:model-value="updatePieOuterRadius"
            />
          </div>
          <div v-if="chartType === 'doughnut'" class="new-design-range-row">
            <span>Толщина кольца</span>
            <input
              :value="pieThicknessPercent"
              type="range"
              :min="pieMinimumThicknessPercent"
              :max="MAX_PIE_RING_THICKNESS_PERCENT"
              aria-label="Толщина кольца"
              :aria-valuetext="`${Math.round(pieThicknessPercent)}%, минимум ${Math.round(pieMinimumThicknessPx)} px`"
              :title="`Минимальная толщина — ${Math.round(pieMinimumThicknessPx)} px`"
              :style="rangeStyle(pieThicknessPercent, pieMinimumThicknessPercent, MAX_PIE_RING_THICKNESS_PERCENT)"
              @input="updatePieThickness(Number(($event.target as HTMLInputElement).value))"
            />
            <FigmaPercentInput
              :model-value="Math.round(pieThicknessPercent)"
              :label="`Толщина кольца в процентах, минимум ${Math.round(pieMinimumThicknessPx)} пикселей`"
              :minimum="pieMinimumThicknessPercent"
              :maximum="MAX_PIE_RING_THICKNESS_PERCENT"
              @update:model-value="updatePieThickness"
            />
          </div>
          <div class="new-design-range-row">
            <span>Расстояние между секторами</span>
            <input
              :value="Math.round((settings.piePadAngle / 12) * 100)"
              type="range"
              min="0"
              max="100"
              aria-label="Расстояние между секторами"
              :style="rangeStyle(settings.piePadAngle, 0, 12)"
              @input="updatePieGap(Number(($event.target as HTMLInputElement).value))"
            />
            <FigmaPercentInput
              :model-value="Math.round((settings.piePadAngle / 12) * 100)"
              label="Расстояние между секторами"
              @update:model-value="updatePieGap"
            />
          </div>
          <div class="new-design-range-row">
            <span>Скругление</span>
            <input
              :value="Math.round((settings.pieBorderRadius / 80) * 100)"
              type="range"
              min="0"
              max="100"
              aria-label="Скругление секторов"
              :style="rangeStyle(settings.pieBorderRadius, 0, 80)"
              @input="updatePieRadius(Number(($event.target as HTMLInputElement).value))"
            />
            <FigmaPercentInput
              :model-value="Math.round((settings.pieBorderRadius / 80) * 100)"
              label="Скругление секторов"
              @update:model-value="updatePieRadius"
            />
          </div>
          <label class="new-design-switch-row last">
            <span>Радиус зависит от значения</span>
            <input
              :checked="settings.pieRoseType !== 'none'"
              type="checkbox"
              @change="setPieRadiusByValue(($event.target as HTMLInputElement).checked)"
            />
            <i aria-hidden="true" />
          </label>
        </div>
        <ul v-if="pieWarnings.length" class="new-design-warnings" aria-live="polite">
          <li v-for="warning in pieWarnings" :key="warning">{{ warning }}</li>
        </ul>
      </section>

      <section v-if="chartType === 'line'" class="new-design-section">
        <h3>Линии</h3>
        <div class="new-design-card-stack">
          <label class="new-design-switch-row first">
            <span>Показывать линии</span>
            <input
              id="new-design-show-lines"
              :checked="settings.showLines"
              type="checkbox"
              :aria-expanded="settings.showLines"
              aria-controls="new-design-line-details"
              @change="setShowLines(($event.target as HTMLInputElement).checked)"
            />
            <i aria-hidden="true" />
          </label>
          <Transition name="new-design-disclosure">
            <div
              v-if="settings.showLines"
              id="new-design-line-details"
              class="new-design-disclosure"
            >
              <div class="new-design-disclosure-content">
                <div class="new-design-range-row">
                  <span>Толщина</span>
                  <input
                    :value="settings.lineWidth"
                    type="range"
                    :min="MIN_LINE_WIDTH_PX"
                    :max="MAX_LINE_WIDTH_PX"
                    step="0.5"
                    aria-label="Толщина линий"
                    :style="rangeStyle(settings.lineWidth, MIN_LINE_WIDTH_PX, MAX_LINE_WIDTH_PX)"
                    @input="settings.lineWidth = Number(($event.target as HTMLInputElement).value)"
                  />
                  <FigmaPercentInput
                    :model-value="Math.round(((settings.lineWidth - MIN_LINE_WIDTH_PX) / (MAX_LINE_WIDTH_PX - MIN_LINE_WIDTH_PX)) * 100)"
                    label="Толщина линий"
                    @update:model-value="updateLineWidth"
                  />
                </div>
                <div class="new-design-control-row">
                  <span>Форма</span>
                  <div class="new-design-text-tabs three">
                    <button
                      v-for="choice in [
                        { value: 'straight', label: 'Резкая' },
                        { value: 'smooth', label: 'Плавная' },
                        { value: 'step', label: 'Ступени' },
                      ]"
                      :key="choice.value"
                      type="button"
                      :class="{ active: settings.lineShape === choice.value }"
                      @click="setLineShape(choice.value as LineShape)"
                    >{{ choice.label }}</button>
                  </div>
                </div>
                <div class="new-design-control-row">
                  <span>Начертание</span>
                  <div class="new-design-text-tabs three">
                    <button
                      v-for="choice in [
                        { value: 'solid', label: 'Обычная' },
                        { value: 'dashed', label: 'Штрихи' },
                        { value: 'dotted', label: 'Точки' },
                      ]"
                      :key="choice.value"
                      type="button"
                      :class="{ active: settings.lineType === choice.value }"
                      @click="settings.lineType = choice.value as LineStyleType"
                    >{{ choice.label }}</button>
                  </div>
                </div>
              </div>
            </div>
          </Transition>
          <label class="new-design-switch-row">
            <span>Показывать точки</span>
            <input
              id="new-design-show-points"
              :checked="settings.showLineSymbols"
              type="checkbox"
              :aria-expanded="settings.showLineSymbols"
              aria-controls="new-design-point-details"
              @change="setShowLineSymbols(($event.target as HTMLInputElement).checked)"
            />
            <i aria-hidden="true" />
          </label>
          <Transition name="new-design-disclosure">
            <div
              v-if="settings.showLineSymbols"
              id="new-design-point-details"
              class="new-design-disclosure"
            >
              <div class="new-design-disclosure-content">
                <div class="new-design-range-row">
                  <span>Размер точек</span>
                  <input
                    :value="settings.lineSymbolSize"
                    type="range"
                    min="2"
                    :max="MAX_LINE_WIDTH_PX"
                    aria-label="Размер точек"
                    :style="rangeStyle(settings.lineSymbolSize, 2, MAX_LINE_WIDTH_PX)"
                    @input="settings.lineSymbolSize = Number(($event.target as HTMLInputElement).value)"
                  />
                  <FigmaPercentInput
                    :model-value="Math.round(((settings.lineSymbolSize - 2) / (MAX_LINE_WIDTH_PX - 2)) * 100)"
                    label="Размер точек"
                    @update:model-value="updateLinePointSize"
                  />
                </div>
              </div>
            </div>
          </Transition>
          <label
            class="new-design-switch-row"
            :class="{ last: !settings.showLineArea }"
          >
            <span>Заливка под линиями</span>
            <input
              id="new-design-show-line-area"
              v-model="settings.showLineArea"
              type="checkbox"
              :aria-expanded="settings.showLineArea"
              aria-controls="new-design-line-area-details"
            />
            <i aria-hidden="true" />
          </label>
          <Transition name="new-design-disclosure">
            <div
              v-if="settings.showLineArea"
              id="new-design-line-area-details"
              class="new-design-disclosure"
            >
              <div class="new-design-disclosure-content">
                <div class="new-design-range-row last">
                  <span>Прозрачность заливки</span>
                  <input
                    v-model.number="settings.areaOpacity"
                    type="range"
                    min="0"
                    max="100"
                    aria-label="Прозрачность заливки"
                    :style="rangeStyle(settings.areaOpacity, 0, 100)"
                  />
                  <FigmaPercentInput
                    v-model="settings.areaOpacity"
                    label="Прозрачность заливки"
                  />
                </div>
              </div>
            </div>
          </Transition>
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
            <FigmaPercentInput
              :model-value="Math.round((settings.barRadius / 120) * 100)"
              label="Скругление колонок в процентах"
              @update:model-value="updateBarRadiusPercent"
            />
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
            <FigmaPercentInput
              :model-value="Math.round(((settings.barMaxWidth - 20) / 160) * 100)"
              label="Ширина колонок в процентах"
              @update:model-value="updateBarWidthPercent"
            />
          </div>
          <div class="new-design-range-row">
            <span>Расстояние между колонок</span>
            <input
              v-model.number="settings.barGapPercent"
              type="range"
              min="0"
              :max="barGapMaximum"
              aria-label="Расстояние между колонками"
              :style="rangeStyle(settings.barGapPercent, 0, barGapMaximum)"
            />
            <FigmaPercentInput
              :model-value="settings.barGapPercent"
              label="Расстояние между колонками в процентах"
              :maximum="barGapMaximum"
              @update:model-value="updateBarGapPercent"
            />
          </div>
          <div class="new-design-control-row">
            <span>Порядок колонок</span>
            <div class="new-design-icon-tabs" aria-label="Порядок колонок">
              <button
                v-for="choice in [
                  { value: 'normal', icon: columnsIcon, label: 'От меньшей к большей' },
                  { value: 'reverse', icon: orderReversedIcon, label: 'От большей к меньшей' },
                  { value: 'value', icon: orderRandomIcon, label: 'В порядке таблицы' },
                ]"
                :key="choice.value"
                type="button"
                :class="{ active: settings.barOrder === choice.value }"
                :aria-label="choice.label"
                :aria-pressed="settings.barOrder === choice.value"
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

      <section
        v-if="chartType === 'line' || chartType === 'bar'"
        class="new-design-section"
      >
        <h3>Оси и сетка</h3>
        <div class="new-design-card-stack">
          <label class="new-design-switch-row first">
            <span>Линии осей</span>
            <input
              v-model="settings.showAxisLines"
              type="checkbox"
              :aria-expanded="axisElementsVisible"
              aria-controls="new-design-axis-opacity-details"
            />
            <i aria-hidden="true" />
          </label>
          <label class="new-design-switch-row">
            <span>Засечки</span>
            <input
              v-model="settings.showAxisTicks"
              type="checkbox"
              :aria-expanded="axisElementsVisible"
              aria-controls="new-design-axis-opacity-details"
            />
            <i aria-hidden="true" />
          </label>
          <label
            class="new-design-switch-row"
            :class="{ last: !axisElementsVisible }"
          >
            <span>Линии сетки</span>
            <input
              v-model="settings.showGridLines"
              type="checkbox"
              :aria-expanded="axisElementsVisible"
              aria-controls="new-design-axis-opacity-details"
            />
            <i aria-hidden="true" />
          </label>
          <Transition name="new-design-disclosure">
            <div
              v-if="axisElementsVisible"
              id="new-design-axis-opacity-details"
              class="new-design-disclosure"
            >
              <div class="new-design-disclosure-content">
                <label class="new-design-range-row last">
                  <span>Прозрачность</span>
                  <input
                    v-model.number="settings.axisOpacity"
                    type="range"
                    min="0"
                    max="100"
                    aria-label="Прозрачность линий осей, засечек и сетки"
                    :style="rangeStyle(settings.axisOpacity, 0, 100)"
                  />
                  <FigmaPercentInput
                    :model-value="settings.axisOpacity"
                    label="Прозрачность линий осей, засечек и сетки в процентах"
                    @update:model-value="settings.axisOpacity = $event"
                  />
                </label>
              </div>
            </div>
          </Transition>
        </div>
      </section>

      <section class="new-design-section">
        <h3>Подписи и легенда</h3>
        <div class="new-design-card-stack">
          <label class="new-design-switch-row first">
            <span>Заголовок</span>
            <input
              id="new-design-show-title"
              v-model="settings.showTitle"
              type="checkbox"
              :aria-expanded="settings.showTitle"
              aria-controls="new-design-title-details"
            />
            <i aria-hidden="true" />
          </label>
          <Transition name="new-design-disclosure">
            <div
              v-if="settings.showTitle"
              id="new-design-title-details"
              class="new-design-disclosure"
            >
              <div class="new-design-disclosure-content">
                <div class="new-design-control-row">
                  <span>Положение заголовка</span>
                  <div
                    class="new-design-icon-tabs"
                    aria-label="Положение заголовка"
                  >
                    <button
                      v-for="choice in [
                        { value: 'left', icon: alignLeftIcon, label: 'По левому краю' },
                        { value: 'center', icon: alignCenterIcon, label: 'По центру' },
                        { value: 'right', icon: alignRightIcon, label: 'По правому краю' },
                      ]"
                      :key="choice.value"
                      type="button"
                      :class="[`align-${choice.value}`, { active: settings.titleAlignment === choice.value }]"
                      :aria-label="choice.label"
                      :aria-pressed="settings.titleAlignment === choice.value"
                      @click="settings.titleAlignment = choice.value as LabelAlignment"
                    >
                      <img :src="choice.icon" alt="" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Transition>
          <template v-if="circular">
            <label class="new-design-switch-row">
              <span>Названия секторов</span>
              <input
                id="new-design-show-pie-labels"
                :checked="settings.showPieLabels"
                type="checkbox"
                :aria-expanded="settings.showPieLabels"
                aria-controls="new-design-pie-label-details"
                @change="setPieNames(($event.target as HTMLInputElement).checked)"
              />
              <i aria-hidden="true" />
            </label>
            <Transition name="new-design-disclosure">
              <div
                v-if="settings.showPieLabels"
                id="new-design-pie-label-details"
                class="new-design-disclosure"
              >
                <div class="new-design-disclosure-content">
                  <label class="new-design-switch-row">
                    <span>Линии к названиям</span>
                    <input v-model="settings.showPieLabelLines" type="checkbox" />
                    <i aria-hidden="true" />
                  </label>
                  <div class="new-design-range-row">
                    <span>Размер названий</span>
                    <input
                      :value="settings.pieLabelSize"
                      type="range"
                      min="10"
                      max="48"
                      step="0.5"
                      aria-label="Размер названий секторов"
                      :style="rangeStyle(settings.pieLabelSize, 10, 48)"
                      @input="settings.pieLabelSize = Number(($event.target as HTMLInputElement).value)"
                    />
                    <FigmaPercentInput
                      :model-value="Math.round(((settings.pieLabelSize - 10) / 38) * 100)"
                      label="Размер названий секторов"
                      @update:model-value="updatePieLabelSize"
                    />
                  </div>
                </div>
              </div>
            </Transition>
          </template>

          <template v-if="chartType === 'line'">
            <label class="new-design-switch-row">
              <span>Горизонтальные подписи</span>
              <input v-model="settings.showXAxisLabels" type="checkbox" />
              <i aria-hidden="true" />
            </label>
            <label class="new-design-switch-row">
              <span>Вертикальная шкала</span>
              <input v-model="settings.showYAxisLabels" type="checkbox" />
              <i aria-hidden="true" />
            </label>
          </template>

          <label class="new-design-switch-row">
            <span>Значения</span>
            <input
              v-model="valuesVisible"
              type="checkbox"
              :aria-expanded="valuesVisible"
              aria-controls="new-design-value-details"
            />
            <i aria-hidden="true" />
          </label>
          <Transition name="new-design-disclosure">
            <div
              v-if="valuesVisible"
              id="new-design-value-details"
              class="new-design-disclosure"
            >
              <div class="new-design-disclosure-content">
                <div class="new-design-control-row">
                  <span>Расположение значения</span>
                  <div
                    class="new-design-text-tabs"
                    aria-label="Расположение значения"
                  >
                    <button
                      type="button"
                      :class="{ active: settings.barValuePosition === 'top' }"
                      :aria-pressed="settings.barValuePosition === 'top'"
                      @click="settings.barValuePosition = 'top' as BarValuePosition"
                    >Снаружи</button>
                    <button
                      type="button"
                      :class="{ active: settings.barValuePosition === 'inside' }"
                      :aria-pressed="settings.barValuePosition === 'inside'"
                      @click="settings.barValuePosition = 'inside' as BarValuePosition"
                    >Внутри</button>
                  </div>
                </div>
                <div class="new-design-range-row">
                  <span>Размер значений</span>
                  <input
                    :value="settings.valueLabelSize"
                    type="range"
                    min="10"
                    max="48"
                    step="0.5"
                    aria-label="Размер значений"
                    :style="rangeStyle(settings.valueLabelSize, 10, 48)"
                    @input="settings.valueLabelSize = Number(($event.target as HTMLInputElement).value)"
                  />
                  <FigmaPercentInput
                    :model-value="Math.round(((settings.valueLabelSize - 10) / 38) * 100)"
                    label="Размер значений в процентах"
                    @update:model-value="updateValueLabelSize"
                  />
                </div>
              </div>
            </div>
          </Transition>
          <label v-if="chartType === 'bar'" class="new-design-switch-row">
            <span>Горизонтальные подписи</span>
            <input v-model="settings.showXAxisLabels" type="checkbox" />
            <i aria-hidden="true" />
          </label>
          <label v-if="chartType === 'bar'" class="new-design-switch-row">
            <span>Вертикальные подписи</span>
            <input v-model="settings.showYAxisLabels" type="checkbox" />
            <i aria-hidden="true" />
          </label>
          <label class="new-design-switch-row last">
            <span>Легенда</span>
            <input v-model="settings.showLegend" type="checkbox" />
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
  --new-ui-switch-on: #4d0ae2;
  --new-ui-switch-off: #ececec;
  --new-ui-switch-thumb-border: #d1d1d1;
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
  height: 80px;
  padding: 10px 20px 0;
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
  padding: 32px 20px 0;
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
  --new-design-random-background:
    radial-gradient(
      ellipse 58px 29px at 45.9% 50%,
      rgb(144 255 0 / 66%) 0%,
      rgb(137 255 12 / 66%) 8.207%,
      rgb(129 255 24 / 66%) 16.414%,
      rgb(114 255 49 / 66%) 32.829%,
      rgb(98 255 73 / 66%) 49.243%,
      rgb(83 255 98 / 66%) 65.658%,
      rgb(41 234 99 / 66%) 82.829%,
      rgb(21 223 99 / 66%) 91.414%,
      rgb(10 218 99 / 66%) 95.707%,
      rgb(0 213 99 / 66%) 100%
    ),
    #fff;
  display: flex;
  width: 108px;
  height: 24px;
  min-height: 24px;
  align-items: center;
  justify-content: center;
  padding: 4px 16px;
  border-radius: 41px;
  color: var(--new-ui-accent);
  background: var(--new-design-random-background);
  font-size: 14px;
  font-weight: 500;
  line-height: 16px;
}

.new-design-random:hover {
  background: var(--new-design-random-background);
  filter: brightness(1.03);
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
  background: #fff;
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

.new-design-types button.chart-type-rows > span img {
  transform: rotate(-90deg) scaleY(-1);
}

.new-design-types button.active > span {
  color: #fff;
}

.new-design-types button.active > span img,
.new-design-icon-tabs button.active img {
  filter: brightness(0) invert(1);
}

.new-design-settings {
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding: 32px 20px 0;
}

.new-design-data-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 32px 20px 0;
}

.new-design-data-section > h3 {
  margin: 0;
  padding: 0 16px;
  font-size: 20px;
  font-weight: 600;
  line-height: 24px;
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
  box-shadow: 0 0 0 2px #ececec;
}

.new-design-preset.active {
  color: #fff;
  background: #000;
}

.new-design-preset.active .new-design-dots i {
  box-shadow: 0 0 0 2px #000;
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
  border-radius: 50%;
  box-shadow: 0 0 0 2px #fff;
}

.new-design-dots i:last-child {
  margin-right: 0;
}

.new-design-palette-card {
  display: flex;
  height: auto;
  min-height: 264px;
  justify-content: space-between;
  padding: 16px;
  border-radius: 26px;
  background: #fff;
  font-size: 16px;
  line-height: 20px;
}

.new-design-palette-stack {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.new-design-palette-card.has-gradient-toggle {
  border-radius: 26px 26px 4px 4px;
}

.new-design-palette-card > span {
  padding-top: 10px;
}

.new-design-palette-list {
  display: flex;
  width: 219px;
  flex-direction: column;
  gap: 8px;
}

.new-design-add-color {
  display: flex;
  width: 100%;
  height: 40px;
  min-height: 40px;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
  border: 1px solid #ececec;
  border-radius: 20px;
  gap: 2px;
  color: #000;
  background: #fff;
  cursor: pointer;
  font-size: 16px;
  line-height: 20px;
}

.new-design-add-color > span {
  display: grid;
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
  place-items: center;
  font-size: 24px;
  font-weight: 400;
  line-height: 24px;
}

.new-design-add-color:hover {
  background: #fafafa;
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

.new-design-disclosure {
  display: grid;
  min-height: 0;
  grid-template-rows: 1fr;
  opacity: 1;
}

.new-design-disclosure-content {
  display: flex;
  min-height: 0;
  overflow: hidden;
  flex-direction: column;
  gap: 2px;
}

.new-design-disclosure-enter-active,
.new-design-disclosure-leave-active {
  overflow: hidden;
  transition:
    grid-template-rows 180ms ease,
    opacity 180ms ease;
}

.new-design-disclosure-enter-from,
.new-design-disclosure-leave-to {
  grid-template-rows: 0fr;
  opacity: 0;
}

.new-design-range-row,
.new-design-control-row,
.new-design-switch-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 175px 66px;
  align-items: center;
  min-height: 72px;
  padding: 16px;
  gap: 16px;
  background: #fff;
  font-size: 16px;
  line-height: 20px;
}

.new-design-range-row.first,
.new-design-control-row.first,
.new-design-switch-row.first {
  border-radius: 26px 26px 4px 4px;
}

.new-design-range-row.disabled,
.new-design-control-row.disabled,
.new-design-switch-row.disabled {
  color: #8d8b91;
  cursor: not-allowed;
}

.new-design-range-row input:disabled {
  cursor: not-allowed;
  opacity: 0.42;
}

.new-design-range-row input[type="range"] {
  appearance: none;
  width: 175px;
  height: 24px;
  min-height: 24px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background:
    radial-gradient(
      circle at calc(100% - 4px) center,
      var(--new-ui-accent) 0 4px,
      transparent 4px
    ) left center / var(--range-progress) 8px no-repeat,
    linear-gradient(var(--new-ui-accent), var(--new-ui-accent)) left 4px center /
      max(0px, calc(var(--range-progress) - 8px)) 8px no-repeat,
    radial-gradient(
      circle at 4px center,
      var(--new-ui-accent) 0 4px,
      transparent 4px
    ) left center / 8px 8px no-repeat,
    linear-gradient(#d8d8d8, #d8d8d8) center / 100% 2px no-repeat;
  cursor: pointer;
}

.new-design-range-row input[type="range"]::-webkit-slider-runnable-track {
  height: 24px;
  border: 0;
  background: transparent;
}

.new-design-range-row input[type="range"]::-webkit-slider-thumb {
  box-sizing: content-box;
  width: 6px;
  height: 20px;
  margin: 0;
  appearance: none;
  border: 2px solid #fff;
  border-radius: 999px;
  background: var(--new-ui-accent);
}

.new-design-range-row input[type="range"]::-moz-range-track {
  height: 24px;
  border: 0;
  background: transparent;
}

.new-design-range-row input[type="range"]::-moz-range-thumb {
  box-sizing: content-box;
  width: 6px;
  height: 20px;
  border: 2px solid #fff;
  border-radius: 999px;
  background: var(--new-ui-accent);
}

.new-design-control-row {
  grid-template-columns: minmax(0, 1fr) 256px;
  gap: 8px;
}

.new-design-range-row.last,
.new-design-control-row.last,
.new-design-switch-row.last {
  border-radius: 4px 4px 26px 26px;
}

.new-design-range-row.first.last,
.new-design-control-row.first.last,
.new-design-switch-row.first.last {
  border-radius: 26px;
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

.new-design-text-tabs.three {
  grid-template-columns: repeat(3, 1fr);
}

.new-design-text-tabs.four {
  grid-template-columns: repeat(4, 1fr);
}

.new-design-text-tabs.four button {
  padding: 0 4px;
  font-size: 12px;
}

.new-design-text-tabs button:disabled {
  cursor: not-allowed;
  opacity: 0.42;
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
  flex: 0 0 52px;
  border-radius: 13px;
  background: var(--new-ui-switch-off);
  transition: background-color 160ms ease;
}

.new-design-switch-row i::after {
  position: absolute;
  top: 3px;
  left: 3px;
  box-sizing: border-box;
  width: 20px;
  height: 20px;
  border: 1px solid var(--new-ui-switch-thumb-border);
  border-radius: 50%;
  background: #fff;
  content: "";
  transition:
    border-color 160ms ease,
    transform 160ms ease;
}

.new-design-switch-row input:checked + i {
  background: var(--new-ui-switch-on);
}

.new-design-switch-row input:checked + i::after {
  border-color: transparent;
  transform: translateX(26px);
}

.new-design-switch-row input:focus-visible + i {
  outline: 3px solid color-mix(in srgb, var(--new-ui-accent) 34%, white);
  outline-offset: 2px;
}

.new-design-switch-row input:disabled + i {
  cursor: not-allowed;
  opacity: 0.42;
}

.new-design-warnings {
  display: flex;
  margin: 0;
  padding: 14px 18px 14px 34px;
  border: 1px solid #f0c45b;
  border-radius: 18px;
  flex-direction: column;
  gap: 8px;
  color: #6d4b00;
  background: #fff7df;
  font-size: 14px;
  line-height: 18px;
}

@media (max-width: 620px) {
  .new-design-panel {
    width: 100%;
    min-height: 0;
    padding-bottom: 64px;
  }

  .new-design-heading h2 {
    font-size: 34px;
    line-height: 42px;
  }

  .new-design-preset-scroll {
    width: 100%;
  }

  .new-design-palette-card {
    flex-direction: column;
    gap: 12px;
  }

  .new-design-palette-card > span {
    padding-top: 0;
  }

  .new-design-palette-list {
    width: 100%;
    align-items: flex-end;
  }

  .new-design-range-row {
    grid-template-columns: minmax(0, 1fr) 66px;
  }

  .new-design-range-row > span:first-child {
    grid-column: 1 / -1;
  }

  .new-design-range-row input[type="range"] {
    width: 100%;
  }

  .new-design-control-row {
    grid-template-columns: minmax(0, 1fr);
    gap: 12px;
  }

  .new-design-icon-tabs,
  .new-design-text-tabs {
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .new-design-disclosure-enter-active,
  .new-design-disclosure-leave-active {
    transition-duration: 0.01ms;
  }
}
</style>
