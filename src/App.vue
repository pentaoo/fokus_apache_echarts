<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer, SVGRenderer } from 'echarts/renderers'
import {
  BarChart,
  LineChart,
  PieChart,
  RadarChart,
  ScatterChart,
} from 'echarts/charts'
import {
  GridComponent,
  LegendComponent,
  TooltipComponent,
} from 'echarts/components'
import VChart from 'vue-echarts'
import { applyChartStyle } from './chartStyle'
import type {
  BarArrangement,
  BarCategoryPosition,
  BarValuePosition,
  ChartStyleConfig,
  LabelAlignment,
  LineStep,
  PieRoseType,
} from './chartStyle'

use([
  CanvasRenderer,
  SVGRenderer,
  BarChart,
  LineChart,
  PieChart,
  RadarChart,
  ScatterChart,
  GridComponent,
  LegendComponent,
  TooltipComponent,
])

type ChartType =
  | 'line'
  | 'bar'
  | 'pie'
  | 'doughnut'
  | 'area'
  | 'scatter'
  | 'radar'

type Renderer = 'canvas' | 'svg'
type ChartTheme = 'light' | 'dark'
type StyleMode = 'default' | 'poster'
type ChartOption = Record<string, unknown>

interface BackgroundPreset {
  id: string
  name: string
  background: string
}

interface DataSeries {
  id: number
  name: string
  values: Array<number | null>
}

type StyleSettings = Required<ChartStyleConfig>
type NumericStyleKey = {
  [Key in keyof StyleSettings]: StyleSettings[Key] extends number ? Key : never
}[keyof StyleSettings]
type BooleanStyleKey = {
  [Key in keyof StyleSettings]: StyleSettings[Key] extends boolean ? Key : never
}[keyof StyleSettings]

const initialCategories = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май']
const initialSeries = [
  { id: 1, name: 'Серия 1', values: [120, 180, 150, 230, 190] },
  { id: 2, name: 'Серия 2', values: [80, 140, 210, 170, 250] },
]

const chartTypes: Array<{ value: ChartType; label: string }> = [
  { value: 'line', label: 'Линейный' },
  { value: 'bar', label: 'Столбчатый' },
  { value: 'pie', label: 'Круговой' },
  { value: 'doughnut', label: 'Кольцевой' },
  { value: 'area', label: 'С областями' },
  { value: 'scatter', label: 'Точечный' },
  { value: 'radar', label: 'Лепестковый' },
]

const backgroundPresets: BackgroundPreset[] = [
  { id: 'white', name: 'Белый', background: '#ffffff' },
  { id: 'mist', name: 'Светло-серый', background: '#e5e7eb' },
  { id: 'gray', name: 'Средне-серый', background: '#7b8491' },
  { id: 'graphite', name: 'Графит', background: '#252931' },
  { id: 'black', name: 'Чёрный', background: '#050608' },
  { id: 'navy', name: 'Тёмно-синий', background: '#10233f' },
  { id: 'blue', name: 'Ярко-синий', background: '#155eef' },
  { id: 'amber', name: 'Янтарный', background: '#f59e0b' },
  {
    id: 'gradient',
    name: 'Градиент',
    background: 'linear-gradient(135deg, #f8fafc 0%, #94a3b8 48%, #111827 100%)',
  },
  {
    id: 'checker',
    name: 'Шахматный',
    background: 'conic-gradient(#ffffff 25%, #d1d5db 0 50%, #ffffff 0 75%, #d1d5db 0) 0 0 / 28px 28px',
  },
]

const categories = ref([...initialCategories])
const dataSeries = ref<DataSeries[]>(cloneInitialSeries())
const chartType = ref<ChartType>('line')
const renderer = ref<Renderer>('canvas')
const chartTheme = ref<ChartTheme>('light')
const styleMode = ref<StyleMode>('poster')
const selectedBackgroundId = ref('white')
const customBackground = ref('#b42318')
const selectedPieSeriesId = ref(1)
const nextSeriesId = ref(3)
const copied = ref(false)
const isEditingCss = ref(false)
const cssCode = ref('')
const styleSettings = ref<StyleSettings>({
  backgroundColor: '#050505',
  textColor: '#ffffff',
  mutedTextColor: '#b8b8c2',
  palette: [
    '#4d0ae2',
    '#6e32e8',
    '#8e5beb',
    '#b00ae2',
    '#e20ab3',
    '#e20a6b',
    '#e20a0e',
    '#ff7a00',
    '#ffc252',
  ],
  paletteOpacities: [100, 100, 100, 100, 100, 100, 100, 100, 100],
  fontFamily: 'Inter, Arial, sans-serif',
  fontWeight: 700,
  categoryLabelSize: 14,
  valueLabelSize: 22,
  showAllLabels: true,
  labelAlignment: 'center',
  showLegend: true,
  showTooltip: true,
  showGridLines: false,
  showAxisLines: false,
  showAxisTicks: false,
  animationDuration: 700,
  barArrangement: 'grouped',
  barGapPercent: 21,
  barRadius: 100,
  barRoundPeaks: true,
  barMaxWidth: 120,
  barOpacity: 100,
  barValuePosition: 'top',
  barCategoryPosition: 'axis',
  colorBarsByData: true,
  commonBarColor: false,
  gradientBars: false,
  lineWidth: 10,
  smoothLines: true,
  showLineSymbols: false,
  lineSymbolSize: 10,
  connectNulls: false,
  lineStep: 'none',
  areaOpacity: 24,
  pieInnerRadius: 0,
  pieOuterRadius: 70,
  piePadAngle: 2,
  pieStartAngle: 90,
  pieClockwise: true,
  pieRoseType: 'none',
  showPieLabels: true,
  scatterSymbolSize: 18,
  scatterOpacity: 90,
  showScatterLabels: false,
  radarAreaOpacity: 20,
})

function formatCss(settings: StyleSettings) {
  const palette = settings.palette
    .map(
      (color, index) =>
        `  --chart-color-${index + 1}: ${color};
  --chart-color-${index + 1}-opacity: ${settings.paletteOpacities[index] ?? 100}%;`,
    )
    .join('\n')

  return `.chart-poster {
  /* Общие */
  --chart-background: ${settings.backgroundColor};
  --chart-text: ${settings.textColor};
  --chart-muted: ${settings.mutedTextColor};
  --chart-font-weight: ${settings.fontWeight};
  --chart-value-label-size: ${settings.valueLabelSize}px;
  --chart-category-label-size: ${settings.categoryLabelSize}px;
  --chart-show-labels: ${Number(settings.showAllLabels)};
  --chart-label-align: ${settings.labelAlignment};
  --chart-show-legend: ${Number(settings.showLegend)};
  --chart-show-tooltip: ${Number(settings.showTooltip)};
  --chart-show-grid: ${Number(settings.showGridLines)};
  --chart-show-axis-lines: ${Number(settings.showAxisLines)};
  --chart-show-axis-ticks: ${Number(settings.showAxisTicks)};
  --chart-animation-duration: ${settings.animationDuration}ms;

  /* Столбцы */
  --chart-bar-arrangement: ${settings.barArrangement};
  --chart-bar-gap: ${settings.barGapPercent}%;
  --chart-bar-radius: ${settings.barRadius}px;
  --chart-bar-round-peaks: ${Number(settings.barRoundPeaks)};
  --chart-bar-max-width: ${settings.barMaxWidth}px;
  --chart-bar-opacity: ${settings.barOpacity}%;
  --chart-bar-value-position: ${settings.barValuePosition};
  --chart-bar-category-position: ${settings.barCategoryPosition};
  --chart-common-bar-color: ${Number(settings.commonBarColor)};
  --chart-gradient-bars: ${Number(settings.gradientBars)};
  --chart-color-bars-by-data: ${Number(settings.colorBarsByData)};

  /* Линии */
  --chart-line-width: ${settings.lineWidth}px;
  --chart-smooth-lines: ${Number(settings.smoothLines)};
  --chart-show-line-symbols: ${Number(settings.showLineSymbols)};
  --chart-line-symbol-size: ${settings.lineSymbolSize}px;
  --chart-connect-nulls: ${Number(settings.connectNulls)};
  --chart-line-step: ${settings.lineStep};
  --chart-area-opacity: ${settings.areaOpacity}%;

  /* Круговые */
  --chart-pie-inner-radius: ${settings.pieInnerRadius}%;
  --chart-pie-outer-radius: ${settings.pieOuterRadius}%;
  --chart-pie-gap: ${settings.piePadAngle}deg;
  --chart-pie-start-angle: ${settings.pieStartAngle}deg;
  --chart-pie-clockwise: ${Number(settings.pieClockwise)};
  --chart-pie-rose: ${settings.pieRoseType};
  --chart-show-pie-labels: ${Number(settings.showPieLabels)};

  /* Scatter и radar */
  --chart-scatter-symbol-size: ${settings.scatterSymbolSize}px;
  --chart-scatter-opacity: ${settings.scatterOpacity}%;
  --chart-show-scatter-labels: ${Number(settings.showScatterLabels)};
  --chart-radar-area-opacity: ${settings.radarAreaOpacity}%;

  /* Палитра */
${palette}
}`
}

function normalizeHexColor(value: string) {
  const color = value.trim()
  if (/^#[\da-f]{6}$/i.test(color)) return color.toLowerCase()
  if (/^#[\da-f]{3}$/i.test(color)) {
    return `#${color
      .slice(1)
      .split('')
      .map((character) => character.repeat(2))
      .join('')}`.toLowerCase()
  }
  return null
}

function parseBoolean(value: string) {
  return ['1', 'true', 'on', 'yes'].includes(value.trim().toLowerCase())
}

function numberInRange(value: string, minimum: number, maximum: number) {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed)
    ? Math.min(maximum, Math.max(minimum, parsed))
    : null
}

function applyCssCode(value: string) {
  cssCode.value = value
  const declarations = new Map<string, string>()
  const pattern = /--chart-([\w-]+)\s*:\s*([^;}]+)/g
  let match: RegExpExecArray | null

  while ((match = pattern.exec(value))) {
    declarations.set(match[1], match[2].trim())
  }

  const next = { ...styleSettings.value }
  const background = normalizeHexColor(declarations.get('background') ?? '')
  const text = normalizeHexColor(declarations.get('text') ?? '')
  const muted = normalizeHexColor(declarations.get('muted') ?? '')

  if (background) next.backgroundColor = background
  if (text) next.textColor = text
  if (muted) next.mutedTextColor = muted

  const numericVariables: Array<
    [string, NumericStyleKey, number, number]
  > = [
    ['font-weight', 'fontWeight', 400, 900],
    ['value-label-size', 'valueLabelSize', 10, 48],
    ['category-label-size', 'categoryLabelSize', 10, 30],
    ['animation-duration', 'animationDuration', 0, 3000],
    ['bar-gap', 'barGapPercent', 0, 100],
    ['bar-radius', 'barRadius', 0, 120],
    ['bar-max-width', 'barMaxWidth', 20, 180],
    ['bar-opacity', 'barOpacity', 0, 100],
    ['line-width', 'lineWidth', 1, 40],
    ['line-symbol-size', 'lineSymbolSize', 2, 40],
    ['area-opacity', 'areaOpacity', 0, 100],
    ['pie-inner-radius', 'pieInnerRadius', 0, 80],
    ['pie-outer-radius', 'pieOuterRadius', 20, 100],
    ['pie-gap', 'piePadAngle', 0, 20],
    ['pie-start-angle', 'pieStartAngle', 0, 360],
    ['scatter-symbol-size', 'scatterSymbolSize', 4, 80],
    ['scatter-opacity', 'scatterOpacity', 0, 100],
    ['radar-area-opacity', 'radarAreaOpacity', 0, 100],
  ]

  numericVariables.forEach(([variable, key, minimum, maximum]) => {
    const raw = declarations.get(variable)
    if (raw === undefined) return
    const parsed = numberInRange(raw, minimum, maximum)
    if (parsed !== null) next[key] = parsed
  })

  const booleanVariables: Array<[string, BooleanStyleKey]> = [
    ['show-labels', 'showAllLabels'],
    ['show-legend', 'showLegend'],
    ['show-tooltip', 'showTooltip'],
    ['show-grid', 'showGridLines'],
    ['show-axis-lines', 'showAxisLines'],
    ['show-axis-ticks', 'showAxisTicks'],
    ['bar-round-peaks', 'barRoundPeaks'],
    ['common-bar-color', 'commonBarColor'],
    ['gradient-bars', 'gradientBars'],
    ['color-bars-by-data', 'colorBarsByData'],
    ['smooth-lines', 'smoothLines'],
    ['show-line-symbols', 'showLineSymbols'],
    ['connect-nulls', 'connectNulls'],
    ['pie-clockwise', 'pieClockwise'],
    ['show-pie-labels', 'showPieLabels'],
    ['show-scatter-labels', 'showScatterLabels'],
  ]

  booleanVariables.forEach(([variable, key]) => {
    const raw = declarations.get(variable)
    if (raw !== undefined) next[key] = parseBoolean(raw)
  })

  const enums: Array<
    [
      string,
      keyof Pick<
        StyleSettings,
        | 'labelAlignment'
        | 'barArrangement'
        | 'barValuePosition'
        | 'barCategoryPosition'
        | 'lineStep'
        | 'pieRoseType'
      >,
      readonly string[],
    ]
  > = [
    ['label-align', 'labelAlignment', ['left', 'center', 'right']],
    [
      'bar-arrangement',
      'barArrangement',
      ['grouped', 'stacked', 'horizontal'],
    ],
    ['bar-value-position', 'barValuePosition', ['inside', 'top']],
    ['bar-category-position', 'barCategoryPosition', ['axis', 'inside']],
    ['line-step', 'lineStep', ['none', 'start', 'middle', 'end']],
    ['pie-rose', 'pieRoseType', ['none', 'radius']],
  ]

  enums.forEach(([variable, key, allowed]) => {
    const raw = declarations.get(variable)?.trim()
    if (raw && allowed.includes(raw)) {
      ;(next[key] as string) = raw
    }
  })

  next.palette = [...next.palette]
  next.paletteOpacities = [...next.paletteOpacities]
  next.palette.forEach((_, index) => {
    const color = normalizeHexColor(
      declarations.get(`color-${index + 1}`) ?? '',
    )
    if (color) next.palette[index] = color

    const opacityRaw = declarations.get(`color-${index + 1}-opacity`)
    if (opacityRaw !== undefined) {
      const opacity = numberInRange(opacityRaw, 0, 100)
      if (opacity !== null) next.paletteOpacities[index] = opacity
    }
  })

  styleSettings.value = next
}

function finishCssEditing() {
  isEditingCss.value = false
  cssCode.value = formatCss(styleSettings.value)
}

watch(
  styleSettings,
  (settings) => {
    if (!isEditingCss.value) cssCode.value = formatCss(settings)
  },
  { deep: true, immediate: true },
)

function randomInteger(minimum: number, maximum: number) {
  return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum
}

function randomChoice<T>(items: readonly T[]): T {
  return items[randomInteger(0, items.length - 1)]
}

function randomBoolean(probability = 0.5) {
  return Math.random() < probability
}

function hslToHex(hue: number, saturation: number, lightness: number) {
  const normalizedSaturation = saturation / 100
  const normalizedLightness = lightness / 100
  const chroma =
    (1 - Math.abs(2 * normalizedLightness - 1)) * normalizedSaturation
  const segment = ((hue % 360) + 360) % 360 / 60
  const secondary = chroma * (1 - Math.abs((segment % 2) - 1))
  const offset = normalizedLightness - chroma / 2
  const channels =
    segment < 1
      ? [chroma, secondary, 0]
      : segment < 2
        ? [secondary, chroma, 0]
        : segment < 3
          ? [0, chroma, secondary]
          : segment < 4
            ? [0, secondary, chroma]
            : segment < 5
              ? [secondary, 0, chroma]
              : [chroma, 0, secondary]

  return `#${channels
    .map((channel) =>
      Math.round((channel + offset) * 255)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`
}

function randomizeChartStyle() {
  const availableTypes = chartTypes
    .map((item) => item.value)
    .filter((type) => type !== chartType.value)
  const nextType = randomChoice(availableTypes)
  const baseHue = randomInteger(0, 359)
  const harmony = [0, 28, 58, 142, 178, 214, 264, 310, 336]
  const palette = harmony.map((offset, index) =>
    hslToHex(
      baseHue + offset + randomInteger(-8, 8),
      randomInteger(68, 92),
      index < 3 ? randomInteger(48, 62) : randomInteger(52, 68),
    ),
  )
  const pieInnerRadius =
    nextType === 'doughnut' ? randomInteger(28, 58) : randomInteger(0, 22)

  chartType.value = nextType
  styleSettings.value = {
    ...styleSettings.value,
    backgroundColor: hslToHex(
      baseHue + randomInteger(-20, 20),
      randomInteger(18, 42),
      randomInteger(4, 14),
    ),
    textColor: '#ffffff',
    mutedTextColor: hslToHex(baseHue, 18, randomInteger(68, 82)),
    palette,
    paletteOpacities: palette.map(() => randomInteger(78, 100)),
    fontWeight: randomChoice([500, 600, 700, 800, 900]),
    categoryLabelSize: randomInteger(11, 18),
    valueLabelSize: randomInteger(14, 32),
    showAllLabels: randomBoolean(0.78),
    labelAlignment: randomChoice<LabelAlignment>([
      'left',
      'center',
      'right',
    ]),
    showLegend: randomBoolean(0.72),
    showTooltip: true,
    showGridLines: randomBoolean(0.34),
    showAxisLines: randomBoolean(0.28),
    showAxisTicks: randomBoolean(0.22),
    animationDuration: randomInteger(3, 14) * 100,
    barArrangement: randomChoice<BarArrangement>([
      'grouped',
      'stacked',
      'horizontal',
    ]),
    barGapPercent: randomInteger(8, 58),
    barRadius: randomInteger(0, 110),
    barRoundPeaks: randomBoolean(0.72),
    barMaxWidth: randomInteger(42, 150),
    barOpacity: randomInteger(72, 100),
    barValuePosition: randomChoice<BarValuePosition>(['inside', 'top']),
    barCategoryPosition: randomChoice<BarCategoryPosition>(['axis', 'inside']),
    colorBarsByData: randomBoolean(0.76),
    commonBarColor: randomBoolean(0.18),
    gradientBars: randomBoolean(0.48),
    lineWidth: randomInteger(2, 18),
    smoothLines: randomBoolean(0.72),
    showLineSymbols: randomBoolean(0.48),
    lineSymbolSize: randomInteger(5, 22),
    connectNulls: randomBoolean(0.5),
    lineStep: randomChoice<LineStep>([
      'none',
      'none',
      'start',
      'middle',
      'end',
    ]),
    areaOpacity: randomInteger(12, 54),
    pieInnerRadius,
    pieOuterRadius: randomInteger(
      Math.max(58, pieInnerRadius + 20),
      92,
    ),
    piePadAngle: randomInteger(0, 8),
    pieStartAngle: randomInteger(0, 12) * 30,
    pieClockwise: randomBoolean(),
    pieRoseType: randomChoice<PieRoseType>(['none', 'none', 'radius']),
    showPieLabels: randomBoolean(0.78),
    scatterSymbolSize: randomInteger(8, 42),
    scatterOpacity: randomInteger(58, 100),
    showScatterLabels: randomBoolean(0.42),
    radarAreaOpacity: randomInteger(10, 46),
  }
}

function cloneInitialSeries(): DataSeries[] {
  return initialSeries.map((item) => ({
    ...item,
    values: [...item.values],
  }))
}

function updateNumber(
  event: Event,
  seriesItem: DataSeries,
  rowIndex: number,
) {
  const rawValue = (event.target as HTMLInputElement).value
  if (rawValue === '') {
    seriesItem.values[rowIndex] = null
    return
  }

  const parsedValue = Number(rawValue)
  seriesItem.values[rowIndex] = Number.isFinite(parsedValue)
    ? parsedValue
    : null
}

function addRow() {
  categories.value.push(`Категория ${categories.value.length + 1}`)
  dataSeries.value.forEach((item) => item.values.push(null))
}

function removeRow(rowIndex: number) {
  categories.value.splice(rowIndex, 1)
  dataSeries.value.forEach((item) => item.values.splice(rowIndex, 1))
}

function addSeries() {
  const id = nextSeriesId.value++
  dataSeries.value.push({
    id,
    name: `Серия ${dataSeries.value.length + 1}`,
    values: categories.value.map(() => null),
  })
  if (dataSeries.value.length === 1) {
    selectedPieSeriesId.value = id
  }
}

function removeSeries(seriesId: number) {
  dataSeries.value = dataSeries.value.filter((item) => item.id !== seriesId)
}

function resetData() {
  categories.value = [...initialCategories]
  dataSeries.value = cloneInitialSeries()
  selectedPieSeriesId.value = 1
  nextSeriesId.value = 3
}

watch(
  dataSeries,
  (seriesList) => {
    if (!seriesList.some((item) => item.id === selectedPieSeriesId.value)) {
      selectedPieSeriesId.value = seriesList[0]?.id ?? 0
    }
  },
  { deep: true },
)

const selectedPieSeries = computed(
  () =>
    dataSeries.value.find(
      (item) => item.id === selectedPieSeriesId.value,
    ) ?? dataSeries.value[0],
)

const selectedBackground = computed(() => {
  if (selectedBackgroundId.value === 'custom') {
    return {
      name: `Свой цвет ${customBackground.value.toUpperCase()}`,
      background: customBackground.value,
    }
  }

  return (
    backgroundPresets.find((item) => item.id === selectedBackgroundId.value) ??
    backgroundPresets[0]
  )
})

const chartStageStyle = computed((): Record<string, string> => {
  if (styleMode.value === 'poster') {
    return {
      '--chart-background': styleSettings.value.backgroundColor,
      '--chart-text': styleSettings.value.textColor,
      '--chart-muted': styleSettings.value.mutedTextColor,
      background: 'var(--chart-background)',
    }
  }

  return { background: selectedBackground.value.background }
})

const rawOption = computed<ChartOption>(() => {
  if (chartType.value === 'pie' || chartType.value === 'doughnut') {
    if (!selectedPieSeries.value) {
      return {
        backgroundColor: 'transparent',
        tooltip: { trigger: 'item' },
        legend: {},
        series: [],
      }
    }

    return {
      backgroundColor: 'transparent',
      tooltip: { trigger: 'item' },
      legend: {},
      series: [
        {
          name: selectedPieSeries.value.name,
          type: 'pie',
          ...(chartType.value === 'doughnut'
            ? { radius: ['50%', '70%'] }
            : {}),
          data: categories.value.map((name, index) => ({
            name,
            value: selectedPieSeries.value?.values[index] ?? null,
          })),
        },
      ],
    }
  }

  if (chartType.value === 'radar') {
    const indicators = categories.value.map((name, index) => {
      const values = dataSeries.value
        .map((item) => item.values[index])
        .filter((value): value is number => value !== null)
      const maximum = Math.max(0, ...values)

      return {
        name,
        max: maximum > 0 ? maximum : 1,
      }
    })

    return {
      backgroundColor: 'transparent',
      tooltip: {},
      legend: {},
      radar: { indicator: indicators },
      series: [
        {
          type: 'radar',
          data: dataSeries.value.map((item) => ({
            name: item.name,
            value: item.values,
          })),
        },
      ],
    }
  }

  if (chartType.value === 'scatter') {
    return {
      backgroundColor: 'transparent',
      tooltip: { trigger: 'item' },
      legend: {},
      xAxis: { type: 'value' },
      yAxis: { type: 'value' },
      series: dataSeries.value.map((item) => ({
        name: item.name,
        type: 'scatter',
        data: item.values.map((value, index) => [index + 1, value]),
      })),
    }
  }

  const seriesType = chartType.value === 'bar' ? 'bar' : 'line'

  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    legend: {},
    xAxis: {
      type: 'category',
      data: categories.value,
    },
    yAxis: { type: 'value' },
    series: dataSeries.value.map((item) => ({
      name: item.name,
      type: seriesType,
      data: item.values,
      ...(chartType.value === 'area' ? { areaStyle: {} } : {}),
    })),
  }
})

const option = computed<ChartOption>(() =>
  styleMode.value === 'poster'
    ? applyChartStyle(rawOption.value, styleSettings.value)
    : rawOption.value,
)

const optionText = computed(() => JSON.stringify(option.value, null, 2))

async function copyOption() {
  await navigator.clipboard.writeText(optionText.value)
  copied.value = true
  window.setTimeout(() => {
    copied.value = false
  }, 1500)
}
</script>

<template>
  <main class="app-shell">
    <header class="page-header">
      <div>
        <h1>Дефолтные графики Apache ECharts</h1>
      </div>
      <button class="secondary-button" type="button" @click="resetData">
        Сбросить данные
      </button>
    </header>

    <div class="workspace">
      <div class="editor-column">
        <section class="panel editor-panel" aria-labelledby="editor-title">
          <div class="panel-heading">
            <div>
              <h2 id="editor-title">Редактор данных</h2>
              <p>{{ categories.length }} строк · {{ dataSeries.length }} серий</p>
            </div>
          </div>

          <div class="table-scroll">
            <table>
              <thead>
                <tr>
                  <th scope="col">Категория</th>
                  <th
                    v-for="seriesItem in dataSeries"
                    :key="seriesItem.id"
                    scope="col"
                  >
                    <div class="series-heading">
                      <input
                        v-model="seriesItem.name"
                        class="series-name"
                        type="text"
                        :aria-label="`Название серии ${seriesItem.id}`"
                      />
                      <button
                        class="icon-button"
                        type="button"
                        :aria-label="`Удалить ${seriesItem.name}`"
                        title="Удалить серию"
                        @click="removeSeries(seriesItem.id)"
                      >
                        ×
                      </button>
                    </div>
                  </th>
                  <th class="delete-column" scope="col">
                    <span class="visually-hidden">Удаление</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(_, rowIndex) in categories" :key="rowIndex">
                  <td>
                    <input
                      v-model="categories[rowIndex]"
                      type="text"
                      :aria-label="`Категория, строка ${rowIndex + 1}`"
                    />
                  </td>
                  <td
                    v-for="seriesItem in dataSeries"
                    :key="seriesItem.id"
                  >
                    <input
                      :value="seriesItem.values[rowIndex] ?? ''"
                      type="number"
                      step="any"
                      :aria-label="`${seriesItem.name}, ${categories[rowIndex]}`"
                      @input="updateNumber($event, seriesItem, rowIndex)"
                    />
                  </td>
                  <td class="delete-column">
                    <button
                      class="icon-button"
                      type="button"
                      :aria-label="`Удалить строку ${rowIndex + 1}`"
                      title="Удалить строку"
                      @click="removeRow(rowIndex)"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="editor-actions">
            <button type="button" @click="addRow">+ Добавить строку</button>
            <button type="button" @click="addSeries">+ Добавить серию</button>
          </div>
        </section>

        <section class="panel style-panel" aria-labelledby="style-panel-title">
          <header class="style-panel-header">
            <div>
              <span class="panel-kicker">Оформление</span>
              <h2 id="style-panel-title">Стиль графика</h2>
              <p>Контролы и CSS синхронизированы в обе стороны.</p>
            </div>
            <span v-if="styleMode === 'poster'" class="sync-badge">
              <span aria-hidden="true" />
              Активен
            </span>
          </header>

          <div v-if="styleMode === 'poster'" class="style-panel-body">
            <section class="setting-group type-setting" aria-labelledby="type-title">
              <h3 id="type-title">Тип</h3>
              <div class="chart-type-grid" aria-label="Тип графика">
                <button
                  v-for="item in chartTypes"
                  :key="item.value"
                  type="button"
                  :class="{ active: chartType === item.value }"
                  :aria-pressed="chartType === item.value"
                  @click="chartType = item.value"
                >
                  <span class="chart-type-icon" aria-hidden="true">
                    {{ item.value === 'bar' ? '▥' : item.value === 'line' ? '⌁' : item.value === 'area' ? '◒' : item.value === 'pie' ? '◔' : item.value === 'doughnut' ? '⊙' : item.value === 'scatter' ? '⁙' : '◇' }}
                  </span>
                  {{ item.label }}
                </button>
              </div>
              <button
                class="random-chart-button"
                type="button"
                @click="randomizeChartStyle"
              >
                <span aria-hidden="true">✦</span>
                Рандомный стиль
              </button>
            </section>

            <section
              v-if="chartType === 'bar'"
              class="setting-group"
              aria-labelledby="columns-title"
            >
              <h3 id="columns-title">Столбцы</h3>
              <label class="range-control">
                <span>Зазор</span>
                <input
                  v-model.number="styleSettings.barGapPercent"
                  type="range"
                  min="0"
                  max="100"
                />
                <output>{{ styleSettings.barGapPercent }}%</output>
              </label>
              <div class="choice-row">
                <span>Компоновка</span>
                <div class="segmented-control" aria-label="Компоновка столбцов">
                  <button
                    v-for="choice in [
                      { value: 'grouped', label: 'Рядом' },
                      { value: 'stacked', label: 'Стопкой' },
                      { value: 'horizontal', label: 'Гориз.' },
                    ]"
                    :key="choice.value"
                    type="button"
                    :class="{ active: styleSettings.barArrangement === choice.value }"
                    @click="styleSettings.barArrangement = choice.value as BarArrangement"
                  >
                    {{ choice.label }}
                  </button>
                </div>
              </div>
              <label class="range-control">
                <span>Скругление</span>
                <input
                  v-model.number="styleSettings.barRadius"
                  type="range"
                  min="0"
                  max="120"
                />
                <output>{{ styleSettings.barRadius }} px</output>
              </label>
              <label class="range-control">
                <span>Ширина</span>
                <input
                  v-model.number="styleSettings.barMaxWidth"
                  type="range"
                  min="20"
                  max="180"
                />
                <output>{{ styleSettings.barMaxWidth }} px</output>
              </label>
              <label class="range-control">
                <span>Непрозрачность</span>
                <input
                  v-model.number="styleSettings.barOpacity"
                  type="range"
                  min="0"
                  max="100"
                />
                <output>{{ styleSettings.barOpacity }}%</output>
              </label>
              <div class="switch-grid">
                <label class="switch-control">
                  <input v-model="styleSettings.barRoundPeaks" type="checkbox" />
                  <span aria-hidden="true" />
                  Только вершины
                </label>
                <label class="switch-control">
                  <input v-model="styleSettings.commonBarColor" type="checkbox" />
                  <span aria-hidden="true" />
                  Общий цвет
                </label>
                <label class="switch-control">
                  <input v-model="styleSettings.gradientBars" type="checkbox" />
                  <span aria-hidden="true" />
                  Градиент к вершине
                </label>
                <label class="switch-control">
                  <input
                    v-model="styleSettings.colorBarsByData"
                    type="checkbox"
                  />
                  <span aria-hidden="true" />
                  Цвет по категориям
                </label>
              </div>
              <div class="choice-row">
                <span>Значения</span>
                <div class="segmented-control" aria-label="Положение значений">
                  <button
                    v-for="choice in [
                      { value: 'inside', label: 'Внутри' },
                      { value: 'top', label: 'Сверху' },
                    ]"
                    :key="choice.value"
                    type="button"
                    :class="{ active: styleSettings.barValuePosition === choice.value }"
                    @click="styleSettings.barValuePosition = choice.value as BarValuePosition"
                  >
                    {{ choice.label }}
                  </button>
                </div>
              </div>
              <div class="choice-row">
                <span>Категории</span>
                <div class="segmented-control" aria-label="Положение категорий">
                  <button
                    v-for="choice in [
                      { value: 'axis', label: 'У оси' },
                      { value: 'inside', label: 'Внутри' },
                    ]"
                    :key="choice.value"
                    type="button"
                    :class="{ active: styleSettings.barCategoryPosition === choice.value }"
                    @click="styleSettings.barCategoryPosition = choice.value as BarCategoryPosition"
                  >
                    {{ choice.label }}
                  </button>
                </div>
              </div>
            </section>

            <section
              v-if="chartType === 'line' || chartType === 'area'"
              class="setting-group"
              aria-labelledby="line-title"
            >
              <h3 id="line-title">
                {{ chartType === 'area' ? 'Линия и область' : 'Линия' }}
              </h3>
              <label class="range-control">
                <span>Толщина линии</span>
                <input
                  v-model.number="styleSettings.lineWidth"
                  type="range"
                  min="1"
                  max="40"
                />
                <output>{{ styleSettings.lineWidth }} px</output>
              </label>
              <label class="range-control">
                <span>Размер точек</span>
                <input
                  v-model.number="styleSettings.lineSymbolSize"
                  type="range"
                  min="2"
                  max="40"
                />
                <output>{{ styleSettings.lineSymbolSize }} px</output>
              </label>
              <label v-if="chartType === 'area'" class="range-control">
                <span>Заливка</span>
                <input
                  v-model.number="styleSettings.areaOpacity"
                  type="range"
                  min="0"
                  max="100"
                />
                <output>{{ styleSettings.areaOpacity }}%</output>
              </label>
              <div class="switch-grid">
                <label class="switch-control">
                  <input v-model="styleSettings.smoothLines" type="checkbox" />
                  <span aria-hidden="true" />
                  Плавная линия
                </label>
                <label class="switch-control">
                  <input
                    v-model="styleSettings.showLineSymbols"
                    type="checkbox"
                  />
                  <span aria-hidden="true" />
                  Показывать точки
                </label>
                <label class="switch-control">
                  <input v-model="styleSettings.connectNulls" type="checkbox" />
                  <span aria-hidden="true" />
                  Соединять пропуски
                </label>
              </div>
              <label class="select-control">
                <span>Ступенчатая линия</span>
                <select v-model="styleSettings.lineStep">
                  <option value="none">Нет</option>
                  <option value="start">В начале</option>
                  <option value="middle">Посередине</option>
                  <option value="end">В конце</option>
                </select>
              </label>
            </section>

            <section
              v-if="chartType === 'pie' || chartType === 'doughnut'"
              class="setting-group"
              aria-labelledby="pie-title"
            >
              <h3 id="pie-title">Секторы</h3>
              <label class="range-control">
                <span>Внутренний радиус</span>
                <input
                  v-model.number="styleSettings.pieInnerRadius"
                  type="range"
                  min="0"
                  max="80"
                />
                <output>{{ styleSettings.pieInnerRadius }}%</output>
              </label>
              <label class="range-control">
                <span>Внешний радиус</span>
                <input
                  v-model.number="styleSettings.pieOuterRadius"
                  type="range"
                  min="20"
                  max="100"
                />
                <output>{{ styleSettings.pieOuterRadius }}%</output>
              </label>
              <label class="range-control">
                <span>Зазор секторов</span>
                <input
                  v-model.number="styleSettings.piePadAngle"
                  type="range"
                  min="0"
                  max="20"
                />
                <output>{{ styleSettings.piePadAngle }}°</output>
              </label>
              <label class="range-control">
                <span>Начальный угол</span>
                <input
                  v-model.number="styleSettings.pieStartAngle"
                  type="range"
                  min="0"
                  max="360"
                />
                <output>{{ styleSettings.pieStartAngle }}°</output>
              </label>
              <div class="switch-grid">
                <label class="switch-control">
                  <input v-model="styleSettings.pieClockwise" type="checkbox" />
                  <span aria-hidden="true" />
                  По часовой стрелке
                </label>
                <label class="switch-control">
                  <input v-model="styleSettings.showPieLabels" type="checkbox" />
                  <span aria-hidden="true" />
                  Подписи секторов
                </label>
              </div>
              <label class="select-control">
                <span>Роза Найтингейл</span>
                <select v-model="styleSettings.pieRoseType">
                  <option value="none">Выключена</option>
                  <option value="radius">По радиусу</option>
                </select>
              </label>
            </section>

            <section
              v-if="chartType === 'scatter'"
              class="setting-group"
              aria-labelledby="scatter-title"
            >
              <h3 id="scatter-title">Точки</h3>
              <label class="range-control">
                <span>Размер точек</span>
                <input
                  v-model.number="styleSettings.scatterSymbolSize"
                  type="range"
                  min="4"
                  max="80"
                />
                <output>{{ styleSettings.scatterSymbolSize }} px</output>
              </label>
              <label class="range-control">
                <span>Непрозрачность</span>
                <input
                  v-model.number="styleSettings.scatterOpacity"
                  type="range"
                  min="0"
                  max="100"
                />
                <output>{{ styleSettings.scatterOpacity }}%</output>
              </label>
              <label class="switch-control">
                <input
                  v-model="styleSettings.showScatterLabels"
                  type="checkbox"
                />
                <span aria-hidden="true" />
                Подписи точек
              </label>
            </section>

            <section
              v-if="chartType === 'radar'"
              class="setting-group"
              aria-labelledby="radar-title"
            >
              <h3 id="radar-title">Радар</h3>
              <label class="range-control">
                <span>Толщина линии</span>
                <input
                  v-model.number="styleSettings.lineWidth"
                  type="range"
                  min="1"
                  max="40"
                />
                <output>{{ styleSettings.lineWidth }} px</output>
              </label>
              <label class="range-control">
                <span>Размер точек</span>
                <input
                  v-model.number="styleSettings.lineSymbolSize"
                  type="range"
                  min="2"
                  max="40"
                />
                <output>{{ styleSettings.lineSymbolSize }} px</output>
              </label>
              <label class="range-control">
                <span>Заливка</span>
                <input
                  v-model.number="styleSettings.radarAreaOpacity"
                  type="range"
                  min="0"
                  max="100"
                />
                <output>{{ styleSettings.radarAreaOpacity }}%</output>
              </label>
            </section>

            <section class="setting-group" aria-labelledby="text-title">
              <h3 id="text-title">Текст</h3>
              <label class="range-control">
                <span>Размер значений</span>
                <input
                  v-model.number="styleSettings.valueLabelSize"
                  type="range"
                  min="10"
                  max="48"
                />
                <output>{{ styleSettings.valueLabelSize }} px</output>
              </label>
              <label class="range-control">
                <span>Размер категорий</span>
                <input
                  v-model.number="styleSettings.categoryLabelSize"
                  type="range"
                  min="10"
                  max="30"
                />
                <output>{{ styleSettings.categoryLabelSize }} px</output>
              </label>
              <label class="range-control">
                <span>Насыщенность</span>
                <input
                  v-model.number="styleSettings.fontWeight"
                  type="range"
                  min="400"
                  max="900"
                  step="100"
                />
                <output>{{ styleSettings.fontWeight }}</output>
              </label>
              <div class="choice-row">
                <span>Выравнивание</span>
                <div class="segmented-control" aria-label="Выравнивание подписей">
                  <button
                    v-for="choice in [
                      { value: 'left', label: 'Слева' },
                      { value: 'center', label: 'Центр' },
                      { value: 'right', label: 'Справа' },
                    ]"
                    :key="choice.value"
                    type="button"
                    :class="{ active: styleSettings.labelAlignment === choice.value }"
                    @click="styleSettings.labelAlignment = choice.value as LabelAlignment"
                  >
                    {{ choice.label }}
                  </button>
                </div>
              </div>
              <div class="switch-grid">
                <label class="switch-control">
                  <input v-model="styleSettings.showAllLabels" type="checkbox" />
                  <span aria-hidden="true" />
                  Все подписи
                </label>
                <label class="switch-control">
                  <input v-model="styleSettings.showLegend" type="checkbox" />
                  <span aria-hidden="true" />
                  Легенда
                </label>
                <label class="switch-control">
                  <input v-model="styleSettings.showTooltip" type="checkbox" />
                  <span aria-hidden="true" />
                  Подсказки
                </label>
              </div>
            </section>

            <section
              v-if="['line', 'bar', 'area', 'scatter'].includes(chartType)"
              class="setting-group"
              aria-labelledby="axes-title"
            >
              <h3 id="axes-title">Оси и сетка</h3>
              <div class="switch-grid">
                <label class="switch-control">
                  <input v-model="styleSettings.showGridLines" type="checkbox" />
                  <span aria-hidden="true" />
                  Сетка
                </label>
                <label class="switch-control">
                  <input v-model="styleSettings.showAxisLines" type="checkbox" />
                  <span aria-hidden="true" />
                  Линии осей
                </label>
                <label class="switch-control">
                  <input v-model="styleSettings.showAxisTicks" type="checkbox" />
                  <span aria-hidden="true" />
                  Засечки
                </label>
              </div>
            </section>

            <section class="setting-group" aria-labelledby="colors-title">
              <h3 id="colors-title">Цвета</h3>
              <div class="color-controls">
                <label>
                  <span>Фон</span>
                  <input v-model="styleSettings.backgroundColor" type="color" />
                  <code>{{ styleSettings.backgroundColor }}</code>
                </label>
                <label>
                  <span>Текст</span>
                  <input v-model="styleSettings.textColor" type="color" />
                  <code>{{ styleSettings.textColor }}</code>
                </label>
                <label>
                  <span>Вторичный</span>
                  <input v-model="styleSettings.mutedTextColor" type="color" />
                  <code>{{ styleSettings.mutedTextColor }}</code>
                </label>
              </div>
              <div class="palette-editor">
                <label
                  v-for="(color, colorIndex) in styleSettings.palette"
                  :key="colorIndex"
                  class="palette-row"
                >
                  <span>{{ colorIndex + 1 }}</span>
                  <input
                    v-model="styleSettings.palette[colorIndex]"
                    type="color"
                    :aria-label="`Цвет палитры ${colorIndex + 1}`"
                  />
                  <code>{{ color }}</code>
                  <input
                    v-model.number="styleSettings.paletteOpacities[colorIndex]"
                    type="range"
                    min="0"
                    max="100"
                    :aria-label="`Непрозрачность цвета ${colorIndex + 1}`"
                  />
                  <output>{{ styleSettings.paletteOpacities[colorIndex] }}%</output>
                </label>
              </div>
            </section>

            <section class="setting-group" aria-labelledby="motion-title">
              <h3 id="motion-title">Анимация</h3>
              <label class="range-control">
                <span>Длительность</span>
                <input
                  v-model.number="styleSettings.animationDuration"
                  type="range"
                  min="0"
                  max="3000"
                  step="100"
                />
                <output>{{ styleSettings.animationDuration }} ms</output>
              </label>
            </section>

            <details class="css-disclosure" open>
              <summary>
                <span>CSS-переменные</span>
                <small>Редактируемый код</small>
              </summary>
              <label class="css-editor">
                <span class="visually-hidden">CSS-код</span>
                <textarea
                  :value="cssCode"
                  spellcheck="false"
                  aria-label="CSS-код постерного стиля"
                  @focus="isEditingCss = true"
                  @input="applyCssCode(($event.target as HTMLTextAreaElement).value)"
                  @blur="finishCssEditing"
                />
              </label>
            </details>

          </div>

          <div v-else class="style-panel-empty">
            <div class="style-panel-empty-icon" aria-hidden="true">✦</div>
            <p>Включите постерный режим, чтобы настроить оформление.</p>
            <button type="button" @click="styleMode = 'poster'">
              Включить стилизацию
            </button>
          </div>
        </section>
      </div>

      <section class="chart-column" aria-labelledby="chart-title">
        <div class="panel chart-panel">
          <div class="chart-controls">
            <h2 id="chart-title">Живой график</h2>

            <div class="display-controls">
              <label class="renderer-control">
                Стиль
                <select v-model="styleMode">
                  <option value="default">ECharts по умолчанию</option>
                  <option value="poster">Постерный</option>
                </select>
              </label>

              <label class="renderer-control">
                Тема графика
                <select v-model="chartTheme">
                  <option value="light">Светлая</option>
                  <option value="dark">Тёмная</option>
                </select>
              </label>

              <label class="renderer-control">
                Рендерер
                <select v-model="renderer">
                  <option value="canvas">Canvas</option>
                  <option value="svg">SVG</option>
                </select>
              </label>
            </div>
          </div>

          <label
            v-if="chartType === 'pie' || chartType === 'doughnut'"
            class="pie-series-control"
          >
            Данные для круговой диаграммы
            <select v-model.number="selectedPieSeriesId">
              <option
                v-for="seriesItem in dataSeries"
                :key="seriesItem.id"
                :value="seriesItem.id"
              >
                {{ seriesItem.name }}
              </option>
            </select>
          </label>

          <fieldset v-if="styleMode === 'default'" class="background-picker">
            <legend>Фон под графиком</legend>
            <div class="background-options">
              <button
                v-for="background in backgroundPresets"
                :key="background.id"
                class="background-swatch"
                :class="{ active: selectedBackgroundId === background.id }"
                type="button"
                :title="background.name"
                :aria-label="`Фон: ${background.name}`"
                :aria-pressed="selectedBackgroundId === background.id"
                :style="{ background: background.background }"
                @click="selectedBackgroundId = background.id"
              />

              <label
                class="custom-background"
                :class="{ active: selectedBackgroundId === 'custom' }"
                title="Свой цвет"
              >
                <input
                  v-model="customBackground"
                  type="color"
                  aria-label="Свой цвет фона"
                  @input="selectedBackgroundId = 'custom'"
                  @click="selectedBackgroundId = 'custom'"
                />
                <span aria-hidden="true">+</span>
              </label>
            </div>
            <span class="background-name">{{ selectedBackground.name }}</span>
          </fieldset>

          <div
            class="chart-stage"
            :class="{ 'chart-poster': styleMode === 'poster' }"
            :style="chartStageStyle"
          >
            <VChart
              :key="`${renderer}-${chartTheme}-${styleMode}`"
              class="chart"
              :option="option"
              :init-options="{ renderer }"
              :theme="chartTheme === 'dark' ? 'dark' : undefined"
              :not-merge="true"
              :autoresize="{ throttle: 100 }"
            />
          </div>

          <p v-if="styleMode === 'default'" class="theme-note">
            График использует
            {{ chartTheme === 'dark' ? 'встроенную тёмную' : 'стандартную светлую' }}
            тему ECharts на прозрачном слое. Фон: {{ selectedBackground.name }}.
          </p>
        </div>

        <section
          class="panel echarts-option-panel"
          aria-labelledby="echarts-option-title"
        >
          <header class="echarts-option-header">
            <div>
              <h2 id="echarts-option-title">Итоговый ECharts option</h2>
              <p>Все параметры, которые формируют текущий визуал графика.</p>
            </div>
            <button
              class="copy-icon-button"
              :class="{ copied }"
              type="button"
              :aria-label="copied ? 'ECharts option скопирован' : 'Скопировать ECharts option'"
              :title="copied ? 'Скопировано' : 'Скопировать option'"
              @click="copyOption"
            >
              <span class="copy-icon" aria-hidden="true" />
            </button>
          </header>
          <pre class="echarts-code-window"><code>{{ optionText }}</code></pre>
        </section>

      </section>
    </div>
  </main>
</template>
