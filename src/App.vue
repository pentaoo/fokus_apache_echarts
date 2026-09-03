<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer, SVGRenderer } from 'echarts/renderers'
import { LabelLayout } from 'echarts/features'
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
  TitleComponent,
  TooltipComponent,
} from 'echarts/components'
import VChart from 'vue-echarts'
import ChartDataEditor from './components/ChartDataEditor.vue'
import HexColorInput from './components/HexColorInput.vue'
import NewDesignPanel from './components/NewDesignPanel.vue'
import NewChartDataEditor from './components/NewChartDataEditor.vue'
import NewUiAppShell from './components/NewUiAppShell.vue'
import { generateMonochromePalette } from './colorPalette'
import {
  applyChartStyle,
  getLegendOrientation,
  getMinimumBarWidthForValues,
  getMinimumPieThicknessPercent,
  getPieInnerRadius,
  getPieThicknessPercent,
  MAX_LINE_WIDTH_PX,
  MAX_PIE_RING_THICKNESS_PERCENT,
  MIN_LINE_WIDTH_PX,
  MIN_PIE_RING_THICKNESS_PX,
} from './chartStyle'
import type {
  AnimationEasing,
  BarArrangement,
  BarCategoryPosition,
  BarValuePosition,
  EmphasisFocus,
  LabelAlignment,
  LegendPosition,
  LineShape,
  LineStep,
  LineStyleType,
  PieLabelPosition,
  PieRoseType,
  RadarShape,
  ResolvedChartStyle,
  SymbolShape,
  ValueFormat,
} from './chartStyle'
import {
  PALETTE_PRESETS,
  createNewUiStylePreset,
  createStylePreset,
  type ChartType,
  type NewUiChartKind,
  type PalettePresetId,
} from './stylePresets'

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
  TitleComponent,
  TooltipComponent,
  LabelLayout,
])

type Renderer = 'canvas' | 'svg'
type ChartTheme = 'light' | 'dark'
type StyleMode = 'default' | 'poster'
type UiDesignMode = 'classic' | 'new'
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

interface ImportedTableData {
  categories: string[]
  series: Array<{
    name: string
    values: Array<number | null>
  }>
}

type StyleSettings = ResolvedChartStyle

const initialCategories = ['Апрель', 'Май', 'Июнь', 'Июль', 'Август']
const initialSeries = [
  { id: 1, name: 'Москва', values: [12, 19, 22, 24, 22] },
  { id: 2, name: 'Санкт-Петербург', values: [16, 14, 18, 20, 17] },
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
const defaultMonoBaseColor = PALETTE_PRESETS.find(
  (preset) => preset.id === 'mono',
)!.colors[4]!

const chartType = ref<ChartType>('bar')
const renderer = ref<Renderer>('canvas')
const chartTheme = ref<ChartTheme>('light')
const styleMode = ref<StyleMode>('poster')
const uiDesignMode = ref<UiDesignMode>('new')
const isNewUi = computed(() => uiDesignMode.value === 'new')
const chartTitle = ref('Средняя температура')
const selectedBackgroundId = ref('white')
const customBackground = ref('#b42318')
const nextSeriesId = ref(3)
const copied = ref(false)
const isEditingCss = ref(false)
const cssCode = ref('')
const cssPaletteSnapshot = ref<{
  colors: string[]
  opacities: number[]
} | null>(null)
const selectedPaletteId = ref<PalettePresetId | 'chalk'>('chalk')
const monoBaseColor = ref(defaultMonoBaseColor)
const initialStyle = createNewUiStylePreset('columns')
const styleSettings = ref<StyleSettings>(initialStyle)
const styleSnapshots = new Map<ChartType, StyleSettings>()
const newUiStyleSnapshots = new Map<NewUiChartKind, StyleSettings>()
const chartStageElement = ref<HTMLElement | null>(null)
const chartStageSize = ref({ width: 366, height: 444 })
let chartStageObserver: ResizeObserver | null = null

watch(
  chartStageElement,
  (element, previousElement) => {
    if (!chartStageObserver) {
      chartStageObserver = new ResizeObserver(([entry]) => {
        if (!entry) return
        chartStageSize.value = {
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        }
      })
    }
    if (previousElement) chartStageObserver.unobserve(previousElement)
    if (element) chartStageObserver.observe(element)
  },
  { flush: 'post' },
)

onBeforeUnmount(() => chartStageObserver?.disconnect())

function cloneStyleSettings(settings: StyleSettings): StyleSettings {
  return {
    ...settings,
    palette: [...settings.palette],
    paletteOpacities: [...settings.paletteOpacities],
  }
}

const requiredPaletteColorCount = computed(() => {
  if (
    chartType.value === 'line' ||
    chartType.value === 'area' ||
    chartType.value === 'scatter' ||
    chartType.value === 'radar'
  ) {
    return dataSeries.value.length
  }
  return categories.value.length
})

function monochromePalette(baseColor = monoBaseColor.value) {
  return generateMonochromePalette(
    baseColor,
    requiredPaletteColorCount.value,
  )
}

function applyMonochromePalette(baseColor = monoBaseColor.value) {
  const palette = monochromePalette(baseColor)
  styleSettings.value = {
    ...styleSettings.value,
    palette,
    paletteOpacities: palette.map(() => 100),
  }
  selectedPaletteId.value = 'mono'
}

function updateMonoBaseColor(value: string) {
  const normalized = normalizeHexColor(value)
  if (!normalized) return
  monoBaseColor.value = normalized
  applyMonochromePalette(normalized)
}

function selectChartType(nextType: ChartType) {
  if (nextType === chartType.value) return

  const palette = [...styleSettings.value.palette]
  const paletteOpacities = [...styleSettings.value.paletteOpacities]
  styleSnapshots.set(
    chartType.value,
    cloneStyleSettings(styleSettings.value),
  )
  chartType.value = nextType
  const nextSettings = styleSnapshots.has(nextType)
    ? cloneStyleSettings(styleSnapshots.get(nextType)!)
    : createStylePreset(nextType)
  styleSettings.value = {
    ...nextSettings,
    palette,
    paletteOpacities,
  }
}

function activeNewUiChartKind(): NewUiChartKind {
  if (chartType.value === 'bar') {
    return styleSettings.value.barHorizontal ? 'rows' : 'columns'
  }
  if (chartType.value === 'pie' || chartType.value === 'doughnut') {
    return chartType.value
  }
  return 'line'
}

function selectNewUiChartKind(kind: NewUiChartKind) {
  const currentKind = activeNewUiChartKind()
  if (currentKind === kind) return

  const palette = [...styleSettings.value.palette]
  const paletteOpacities = [...styleSettings.value.paletteOpacities]
  newUiStyleSnapshots.set(currentKind, cloneStyleSettings(styleSettings.value))
  chartType.value =
    kind === 'columns' || kind === 'rows' ? 'bar' : kind
  const hasSnapshot = newUiStyleSnapshots.has(kind)
  const nextSettings = hasSnapshot
    ? cloneStyleSettings(newUiStyleSnapshots.get(kind)!)
    : createNewUiStylePreset(kind)
  styleSettings.value = {
    ...nextSettings,
    ...(kind === 'rows' ? { barCategoryPosition: 'inside' as const } : {}),
    palette,
    paletteOpacities,
  }
}

function selectNewUiChartType(nextType: ChartType) {
  if (nextType === 'line' || nextType === 'pie' || nextType === 'doughnut') {
    selectNewUiChartKind(nextType)
  }
}

function resetCurrentStyle() {
  const next = createStylePreset(chartType.value)
  const palette = monochromePalette()
  next.palette = palette
  next.paletteOpacities = palette.map(() => 100)
  styleSettings.value = next
  styleSnapshots.set(chartType.value, cloneStyleSettings(next))
  selectedPaletteId.value = 'mono'
}

function applyPalette(presetId: Exclude<PalettePresetId, 'custom'>) {
  const preset = PALETTE_PRESETS.find((item) => item.id === presetId)
  if (!preset) return

  if (preset.id === 'mono') {
    applyMonochromePalette()
    return
  }

  styleSettings.value = {
    ...styleSettings.value,
    palette: [...preset.colors],
    paletteOpacities: preset.colors.map(() => 100),
  }
  selectedPaletteId.value = preset.id
}

function palettePresetPreview(
  presetId: Exclude<PalettePresetId, 'custom'>,
  colors: string[],
) {
  return presetId === 'mono'
    ? monochromePalette().slice(0, 4)
    : colors.slice(0, 4)
}

function applyNewPalette(
  presetId: Exclude<PalettePresetId, 'custom'> | 'chalk',
  colors: string[],
) {
  if (presetId === 'mono') {
    applyMonochromePalette()
    return
  }

  styleSettings.value = {
    ...styleSettings.value,
    palette: [...colors],
    paletteOpacities: colors.map(() => 100),
  }
  selectedPaletteId.value = presetId
}

function selectHorizontalBar() {
  selectNewUiChartKind('rows')
}

function selectColumnBar() {
  selectNewUiChartKind('columns')
}

function resetNewDesign() {
  chartType.value = 'bar'
  styleSettings.value = createNewUiStylePreset('columns')
  newUiStyleSnapshots.clear()
  chartTitle.value = 'Средняя температура'
  selectedPaletteId.value = 'chalk'
  styleMode.value = 'poster'
}

function markPaletteCustom() {
  styleSettings.value = cloneStyleSettings(styleSettings.value)
  selectedPaletteId.value = 'custom'
}

watch(
  requiredPaletteColorCount,
  () => {
    if (selectedPaletteId.value === 'mono') applyMonochromePalette()
  },
  { flush: 'sync' },
)

function hexChannels(color: string): [number, number, number] | null {
  const match = color.trim().match(/^#([\da-f]{6})$/i)
  if (!match?.[1]) return null
  return [
    Number.parseInt(match[1].slice(0, 2), 16),
    Number.parseInt(match[1].slice(2, 4), 16),
    Number.parseInt(match[1].slice(4, 6), 16),
  ]
}

function nextDistinctPaletteColor(colors: string[]) {
  const existing = colors
    .map(hexChannels)
    .filter((color): color is [number, number, number] => color !== null)
  const candidates = Array.from({ length: 72 }, (_, index) =>
    hslToHex(
      index * 137.508,
      index % 3 === 0 ? 82 : 70,
      index % 2 === 0 ? 52 : 64,
    ),
  )

  if (existing.length === 0) return candidates[0]!

  return candidates.reduce(
    (best, candidate) => {
      const channels = hexChannels(candidate)!
      const distance = Math.min(
        ...existing.map(([red, green, blue]) =>
          (channels[0] - red) ** 2 +
          (channels[1] - green) ** 2 +
          (channels[2] - blue) ** 2,
        ),
      )
      return distance > best.distance ? { color: candidate, distance } : best
    },
    { color: candidates[0]!, distance: -1 },
  ).color
}

function addPaletteColor() {
  const newColor = nextDistinctPaletteColor(styleSettings.value.palette)
  styleSettings.value = {
    ...styleSettings.value,
    palette: [...styleSettings.value.palette, newColor],
    paletteOpacities: [...styleSettings.value.paletteOpacities, 100],
  }
  selectedPaletteId.value = 'custom'
}

function removePaletteColor(index: number) {
  if (styleSettings.value.palette.length <= 1) return
  styleSettings.value = {
    ...styleSettings.value,
    palette: styleSettings.value.palette.filter(
      (_, colorIndex) => colorIndex !== index,
    ),
    paletteOpacities: styleSettings.value.paletteOpacities.filter(
      (_, colorIndex) => colorIndex !== index,
    ),
  }
  selectedPaletteId.value = 'custom'
}

function movePaletteColor(index: number, direction: -1 | 1) {
  const target = index + direction
  if (target < 0 || target >= styleSettings.value.palette.length) return

  const colors = [...styleSettings.value.palette]
  const opacities = [...styleSettings.value.paletteOpacities]
  ;[colors[index], colors[target]] = [colors[target], colors[index]]
  ;[opacities[index], opacities[target]] = [
    opacities[target],
    opacities[index],
  ]
  styleSettings.value = {
    ...styleSettings.value,
    palette: [...colors],
    paletteOpacities: [...opacities],
  }
  selectedPaletteId.value = 'custom'
}

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
  --chart-font-family: ${settings.fontFamily};
  --chart-font-weight: ${settings.fontWeight};
  --chart-padding: ${settings.chartPadding}px;
  --chart-animation-duration: ${settings.animationDuration}ms;
  --chart-animation-update-duration: ${settings.animationUpdateDuration}ms;
  --chart-animation-easing: ${settings.animationEasing};

  /* Легенда и tooltip */
  --chart-show-title: ${Number(settings.showTitle)};
  --chart-title-align: ${settings.titleAlignment};
  --chart-show-legend: ${Number(settings.showLegend)};
  --chart-legend-position: ${settings.legendPosition};
  --chart-legend-font-size: ${settings.legendFontSize}px;
  --chart-legend-item-size: ${settings.legendItemSize}px;
  --chart-legend-gap: ${settings.legendGap}px;
  --chart-show-tooltip: ${Number(settings.showTooltip)};
  --chart-tooltip-background: ${settings.tooltipBackgroundColor};
  --chart-tooltip-border: ${settings.tooltipBorderColor};
  --chart-tooltip-font-size: ${settings.tooltipFontSize}px;

  /* Подписи осей и значений */
  --chart-show-x-axis-labels: ${Number(settings.showXAxisLabels)};
  --chart-show-y-axis-labels: ${Number(settings.showYAxisLabels)};
  --chart-show-value-labels: ${Number(settings.showValueLabels)};
  --chart-label-align: ${settings.labelAlignment};
  --chart-x-axis-label-size: ${settings.xAxisLabelSize}px;
  --chart-y-axis-label-size: ${settings.yAxisLabelSize}px;
  --chart-value-label-size: ${settings.valueLabelSize}px;
  --chart-axis-label-weight: ${settings.axisLabelWeight};
  --chart-value-label-weight: ${settings.valueLabelWeight};
  --chart-category-label-color: ${settings.categoryLabelColor};
  --chart-value-axis-label-color: ${settings.valueAxisLabelColor};
  --chart-pie-label-color: ${settings.pieLabelColor};
  --chart-pie-label-size: ${settings.pieLabelSize}px;
  --chart-x-axis-label-rotate: ${settings.xAxisLabelRotate}deg;
  --chart-y-axis-label-rotate: ${settings.yAxisLabelRotate}deg;
  --chart-x-axis-label-margin: ${settings.xAxisLabelMargin}px;
  --chart-y-axis-label-margin: ${settings.yAxisLabelMargin}px;
  --chart-value-format: ${settings.valueFormat};
  --chart-value-decimals: ${settings.valueDecimals};

  /* Оси и сетка */
  --chart-show-grid: ${Number(settings.showGridLines)};
  --chart-show-axis-lines: ${Number(settings.showAxisLines)};
  --chart-show-axis-ticks: ${Number(settings.showAxisTicks)};
  --chart-grid-line-color: ${settings.gridLineColor};
  --chart-grid-line-width: ${settings.gridLineWidth}px;
  --chart-axis-opacity: ${settings.axisOpacity}%;
  --chart-grid-line-type: ${settings.gridLineType};
  --chart-axis-line-color: ${settings.axisLineColor};
  --chart-boundary-gap: ${Number(settings.boundaryGap)};
  --chart-y-axis-min: ${settings.yAxisMin ?? 'auto'};
  --chart-y-axis-max: ${settings.yAxisMax ?? 'auto'};
  --chart-y-axis-interval: ${settings.yAxisInterval ?? 'auto'};

  /* Столбцы */
  --chart-bar-arrangement: ${settings.barArrangement};
  --chart-bar-horizontal: ${Number(settings.barHorizontal)};
  --chart-bar-order: ${settings.barOrder};
  --chart-bar-gap: ${settings.barGapPercent}%;
  --chart-bar-series-gap: ${settings.barSeriesGapPercent}%;
  --chart-bar-radius: ${settings.barRadius}px;
  --chart-bar-round-peaks: ${Number(settings.barRoundPeaks)};
  --chart-bar-width: ${settings.barWidth}px;
  --chart-bar-max-width: ${settings.barMaxWidth}px;
  --chart-bar-min-height: ${settings.barMinHeight}px;
  --chart-bar-opacity: ${settings.barOpacity}%;
  --chart-bar-border-width: ${settings.barBorderWidth}px;
  --chart-bar-border-color: ${settings.barBorderColor};
  --chart-bar-value-position: ${settings.barValuePosition};
  --chart-bar-category-position: ${settings.barCategoryPosition};
  --chart-common-bar-color: ${Number(settings.commonBarColor)};
  --chart-color-bars-by-data: ${Number(settings.colorBarsByData)};
  --chart-show-bar-background: ${Number(settings.showBarBackground)};
  --chart-bar-background-color: ${settings.barBackgroundColor};

  /* Линии */
  --chart-line-show: ${Number(settings.showLines)};
  --chart-line-shape: ${settings.lineShape};
  --chart-line-width: ${settings.lineWidth}px;
  --chart-line-opacity: ${settings.lineOpacity}%;
  --chart-line-type: ${settings.lineType};
  --chart-smooth-lines: ${Number(settings.smoothLines)};
  --chart-show-line-symbols: ${Number(settings.showLineSymbols)};
  --chart-line-show-points: ${Number(settings.showLineSymbols)};
  --chart-line-symbol-size: ${settings.lineSymbolSize}px;
  --chart-line-symbol: ${settings.lineSymbol};
  --chart-line-step: ${settings.lineStep};
  --chart-area-opacity: ${settings.areaOpacity}%;
  --chart-line-show-area: ${Number(settings.showLineArea)};
  --chart-line-stacked: ${Number(settings.lineStacked)};
  --chart-show-end-label: ${Number(settings.showEndLabel)};

  /* Круговые */
  --chart-pie-show-names: ${Number(settings.showPieLabels)};
  --chart-pie-show-percentages: ${Number(settings.showPiePercentages)};
  --chart-pie-inner-radius: ${settings.pieInnerRadius}%;
  --chart-pie-outer-radius: ${settings.pieOuterRadius}%;
  --chart-pie-gap: ${settings.piePadAngle}deg;
  --chart-pie-start-angle: ${settings.pieStartAngle}deg;
  --chart-pie-end-angle: ${settings.pieEndAngle}deg;
  --chart-pie-clockwise: ${Number(settings.pieClockwise)};
  --chart-pie-rose: ${settings.pieRoseType};
  --chart-show-pie-labels: ${Number(settings.showPieLabels)};
  --chart-show-pie-label-lines: ${Number(settings.showPieLabelLines)};
  --chart-pie-label-position: ${settings.pieLabelPosition};
  --chart-pie-min-angle: ${settings.pieMinAngle}deg;
  --chart-pie-border-radius: ${settings.pieBorderRadius}px;
  --chart-pie-border-width: ${settings.pieBorderWidth}px;
  --chart-pie-border-color: ${settings.pieBorderColor};
  --chart-pie-selected-mode: ${Number(settings.pieSelectedMode)};
  --chart-pie-selected-offset: ${settings.pieSelectedOffset}px;

  /* Scatter */
  --chart-scatter-symbol-size: ${settings.scatterSymbolSize}px;
  --chart-scatter-symbol: ${settings.scatterSymbol};
  --chart-scatter-symbol-rotate: ${settings.scatterSymbolRotate}deg;
  --chart-scatter-opacity: ${settings.scatterOpacity}%;
  --chart-scatter-border-width: ${settings.scatterBorderWidth}px;
  --chart-scatter-border-color: ${settings.scatterBorderColor};
  --chart-scatter-shadow-blur: ${settings.scatterShadowBlur}px;
  --chart-scatter-shadow-offset-x: ${settings.scatterShadowOffsetX}px;
  --chart-scatter-shadow-offset-y: ${settings.scatterShadowOffsetY}px;
  --chart-show-scatter-labels: ${Number(settings.showScatterLabels)};

  /* Radar */
  --chart-radar-area-opacity: ${settings.radarAreaOpacity}%;
  --chart-radar-shape: ${settings.radarShape};
  --chart-radar-radius: ${settings.radarRadius}%;
  --chart-radar-split-number: ${settings.radarSplitNumber};
  --chart-show-radar-names: ${Number(settings.showRadarNames)};
  --chart-show-radar-split-area: ${Number(settings.showRadarSplitArea)};
  --chart-radar-split-area-opacity: ${settings.radarSplitAreaOpacity}%;
  --chart-radar-line-width: ${settings.radarLineWidth}px;
  --chart-radar-line-type: ${settings.radarLineType};

  /* Состояния */
  --chart-emphasis-focus: ${settings.emphasisFocus};
  --chart-emphasis-scale: ${Number(settings.emphasisScale)};
  --chart-blur-opacity: ${settings.blurOpacity}%;
  --chart-select-border-width: ${settings.selectBorderWidth}px;

  /* Палитра */
  --chart-palette-mode: ${selectedPaletteId.value};
  --chart-mono-base-color: ${monoBaseColor.value};
${palette}
}`
}

function normalizeHexColor(value: string) {
  const color = value.trim()
  if (/^#[\da-f]{6}([\da-f]{2})?$/i.test(color)) return color.toLowerCase()
  if (/^#[\da-f]{3,4}$/i.test(color)) {
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

function updateNullableStyleNumber(
  event: Event,
  key: 'yAxisMin' | 'yAxisMax' | 'yAxisInterval',
) {
  const rawValue = (event.target as HTMLInputElement).value
  if (rawValue === '') {
    styleSettings.value[key] = null
    return
  }

  const parsed = Number(rawValue)
  if (Number.isFinite(parsed)) {
    styleSettings.value[key] =
      key === 'yAxisInterval' ? Math.max(0, parsed) : parsed
  }
}

function applyCssCode(value: string) {
  cssCode.value = value
  const declarations = new Map<string, string>()
  const pattern = /--chart-([\w-]+)\s*:\s*([^;}]+)/g
  let match: RegExpExecArray | null

  while ((match = pattern.exec(value))) {
    declarations.set(match[1], match[2].trim())
  }

  const next = cloneStyleSettings(styleSettings.value)
  const declaredPaletteMode = declarations.get('palette-mode')?.trim()
  const declaredMonoBaseColor = normalizeHexColor(
    declarations.get('mono-base-color') ?? '',
  )
  if (declaredMonoBaseColor) monoBaseColor.value = declaredMonoBaseColor

  const colorVariables: Array<[string, keyof StyleSettings]> = [
    ['background', 'backgroundColor'],
    ['text', 'textColor'],
    ['muted', 'mutedTextColor'],
    ['tooltip-background', 'tooltipBackgroundColor'],
    ['tooltip-border', 'tooltipBorderColor'],
    ['grid-line-color', 'gridLineColor'],
    ['axis-line-color', 'axisLineColor'],
    ['bar-border-color', 'barBorderColor'],
    ['bar-background-color', 'barBackgroundColor'],
    ['pie-border-color', 'pieBorderColor'],
    ['scatter-border-color', 'scatterBorderColor'],
    ['category-label-color', 'categoryLabelColor'],
    ['value-axis-label-color', 'valueAxisLabelColor'],
    ['pie-label-color', 'pieLabelColor'],
  ]

  colorVariables.forEach(([variable, key]) => {
    const color = normalizeHexColor(declarations.get(variable) ?? '')
    if (color) next[key] = color as never
  })

  const fontFamily = declarations.get('font-family')?.trim()
  if (fontFamily && !/[{};]/.test(fontFamily)) {
    next.fontFamily = fontFamily.slice(0, 120)
  }

  const numericVariables: Array<
    [string, keyof StyleSettings, number, number]
  > = [
    ['font-weight', 'fontWeight', 400, 900],
    ['padding', 'chartPadding', 0, 80],
    ['animation-duration', 'animationDuration', 0, 3000],
    ['animation-update-duration', 'animationUpdateDuration', 0, 3000],
    ['legend-font-size', 'legendFontSize', 8, 30],
    ['legend-item-size', 'legendItemSize', 6, 30],
    ['legend-gap', 'legendGap', 0, 60],
    ['tooltip-font-size', 'tooltipFontSize', 8, 30],
    ['x-axis-label-size', 'xAxisLabelSize', 8, 40],
    ['y-axis-label-size', 'yAxisLabelSize', 8, 40],
    ['value-label-size', 'valueLabelSize', 10, 48],
    ['pie-label-size', 'pieLabelSize', 10, 48],
    ['axis-label-weight', 'axisLabelWeight', 400, 900],
    ['value-label-weight', 'valueLabelWeight', 400, 900],
    ['x-axis-label-rotate', 'xAxisLabelRotate', -90, 90],
    ['y-axis-label-rotate', 'yAxisLabelRotate', -90, 90],
    ['x-axis-label-margin', 'xAxisLabelMargin', 0, 60],
    ['y-axis-label-margin', 'yAxisLabelMargin', -60, 60],
    ['value-decimals', 'valueDecimals', 0, 4],
    ['grid-line-width', 'gridLineWidth', 1, 8],
    ['grid-line-opacity', 'axisOpacity', 0, 100],
    ['axis-opacity', 'axisOpacity', 0, 100],
    ['bar-gap', 'barGapPercent', 0, 100],
    ['bar-series-gap', 'barSeriesGapPercent', -100, 100],
    ['bar-radius', 'barRadius', 0, 120],
    ['bar-width', 'barWidth', 0, 180],
    ['bar-max-width', 'barMaxWidth', 20, 180],
    ['bar-min-height', 'barMinHeight', 0, 80],
    ['bar-opacity', 'barOpacity', 0, 100],
    ['bar-border-width', 'barBorderWidth', 0, 20],
    ['line-width', 'lineWidth', MIN_LINE_WIDTH_PX, MAX_LINE_WIDTH_PX],
    ['line-opacity', 'lineOpacity', 0, 100],
    ['line-symbol-size', 'lineSymbolSize', 2, MAX_LINE_WIDTH_PX],
    ['area-opacity', 'areaOpacity', 0, 100],
    ['pie-inner-radius', 'pieInnerRadius', 0, 80],
    ['pie-outer-radius', 'pieOuterRadius', 20, 100],
    ['pie-gap', 'piePadAngle', 0, 20],
    ['pie-start-angle', 'pieStartAngle', 0, 360],
    ['pie-end-angle', 'pieEndAngle', 0, 360],
    ['pie-min-angle', 'pieMinAngle', 0, 90],
    ['pie-border-radius', 'pieBorderRadius', 0, 80],
    ['pie-border-width', 'pieBorderWidth', 0, 20],
    ['pie-selected-offset', 'pieSelectedOffset', 0, 60],
    ['scatter-symbol-size', 'scatterSymbolSize', 4, 80],
    ['scatter-symbol-rotate', 'scatterSymbolRotate', 0, 360],
    ['scatter-opacity', 'scatterOpacity', 0, 100],
    ['scatter-border-width', 'scatterBorderWidth', 0, 20],
    ['scatter-shadow-blur', 'scatterShadowBlur', 0, 60],
    ['scatter-shadow-offset-x', 'scatterShadowOffsetX', -30, 30],
    ['scatter-shadow-offset-y', 'scatterShadowOffsetY', -30, 30],
    ['radar-area-opacity', 'radarAreaOpacity', 0, 100],
    ['radar-radius', 'radarRadius', 20, 90],
    ['radar-split-number', 'radarSplitNumber', 1, 10],
    ['radar-split-area-opacity', 'radarSplitAreaOpacity', 0, 40],
    ['radar-line-width', 'radarLineWidth', 1, 20],
    ['blur-opacity', 'blurOpacity', 0, 100],
    ['select-border-width', 'selectBorderWidth', 0, 20],
  ]

  numericVariables.forEach(([variable, key, minimum, maximum]) => {
    const raw = declarations.get(variable)
    if (raw === undefined) return
    const parsed = numberInRange(raw, minimum, maximum)
    if (parsed !== null) next[key] = parsed as never
  })

  const nullableNumberVariables: Array<
    [string, 'yAxisMin' | 'yAxisMax' | 'yAxisInterval', number, number]
  > = [
    ['y-axis-min', 'yAxisMin', -1_000_000_000, 1_000_000_000],
    ['y-axis-max', 'yAxisMax', -1_000_000_000, 1_000_000_000],
    ['y-axis-interval', 'yAxisInterval', 0, 1_000_000_000],
  ]

  nullableNumberVariables.forEach(([variable, key, minimum, maximum]) => {
    const raw = declarations.get(variable)
    if (raw === undefined) return
    if (raw.trim().toLowerCase() === 'auto') {
      next[key] = null
      return
    }
    const parsed = numberInRange(raw, minimum, maximum)
    if (parsed !== null) next[key] = parsed
  })

  const booleanVariables: Array<[string, keyof StyleSettings]> = [
    ['show-title', 'showTitle'],
    ['show-legend', 'showLegend'],
    ['show-tooltip', 'showTooltip'],
    ['show-x-axis-labels', 'showXAxisLabels'],
    ['show-y-axis-labels', 'showYAxisLabels'],
    ['show-value-labels', 'showValueLabels'],
    ['show-grid', 'showGridLines'],
    ['show-axis-lines', 'showAxisLines'],
    ['show-axis-ticks', 'showAxisTicks'],
    ['boundary-gap', 'boundaryGap'],
    ['bar-round-peaks', 'barRoundPeaks'],
    ['bar-horizontal', 'barHorizontal'],
    ['common-bar-color', 'commonBarColor'],
    ['color-bars-by-data', 'colorBarsByData'],
    ['show-bar-background', 'showBarBackground'],
    ['line-show', 'showLines'],
    ['smooth-lines', 'smoothLines'],
    ['show-line-symbols', 'showLineSymbols'],
    ['line-show-points', 'showLineSymbols'],
    ['line-show-area', 'showLineArea'],
    ['line-stacked', 'lineStacked'],
    ['show-end-label', 'showEndLabel'],
    ['pie-clockwise', 'pieClockwise'],
    ['pie-show-percentages', 'showPiePercentages'],
    ['show-pie-labels', 'showPieLabels'],
    ['pie-show-names', 'showPieLabels'],
    ['show-pie-label-lines', 'showPieLabelLines'],
    ['pie-selected-mode', 'pieSelectedMode'],
    ['show-scatter-labels', 'showScatterLabels'],
    ['show-radar-names', 'showRadarNames'],
    ['show-radar-split-area', 'showRadarSplitArea'],
    ['emphasis-scale', 'emphasisScale'],
  ]

  booleanVariables.forEach(([variable, key]) => {
    const raw = declarations.get(variable)
    if (raw !== undefined) next[key] = parseBoolean(raw) as never
  })

  const enums: Array<[string, keyof StyleSettings, readonly string[]]> = [
    ['animation-easing', 'animationEasing', [
      'linear',
      'cubicIn',
      'cubicOut',
      'cubicInOut',
      'quarticOut',
      'elasticOut',
    ]],
    ['legend-position', 'legendPosition', ['top', 'bottom', 'left', 'right']],
    ['title-align', 'titleAlignment', ['left', 'center', 'right']],
    ['label-align', 'labelAlignment', ['left', 'center', 'right']],
    ['value-format', 'valueFormat', ['number', 'percent', 'compact']],
    ['grid-line-type', 'gridLineType', ['solid', 'dashed', 'dotted']],
    [
      'bar-arrangement',
      'barArrangement',
      ['grouped', 'stacked', 'horizontal'],
    ],
    ['bar-order', 'barOrder', ['normal', 'reverse', 'value']],
    ['bar-value-position', 'barValuePosition', ['inside', 'top']],
    ['bar-category-position', 'barCategoryPosition', ['axis', 'inside']],
    ['line-shape', 'lineShape', ['straight', 'smooth', 'step']],
    ['line-type', 'lineType', ['solid', 'dashed', 'dotted']],
    ['line-symbol', 'lineSymbol', [
      'circle',
      'rect',
      'roundRect',
      'triangle',
      'diamond',
      'pin',
      'arrow',
    ]],
    ['line-step', 'lineStep', ['none', 'start', 'middle', 'end']],
    ['pie-rose', 'pieRoseType', ['none', 'radius', 'area']],
    ['pie-label-position', 'pieLabelPosition', ['outside', 'inside', 'center']],
    ['scatter-symbol', 'scatterSymbol', [
      'circle',
      'rect',
      'roundRect',
      'triangle',
      'diamond',
      'pin',
      'arrow',
    ]],
    ['radar-shape', 'radarShape', ['polygon', 'circle']],
    ['radar-line-type', 'radarLineType', ['solid', 'dashed', 'dotted']],
    ['emphasis-focus', 'emphasisFocus', ['none', 'self', 'series']],
  ]

  enums.forEach(([variable, key, allowed]) => {
    const raw = declarations.get(variable)?.trim()
    if (raw && allowed.includes(raw)) {
      next[key] = raw as never
    }
  })

  const monoModeRequested = declaredPaletteMode === 'mono'
  const expectedMonoPalette = monochromePalette()
  const paletteSnapshot = cssPaletteSnapshot.value
  let paletteWasEdited = false

  if (monoModeRequested) {
    next.palette = [...expectedMonoPalette]
    next.paletteOpacities = expectedMonoPalette.map(() => 100)
  } else {
    next.palette = [...next.palette]
    next.paletteOpacities = [...next.paletteOpacities]
  }

  next.palette.forEach((_, index) => {
    const color = normalizeHexColor(
      declarations.get(`color-${index + 1}`) ?? '',
    )
    const snapshotColor = paletteSnapshot?.colors[index]
    const colorWasEdited = Boolean(
      color && snapshotColor && color !== normalizeHexColor(snapshotColor),
    )
    if (colorWasEdited) paletteWasEdited = true
    if (color && (!monoModeRequested || colorWasEdited)) {
      next.palette[index] = color
    }

    const opacityRaw = declarations.get(`color-${index + 1}-opacity`)
    if (opacityRaw !== undefined) {
      const opacity = numberInRange(opacityRaw, 0, 100)
      const snapshotOpacity = paletteSnapshot?.opacities[index]
      const opacityWasEdited =
        opacity !== null &&
        snapshotOpacity !== undefined &&
        opacity !== snapshotOpacity
      if (opacityWasEdited) paletteWasEdited = true
      if (opacity !== null && (!monoModeRequested || opacityWasEdited)) {
        next.paletteOpacities[index] = opacity
      }
    }
  })

  if (next.presentationMode) {
    if (chartType.value === 'pie') {
      next.pieInnerRadius = 0
    } else if (chartType.value === 'doughnut') {
      next.pieInnerRadius = Math.min(
        Math.max(1, next.pieInnerRadius),
        Math.max(1, next.pieOuterRadius - 1),
      )
    }

    next.smoothLines = next.lineShape === 'smooth'
    next.lineStep = next.lineShape === 'step' ? 'middle' : 'none'
  }

  styleSettings.value = next
  selectedPaletteId.value =
    monoModeRequested && !paletteWasEdited ? 'mono' : 'custom'
}

function beginCssEditing() {
  isEditingCss.value = true
  cssPaletteSnapshot.value = {
    colors: styleSettings.value.palette.map(
      (color) => normalizeHexColor(color) ?? color,
    ),
    opacities: [...styleSettings.value.paletteOpacities],
  }
}

function finishCssEditing() {
  isEditingCss.value = false
  cssPaletteSnapshot.value = null
  cssCode.value = formatCss(styleSettings.value)
}

watch(
  [styleSettings, monoBaseColor, selectedPaletteId],
  ([settings]) => {
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

function approximateTextWidth(text: string, fontSize: number) {
  return Array.from(text).reduce(
    (width, character) =>
      width + (/[MWЖШЩЮЫФмшщюы]/.test(character) ? 0.82 : 0.58) * fontSize,
    0,
  )
}

interface WrappedTextLayout {
  text: string
  lines: string[]
}

function fitTextWithEllipsis(
  text: string,
  maximumWidth: number,
  fontSize: number,
) {
  const ellipsis = '…'
  const normalized = text.trimEnd()
  if (approximateTextWidth(normalized, fontSize) <= maximumWidth) {
    return normalized
  }

  const characters = Array.from(normalized)
  while (
    characters.length > 0 &&
    approximateTextWidth(`${characters.join('')}${ellipsis}`, fontSize) >
      maximumWidth
  ) {
    characters.pop()
  }
  return `${characters.join('').trimEnd()}${ellipsis}`
}

function wrapTextWithEllipsis(
  source: string,
  maximumWidth: number,
  fontSize: number,
  maximumLines = 3,
): WrappedTextLayout {
  const normalized = source.replace(/\s+/g, ' ').trim()
  if (!normalized || maximumWidth <= 0 || maximumLines <= 0) {
    return { text: '', lines: [] }
  }

  const lines: string[] = []
  let remaining = normalized

  while (remaining && lines.length < maximumLines) {
    if (approximateTextWidth(remaining, fontSize) <= maximumWidth) {
      lines.push(remaining)
      remaining = ''
      break
    }

    const characters = Array.from(remaining)
    let fittingLength = 0
    while (
      fittingLength < characters.length &&
      approximateTextWidth(
        characters.slice(0, fittingLength + 1).join(''),
        fontSize,
      ) <= maximumWidth
    ) {
      fittingLength += 1
    }

    fittingLength = Math.max(1, fittingLength)
    const fittingText = characters.slice(0, fittingLength).join('')
    const lastSpace = fittingText.lastIndexOf(' ')
    const breakLength = lastSpace > 0 ? lastSpace : fittingLength
    const line = characters.slice(0, breakLength).join('').trim()
    const next = characters
      .slice(lastSpace > 0 ? breakLength + 1 : breakLength)
      .join('')
      .trimStart()

    if (lines.length === maximumLines - 1) {
      lines.push(fitTextWithEllipsis(line || next, maximumWidth, fontSize))
      remaining = ''
      break
    }

    lines.push(line || characters[0])
    remaining = next
  }

  return { text: lines.join('\n'), lines }
}

interface LegendTextLayout {
  visibleNames: string[]
  labels: Record<string, string>
  lineCount: number
  widestItem: number
}

function layoutLegendText(
  names: string[],
  maximumWidth: number,
  fontSize: number,
  markerSize: number,
  vertical: boolean,
): LegendTextLayout {
  const measurementFontSize = fontSize * 1.12
  const markerTextGap = 8
  const availableLabelWidth = maximumWidth - markerSize - markerTextGap
  const labelMaximumWidth = Math.max(
    measurementFontSize * 3,
    vertical
      ? availableLabelWidth
      : Math.min(availableLabelWidth, maximumWidth * 0.58),
  )
  const labels: Record<string, string> = {}
  let widestItem = 0

  for (const name of names) {
    const label = fitTextWithEllipsis(
      name,
      labelMaximumWidth,
      measurementFontSize,
    )
    const textWidth = approximateTextWidth(label, measurementFontSize)
    labels[name] = label
    widestItem = Math.max(
      widestItem,
      Math.min(maximumWidth, markerSize + markerTextGap + textWidth),
    )
  }

  return {
    visibleNames: [...names],
    labels,
    lineCount: names.length === 0 ? 0 : vertical ? names.length : 1,
    widestItem,
  }
}

function topLegendFitsTitle(legendItems: string[], showTitle: boolean) {
  const scale = newUiChartScale.value
  const stageWidth = chartStageSize.value.width
  const legendFontSize = Math.max(
    11,
    Math.round(styleSettings.value.legendFontSize * scale),
  )
  const legendWidth = legendItems.reduce(
    (width, item) =>
      width +
      approximateTextWidth(item, legendFontSize) +
      (styleSettings.value.legendItemSize + styleSettings.value.legendGap) * scale,
    0,
  )
  const legendLeft = (stageWidth - legendWidth) / 2
  if (legendLeft < 0) return false
  if (!showTitle || !chartTitle.value.trim()) return true

  const titleWidth = approximateTextWidth(
    chartTitle.value.trim(),
    Math.max(18, Math.round(24 * scale)),
  )
  return titleWidth + 24 * scale <= legendLeft
}

function randomizeChartStyle() {
  if (isNewUi.value) {
    const currentKind = activeNewUiChartKind()
    const kinds: NewUiChartKind[] = [
      'columns',
      'rows',
      'doughnut',
      'pie',
      'line',
    ]
    const alternatives = kinds.filter((kind) => kind !== currentKind)
    selectNewUiChartKind(randomChoice(alternatives))
  } else {
    const alternatives = chartTypes
      .map(({ value }) => value)
      .filter((type) => type !== chartType.value)
    selectChartType(randomChoice(alternatives))
  }

  const baseHue = randomInteger(0, 359)
  const harmony = [0, 28, 58, 142, 178, 214, 264, 310, 336]
  const palette = harmony.map((offset, index) =>
    hslToHex(
      baseHue + offset + randomInteger(-8, 8),
      randomInteger(68, 92),
      index < 3 ? randomInteger(48, 62) : randomInteger(52, 68),
    ),
  )
  const presentation = styleSettings.value.presentationMode
  const currentType = chartType.value
  const currentKind = activeNewUiChartKind()
  const randomValueLabelSize = randomInteger(14, 32)
  const nextValueLabelSize =
    currentType === 'line' &&
    randomValueLabelSize === styleSettings.value.valueLabelSize
      ? randomValueLabelSize === 32
        ? 31
        : randomValueLabelSize + 1
      : randomValueLabelSize
  const showValueLabels =
    currentType === 'line'
      ? !styleSettings.value.showValueLabels
      : randomBoolean(0.48)
  const valueLabelPosition = randomChoice<BarValuePosition>([
    'inside',
    'top',
  ])
  const pieOuterRadius = randomInteger(64, 92)
  const pieInnerRadius =
    currentType === 'doughnut'
      ? randomInteger(24, Math.max(25, pieOuterRadius - 16))
      : 0
  const lineShape = randomChoice<LineShape>([
    'straight',
    'smooth',
    'step',
  ])
  let showLines = randomBoolean(0.82)
  let showLineSymbols = randomBoolean(0.5)
  let lineWidth = randomInteger(2, 18)
  let lineSymbolSize = randomInteger(5, 22)
  if (currentType === 'line' && !showLines && !showLineSymbols) {
    if (randomBoolean(0.7)) showLines = true
    else showLineSymbols = true
  }
  if (
    currentType === 'line' &&
    showValueLabels &&
    valueLabelPosition === 'inside'
  ) {
    const safeLineLabelBackgroundSize = Math.min(
      MAX_LINE_WIDTH_PX,
      nextValueLabelSize + 12,
    )
    const safeSymbolLabelBackgroundSize = Math.min(
      MAX_LINE_WIDTH_PX,
      nextValueLabelSize + 18,
    )
    if (randomBoolean()) {
      showLineSymbols = true
      lineSymbolSize = safeSymbolLabelBackgroundSize
    } else {
      showLines = true
      showLineSymbols = false
      lineWidth = safeLineLabelBackgroundSize
    }
  }
  const showTitle = randomBoolean(0.88)
  const showLegend = presentation && currentType === 'line'
    ? true
    : randomBoolean(0.72)
  let labelAlignment = randomChoice<LabelAlignment>([
    'left',
    'center',
    'right',
  ])
  let titleAlignment = labelAlignment
  let legendPosition: LegendPosition = presentation && currentType === 'line'
    ? 'top'
    : randomChoice<LegendPosition>(['top', 'bottom', 'left', 'right'])

  if (currentType === 'doughnut') {
    legendPosition = topLegendFitsTitle(categories.value, showTitle) && randomBoolean()
      ? 'top'
      : 'left'
    if (legendPosition === 'top') labelAlignment = 'left'
    if (legendPosition === 'top') titleAlignment = 'left'
  } else if (currentKind === 'rows') {
    const seriesNames = dataSeries.value.map((series) => series.name)
    legendPosition =
      topLegendFitsTitle(seriesNames, showTitle) && randomBoolean()
        ? 'top'
        : 'bottom'
  }

  styleSettings.value = {
    ...styleSettings.value,
    backgroundColor: presentation
      ? 'transparent'
      : hslToHex(
          baseHue + randomInteger(-20, 20),
          randomInteger(18, 42),
          randomInteger(4, 14),
        ),
    textColor: presentation ? '#000000' : '#ffffff',
    mutedTextColor: presentation
      ? '#000000'
      : hslToHex(baseHue, 18, randomInteger(68, 82)),
    palette,
    paletteOpacities: palette.map(() => randomInteger(78, 100)),
    valueLabelSize: nextValueLabelSize,
    pieLabelSize: randomInteger(12, 24),
    showXAxisLabels: presentation && currentType === 'line'
      ? true
      : randomBoolean(0.86),
    showYAxisLabels: presentation && currentType === 'line'
      ? true
      : randomBoolean(0.72),
    showValueLabels,
    labelAlignment,
    titleAlignment,
    showTitle,
    showLegend,
    legendPosition,
    showTooltip: presentation ? false : true,
    showGridLines: randomBoolean(0.34),
    showAxisLines: randomBoolean(0.28),
    showAxisTicks: randomBoolean(0.22),
    animationDuration: presentation ? 0 : randomInteger(3, 14) * 100,
    animationUpdateDuration: presentation ? 0 : randomInteger(2, 10) * 100,
    barArrangement: randomChoice<BarArrangement>([
      'grouped',
      'stacked',
    ]),
    barGapPercent: randomInteger(8, 58),
    barRadius: randomInteger(0, 110),
    barRoundPeaks: randomBoolean(0.72),
    barMaxWidth: randomInteger(42, 150),
    barOpacity: randomInteger(72, 100),
    barValuePosition: valueLabelPosition,
    // Only horizontal bars may place category labels inside their bars.
    // Cartesian X-axis labels must always remain below the axis line.
    barCategoryPosition:
      currentKind === 'rows'
        ? randomChoice<BarCategoryPosition>(['axis', 'inside'])
        : 'axis',
    colorBarsByData: randomBoolean(0.76),
    commonBarColor: randomBoolean(0.18),
    showLines,
    lineShape,
    lineWidth,
    lineOpacity: randomInteger(70, 100),
    lineType: randomChoice<LineStyleType>([
      'solid',
      'dashed',
      'dotted',
    ]),
    smoothLines: lineShape === 'smooth',
    showLineSymbols,
    lineSymbolSize,
    lineStep: lineShape === 'step' ? 'middle' : 'none',
    showLineArea: randomBoolean(0.5),
    areaOpacity: randomInteger(12, 54),
    pieInnerRadius,
    pieOuterRadius,
    piePadAngle: randomInteger(0, 8),
    pieBorderRadius: randomInteger(0, 80),
    pieStartAngle: randomInteger(0, 12) * 30,
    pieClockwise: randomBoolean(),
    pieRoseType: randomChoice<PieRoseType>(['none', 'none', 'radius']),
    showPieLabels: presentation ? true : randomBoolean(0.78),
    showPiePercentages: presentation ? true : randomBoolean(0.5),
    showPieLabelLines: presentation ? true : randomBoolean(0.7),
    emphasisFocus: presentation ? 'none' : styleSettings.value.emphasisFocus,
    emphasisScale: presentation ? false : styleSettings.value.emphasisScale,
    selectBorderWidth: presentation ? 0 : styleSettings.value.selectBorderWidth,
    scatterSymbolSize: randomInteger(8, 42),
    scatterOpacity: randomInteger(58, 100),
    showScatterLabels: randomBoolean(0.42),
    radarAreaOpacity: randomInteger(10, 46),
  }
  selectedPaletteId.value = 'custom'
}

function cloneInitialSeries(): DataSeries[] {
  return initialSeries.map((item) => ({
    ...item,
    values: [...item.values],
  }))
}

function updateCategory(rowIndex: number, value: string) {
  categories.value[rowIndex] = value
}

function updateSeriesName(seriesId: number, value: string) {
  const seriesItem = dataSeries.value.find((item) => item.id === seriesId)
  if (seriesItem) seriesItem.name = value
}

function updateNumberById(seriesId: number, rowIndex: number, rawValue: string) {
  const seriesItem = dataSeries.value.find((item) => item.id === seriesId)
  if (!seriesItem) return

  seriesItem.values[rowIndex] = rawValue === ''
    ? null
    : Number.isFinite(Number(rawValue))
      ? Number(rawValue)
      : null
}

function addRow() {
  categories.value.push(`Категория ${categories.value.length + 1}`)
  dataSeries.value.forEach((item) => item.values.push(0))
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
    values: categories.value.map(() => 0),
  })
}

function removeSeries(seriesId: number) {
  dataSeries.value = dataSeries.value.filter((item) => item.id !== seriesId)
}

function transposeData() {
  if (categories.value.length === 0 || dataSeries.value.length === 0) return

  const previousCategories = [...categories.value]
  const previousSeries = dataSeries.value.map((item) => ({
    ...item,
    values: [...item.values],
  }))
  categories.value = previousSeries.map((item) => item.name)
  dataSeries.value = previousCategories.map((name, categoryIndex) => ({
    id: nextSeriesId.value++,
    name,
    values: previousSeries.map((item) => item.values[categoryIndex] ?? null),
  }))
}

function importTableData(importedData: ImportedTableData) {
  categories.value = [...importedData.categories]
  dataSeries.value = importedData.series.map((item) => ({
    id: nextSeriesId.value++,
    name: item.name,
    values: [...item.values],
  }))
}

function clearDataValues() {
  dataSeries.value = dataSeries.value.map((item) => ({
    ...item,
    values: categories.value.map(() => 0),
  }))
}

function resetData() {
  categories.value = [...initialCategories]
  dataSeries.value = cloneInitialSeries()
  nextSeriesId.value = 3
}

const selectedPieSeries = computed(() => dataSeries.value[0])

const pieWarnings = computed(() => {
  if (chartType.value !== 'pie' && chartType.value !== 'doughnut') return []

  const values = selectedPieSeries.value?.values ?? []
  const nonEmptyValues = values.filter(
    (value, index): value is number =>
      value !== null && Boolean(categories.value[index]?.trim()),
  )
  const warnings: string[] = []

  if (nonEmptyValues.length > 8) {
    warnings.push(
      'На круговом графике больше 8 секторов — подписи и различия между значениями могут читаться хуже',
    )
  }
  if (nonEmptyValues.some((value) => value < 0)) {
    warnings.push('Круговой график не поддерживает отрицательные значения.')
  }
  if (
    nonEmptyValues.length > 0 &&
    nonEmptyValues.reduce((sum, value) => sum + value, 0) === 0
  ) {
    warnings.push('Сумма значений равна нулю — сектора нельзя отобразить.')
  }
  if (styleSettings.value.pieInnerRadius >= styleSettings.value.pieOuterRadius) {
    warnings.push('Толщина кольца должна оставлять внутренний радиус меньше внешнего.')
  }

  return warnings
})

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
  const title = chartTitle.value.trim()
    ? {
        title: {
          text: chartTitle.value.trim(),
          left: styleSettings.value.titleAlignment,
        },
      }
    : {}

  if (chartType.value === 'pie' || chartType.value === 'doughnut') {
    if (!selectedPieSeries.value) {
      return {
        ...title,
        backgroundColor: 'transparent',
        tooltip: { trigger: 'item' },
        legend: {},
        series: [],
      }
    }

    return {
      ...title,
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
      ...title,
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
      ...title,
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
    ...title,
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

const styleRevision = computed(() => JSON.stringify(styleSettings.value))

const option = computed<ChartOption>(() => {
  const settingsSnapshot = JSON.parse(
    styleRevision.value,
  ) as StyleSettings
  return styleMode.value === 'poster'
    ? applyChartStyle(rawOption.value, settingsSnapshot)
    : rawOption.value
})

const newUiChartStageStyle = computed((): Record<string, string> => ({
  ...chartStageStyle.value,
  '--chart-background': 'transparent',
  background: 'transparent',
  backgroundColor: 'transparent',
}))

const newUiChartScale = computed(() => {
  const kind = activeNewUiChartKind()
  const circular = kind === 'pie' || kind === 'doughnut'
  const baseWidth = circular ? 320 : 366
  const baseHeight = circular ? 320 : 444
  const scale = Math.min(
    chartStageSize.value.width / baseWidth,
    chartStageSize.value.height / baseHeight,
  )
  return Math.min(1.35, Math.max(0.4, scale || 1))
})

const newUiTitleLayout = computed(() => {
  const scale = newUiChartScale.value
  const fontSize = Math.round(24 * scale)
  const horizontalInset = Math.max(16, Math.round(16 * scale))
  return wrapTextWithEllipsis(
    chartTitle.value,
    Math.max(1, chartStageSize.value.width - horizontalInset * 2),
    fontSize * 1.12,
    3,
  )
})

const newUiTitleReserve = computed(() => {
  if (!styleSettings.value.showTitle || newUiTitleLayout.value.lines.length === 0) {
    return 0
  }
  const scale = newUiChartScale.value
  const lineHeight = Math.round(29 * scale)
  return newUiTitleLayout.value.lines.length * lineHeight + Math.round(16 * scale)
})

const newUiPieTopReserve = computed(() => {
  const titleReserve = newUiTitleReserve.value
  const kind = activeNewUiChartKind()
  const legendReserve =
    (kind === 'pie' || kind === 'doughnut') &&
    styleSettings.value.showLegend &&
    styleSettings.value.legendPosition === 'top'
      ? Math.round(48 * newUiChartScale.value)
      : 0

  return Math.max(titleReserve, legendReserve)
})

const newUiPieAvailableHeight = computed(() =>
  Math.max(120, chartStageSize.value.height - newUiPieTopReserve.value),
)

const newUiPieLegendSideReserve = computed(() => {
  const kind = activeNewUiChartKind()
  if (
    (kind !== 'pie' && kind !== 'doughnut') ||
    !styleSettings.value.showLegend ||
    (styleSettings.value.legendPosition !== 'left' &&
      styleSettings.value.legendPosition !== 'right')
  ) {
    return 0
  }

  const fontSize = Math.max(11, Math.round(12 * newUiChartScale.value))
  const widestItem = Math.max(
    0,
    ...categories.value.map((category) => approximateTextWidth(category, fontSize)),
  )
  return Math.min(
    chartStageSize.value.width * 0.3,
    Math.max(96 * newUiChartScale.value, widestItem + 46 * newUiChartScale.value),
  )
})

const newUiPieMaximumRadius = computed(() =>
  Math.max(
    1,
    Math.min(
      chartStageSize.value.width - 2 * newUiPieLegendSideReserve.value,
      newUiPieAvailableHeight.value,
    ) / 2,
  ),
)

const barGapMaximum = computed(() => {
  if (!isNewUi.value || chartType.value !== 'bar') return 100

  const settings = styleSettings.value
  const horizontal =
    settings.barHorizontal || settings.barArrangement === 'horizontal'
  const titleReserve =
    settings.showTitle && chartTitle.value.trim()
      ? Math.round(52 * newUiChartScale.value)
      : 0
  const categoryLength = horizontal
    ? Math.max(1, chartStageSize.value.height - titleReserve)
    : Math.max(1, chartStageSize.value.width)
  const bandSize = categoryLength / Math.max(1, categories.value.length)
  const categoryLabelInside =
    horizontal &&
    settings.showYAxisLabels &&
    settings.barCategoryPosition === 'inside'
  const valueLabelInside =
    settings.showValueLabels && settings.barValuePosition === 'inside'

  if (!categoryLabelInside && !valueLabelInside) return 100

  const categoryLabelThickness = categoryLabelInside
    ? settings.yAxisLabelSize * 1.15 + 8
    : 0
  const valueLabelThickness = valueLabelInside
    ? settings.valueLabelSize * 1.15 + 8
    : 0
  const visibleSeriesCount = settings.barArrangement === 'stacked'
    ? 1
    : Math.max(1, dataSeries.value.length)
  const seriesGapRatio = Math.max(-0.99, settings.barSeriesGapPercent / 100)
  const occupiedBars =
    visibleSeriesCount +
    Math.max(0, visibleSeriesCount - 1) * seriesGapRatio
  const requiredBandSize = Math.max(
    categoryLabelThickness,
    valueLabelThickness * occupiedBars,
  )

  return Math.min(
    100,
    Math.max(0, Math.floor((1 - requiredBandSize / bandSize) * 100)),
  )
})

const newUiPieOuterRadius = computed(
  () =>
    newUiPieMaximumRadius.value *
    (Math.min(100, Math.max(30, styleSettings.value.pieOuterRadius)) / 100),
)

const newUiPieMinimumThickness = computed(() =>
  getMinimumPieThicknessPercent(
    newUiPieOuterRadius.value,
    Math.max(
      MIN_PIE_RING_THICKNESS_PX,
      styleSettings.value.valueLabelSize + 16,
    ),
  ),
)

// ECharts сдвигает pie-label с position="inside" на 3 px наружу.
const PIE_INSIDE_LABEL_RADIAL_OFFSET = 3

function centerPieInsideLabel(
  centerX: number,
  centerY: number,
) {
  return ({
    labelRect,
  }: {
    labelRect: { x: number; y: number; width: number; height: number }
  }) => {
    const labelCenterX = labelRect.x + labelRect.width / 2
    const labelCenterY = labelRect.y + labelRect.height / 2
    const radialX = labelCenterX - centerX
    const radialY = labelCenterY - centerY
    const radialLength = Math.hypot(radialX, radialY)

    if (radialLength === 0) return { hideOverlap: true }

    const unitX = radialX / radialLength
    const unitY = radialY / radialLength
    let labelRotation = Math.atan2(unitX, unitY)
    if (labelRotation < 0) labelRotation += Math.PI * 2
    if (unitY > 0) labelRotation += Math.PI
    labelRotation -= Math.PI
    labelRotation *= -1

    const globalOffsetX = -unitX * PIE_INSIDE_LABEL_RADIAL_OFFSET
    const globalOffsetY = -unitY * PIE_INSIDE_LABEL_RADIAL_OFFSET
    const cosine = Math.cos(labelRotation)
    const sine = Math.sin(labelRotation)

    // labelLayout вращает dx/dy вместе с текстом: переводим глобальный
    // радиальный сдвиг в локальные оси тангенциальной подписи.
    return {
      dx: cosine * globalOffsetX + sine * globalOffsetY,
      dy: -sine * globalOffsetX + cosine * globalOffsetY,
      hideOverlap: true,
    }
  }
}

watch(
  [
    isNewUi,
    chartType,
    newUiPieMinimumThickness,
    () => styleSettings.value.pieInnerRadius,
    () => styleSettings.value.pieOuterRadius,
  ],
  () => {
    if (!isNewUi.value || chartType.value !== 'doughnut') return
    const thickness = getPieThicknessPercent(
      styleSettings.value.pieInnerRadius,
      styleSettings.value.pieOuterRadius,
    )
    const safeThickness = Math.min(
      MAX_PIE_RING_THICKNESS_PERCENT,
      Math.max(newUiPieMinimumThickness.value, thickness),
    )
    if (Math.abs(safeThickness - thickness) < 0.001) return
    styleSettings.value.pieInnerRadius = getPieInnerRadius(
      styleSettings.value.pieOuterRadius,
      safeThickness,
    )
  },
  { flush: 'sync' },
)

watch(
  [barGapMaximum, () => styleSettings.value.barGapPercent],
  ([maximum, current]) => {
    if (current <= maximum) return
    styleSettings.value.barGapPercent = maximum
  },
  { flush: 'sync' },
)

const newUiOption = computed<ChartOption>(() => {
  const settingsSnapshot = JSON.parse(styleRevision.value) as StyleSettings
  const scale = newUiChartScale.value
  const safeContentInset = Math.max(8, Math.round(12 * scale))
  const kind = activeNewUiChartKind()
  const rowsLegendPosition: 'top' | 'bottom' =
    settingsSnapshot.legendPosition === 'top' ? 'top' : 'bottom'
  const resolvedLegendPosition =
    kind === 'rows' ? rowsLegendPosition : settingsSnapshot.legendPosition
  const legendNames =
    kind === 'pie' || kind === 'doughnut'
      ? [...categories.value]
      : dataSeries.value.map((series) => series.name)
  const titleLayout = settingsSnapshot.showTitle
    ? newUiTitleLayout.value
    : { text: '', lines: [] }
  const titleLineHeight = Math.round(29 * scale)
  const titleReserve = settingsSnapshot.showTitle
    ? newUiTitleReserve.value
    : 0
  const legendFontSize = Math.max(
    11,
    Math.round(settingsSnapshot.legendFontSize * scale),
  )
  const legendLineHeight = Math.round(legendFontSize * 1.3)
  const legendMarkerSize = Math.max(
    8,
    Math.round(settingsSnapshot.legendItemSize * scale),
  )
  const legendItemGap = Math.max(
    8,
    Math.round(settingsSnapshot.legendGap * scale),
  )
  const legendOrientation = getLegendOrientation(resolvedLegendPosition)
  const legendIsVertical = legendOrientation === 'vertical'
  const legendMaximumWidth = legendIsVertical
    ? Math.max(
        96,
        Math.min(
          chartStageSize.value.width * 0.3,
          Math.round(190 * scale),
        ),
      )
    : Math.max(1, chartStageSize.value.width - Math.round(32 * scale))
  const legendTextLayout = settingsSnapshot.showLegend
    ? layoutLegendText(
        legendNames,
        legendMaximumWidth,
        legendFontSize,
        legendMarkerSize,
        legendIsVertical,
      )
    : {
        visibleNames: [],
        labels: {},
        lineCount: 0,
        widestItem: 0,
      }
  const legendIsVisible =
    settingsSnapshot.showLegend && legendTextLayout.visibleNames.length > 0
  const legendOuterGap = Math.round(12 * scale)
  const legendRequiredHeight = legendIsVertical
    ? legendTextLayout.lineCount * legendLineHeight +
      Math.max(0, legendTextLayout.lineCount - 1) * legendItemGap
    : Math.max(legendLineHeight, legendMarkerSize)
  const legendAvailableHeight = Math.max(
    legendLineHeight,
    chartStageSize.value.height - titleReserve - legendOuterGap * 2,
  )
  const legendContentHeight = legendIsVisible
    ? legendIsVertical
      ? Math.min(legendRequiredHeight, legendAvailableHeight)
      : legendRequiredHeight
    : 0
  const legendTop = titleReserve > 0 ? titleReserve : legendOuterGap
  const legendVerticalReserve = legendIsVisible
    ? legendContentHeight + legendOuterGap * 2
    : 0
  const legendSideReserve = legendIsVisible && legendIsVertical
    ? Math.min(
        chartStageSize.value.width * 0.34,
        legendTextLayout.widestItem + legendOuterGap * 2,
      )
    : 0
  const topContentReserve =
    titleReserve +
    (legendIsVisible && resolvedLegendPosition === 'top'
      ? legendVerticalReserve
      : 0)
  const bottomContentReserve =
    legendIsVisible && resolvedLegendPosition === 'bottom'
      ? legendVerticalReserve
      : 0
  const legendSideTop = Math.round(
    topContentReserve +
      Math.max(
        0,
        (chartStageSize.value.height -
          topContentReserve -
          bottomContentReserve -
          legendContentHeight) /
          2,
      ),
  )
  const categoryCount = Math.max(1, categories.value.length)
  const categoryAxisLength = kind === 'rows'
    ? Math.max(
        1,
        chartStageSize.value.height -
          topContentReserve -
          bottomContentReserve,
      )
    : Math.max(1, chartStageSize.value.width)
  const categoryBandSize = categoryAxisLength / categoryCount
  const occupiedCategoryBand =
    categoryBandSize *
    (1 - Math.min(100, Math.max(0, settingsSnapshot.barGapPercent)) / 100)
  const visibleBarCount = settingsSnapshot.barArrangement === 'stacked'
    ? 1
    : Math.max(1, dataSeries.value.length)
  const seriesGapRatio = Math.max(
    -0.99,
    settingsSnapshot.barSeriesGapPercent / 100,
  )
  const occupiedBarUnits =
    visibleBarCount + Math.max(0, visibleBarCount - 1) * seriesGapRatio
  const automaticBarThickness = occupiedCategoryBand / occupiedBarUnits
  const fillsCategoryBand = settingsSnapshot.barGapPercent <= 0
  const scaledValueLabelSize = Math.round(
    settingsSnapshot.valueLabelSize * scale,
  )
  const scaledBarSettings: StyleSettings = {
    ...settingsSnapshot,
    valueLabelSize: scaledValueLabelSize,
  }
  const minimumBarThickness = kind === 'columns'
    ? Math.max(
        2 * scale,
        ...dataSeries.value.map((series) =>
          getMinimumBarWidthForValues(
            { data: series.values },
            scaledBarSettings,
          ),
        ),
      )
    : 2 * scale
  const requestedBarThickness =
    fillsCategoryBand
      ? automaticBarThickness
      : settingsSnapshot.barWidth > 0
      ? settingsSnapshot.barWidth * scale
      : settingsSnapshot.barMaxWidth * scale
  const actualBarThickness = Math.min(
    automaticBarThickness,
    Math.max(minimumBarThickness, requestedBarThickness),
  )
  const proportionalBarRadius =
    (actualBarThickness / 2) *
    (Math.min(120, Math.max(0, settingsSnapshot.barRadius)) / 120)
  const usesDefaultRowAxisLabels =
    kind === 'rows' && settingsSnapshot.barCategoryPosition === 'axis'
  const categoryAxisLabelSize = usesDefaultRowAxisLabels
    ? settingsSnapshot.xAxisLabelSize
    : settingsSnapshot.yAxisLabelSize
  const categoryAxisLabelMargin = usesDefaultRowAxisLabels
    ? settingsSnapshot.xAxisLabelMargin
    : settingsSnapshot.yAxisLabelMargin
  const styled = applyChartStyle(rawOption.value, {
    ...settingsSnapshot,
    legendPosition: resolvedLegendPosition,
    barCategoryPosition: settingsSnapshot.barCategoryPosition,
    barRadius: proportionalBarRadius,
    backgroundColor: 'transparent',
    textColor: '#000000',
    mutedTextColor: '#000000',
    categoryLabelColor: usesDefaultRowAxisLabels
      ? '#000000'
      : settingsSnapshot.categoryLabelColor,
    xAxisLabelSize: Math.round(settingsSnapshot.xAxisLabelSize * scale),
    yAxisLabelSize: Math.round(categoryAxisLabelSize * scale),
    valueLabelSize: scaledValueLabelSize,
    pieLabelSize: Math.round(settingsSnapshot.pieLabelSize * scale),
    xAxisLabelMargin: Math.round(settingsSnapshot.xAxisLabelMargin * scale),
    yAxisLabelMargin: Math.round(categoryAxisLabelMargin * scale),
    barWidth:
      settingsSnapshot.barWidth > 0
        ? Math.round(settingsSnapshot.barWidth * scale)
        : 0,
    barMaxWidth: Math.round(settingsSnapshot.barMaxWidth * scale),
  })

  if (kind === 'columns' || kind === 'rows') {
    const valueAxisKey = kind === 'rows' ? 'xAxis' : 'yAxis'
    const source = styled[valueAxisKey]
    const axes = (Array.isArray(source) ? source : [source]).map((axis) => ({
      ...(axis ?? {}),
      min: 0,
      max: ({ max }: { max: number }) =>
        Math.max(10, Math.ceil(max / 10) * 10),
      splitNumber: 3,
      ...(kind === 'rows'
        ? {
            axisLabel: {
              ...(axis?.axisLabel ?? {}),
              showMinLabel: true,
              showMaxLabel: true,
              alignMinLabel: 'left',
              alignMaxLabel: 'right',
            },
          }
        : {}),
    }))
    styled[valueAxisKey] = Array.isArray(source) ? axes : axes[0]

    if (kind === 'rows') {
      const categoryAxisSource = styled.yAxis
      const categoryAxes = (
        Array.isArray(categoryAxisSource)
          ? categoryAxisSource
          : [categoryAxisSource]
      ).map((axis) => {
        const {
          min: _minimum,
          max: _maximum,
          interval: _interval,
          ...categoryAxis
        } = axis ?? {}

        return {
          ...categoryAxis,
          type: 'category',
          data: [...categories.value],
          boundaryGap: true,
        }
      })
      styled.yAxis = Array.isArray(categoryAxisSource)
        ? categoryAxes
        : categoryAxes[0]

      const {
        width: _gridWidth,
        height: _gridHeight,
        ...responsiveGrid
      } = styled.grid ?? {}
      styled.grid = {
        ...responsiveGrid,
        left:
          safeContentInset +
          (resolvedLegendPosition === 'left' ? legendSideReserve : 0),
        right:
          safeContentInset +
          (resolvedLegendPosition === 'right' ? legendSideReserve : 0),
        top: topContentReserve + safeContentInset,
        bottom: bottomContentReserve + safeContentInset,
      }
    } else {
      styled.grid = {
        ...(styled.grid ?? {}),
        left:
          safeContentInset +
          (resolvedLegendPosition === 'left' ? legendSideReserve : 0),
        right:
          safeContentInset +
          (resolvedLegendPosition === 'right' ? legendSideReserve : 0),
        top: topContentReserve + safeContentInset,
        bottom: bottomContentReserve + safeContentInset,
      }
    }
  }

  if (kind === 'line') {
    const source = styled.xAxis
    const axes = (Array.isArray(source) ? source : [source]).map((axisValue) => {
      const axis = (axisValue ?? {}) as Record<string, unknown>
      const axisLabel = (axis.axisLabel ?? {}) as Record<string, unknown>
      return {
        ...axis,
        axisLabel: {
          ...axisLabel,
          align: 'center',
        },
      }
    })
    styled.xAxis = Array.isArray(source) ? axes : axes[0]

    styled.grid = {
      ...(styled.grid ?? {}),
      left:
        safeContentInset +
        (resolvedLegendPosition === 'left' ? legendSideReserve : 0),
      right:
        safeContentInset +
        (resolvedLegendPosition === 'right' ? legendSideReserve : 0),
      top: topContentReserve + safeContentInset,
      bottom: bottomContentReserve + safeContentInset,
    }
  }

  if (styled.legend && !Array.isArray(styled.legend)) {
    const legendFormatter = (name: string) =>
      legendTextLayout.labels[name] ?? name
    styled.legend = {
      ...styled.legend,
      show: legendIsVisible,
      type: 'scroll',
      data: legendTextLayout.visibleNames,
      formatter: legendFormatter,
      itemWidth: legendMarkerSize,
      itemHeight: legendMarkerSize,
      itemGap: legendItemGap,
      width: legendMaximumWidth,
      height: legendContentHeight,
      orient: legendOrientation,
      left:
        resolvedLegendPosition === 'left'
          ? legendOuterGap
          : resolvedLegendPosition === 'right'
            ? undefined
            : 'center',
      right:
        resolvedLegendPosition === 'right' ? legendOuterGap : undefined,
      top:
        resolvedLegendPosition === 'top'
          ? legendTop
          : legendIsVertical
            ? legendSideTop
            : undefined,
      bottom:
        resolvedLegendPosition === 'bottom' ? legendOuterGap : undefined,
      textStyle: {
        ...(styled.legend.textStyle ?? {}),
        fontSize: legendFontSize,
        lineHeight: legendLineHeight,
        overflow: 'truncate',
      },
    }
  }

  if (kind === 'pie' || kind === 'doughnut') {
    const leftReserve =
      resolvedLegendPosition === 'left' ? legendSideReserve : 0
    const rightReserve =
      resolvedLegendPosition === 'right' ? legendSideReserve : 0
    const availableWidth = Math.max(
      1,
      chartStageSize.value.width - leftReserve - rightReserve,
    )
    const availableHeight = Math.max(
      1,
      chartStageSize.value.height - topContentReserve - bottomContentReserve,
    )
    const maximumRadius = Math.max(
      1,
      Math.min(availableWidth, availableHeight) / 2,
    )
    const outerRadius =
      maximumRadius *
      (Math.min(100, Math.max(30, settingsSnapshot.pieOuterRadius)) / 100)
    const requestedThickness = getPieThicknessPercent(
      settingsSnapshot.pieInnerRadius,
      settingsSnapshot.pieOuterRadius,
    )
    const thickness =
      kind === 'doughnut'
        ? Math.min(
            MAX_PIE_RING_THICKNESS_PERCENT,
            Math.max(
              getMinimumPieThicknessPercent(outerRadius),
              requestedThickness,
            ),
          )
        : 100
    const innerRatio = 1 - thickness / 100
    const roundingRatio = Math.min(
      1,
      Math.max(0, settingsSnapshot.pieBorderRadius / 80),
    )
    const radialThickness = outerRadius * (1 - innerRatio)
    const relativeBorderRadius = radialThickness * 0.5 * roundingRatio
    const centerX = leftReserve + availableWidth / 2
    const centerY = topContentReserve + availableHeight / 2
    const sourceSeries = Array.isArray(styled.series)
      ? styled.series
      : [styled.series]
    const circularSeries = sourceSeries.map((series) => {
      const valueLayer = String(series?.id ?? '').endsWith('-values')

      return {
        ...(series ?? {}),
        center: [centerX, centerY],
        radius: [outerRadius * innerRatio, outerRadius],
        ...(valueLayer
          ? { labelLayout: centerPieInsideLabel(centerX, centerY) }
          : {}),
        itemStyle: {
          ...(series?.itemStyle ?? {}),
          borderRadius: relativeBorderRadius,
        },
      }
    })
    styled.series = Array.isArray(styled.series)
      ? circularSeries
      : circularSeries[0]
  }

  if (styled.title && !Array.isArray(styled.title)) {
    styled.title = {
      ...styled.title,
      text: titleLayout.text,
      top: 0,
      left: settingsSnapshot.titleAlignment,
      textStyle: {
        ...(styled.title.textStyle ?? {}),
        fontSize: Math.round(24 * scale),
        fontWeight: 900,
        lineHeight: titleLineHeight,
      },
    }
  }

  return styled
})

type OptionFunction = {
  __echartsOptionSource?: string
  toString: () => string
}

function serializeOption(value: ChartOption) {
  const functionSources: string[] = []
  const serialized = JSON.stringify(
    value,
    (_key, currentValue: unknown) => {
      if (typeof currentValue !== 'function') return currentValue

      const optionFunction = currentValue as OptionFunction
      const functionIndex =
        functionSources.push(
          optionFunction.__echartsOptionSource ?? optionFunction.toString(),
        ) - 1
      return `__ECHARTS_OPTION_FUNCTION_${functionIndex}__`
    },
    2,
  )

  return serialized.replace(
    /"__ECHARTS_OPTION_FUNCTION_(\d+)__"/g,
    (_match, index: string) => functionSources[Number(index)] ?? 'undefined',
  )
}

const optionText = computed(() => serializeOption(option.value))

async function copyOption() {
  await navigator.clipboard.writeText(optionText.value)
  copied.value = true
  window.setTimeout(() => {
    copied.value = false
  }, 1500)
}
</script>

<template>
  <NewUiAppShell
    v-if="isNewUi"
    @show-classic="uiDesignMode = 'classic'"
  >
    <template #settings>
      <NewDesignPanel
        :settings="styleSettings"
        :chart-type="chartType"
        :chart-title="chartTitle"
        :selected-palette-id="selectedPaletteId"
        :mono-base-color="monoBaseColor"
        :series="dataSeries"
        :data-row-count="categories.length"
        :pie-warnings="pieWarnings"
        :pie-maximum-radius-px="newUiPieMaximumRadius"
        :bar-gap-maximum="barGapMaximum"
        @update:chart-title="chartTitle = $event"
        @select-chart-type="selectNewUiChartType"
        @select-columns-bar="selectColumnBar"
        @select-horizontal-bar="selectHorizontalBar"
        @apply-palette="applyNewPalette"
        @update:mono-base-color="updateMonoBaseColor"
        @mark-palette-custom="markPaletteCustom"
        @add-palette-color="addPaletteColor"
        @randomize="randomizeChartStyle"
        @clear="resetNewDesign"
        @close="uiDesignMode = 'classic'"
      >
        <template #data-editor>
          <NewChartDataEditor
            :categories="categories"
            :series="dataSeries"
            @update-category="updateCategory"
            @update-series-name="updateSeriesName"
            @update-number="updateNumberById"
            @remove-series="removeSeries"
            @remove-row="removeRow"
            @add-row="addRow"
            @add-series="addSeries"
            @transpose="transposeData"
            @import="importTableData"
            @clear="clearDataValues"
          />
        </template>
      </NewDesignPanel>
    </template>

    <template #chart>
      <div
        ref="chartStageElement"
        class="chart-stage chart-poster new-ui-chart-stage"
        :style="newUiChartStageStyle"
      >
        <VChart
          :key="`new-${activeNewUiChartKind()}-${renderer}-${chartTheme}-${styleMode}`"
          class="chart"
          :option="newUiOption"
          :init-options="{ renderer }"
          :update-options="{ notMerge: true }"
          :theme="chartTheme === 'dark' ? 'dark' : undefined"
          :autoresize="{ throttle: 100 }"
        />
      </div>
    </template>

  </NewUiAppShell>

  <main v-else class="app-shell">
    <header class="page-header">
      <div>
        <h1>Дефолтные графики Apache ECharts</h1>
      </div>
      <div class="header-actions">
        <div class="ui-design-switch" aria-label="Вид интерфейса">
          <button
            type="button"
            :class="{ active: uiDesignMode === 'classic' }"
            :aria-pressed="uiDesignMode === 'classic'"
            @click="uiDesignMode = 'classic'"
          >
            Текущий UI
          </button>
          <button
            type="button"
            :class="{ active: uiDesignMode === 'new' }"
            :aria-pressed="uiDesignMode === 'new'"
            @click="uiDesignMode = 'new'; styleMode = 'poster'"
          >
            Новый UI
          </button>
        </div>
        <button class="secondary-button" type="button" @click="resetData">
          Сбросить данные
        </button>
      </div>
    </header>

    <div class="workspace">
      <div class="editor-column">
        <ChartDataEditor
          :categories="categories"
          :series="dataSeries"
          heading-id="editor-title"
          @update-category="updateCategory"
          @update-series-name="updateSeriesName"
          @update-number="updateNumberById"
          @remove-series="removeSeries"
          @remove-row="removeRow"
          @add-row="addRow"
          @add-series="addSeries"
        />

        <section
          v-if="uiDesignMode === 'classic'"
          class="panel style-panel"
          aria-labelledby="style-panel-title"
        >
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
                  @click="selectChartType(item.value)"
                >
                  <span class="chart-type-icon" aria-hidden="true">
                    {{ item.value === 'bar' ? '▥' : item.value === 'line' ? '⌁' : item.value === 'area' ? '◒' : item.value === 'pie' ? '◔' : item.value === 'doughnut' ? '⊙' : item.value === 'scatter' ? '⁙' : '◇' }}
                  </span>
                  {{ item.label }}
                </button>
              </div>
              <div class="preset-actions">
                <button
                  class="random-chart-button"
                  type="button"
                  @click="randomizeChartStyle"
                >
                  <span aria-hidden="true">✦</span>
                  Рандомный стиль
                </button>
                <button
                  class="reset-style-button"
                  type="button"
                  @click="resetCurrentStyle"
                >
                  Сбросить стиль типа
                </button>
              </div>
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
              <label class="range-control">
                <span>Между сериями</span>
                <input
                  v-model.number="styleSettings.barSeriesGapPercent"
                  type="range"
                  min="-100"
                  max="100"
                />
                <output>{{ styleSettings.barSeriesGapPercent }}%</output>
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
                <span>Макс. ширина</span>
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
                  <input
                    v-model="styleSettings.colorBarsByData"
                    type="checkbox"
                  />
                  <span aria-hidden="true" />
                  Цвет по категориям
                </label>
                <label class="switch-control">
                  <input
                    v-model="styleSettings.showBarBackground"
                    type="checkbox"
                  />
                  <span aria-hidden="true" />
                  Фон столбцов
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
              <details class="advanced-settings">
                <summary>Ширина, граница и фон</summary>
                <label class="range-control">
                  <span>Точная ширина</span>
                  <input
                    v-model.number="styleSettings.barWidth"
                    type="range"
                    min="0"
                    max="180"
                  />
                  <output>
                    {{ styleSettings.barWidth === 0 ? 'Авто' : `${styleSettings.barWidth} px` }}
                  </output>
                </label>
                <label class="range-control">
                  <span>Мин. высота</span>
                  <input
                    v-model.number="styleSettings.barMinHeight"
                    type="range"
                    min="0"
                    max="80"
                  />
                  <output>{{ styleSettings.barMinHeight }} px</output>
                </label>
                <label class="range-control">
                  <span>Граница</span>
                  <input
                    v-model.number="styleSettings.barBorderWidth"
                    type="range"
                    min="0"
                    max="20"
                  />
                  <output>{{ styleSettings.barBorderWidth }} px</output>
                </label>
                <div class="color-controls compact-colors">
                  <label>
                    <span>Граница</span>
                    <HexColorInput
                      v-model="styleSettings.barBorderColor"
                      label="Цвет границы столбца"
                    />
                  </label>
                  <label>
                    <span>Фон</span>
                    <HexColorInput
                      v-model="styleSettings.barBackgroundColor"
                      label="Цвет фона столбца"
                    />
                  </label>
                </div>
              </details>
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
                  :min="MIN_LINE_WIDTH_PX"
                  :max="MAX_LINE_WIDTH_PX"
                />
                <output>{{ styleSettings.lineWidth }} px</output>
              </label>
              <label class="range-control">
                <span>Непрозрачность</span>
                <input
                  v-model.number="styleSettings.lineOpacity"
                  type="range"
                  min="0"
                  max="100"
                />
                <output>{{ styleSettings.lineOpacity }}%</output>
              </label>
              <label class="select-control">
                <span>Тип линии</span>
                <select
                  :value="styleSettings.lineType"
                  @change="styleSettings.lineType = ($event.target as HTMLSelectElement).value as LineStyleType"
                >
                  <option value="solid">Сплошная</option>
                  <option value="dashed">Штриховая</option>
                  <option value="dotted">Точки</option>
                </select>
              </label>
              <label class="range-control">
                <span>Размер точек</span>
                <input
                  v-model.number="styleSettings.lineSymbolSize"
                  type="range"
                  min="2"
                  :max="MAX_LINE_WIDTH_PX"
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
                  <input v-model="styleSettings.lineStacked" type="checkbox" />
                  <span aria-hidden="true" />
                  Сложение серий
                </label>
                <label class="switch-control">
                  <input v-model="styleSettings.showEndLabel" type="checkbox" />
                  <span aria-hidden="true" />
                  Значение в конце
                </label>
              </div>
              <label class="select-control">
                <span>Форма точек</span>
                <select
                  :value="styleSettings.lineSymbol"
                  :disabled="!styleSettings.showLineSymbols"
                  @change="styleSettings.lineSymbol = ($event.target as HTMLSelectElement).value as SymbolShape"
                >
                  <option value="circle">Круг</option>
                  <option value="rect">Квадрат</option>
                  <option value="roundRect">Скруглённый</option>
                  <option value="triangle">Треугольник</option>
                  <option value="diamond">Ромб</option>
                  <option value="pin">Метка</option>
                  <option value="arrow">Стрелка</option>
                </select>
              </label>
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
              <label class="range-control">
                <span>Конечный угол</span>
                <input
                  v-model.number="styleSettings.pieEndAngle"
                  type="range"
                  min="0"
                  max="360"
                />
                <output>{{ styleSettings.pieEndAngle }}°</output>
              </label>
              <label class="range-control">
                <span>Мин. сектор</span>
                <input
                  v-model.number="styleSettings.pieMinAngle"
                  type="range"
                  min="0"
                  max="90"
                />
                <output>{{ styleSettings.pieMinAngle }}°</output>
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
                <label class="switch-control">
                  <input
                    v-model="styleSettings.showPieLabelLines"
                    :disabled="!styleSettings.showPieLabels"
                    type="checkbox"
                  />
                  <span aria-hidden="true" />
                  Линии подписей
                </label>
                <label class="switch-control">
                  <input
                    v-model="styleSettings.pieSelectedMode"
                    type="checkbox"
                  />
                  <span aria-hidden="true" />
                  Выбор сектора
                </label>
              </div>
              <label class="select-control">
                <span>Положение подписей</span>
                <select
                  :value="styleSettings.pieLabelPosition"
                  :disabled="!styleSettings.showPieLabels"
                  @change="styleSettings.pieLabelPosition = ($event.target as HTMLSelectElement).value as PieLabelPosition"
                >
                  <option value="outside">Снаружи</option>
                  <option value="inside">Внутри</option>
                  <option value="center">В центре сектора</option>
                </select>
              </label>
              <label class="select-control">
                <span>Роза Найтингейл</span>
                <select v-model="styleSettings.pieRoseType">
                  <option value="none">Выключена</option>
                  <option value="radius">По радиусу</option>
                  <option value="area">По площади</option>
                </select>
              </label>
              <details class="advanced-settings">
                <summary>Граница и выбор</summary>
                <label class="range-control">
                  <span>Скругление</span>
                  <input
                    v-model.number="styleSettings.pieBorderRadius"
                    type="range"
                    min="0"
                    max="80"
                  />
                  <output>{{ styleSettings.pieBorderRadius }} px</output>
                </label>
                <label class="range-control">
                  <span>Толщина границы</span>
                  <input
                    v-model.number="styleSettings.pieBorderWidth"
                    type="range"
                    min="0"
                    max="20"
                  />
                  <output>{{ styleSettings.pieBorderWidth }} px</output>
                </label>
                <label class="range-control">
                  <span>Смещение выбора</span>
                  <input
                    v-model.number="styleSettings.pieSelectedOffset"
                    :disabled="!styleSettings.pieSelectedMode"
                    type="range"
                    min="0"
                    max="60"
                  />
                  <output>{{ styleSettings.pieSelectedOffset }} px</output>
                </label>
                <div class="color-controls compact-colors">
                  <label>
                    <span>Граница</span>
                    <HexColorInput
                      v-model="styleSettings.pieBorderColor"
                      label="Цвет границы сектора"
                    />
                  </label>
                </div>
              </details>
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
              <label class="select-control">
                <span>Форма точек</span>
                <select
                  :value="styleSettings.scatterSymbol"
                  @change="styleSettings.scatterSymbol = ($event.target as HTMLSelectElement).value as SymbolShape"
                >
                  <option value="circle">Круг</option>
                  <option value="rect">Квадрат</option>
                  <option value="roundRect">Скруглённый</option>
                  <option value="triangle">Треугольник</option>
                  <option value="diamond">Ромб</option>
                  <option value="pin">Метка</option>
                  <option value="arrow">Стрелка</option>
                </select>
              </label>
              <label class="range-control">
                <span>Поворот</span>
                <input
                  v-model.number="styleSettings.scatterSymbolRotate"
                  type="range"
                  min="0"
                  max="360"
                />
                <output>{{ styleSettings.scatterSymbolRotate }}°</output>
              </label>
              <label class="switch-control">
                <input
                  v-model="styleSettings.showScatterLabels"
                  type="checkbox"
                />
                <span aria-hidden="true" />
                Подписи точек
              </label>
              <details class="advanced-settings">
                <summary>Граница и тень</summary>
                <label class="range-control">
                  <span>Граница</span>
                  <input
                    v-model.number="styleSettings.scatterBorderWidth"
                    type="range"
                    min="0"
                    max="20"
                  />
                  <output>{{ styleSettings.scatterBorderWidth }} px</output>
                </label>
                <label class="range-control">
                  <span>Размытие тени</span>
                  <input
                    v-model.number="styleSettings.scatterShadowBlur"
                    type="range"
                    min="0"
                    max="60"
                  />
                  <output>{{ styleSettings.scatterShadowBlur }} px</output>
                </label>
                <label class="range-control">
                  <span>Смещение X</span>
                  <input
                    v-model.number="styleSettings.scatterShadowOffsetX"
                    type="range"
                    min="-30"
                    max="30"
                  />
                  <output>{{ styleSettings.scatterShadowOffsetX }} px</output>
                </label>
                <label class="range-control">
                  <span>Смещение Y</span>
                  <input
                    v-model.number="styleSettings.scatterShadowOffsetY"
                    type="range"
                    min="-30"
                    max="30"
                  />
                  <output>{{ styleSettings.scatterShadowOffsetY }} px</output>
                </label>
                <div class="color-controls compact-colors">
                  <label>
                    <span>Граница</span>
                    <HexColorInput
                      v-model="styleSettings.scatterBorderColor"
                      label="Цвет границы точки"
                    />
                  </label>
                </div>
              </details>
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
                  v-model.number="styleSettings.radarLineWidth"
                  type="range"
                  min="1"
                  max="20"
                />
                <output>{{ styleSettings.radarLineWidth }} px</output>
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
              <label class="select-control">
                <span>Форма точек</span>
                <select
                  :value="styleSettings.lineSymbol"
                  @change="styleSettings.lineSymbol = ($event.target as HTMLSelectElement).value as SymbolShape"
                >
                  <option value="circle">Круг</option>
                  <option value="rect">Квадрат</option>
                  <option value="roundRect">Скруглённый</option>
                  <option value="triangle">Треугольник</option>
                  <option value="diamond">Ромб</option>
                </select>
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
              <label class="range-control">
                <span>Радиус</span>
                <input
                  v-model.number="styleSettings.radarRadius"
                  type="range"
                  min="20"
                  max="90"
                />
                <output>{{ styleSettings.radarRadius }}%</output>
              </label>
              <label class="range-control">
                <span>Деления</span>
                <input
                  v-model.number="styleSettings.radarSplitNumber"
                  type="range"
                  min="1"
                  max="10"
                />
                <output>{{ styleSettings.radarSplitNumber }}</output>
              </label>
              <label class="select-control">
                <span>Форма сетки</span>
                <select
                  :value="styleSettings.radarShape"
                  @change="styleSettings.radarShape = ($event.target as HTMLSelectElement).value as RadarShape"
                >
                  <option value="polygon">Многоугольник</option>
                  <option value="circle">Круг</option>
                </select>
              </label>
              <label class="select-control">
                <span>Тип линии</span>
                <select
                  :value="styleSettings.radarLineType"
                  @change="styleSettings.radarLineType = ($event.target as HTMLSelectElement).value as LineStyleType"
                >
                  <option value="solid">Сплошная</option>
                  <option value="dashed">Штриховая</option>
                  <option value="dotted">Точки</option>
                </select>
              </label>
              <div class="switch-grid">
                <label class="switch-control">
                  <input v-model="styleSettings.showRadarNames" type="checkbox" />
                  <span aria-hidden="true" />
                  Названия индикаторов
                </label>
                <label class="switch-control">
                  <input
                    v-model="styleSettings.showRadarSplitArea"
                    type="checkbox"
                  />
                  <span aria-hidden="true" />
                  Чередование областей
                </label>
              </div>
              <label class="range-control">
                <span>Области сетки</span>
                <input
                  v-model.number="styleSettings.radarSplitAreaOpacity"
                  :disabled="!styleSettings.showRadarSplitArea"
                  type="range"
                  min="0"
                  max="40"
                />
                <output>{{ styleSettings.radarSplitAreaOpacity }}%</output>
              </label>
            </section>

            <section class="setting-group" aria-labelledby="text-title">
              <h3 id="text-title">Подписи осей и значений</h3>
              <div
                v-if="['line', 'bar', 'area', 'scatter'].includes(chartType)"
                class="switch-grid"
              >
                <label class="switch-control">
                  <input
                    v-model="styleSettings.showXAxisLabels"
                    type="checkbox"
                  />
                  <span aria-hidden="true" />
                  Горизонтальная ось
                </label>
                <label class="switch-control">
                  <input
                    v-model="styleSettings.showYAxisLabels"
                    type="checkbox"
                  />
                  <span aria-hidden="true" />
                  Вертикальная ось
                </label>
              </div>
              <label class="switch-control">
                <input
                  v-model="styleSettings.showValueLabels"
                  type="checkbox"
                />
                <span aria-hidden="true" />
                Значения на графике
              </label>
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
              <template
                v-if="['line', 'bar', 'area', 'scatter'].includes(chartType)"
              >
                <label class="range-control">
                  <span>Гориз. ось</span>
                  <input
                    v-model.number="styleSettings.xAxisLabelSize"
                    type="range"
                    min="8"
                    max="40"
                  />
                  <output>{{ styleSettings.xAxisLabelSize }} px</output>
                </label>
                <label class="range-control">
                  <span>Вертик. ось</span>
                  <input
                    v-model.number="styleSettings.yAxisLabelSize"
                    type="range"
                    min="8"
                    max="40"
                  />
                  <output>{{ styleSettings.yAxisLabelSize }} px</output>
                </label>
              </template>
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
              <label class="select-control">
                <span>Шрифт</span>
                <select v-model="styleSettings.fontFamily">
                  <option value="Inter, Arial, sans-serif">Inter</option>
                  <option value="Arial, sans-serif">Arial</option>
                  <option value="Georgia, serif">Georgia</option>
                  <option value="'SFMono-Regular', Consolas, monospace">
                    Моноширинный
                  </option>
                </select>
              </label>
              <label class="select-control">
                <span>Формат значений</span>
                <select
                  :value="styleSettings.valueFormat"
                  @change="styleSettings.valueFormat = ($event.target as HTMLSelectElement).value as ValueFormat"
                >
                  <option value="number">Число</option>
                  <option value="percent">Проценты</option>
                  <option value="compact">Сокращённый</option>
                </select>
              </label>
              <label class="range-control">
                <span>Знаков после запятой</span>
                <input
                  v-model.number="styleSettings.valueDecimals"
                  type="range"
                  min="0"
                  max="4"
                />
                <output>{{ styleSettings.valueDecimals }}</output>
              </label>
              <details
                v-if="['line', 'bar', 'area', 'scatter'].includes(chartType)"
                class="advanced-settings"
              >
                <summary>Поворот и отступы</summary>
                <label class="range-control">
                  <span>Поворот X</span>
                  <input
                    v-model.number="styleSettings.xAxisLabelRotate"
                    type="range"
                    min="-90"
                    max="90"
                  />
                  <output>{{ styleSettings.xAxisLabelRotate }}°</output>
                </label>
                <label class="range-control">
                  <span>Поворот Y</span>
                  <input
                    v-model.number="styleSettings.yAxisLabelRotate"
                    type="range"
                    min="-90"
                    max="90"
                  />
                  <output>{{ styleSettings.yAxisLabelRotate }}°</output>
                </label>
                <label class="range-control">
                  <span>Отступ X</span>
                  <input
                    v-model.number="styleSettings.xAxisLabelMargin"
                    type="range"
                    min="0"
                    max="60"
                  />
                  <output>{{ styleSettings.xAxisLabelMargin }} px</output>
                </label>
                <label class="range-control">
                  <span>Отступ Y</span>
                  <input
                    v-model.number="styleSettings.yAxisLabelMargin"
                    type="range"
                    min="0"
                    max="60"
                  />
                  <output>{{ styleSettings.yAxisLabelMargin }} px</output>
                </label>
              </details>
            </section>

            <section class="setting-group" aria-labelledby="legend-title">
              <h3 id="legend-title">Легенда и подсказки</h3>
              <div class="switch-grid">
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
              <label class="select-control">
                <span>Положение легенды</span>
                <select
                  :value="styleSettings.legendPosition"
                  :disabled="!styleSettings.showLegend"
                  @change="styleSettings.legendPosition = ($event.target as HTMLSelectElement).value as LegendPosition"
                >
                  <option value="bottom">Снизу</option>
                  <option value="top">Сверху</option>
                  <option value="right">Справа</option>
                  <option value="left">Слева</option>
                </select>
              </label>
              <label class="range-control">
                <span>Размер текста</span>
                <input
                  v-model.number="styleSettings.legendFontSize"
                  :disabled="!styleSettings.showLegend"
                  type="range"
                  min="8"
                  max="30"
                />
                <output>{{ styleSettings.legendFontSize }} px</output>
              </label>
              <label class="range-control">
                <span>Размер маркера</span>
                <input
                  v-model.number="styleSettings.legendItemSize"
                  :disabled="!styleSettings.showLegend"
                  type="range"
                  min="6"
                  max="30"
                />
                <output>{{ styleSettings.legendItemSize }} px</output>
              </label>
              <label class="range-control">
                <span>Зазор элементов</span>
                <input
                  v-model.number="styleSettings.legendGap"
                  :disabled="!styleSettings.showLegend"
                  type="range"
                  min="0"
                  max="60"
                />
                <output>{{ styleSettings.legendGap }} px</output>
              </label>
              <details class="advanced-settings">
                <summary>Оформление tooltip</summary>
                <div class="color-controls compact-colors">
                  <label>
                    <span>Фон</span>
                    <HexColorInput
                      v-model="styleSettings.tooltipBackgroundColor"
                      :disabled="!styleSettings.showTooltip"
                      label="Цвет фона tooltip"
                    />
                  </label>
                  <label>
                    <span>Граница</span>
                    <HexColorInput
                      v-model="styleSettings.tooltipBorderColor"
                      :disabled="!styleSettings.showTooltip"
                      label="Цвет границы tooltip"
                    />
                  </label>
                </div>
                <label class="range-control">
                  <span>Размер текста</span>
                  <input
                    v-model.number="styleSettings.tooltipFontSize"
                    :disabled="!styleSettings.showTooltip"
                    type="range"
                    min="8"
                    max="30"
                  />
                  <output>{{ styleSettings.tooltipFontSize }} px</output>
                </label>
              </details>
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
                <label class="switch-control">
                  <input v-model="styleSettings.boundaryGap" type="checkbox" />
                  <span aria-hidden="true" />
                  Отступ от края
                </label>
              </div>
              <details class="advanced-settings">
                <summary>Диапазон и оформление</summary>
                <div class="number-grid">
                  <label>
                    <span>Минимум Y</span>
                    <input
                      :value="styleSettings.yAxisMin ?? ''"
                      type="number"
                      placeholder="Авто"
                      @input="updateNullableStyleNumber($event, 'yAxisMin')"
                    />
                  </label>
                  <label>
                    <span>Максимум Y</span>
                    <input
                      :value="styleSettings.yAxisMax ?? ''"
                      type="number"
                      placeholder="Авто"
                      @input="updateNullableStyleNumber($event, 'yAxisMax')"
                    />
                  </label>
                  <label>
                    <span>Интервал Y</span>
                    <input
                      :value="styleSettings.yAxisInterval ?? ''"
                      type="number"
                      min="0"
                      placeholder="Авто"
                      @input="updateNullableStyleNumber($event, 'yAxisInterval')"
                    />
                  </label>
                </div>
                <label class="range-control">
                  <span>Толщина сетки</span>
                  <input
                    v-model.number="styleSettings.gridLineWidth"
                    type="range"
                    min="1"
                    max="8"
                  />
                  <output>{{ styleSettings.gridLineWidth }} px</output>
                </label>
                <label class="range-control">
                  <span>Прозрачность</span>
                  <input
                    v-model.number="styleSettings.axisOpacity"
                    :disabled="!styleSettings.showGridLines && !styleSettings.showAxisLines && !styleSettings.showAxisTicks"
                    type="range"
                    min="0"
                    max="100"
                  />
                  <output>{{ styleSettings.axisOpacity }}%</output>
                </label>
                <label class="select-control">
                  <span>Тип линий сетки</span>
                  <select
                    :value="styleSettings.gridLineType"
                    @change="styleSettings.gridLineType = ($event.target as HTMLSelectElement).value as LineStyleType"
                  >
                    <option value="solid">Сплошные</option>
                    <option value="dashed">Штриховые</option>
                    <option value="dotted">Точки</option>
                  </select>
                </label>
                <div class="color-controls compact-colors">
                  <label>
                    <span>Сетка</span>
                    <HexColorInput
                      v-model="styleSettings.gridLineColor"
                      label="Цвет линий сетки"
                    />
                  </label>
                  <label>
                    <span>Оси</span>
                    <HexColorInput
                      v-model="styleSettings.axisLineColor"
                      label="Цвет линий осей"
                    />
                  </label>
                </div>
              </details>
            </section>

            <section class="setting-group" aria-labelledby="colors-title">
              <h3 id="colors-title">Цвета</h3>
              <div class="palette-presets" aria-label="Готовые палитры">
                <button
                  v-for="preset in PALETTE_PRESETS"
                  :key="preset.id"
                  type="button"
                  :class="{ active: selectedPaletteId === preset.id }"
                  :aria-pressed="selectedPaletteId === preset.id"
                  @click="applyPalette(preset.id)"
                >
                  <span class="palette-preview" aria-hidden="true">
                    <i
                      v-for="color in palettePresetPreview(preset.id, preset.colors)"
                      :key="color"
                      :style="{ background: color }"
                    />
                  </span>
                  {{ preset.name }}
                </button>
              </div>
              <div class="color-controls">
                <label v-if="selectedPaletteId === 'mono'">
                  <span>Основной цвет</span>
                  <HexColorInput
                    :model-value="monoBaseColor"
                    label="Основной цвет одноцветной палитры"
                    @update:model-value="updateMonoBaseColor"
                  />
                </label>
                <label>
                  <span>Фон</span>
                  <HexColorInput
                    v-model="styleSettings.backgroundColor"
                    label="Цвет фона графика"
                  />
                </label>
                <label>
                  <span>Текст</span>
                  <HexColorInput
                    v-model="styleSettings.textColor"
                    label="Основной цвет текста"
                  />
                </label>
                <label>
                  <span>Вторичный</span>
                  <HexColorInput
                    v-model="styleSettings.mutedTextColor"
                    label="Вторичный цвет текста"
                  />
                </label>
              </div>
              <div class="palette-editor">
                <div
                  v-for="(_, colorIndex) in styleSettings.palette"
                  :key="colorIndex"
                  class="palette-row"
                >
                  <span>{{ colorIndex + 1 }}</span>
                  <HexColorInput
                    v-model="styleSettings.palette[colorIndex]"
                    :label="`Цвет палитры ${colorIndex + 1}`"
                    @update:model-value="markPaletteCustom"
                  />
                  <input
                    v-model.number="styleSettings.paletteOpacities[colorIndex]"
                    type="range"
                    min="0"
                    max="100"
                    :aria-label="`Непрозрачность цвета ${colorIndex + 1}`"
                    @input="markPaletteCustom"
                  />
                  <output>{{ styleSettings.paletteOpacities[colorIndex] }}%</output>
                  <div class="palette-row-actions">
                    <button
                      type="button"
                      :disabled="colorIndex === 0"
                      :aria-label="`Поднять цвет ${colorIndex + 1}`"
                      @click="movePaletteColor(colorIndex, -1)"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      :disabled="colorIndex === styleSettings.palette.length - 1"
                      :aria-label="`Опустить цвет ${colorIndex + 1}`"
                      @click="movePaletteColor(colorIndex, 1)"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      :disabled="styleSettings.palette.length <= 1"
                      :aria-label="`Удалить цвет ${colorIndex + 1}`"
                      @click="removePaletteColor(colorIndex)"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
              <button
                class="add-palette-color"
                type="button"
                :disabled="styleSettings.palette.length >= 12"
                @click="addPaletteColor"
              >
                + Добавить цвет
              </button>
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
              <label class="range-control">
                <span>Обновление</span>
                <input
                  v-model.number="styleSettings.animationUpdateDuration"
                  type="range"
                  min="0"
                  max="3000"
                  step="100"
                />
                <output>{{ styleSettings.animationUpdateDuration }} ms</output>
              </label>
              <label class="select-control">
                <span>Характер движения</span>
                <select
                  :value="styleSettings.animationEasing"
                  @change="styleSettings.animationEasing = ($event.target as HTMLSelectElement).value as AnimationEasing"
                >
                  <option value="linear">Линейный</option>
                  <option value="cubicIn">Разгон</option>
                  <option value="cubicOut">Торможение</option>
                  <option value="cubicInOut">Разгон и торможение</option>
                  <option value="quarticOut">Мягкое торможение</option>
                  <option value="elasticOut">Пружина</option>
                </select>
              </label>
              <label class="range-control">
                <span>Внутренний отступ</span>
                <input
                  v-model.number="styleSettings.chartPadding"
                  type="range"
                  min="8"
                  max="80"
                />
                <output>{{ styleSettings.chartPadding }} px</output>
              </label>
            </section>

            <section class="setting-group" aria-labelledby="states-title">
              <h3 id="states-title">Состояния</h3>
              <label class="select-control">
                <span>Фокус при наведении</span>
                <select
                  :value="styleSettings.emphasisFocus"
                  @change="styleSettings.emphasisFocus = ($event.target as HTMLSelectElement).value as EmphasisFocus"
                >
                  <option value="series">Серия</option>
                  <option value="self">Элемент</option>
                  <option value="none">Без фокуса</option>
                </select>
              </label>
              <label class="switch-control">
                <input v-model="styleSettings.emphasisScale" type="checkbox" />
                <span aria-hidden="true" />
                Увеличивать при наведении
              </label>
              <label class="range-control">
                <span>Прозрачность blur</span>
                <input
                  v-model.number="styleSettings.blurOpacity"
                  type="range"
                  min="0"
                  max="100"
                />
                <output>{{ styleSettings.blurOpacity }}%</output>
              </label>
              <label class="range-control">
                <span>Граница select</span>
                <input
                  v-model.number="styleSettings.selectBorderWidth"
                  type="range"
                  min="0"
                  max="20"
                />
                <output>{{ styleSettings.selectBorderWidth }} px</output>
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
                  @focus="beginCssEditing"
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

        <NewDesignPanel
          v-else
          :settings="styleSettings"
          :chart-type="chartType"
          :chart-title="chartTitle"
          :selected-palette-id="selectedPaletteId"
          :mono-base-color="monoBaseColor"
          :series="dataSeries"
          :data-row-count="categories.length"
          :pie-warnings="pieWarnings"
          :pie-maximum-radius-px="newUiPieMaximumRadius"
          :bar-gap-maximum="barGapMaximum"
          @update:chart-title="chartTitle = $event"
          @select-chart-type="selectNewUiChartType"
          @select-columns-bar="selectColumnBar"
          @select-horizontal-bar="selectHorizontalBar"
          @apply-palette="applyNewPalette"
          @update:mono-base-color="updateMonoBaseColor"
          @mark-palette-custom="markPaletteCustom"
          @add-palette-color="addPaletteColor"
          @randomize="randomizeChartStyle"
          @clear="resetNewDesign"
          @close="uiDesignMode = 'classic'"
        />
      </div>

      <section class="chart-column" aria-labelledby="chart-title">
        <div class="panel chart-panel">
          <div class="chart-controls">
            <h2 id="chart-title">Живой график</h2>

            <div class="display-controls">
              <label class="renderer-control">
                Стиль
                <select
                  v-model="styleMode"
                  :disabled="uiDesignMode === 'new'"
                  :title="uiDesignMode === 'new' ? 'Новый интерфейс использует постерный режим' : undefined"
                >
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
            <HexColorInput
              v-model="customBackground"
              class="standard-background-hex"
              label="Свой цвет фона"
              @update:model-value="selectedBackgroundId = 'custom'"
            />
          </fieldset>

          <div
            class="chart-stage"
            :class="{ 'chart-poster': styleMode === 'poster' }"
            :style="chartStageStyle"
          >
            <VChart
              :key="`${chartType}-${renderer}-${chartTheme}-${styleMode}`"
              class="chart"
              :option="option"
              :init-options="{ renderer }"
              :update-options="{ notMerge: true }"
              :theme="chartTheme === 'dark' ? 'dark' : undefined"
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
