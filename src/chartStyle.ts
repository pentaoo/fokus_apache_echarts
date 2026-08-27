/**
 * Чистый слой стилизации Apache ECharts.
 *
 * Функция не зависит от Vue, не мутирует исходный option и использует только
 * стандартные свойства Apache ECharts 6.
 */
import { format as echartsFormat } from 'echarts/core'

export type EChartsOption = Record<string, any>
export type BarArrangement = 'grouped' | 'stacked' | 'horizontal'
export type BarOrder = 'normal' | 'reverse' | 'value'
export type LabelAlignment = 'left' | 'center' | 'right'
export type BarValuePosition = 'inside' | 'top'
export type BarCategoryPosition = 'axis' | 'inside'
export type LineStep = 'none' | 'start' | 'middle' | 'end'
export type LineShape = 'straight' | 'smooth' | 'step'
export type LineStyleType = 'solid' | 'dashed' | 'dotted' | 'dashDotted'
export type PieRoseType = 'none' | 'radius' | 'area'
export type PieLabelPosition = 'outside' | 'inside' | 'center'
export type LegendPosition = 'top' | 'bottom' | 'left' | 'right'
export type ValueFormat = 'number' | 'percent' | 'compact'
export type SymbolShape =
  | 'circle'
  | 'rect'
  | 'roundRect'
  | 'triangle'
  | 'diamond'
  | 'pin'
  | 'arrow'
export type RadarShape = 'polygon' | 'circle'
export type EmphasisFocus = 'none' | 'self' | 'series'
export type AnimationEasing =
  | 'linear'
  | 'cubicIn'
  | 'cubicOut'
  | 'cubicInOut'
  | 'quarticOut'
  | 'elasticOut'

export interface ChartStyleConfig {
  backgroundColor?: string
  textColor?: string
  mutedTextColor?: string
  palette?: string[]
  paletteOpacities?: number[]
  fontFamily?: string
  fontWeight?: number
  chartPadding?: number

  showTitle?: boolean
  showLegend?: boolean
  legendPosition?: LegendPosition
  legendFontSize?: number
  legendItemSize?: number
  legendGap?: number

  showTooltip?: boolean
  tooltipBackgroundColor?: string
  tooltipBorderColor?: string
  tooltipFontSize?: number

  animationDuration?: number
  animationUpdateDuration?: number
  animationEasing?: AnimationEasing
  presentationMode?: boolean

  showXAxisLabels?: boolean
  showYAxisLabels?: boolean
  showValueLabels?: boolean
  labelAlignment?: LabelAlignment
  xAxisLabelSize?: number
  yAxisLabelSize?: number
  valueLabelSize?: number
  axisLabelWeight?: number
  valueLabelWeight?: number
  categoryLabelColor?: string
  valueAxisLabelColor?: string
  pieLabelColor?: string
  pieLabelSize?: number
  xAxisLabelRotate?: number
  yAxisLabelRotate?: number
  xAxisLabelMargin?: number
  yAxisLabelMargin?: number
  valueFormat?: ValueFormat
  valueDecimals?: number

  showGridLines?: boolean
  showAxisLines?: boolean
  showAxisTicks?: boolean
  gridLineColor?: string
  gridLineWidth?: number
  gridLineType?: LineStyleType
  axisLineColor?: string
  boundaryGap?: boolean
  yAxisMin?: number | null
  yAxisMax?: number | null
  yAxisInterval?: number | null

  barArrangement?: BarArrangement
  barHorizontal?: boolean
  barOrder?: BarOrder
  barGapPercent?: number
  barSeriesGapPercent?: number
  barRadius?: number
  barRoundPeaks?: boolean
  barWidth?: number
  barMaxWidth?: number
  barMinHeight?: number
  barOpacity?: number
  barBorderWidth?: number
  barBorderColor?: string
  barValuePosition?: BarValuePosition
  barCategoryPosition?: BarCategoryPosition
  colorBarsByData?: boolean
  commonBarColor?: boolean
  gradientBars?: boolean
  showBarBackground?: boolean
  barBackgroundColor?: string

  lineWidth?: number
  lineOpacity?: number
  lineType?: LineStyleType
  showLines?: boolean
  lineShape?: LineShape
  smoothLines?: boolean
  showLineSymbols?: boolean
  lineSymbolSize?: number
  lineSymbol?: SymbolShape
  lineStep?: LineStep
  areaOpacity?: number
  showLineArea?: boolean
  lineStacked?: boolean
  showEndLabel?: boolean

  pieInnerRadius?: number
  pieOuterRadius?: number
  piePadAngle?: number
  pieStartAngle?: number
  pieEndAngle?: number
  pieClockwise?: boolean
  pieRoseType?: PieRoseType
  showPiePercentages?: boolean
  showPieLabels?: boolean
  showPieLabelLines?: boolean
  pieLabelPosition?: PieLabelPosition
  pieMinAngle?: number
  pieBorderRadius?: number
  pieBorderWidth?: number
  pieBorderColor?: string
  pieSelectedMode?: boolean
  pieSelectedOffset?: number

  scatterSymbolSize?: number
  scatterSymbol?: SymbolShape
  scatterSymbolRotate?: number
  scatterOpacity?: number
  scatterBorderWidth?: number
  scatterBorderColor?: string
  scatterShadowBlur?: number
  scatterShadowOffsetX?: number
  scatterShadowOffsetY?: number
  showScatterLabels?: boolean

  radarAreaOpacity?: number
  radarShape?: RadarShape
  radarRadius?: number
  radarSplitNumber?: number
  showRadarNames?: boolean
  showRadarSplitArea?: boolean
  radarSplitAreaOpacity?: number
  radarLineWidth?: number
  radarLineType?: LineStyleType

  emphasisFocus?: EmphasisFocus
  emphasisScale?: boolean
  blurOpacity?: number
  selectBorderWidth?: number
}

export type ResolvedChartStyle = Required<ChartStyleConfig>

export const MIN_LINE_WIDTH_PX = 1
export const MAX_LINE_WIDTH_PX = 120
export const MIN_PIE_RING_THICKNESS_PX = 32
export const MAX_PIE_RING_THICKNESS_PERCENT = 99

export function getPieThicknessPercent(
  innerRadius: number,
  outerRadius: number,
) {
  if (!Number.isFinite(outerRadius) || outerRadius <= 0) return 100
  const safeInnerRadius = Math.min(
    outerRadius,
    Math.max(0, Number.isFinite(innerRadius) ? innerRadius : 0),
  )
  return ((outerRadius - safeInnerRadius) / outerRadius) * 100
}

export function getPieInnerRadius(
  outerRadius: number,
  thicknessPercent: number,
) {
  const safeOuterRadius = Math.max(0, outerRadius)
  const safeThickness = Math.min(100, Math.max(0, thicknessPercent))
  return safeOuterRadius * (1 - safeThickness / 100)
}

export function getMinimumPieThicknessPercent(
  outerRadiusPx: number,
  minimumThicknessPx = MIN_PIE_RING_THICKNESS_PX,
) {
  if (!Number.isFinite(outerRadiusPx) || outerRadiusPx <= 0) return 100
  return Math.min(100, Math.ceil((minimumThicknessPx / outerRadiusPx) * 100))
}

export const DEFAULT_PALETTE = [
  '#4D0AE2',
  '#6E32E8',
  '#8E5BEB',
  '#B00AE2',
  '#E20AB3',
  '#E20A6B',
  '#E20A0E',
  '#FF7A00',
  '#FFC252',
]

export const DEFAULT_CHART_STYLE: ResolvedChartStyle = {
  backgroundColor: '#050505',
  textColor: '#FFFFFF',
  mutedTextColor: '#B8B8C2',
  palette: DEFAULT_PALETTE,
  paletteOpacities: DEFAULT_PALETTE.map(() => 100),
  fontFamily: '"ALS Hauss", Arial, Helvetica, sans-serif',
  fontWeight: 700,
  chartPadding: 28,

  showTitle: true,
  showLegend: true,
  legendPosition: 'bottom',
  legendFontSize: 13,
  legendItemSize: 12,
  legendGap: 16,

  showTooltip: true,
  tooltipBackgroundColor: '#18181D',
  tooltipBorderColor: '#3E3E46',
  tooltipFontSize: 13,

  animationDuration: 700,
  animationUpdateDuration: 400,
  animationEasing: 'cubicOut',
  presentationMode: false,

  showXAxisLabels: true,
  showYAxisLabels: true,
  showValueLabels: false,
  labelAlignment: 'center',
  xAxisLabelSize: 14,
  yAxisLabelSize: 12,
  valueLabelSize: 22,
  axisLabelWeight: 500,
  valueLabelWeight: 700,
  categoryLabelColor: '#FFFFFF',
  valueAxisLabelColor: '#B8B8C2',
  pieLabelColor: '#FFFFFF',
  pieLabelSize: 14,
  xAxisLabelRotate: 0,
  yAxisLabelRotate: 0,
  xAxisLabelMargin: 18,
  yAxisLabelMargin: 12,
  valueFormat: 'number',
  valueDecimals: 0,

  showGridLines: false,
  showAxisLines: false,
  showAxisTicks: false,
  gridLineColor: '#2A2A31',
  gridLineWidth: 1,
  gridLineType: 'solid',
  axisLineColor: '#3B3B44',
  boundaryGap: true,
  yAxisMin: null,
  yAxisMax: null,
  yAxisInterval: null,

  barArrangement: 'grouped',
  barHorizontal: false,
  barOrder: 'normal',
  barGapPercent: 21,
  barSeriesGapPercent: 30,
  barRadius: 100,
  barRoundPeaks: true,
  barWidth: 0,
  barMaxWidth: 120,
  barMinHeight: 0,
  barOpacity: 100,
  barBorderWidth: 0,
  barBorderColor: '#050505',
  barValuePosition: 'top',
  barCategoryPosition: 'axis',
  colorBarsByData: true,
  commonBarColor: false,
  gradientBars: false,
  showBarBackground: false,
  barBackgroundColor: '#202027',

  lineWidth: 6,
  lineOpacity: 100,
  lineType: 'solid',
  showLines: true,
  lineShape: 'smooth',
  smoothLines: true,
  showLineSymbols: false,
  lineSymbolSize: 10,
  lineSymbol: 'circle',
  lineStep: 'none',
  areaOpacity: 24,
  showLineArea: false,
  lineStacked: false,
  showEndLabel: false,

  pieInnerRadius: 0,
  pieOuterRadius: 66,
  piePadAngle: 2,
  pieStartAngle: 90,
  pieEndAngle: 360,
  pieClockwise: true,
  pieRoseType: 'none',
  showPiePercentages: false,
  showPieLabels: true,
  showPieLabelLines: true,
  pieLabelPosition: 'outside',
  pieMinAngle: 2,
  pieBorderRadius: 8,
  pieBorderWidth: 3,
  pieBorderColor: '#050505',
  pieSelectedMode: false,
  pieSelectedOffset: 10,

  scatterSymbolSize: 18,
  scatterSymbol: 'circle',
  scatterSymbolRotate: 0,
  scatterOpacity: 90,
  scatterBorderWidth: 0,
  scatterBorderColor: '#FFFFFF',
  scatterShadowBlur: 18,
  scatterShadowOffsetX: 0,
  scatterShadowOffsetY: 4,
  showScatterLabels: false,

  radarAreaOpacity: 20,
  radarShape: 'polygon',
  radarRadius: 62,
  radarSplitNumber: 4,
  showRadarNames: true,
  showRadarSplitArea: true,
  radarSplitAreaOpacity: 4,
  radarLineWidth: 3,
  radarLineType: 'solid',

  emphasisFocus: 'series',
  emphasisScale: true,
  blurOpacity: 20,
  selectBorderWidth: 3,
}

export function createDefaultChartStyle(): ResolvedChartStyle {
  return {
    ...DEFAULT_CHART_STYLE,
    palette: [...DEFAULT_CHART_STYLE.palette],
    paletteOpacities: [...DEFAULT_CHART_STYLE.paletteOpacities],
  }
}

function asArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return []
  return Array.isArray(value) ? value : [value]
}

function restoreShape<T>(source: T | T[] | undefined, values: T[]) {
  if (source === undefined) return undefined
  return Array.isArray(source) ? values : values[0]
}

function hexToRgba(hex: string, opacity: number) {
  const normalized = hex.trim().replace('#', '')
  const expanded =
    normalized.length === 3
      ? normalized
          .split('')
          .map((character) => character.repeat(2))
          .join('')
      : normalized

  if (!/^[\da-f]{6}$/i.test(expanded)) return hex

  const value = Number.parseInt(expanded, 16)
  const red = (value >> 16) & 255
  const green = (value >> 8) & 255
  const blue = value & 255
  return `rgba(${red}, ${green}, ${blue}, ${opacity / 100})`
}

function darkenHexColor(hex: string, percentage: number) {
  const normalized = hex.trim().replace('#', '')
  const expanded =
    normalized.length === 3
      ? normalized
          .split('')
          .map((character) => character.repeat(2))
          .join('')
      : normalized

  if (!/^[\da-f]{6}$/i.test(expanded)) return hex

  const factor = 1 - Math.min(90, Math.max(0, percentage)) / 100
  const value = Number.parseInt(expanded, 16)
  const channels = [
    (value >> 16) & 255,
    (value >> 8) & 255,
    value & 255,
  ]

  return `#${channels
    .map((channel) => Math.round(channel * factor).toString(16).padStart(2, '0'))
    .join('')}`
}

function seriesDarkening(seriesIndex: number, seriesCount: number) {
  return seriesCount > 1 ? Math.min(seriesIndex * 10, 90) : 0
}

function makeGradient(color: string, opacity: number, horizontal: boolean) {
  const transparent = hexToRgba(color, Math.max(8, opacity * 0.28))
  const solid = hexToRgba(color, opacity)

  return {
    type: 'linear',
    x: 0,
    y: horizontal ? 0 : 1,
    x2: horizontal ? 1 : 0,
    y2: 0,
    colorStops: [
      { offset: 0, color: transparent },
      { offset: 1, color: solid },
    ],
  }
}

function getPaletteColor(
  config: ResolvedChartStyle,
  index: number,
  darkenBy = 0,
) {
  const palette = config.palette.length > 0 ? config.palette : DEFAULT_PALETTE
  const paletteIndex = index % palette.length
  const opacity =
    config.paletteOpacities[paletteIndex] ??
    config.paletteOpacities[0] ??
    100
  return hexToRgba(darkenHexColor(palette[paletteIndex], darkenBy), opacity)
}

function formatNumber(value: unknown, config: ResolvedChartStyle) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return String(value ?? '')

  if (config.valueFormat === 'compact') {
    return new Intl.NumberFormat('ru-RU', {
      notation: 'compact',
      maximumFractionDigits: config.valueDecimals,
    }).format(numeric)
  }

  const formatted = new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: config.valueDecimals,
    maximumFractionDigits: config.valueDecimals,
  }).format(numeric)

  return config.valueFormat === 'percent' ? `${formatted}%` : formatted
}

type FormatterWithSource = {
  __echartsOptionSource?: string
}

function attachFormatterSource<T extends CallableFunction>(
  formatter: T,
  source: string,
) {
  Object.defineProperty(formatter, '__echartsOptionSource', {
    configurable: false,
    enumerable: false,
    value: source,
    writable: false,
  })
  return formatter as T & FormatterWithSource
}

function numberFormattingSource(
  valueExpression: string,
  config: ResolvedChartStyle,
) {
  const format = JSON.stringify(config.valueFormat)
  const decimals = config.valueDecimals
  return `
  const rawValue = ${valueExpression};
  const numeric = Number(rawValue);
  if (!Number.isFinite(numeric)) return String(rawValue ?? "");
  if (${format} === "compact") {
    return new Intl.NumberFormat("ru-RU", {
      notation: "compact",
      maximumFractionDigits: ${decimals}
    }).format(numeric);
  }
  const formatted = new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: ${decimals},
    maximumFractionDigits: ${decimals}
  }).format(numeric);
  return ${format} === "percent" ? formatted + "%" : formatted;`
}

function valueFormatter(config: ResolvedChartStyle) {
  const formatter = (params: { value?: unknown }) => {
    const rawValue = Array.isArray(params.value)
      ? params.value[params.value.length - 1]
      : params.value
    return formatNumber(rawValue, config)
  }
  return attachFormatterSource(
    formatter,
    `(params) => {${numberFormattingSource(
      'Array.isArray(params.value) ? params.value[params.value.length - 1] : params.value',
      config,
    )}
}`,
  )
}

function axisFormatter(config: ResolvedChartStyle) {
  const formatter = (value: unknown) => formatNumber(value, config)
  return attachFormatterSource(
    formatter,
    `(value) => {${numberFormattingSource('value', config)}
}`,
  )
}

function pieFormatter(config: ResolvedChartStyle) {
  const formatter = (params: { name?: string; value?: unknown }) =>
    `${params.name ?? ''}\n${formatNumber(params.value, config)}`
  return attachFormatterSource(
    formatter,
    `(params) => {
  const name = params.name ?? "";
  const formattedValue = ((inputValue) => {${numberFormattingSource(
    'inputValue',
    config,
  )}
  })(params.value);
  return String(name) + "\\n" + formattedValue;
}`,
  )
}

function piePercentageFormatter() {
  const formatter = (params: { percent?: unknown }) => {
    const percentage = Number(params.percent)
    return Number.isFinite(percentage) ? String(Math.round(percentage)) : ''
  }

  return attachFormatterSource(
    formatter,
    `(params) => {
  const percentage = Number(params.percent);
  return Number.isFinite(percentage) ? String(Math.round(percentage)) : "";
}`,
  )
}

function styleAxis(
  axis: EChartsOption,
  config: ResolvedChartStyle,
  dimension: 'x' | 'y',
) {
  const isCategory = axis.type === 'category' || Array.isArray(axis.data)
  const categoryInside = isCategory && config.barCategoryPosition === 'inside'
  const showLabels =
    dimension === 'x' ? config.showXAxisLabels : config.showYAxisLabels
  const labelSize =
    dimension === 'x' ? config.xAxisLabelSize : config.yAxisLabelSize
  const labelRotate =
    dimension === 'x' ? config.xAxisLabelRotate : config.yAxisLabelRotate
  const labelMargin =
    dimension === 'x' ? config.xAxisLabelMargin : config.yAxisLabelMargin
  const horizontalCategoryAlign =
    config.labelAlignment === 'left'
      ? 'right'
      : config.labelAlignment === 'right'
        ? 'left'
        : 'center'
  const valueRange =
    dimension === 'y' && !isCategory
      ? {
          ...(config.yAxisMin !== null ? { min: config.yAxisMin } : {}),
          ...(config.yAxisMax !== null ? { max: config.yAxisMax } : {}),
          ...(config.yAxisInterval !== null
            ? { interval: config.yAxisInterval }
            : {}),
        }
      : {}

  return {
    ...axis,
    ...(categoryInside ? { z: Math.max(10, axis.z ?? 0) } : {}),
    ...valueRange,
    ...(isCategory
      ? {
          boundaryGap: config.boundaryGap,
          inverse:
            config.barHorizontal || config.barArrangement === 'horizontal',
        }
      : {}),
    axisLine: {
      ...axis.axisLine,
      show: config.showAxisLines,
      lineStyle: {
        ...axis.axisLine?.lineStyle,
        color: config.axisLineColor,
      },
    },
    axisTick: {
      ...axis.axisTick,
      show: config.showAxisTicks,
    },
    axisLabel: {
      ...axis.axisLabel,
      show: showLabels,
      inside: categoryInside,
      align: categoryInside
        ? 'left'
        : isCategory
          ? dimension === 'x'
            ? horizontalCategoryAlign
            : config.labelAlignment
          : dimension === 'x'
            ? 'center'
            : 'right',
      verticalAlign: categoryInside ? 'middle' : axis.axisLabel?.verticalAlign,
      padding: categoryInside ? [0, 0, 0, 8] : axis.axisLabel?.padding,
      color: isCategory
        ? config.categoryLabelColor
        : config.valueAxisLabelColor,
      fontFamily: config.fontFamily,
      fontSize: labelSize,
      fontWeight: config.axisLabelWeight,
      margin: labelMargin,
      rotate: labelRotate,
      interval: 0,
      ...(axis.axisLabel?.formatter === undefined && !isCategory
        ? { formatter: axisFormatter(config) }
        : {}),
    },
    splitLine: {
      ...axis.splitLine,
      show: config.showGridLines,
      lineStyle: {
        ...axis.splitLine?.lineStyle,
        color: config.gridLineColor,
        width: config.gridLineWidth,
        type: config.gridLineType,
      },
    },
  }
}

function seriesStates(
  series: EChartsOption,
  color: string,
  config: ResolvedChartStyle,
) {
  if (config.presentationMode) {
    return {
      silent: true,
      emphasis: {
        ...series.emphasis,
        disabled: true,
        focus: 'none',
        scale: false,
      },
      blur: {
        ...series.blur,
        disabled: true,
      },
      select: {
        ...series.select,
        disabled: true,
      },
    }
  }

  return {
    emphasis: {
      ...series.emphasis,
      focus: config.emphasisFocus,
      scale: config.emphasisScale,
    },
    blur: {
      ...series.blur,
      itemStyle: {
        ...series.blur?.itemStyle,
        opacity: config.blurOpacity / 100,
      },
      lineStyle: {
        ...series.blur?.lineStyle,
        opacity: config.blurOpacity / 100,
      },
    },
    select: {
      ...series.select,
      itemStyle: {
        ...series.select?.itemStyle,
        borderColor: color,
        borderWidth: config.selectBorderWidth,
      },
    },
  }
}

function lineDashType(type: LineStyleType) {
  return type === 'dashDotted' ? [12, 6, 2, 6] : type
}

function minimumBarWidthForValues(
  series: EChartsOption,
  config: ResolvedChartStyle,
) {
  if (!config.showValueLabels || !Array.isArray(series.data)) return 0

  const font = `${config.valueLabelWeight} ${config.valueLabelSize}px ${config.fontFamily}`
  const widestValue = series.data.reduce((maximum: number, item: unknown) => {
    const value = barDatumNumber(item)
    if (value === null) return maximum
    const text = formatNumber(value, config)
    return Math.max(maximum, echartsFormat.getTextRect(text, font).width)
  }, 0)

  return widestValue > 0 ? Math.ceil(widestValue) + 8 : 0
}

interface StackedBarBounds {
  positiveStart: Array<number | undefined>
  positiveEnd: Array<number | undefined>
  negativeStart: Array<number | undefined>
  negativeEnd: Array<number | undefined>
}

function getStackedBarBounds(series: EChartsOption[]): StackedBarBounds {
  const bounds: StackedBarBounds = {
    positiveStart: [],
    positiveEnd: [],
    negativeStart: [],
    negativeEnd: [],
  }

  series.forEach((item, seriesIndex) => {
    if (item.type !== 'bar' || !Array.isArray(item.data)) return

    item.data.forEach((datum: unknown, dataIndex: number) => {
      const value = barDatumNumber(datum)
      if (value === null || value === 0) return

      const start = value > 0 ? bounds.positiveStart : bounds.negativeStart
      const end = value > 0 ? bounds.positiveEnd : bounds.negativeEnd
      start[dataIndex] ??= seriesIndex
      end[dataIndex] = seriesIndex
    })
  })

  return bounds
}

function stackedBarBorderRadius(
  value: number | null,
  dataIndex: number,
  seriesIndex: number,
  bounds: StackedBarBounds,
  horizontal: boolean,
  roundPeaksOnly: boolean,
  radius: number,
) {
  if (value === null || value === 0 || radius <= 0) return 0

  const positive = value > 0
  const start = positive ? bounds.positiveStart : bounds.negativeStart
  const end = positive ? bounds.positiveEnd : bounds.negativeEnd
  const isStart = start[dataIndex] === seriesIndex
  const isEnd = end[dataIndex] === seriesIndex
  const corners: [number, number, number, number] = [0, 0, 0, 0]

  if (horizontal) {
    if (positive) {
      if (!roundPeaksOnly && isStart) corners[0] = corners[3] = radius
      if (isEnd) corners[1] = corners[2] = radius
    } else {
      if (!roundPeaksOnly && isStart) corners[1] = corners[2] = radius
      if (isEnd) corners[0] = corners[3] = radius
    }
  } else if (positive) {
    if (isEnd) corners[0] = corners[1] = radius
    if (!roundPeaksOnly && isStart) corners[2] = corners[3] = radius
  } else {
    if (!roundPeaksOnly && isStart) corners[0] = corners[1] = radius
    if (isEnd) corners[2] = corners[3] = radius
  }

  return corners
}

function styleBarSeries(
  series: EChartsOption,
  seriesIndex: number,
  seriesCount: number,
  stackedBounds: StackedBarBounds | null,
  config: ResolvedChartStyle,
) {
  const horizontal =
    config.barHorizontal || config.barArrangement === 'horizontal'
  const { stack: _sourceStack, ...seriesWithoutStack } = series
  const base =
    config.barArrangement === 'stacked'
      ? { ...series, stack: '__poster_total__' }
      : seriesWithoutStack
  const darkenBy = seriesDarkening(seriesIndex, seriesCount)
  const radius = config.barRadius
  const borderRadius = config.barRoundPeaks
    ? horizontal
      ? [0, radius, radius, 0]
      : [radius, radius, 0, 0]
    : radius

  const styledData = Array.isArray(series.data)
    ? series.data.map((item: any, dataIndex: number) => {
        const paletteIndex = config.commonBarColor
          ? 0
          : config.colorBarsByData
            ? dataIndex
            : seriesIndex
        const itemColor = getPaletteColor(config, paletteIndex, darkenBy)
        const palette = config.palette.length > 0
          ? config.palette
          : DEFAULT_PALETTE
        const rawColor = darkenHexColor(
          palette[paletteIndex % palette.length],
          darkenBy,
        )
        const opacity =
          config.paletteOpacities[
            paletteIndex % config.paletteOpacities.length
          ] ?? 100
        const source =
          item !== null && typeof item === 'object' && !Array.isArray(item)
            ? item
            : { value: item }
        const itemBorderRadius = stackedBounds
          ? stackedBarBorderRadius(
              barDatumNumber(source),
              dataIndex,
              seriesIndex,
              stackedBounds,
              horizontal,
              config.barRoundPeaks,
              radius,
            )
          : borderRadius

        return {
          ...source,
          itemStyle: {
            ...source.itemStyle,
            color: config.gradientBars
              ? makeGradient(rawColor, opacity, horizontal)
              : itemColor,
            borderRadius: itemBorderRadius,
          },
          label: {
            ...source.label,
            color:
              config.barValuePosition === 'inside'
                ? '#FFFFFF'
                : itemColor,
          },
        }
      })
    : series.data

  const seriesPaletteIndex =
    config.commonBarColor || config.colorBarsByData ? 0 : seriesIndex
  const color = getPaletteColor(config, seriesPaletteIndex, darkenBy)
  const labelInside = config.barValuePosition === 'inside'
  const minimumBarWidth = horizontal
    ? 0
    : minimumBarWidthForValues(series, config)
  const sourceMinimumBarWidth =
    typeof series.barMinWidth === 'number' ? series.barMinWidth : 0
  const insidePosition = horizontal
    ? config.labelAlignment === 'left'
      ? 'insideLeft'
      : config.labelAlignment === 'right'
        ? 'insideRight'
        : 'inside'
    : config.labelAlignment === 'left'
      ? 'insideTopLeft'
      : config.labelAlignment === 'right'
        ? 'insideTopRight'
        : 'insideTop'

  return {
    ...base,
    data: styledData,
    ...(config.barWidth > 0 ? { barWidth: config.barWidth } : {}),
    barMaxWidth: config.barMaxWidth,
    ...(!horizontal && minimumBarWidth > 0
      ? { barMinWidth: Math.max(sourceMinimumBarWidth, minimumBarWidth) }
      : {}),
    barMinHeight: config.barMinHeight,
    barCategoryGap: `${config.barGapPercent}%`,
    barGap: `${config.barSeriesGapPercent}%`,
    realtimeSort: false,
    showBackground: config.showBarBackground,
    backgroundStyle: {
      ...series.backgroundStyle,
      color: config.barBackgroundColor,
      borderRadius,
    },
    itemStyle: {
      ...series.itemStyle,
      color,
      opacity: config.barOpacity / 100,
      borderRadius: stackedBounds ? 0 : borderRadius,
      borderColor: config.barBorderColor,
      borderWidth: config.barBorderWidth,
    },
    label: {
      ...series.label,
      show: config.showValueLabels,
      position: labelInside
        ? insidePosition
        : horizontal
          ? 'right'
          : 'top',
      distance: horizontal ? 10 : labelInside ? 0 : 6,
      padding: horizontal
        ? series.label?.padding
        : labelInside
          ? [6, 4, 0, 4]
          : [0, 4, 0, 4],
      align: labelInside
        ? config.labelAlignment
        : horizontal
          ? 'left'
          : 'center',
      color: labelInside ? '#FFFFFF' : color,
      fontFamily: config.fontFamily,
      fontSize: config.valueLabelSize,
      fontWeight: config.valueLabelWeight,
      ...(series.label?.formatter === undefined
        ? { formatter: valueFormatter(config) }
        : {}),
    },
    labelLayout: {
      hideOverlap: true,
      ...series.labelLayout,
    },
    ...seriesStates(series, color, config),
  }
}

function styleLineSeries(
  series: EChartsOption,
  seriesIndex: number,
  seriesCount: number,
  config: ResolvedChartStyle,
) {
  const color = getPaletteColor(
    config,
    seriesIndex,
    seriesDarkening(seriesIndex, seriesCount),
  )
  const hasArea = config.presentationMode
    ? config.showLineArea
    : series.areaStyle !== undefined
  const showLine = config.showLines
  const showPoints = config.showLineSymbols
  const smooth = config.presentationMode
    ? config.lineShape === 'smooth'
      ? 0.5
      : false
    : config.smoothLines
      ? 0.8
      : false
  const step = config.presentationMode
    ? config.lineShape === 'step'
      ? 'middle'
      : false
    : config.lineStep === 'none'
      ? false
      : config.lineStep
  const { stack: _sourceStack, ...seriesWithoutStack } = series
  const base = config.lineStacked
    ? { ...series, stack: '__poster_line_total__' }
    : seriesWithoutStack

  return {
    ...base,
    smooth,
    ...(smooth ? { smoothMonotone: 'x' } : {}),
    showSymbol: showPoints,
    symbol: config.lineSymbol,
    symbolSize: config.lineSymbolSize,
    step,
    lineStyle: {
      ...series.lineStyle,
      width: showLine ? config.lineWidth : 0,
      opacity: showLine ? config.lineOpacity / 100 : 0,
      type: lineDashType(config.lineType),
      cap: 'round',
      join: 'round',
      color: config.presentationMode
        ? color
        : series.lineStyle?.color ?? color,
    },
    itemStyle: {
      ...series.itemStyle,
      color,
    },
    label: {
      ...series.label,
      show: config.presentationMode ? false : config.showValueLabels,
      position: 'top',
      align: config.labelAlignment,
      color: config.textColor,
      fontFamily: config.fontFamily,
      fontSize: config.valueLabelSize,
      fontWeight: config.valueLabelWeight,
      ...(series.label?.formatter === undefined
        ? { formatter: valueFormatter(config) }
        : {}),
    },
    endLabel: {
      ...series.endLabel,
      show: config.presentationMode ? false : config.showEndLabel,
      align: config.labelAlignment,
      color: config.textColor,
      fontFamily: config.fontFamily,
      fontSize: config.valueLabelSize,
      fontWeight: config.valueLabelWeight,
      ...(series.endLabel?.formatter === undefined
        ? { formatter: valueFormatter(config) }
        : {}),
    },
    labelLayout: {
      hideOverlap: true,
      moveOverlap: 'shiftY',
      ...series.labelLayout,
    },
    areaStyle: hasArea
      ? {
          ...series.areaStyle,
          opacity: config.areaOpacity / 100,
          color,
        }
      : undefined,
    ...seriesStates(series, color, config),
  }
}

function pieCenter(config: ResolvedChartStyle): [string, string] {
  if (!config.showLegend) return ['50%', '50%']
  if (config.legendPosition === 'top') return ['50%', '56%']
  if (config.legendPosition === 'bottom') return ['50%', '44%']
  if (config.legendPosition === 'left') return ['58%', '50%']
  return ['42%', '50%']
}

function stylePieSeries(
  series: EChartsOption,
  seriesIndex: number,
  config: ResolvedChartStyle,
) {
  const sourceInnerRadius =
    Array.isArray(series.radius) && typeof series.radius[0] === 'string'
      ? Number.parseFloat(series.radius[0])
      : 0
  const configuredInnerRadius =
    !config.presentationMode &&
    config.pieInnerRadius === 0 &&
    sourceInnerRadius > 0
      ? sourceInnerRadius
      : config.pieInnerRadius
  const innerRadius = Math.min(
    Math.max(0, configuredInnerRadius),
    Math.max(0, config.pieOuterRadius - 1),
  )
  const color = getPaletteColor(config, seriesIndex)
  const labelInSectorCenter = config.pieLabelPosition === 'center'
  const showNames = config.showPieLabels
  const data = Array.isArray(series.data)
    ? series.data.map((item: unknown) =>
        item !== null && typeof item === 'object' && !Array.isArray(item)
          ? { ...item }
          : item,
      )
    : series.data

  return {
    ...series,
    data,
    center: pieCenter(config),
    radius: [`${innerRadius}%`, `${config.pieOuterRadius}%`],
    padAngle: config.piePadAngle,
    startAngle: config.pieStartAngle,
    endAngle: config.pieEndAngle === 360 ? 'auto' : config.pieEndAngle,
    clockwise: config.pieClockwise,
    roseType: config.pieRoseType === 'none' ? false : config.pieRoseType,
    minAngle: config.pieMinAngle,
    selectedMode:
      config.presentationMode || !config.pieSelectedMode ? false : 'single',
    selectedOffset: config.pieSelectedOffset,
    avoidLabelOverlap: true,
    itemStyle: {
      ...series.itemStyle,
      borderColor: config.pieBorderColor,
      borderWidth: config.pieBorderWidth,
      borderRadius: config.pieBorderRadius,
    },
    label: {
      ...series.label,
      show: showNames,
      position: config.presentationMode
        ? 'outside'
        : labelInSectorCenter
          ? 'inside'
          : config.pieLabelPosition,
      rotate: labelInSectorCenter ? 'tangential' : 0,
      align: labelInSectorCenter ? 'center' : config.labelAlignment,
      verticalAlign: labelInSectorCenter
        ? 'middle'
        : series.label?.verticalAlign,
      color: config.pieLabelColor,
      fontFamily: config.fontFamily,
      fontSize: config.pieLabelSize,
      fontWeight: labelInSectorCenter
        ? config.valueLabelWeight
        : config.fontWeight,
      ...(series.label?.formatter === undefined
        ? {
            formatter: config.presentationMode
              ? '{b}'
              : labelInSectorCenter
              ? valueFormatter(config)
              : pieFormatter(config),
          }
        : {}),
    },
    labelLine: {
      ...series.labelLine,
      show:
        showNames &&
        config.showPieLabelLines &&
        (config.presentationMode || config.pieLabelPosition === 'outside'),
      length: 14,
      length2: 10,
      smooth: 0.2,
      lineStyle: {
        ...series.labelLine?.lineStyle,
        color: config.mutedTextColor,
      },
    },
    labelLayout: {
      hideOverlap: true,
      moveOverlap: 'shiftY',
      ...series.labelLayout,
    },
    ...seriesStates(series, color, config),
  }
}

function piePercentageSeries(
  series: EChartsOption,
  config: ResolvedChartStyle,
): EChartsOption {
  const percentageFormatter = piePercentageFormatter()
  const data = Array.isArray(series.data)
    ? series.data.map((item: unknown) => {
        const source =
          item !== null && typeof item === 'object' && !Array.isArray(item)
            ? item as EChartsOption
            : { value: item }

        return {
          ...source,
          itemStyle: {
            ...source.itemStyle,
            color: 'rgba(0, 0, 0, 0)',
            opacity: 1,
            borderWidth: 0,
          },
          label: {
            ...source.label,
            show: true,
            position: 'inside',
            rotate: 'tangential',
            formatter: percentageFormatter,
            color: '#FFFFFF',
            fontFamily: config.fontFamily,
            fontSize: Math.min(24, config.valueLabelSize),
            fontWeight: config.valueLabelWeight,
          },
        }
      })
    : series.data

  return {
    ...series,
    id: `${String(series.id ?? series.name ?? 'pie')}-percentages`,
    name: '',
    data,
    z: Number(series.z ?? 2) + 1,
    silent: true,
    animation: false,
    animationDuration: 0,
    legendHoverLink: false,
    selectedMode: false,
    tooltip: { show: false },
    itemStyle: {
      ...series.itemStyle,
      color: 'rgba(0, 0, 0, 0)',
      opacity: 1,
      borderWidth: 0,
    },
    label: {
      show: true,
      position: 'inside',
      rotate: 'tangential',
      formatter: percentageFormatter,
      color: '#FFFFFF',
      fontFamily: config.fontFamily,
      fontSize: Math.min(24, config.valueLabelSize),
      fontWeight: config.valueLabelWeight,
    },
    labelLine: { show: false },
    labelLayout: { hideOverlap: true },
    emphasis: { disabled: true, scale: false },
    blur: { disabled: true },
    select: { disabled: true },
  }
}

function styleScatterSeries(
  series: EChartsOption,
  seriesIndex: number,
  seriesCount: number,
  config: ResolvedChartStyle,
) {
  const color = getPaletteColor(
    config,
    seriesIndex,
    seriesDarkening(seriesIndex, seriesCount),
  )

  return {
    ...series,
    symbol: config.scatterSymbol,
    symbolSize: config.scatterSymbolSize,
    symbolRotate: config.scatterSymbolRotate,
    itemStyle: {
      ...series.itemStyle,
      color,
      opacity: config.scatterOpacity / 100,
      borderColor: config.scatterBorderColor,
      borderWidth: config.scatterBorderWidth,
      shadowBlur: config.scatterShadowBlur,
      shadowColor: color,
      shadowOffsetX: config.scatterShadowOffsetX,
      shadowOffsetY: config.scatterShadowOffsetY,
    },
    label: {
      ...series.label,
      show: config.showScatterLabels || config.showValueLabels,
      position: 'top',
      align: config.labelAlignment,
      color: config.textColor,
      fontFamily: config.fontFamily,
      fontSize: config.valueLabelSize,
      fontWeight: config.fontWeight,
      ...(series.label?.formatter === undefined
        ? { formatter: valueFormatter(config) }
        : {}),
    },
    labelLayout: {
      hideOverlap: true,
      ...series.labelLayout,
    },
    ...seriesStates(series, color, config),
  }
}

function styleRadarSeries(
  series: EChartsOption,
  seriesIndex: number,
  config: ResolvedChartStyle,
) {
  const color = getPaletteColor(config, seriesIndex)
  const dataCount = Array.isArray(series.data) ? series.data.length : 0
  const styledData = Array.isArray(series.data)
    ? series.data.map((item: unknown, dataIndex: number) => {
        const source =
          item !== null && typeof item === 'object' && !Array.isArray(item)
            ? item as EChartsOption
            : { value: item }
        const itemColor = getPaletteColor(
          config,
          dataIndex,
          seriesDarkening(dataIndex, dataCount),
        )

        return {
          ...source,
          lineStyle: {
            ...source.lineStyle,
            color: itemColor,
          },
          itemStyle: {
            ...source.itemStyle,
            color: itemColor,
          },
          areaStyle: {
            ...source.areaStyle,
            color: itemColor,
          },
        }
      })
    : series.data

  return {
    ...series,
    data: styledData,
    symbol: config.lineSymbol,
    symbolSize: config.lineSymbolSize,
    lineStyle: {
      ...series.lineStyle,
      width: config.radarLineWidth,
      type: config.radarLineType,
      color,
    },
    itemStyle: {
      ...series.itemStyle,
      color,
    },
    areaStyle: {
      ...series.areaStyle,
      color,
      opacity: config.radarAreaOpacity / 100,
    },
    label: {
      ...series.label,
      show: config.showValueLabels,
      align: config.labelAlignment,
      color: config.textColor,
      fontFamily: config.fontFamily,
      fontSize: config.valueLabelSize,
      ...(series.label?.formatter === undefined
        ? { formatter: valueFormatter(config) }
        : {}),
    },
    ...seriesStates(series, color, config),
  }
}

function legendLayout(
  config: ResolvedChartStyle,
  presentationLine = false,
  hasTitle = false,
) {
  const common = {
    type: 'scroll',
    itemWidth: config.legendItemSize,
    itemHeight: config.legendItemSize,
    itemGap: config.legendGap,
  }

  if (config.legendPosition === 'top') {
    return {
      ...common,
      top: presentationLine && hasTitle ? 48 : 18,
      left: 'center',
      right: presentationLine ? 0 : undefined,
      orient: 'horizontal',
    }
  }
  if (config.legendPosition === 'bottom') {
    return { ...common, bottom: 18, left: 'center', orient: 'horizontal' }
  }
  if (config.legendPosition === 'left') {
    return { ...common, left: 18, top: 'middle', orient: 'vertical' }
  }
  return { ...common, right: 18, top: 'middle', orient: 'vertical' }
}

function gridLayout(
  config: ResolvedChartStyle,
  presentationLine = false,
  hasTitle = false,
) {
  const padding = config.chartPadding
  const reserved = 66

  if (presentationLine) {
    return {
      left: padding,
      right: padding,
      top:
        padding +
        (hasTitle ? 48 : 0) +
        (config.showLegend ? 44 : 8),
      bottom: padding,
      outerBoundsMode: 'same',
      outerBoundsContain: 'axisLabel',
    }
  }

  return {
    left:
      config.showLegend && config.legendPosition === 'left'
        ? padding + reserved
        : padding,
    right:
      config.showLegend && config.legendPosition === 'right'
        ? padding + reserved
        : padding,
    top:
      config.showLegend && config.legendPosition === 'top'
        ? padding + 42
        : padding,
    bottom:
      config.showLegend && config.legendPosition === 'bottom'
        ? padding + 42
        : padding,
    outerBoundsMode: 'same',
    outerBoundsContain: 'axisLabel',
  }
}

function barDatumNumber(item: unknown): number | null {
  const rawValue =
    item !== null && typeof item === 'object' && !Array.isArray(item)
      ? (item as { value?: unknown }).value
      : item
  let candidate: unknown = rawValue
  if (Array.isArray(rawValue)) {
    candidate = null
    for (let index = rawValue.length - 1; index >= 0; index -= 1) {
      if (typeof rawValue[index] === 'number') {
        candidate = rawValue[index]
        break
      }
    }
  }

  return typeof candidate === 'number' && Number.isFinite(candidate)
    ? candidate
    : null
}

function orderBarCategories(
  option: EChartsOption,
  order: BarOrder,
): EChartsOption {
  if (order === 'value') return option

  const xAxes = asArray(option.xAxis)
  const categoryAxisIndex = xAxes.findIndex(
    (axis) => axis?.type === 'category' || Array.isArray(axis?.data),
  )
  const categories = xAxes[categoryAxisIndex]?.data
  const series = asArray(option.series)
  const barSeries = series.filter(
    (item) => item?.type === 'bar' && Array.isArray(item.data),
  )

  if (
    categoryAxisIndex < 0 ||
    !Array.isArray(categories) ||
    categories.length < 2 ||
    barSeries.length === 0
  ) {
    return option
  }

  const ranked = categories.map((_, index) => {
    const values = barSeries
      .map((item) => barDatumNumber(item.data[index]))
      .filter((value): value is number => value !== null)

    return {
      index,
      hasValue: values.length > 0,
      value: values.reduce((sum, value) => sum + value, 0),
    }
  })

  ranked.sort((a, b) => {
    if (a.hasValue !== b.hasValue) return a.hasValue ? -1 : 1
    const difference = order === 'normal'
      ? a.value - b.value
      : b.value - a.value
    return difference || a.index - b.index
  })

  const indices = ranked.map((item) => item.index)
  const orderedAxes = xAxes.map((axis, index) =>
    index === categoryAxisIndex
      ? { ...axis, data: indices.map((itemIndex) => categories[itemIndex]) }
      : axis,
  )
  const orderedSeries = series.map((item) =>
    Array.isArray(item?.data) && item.data.length === categories.length
      ? {
          ...item,
          data: indices.map((itemIndex) => item.data[itemIndex]),
        }
      : item,
  )

  return {
    ...option,
    xAxis: restoreShape(option.xAxis, orderedAxes),
    series: restoreShape(option.series, orderedSeries),
  }
}

export function applyChartStyle(
  option: EChartsOption,
  overrides: ChartStyleConfig = {},
): EChartsOption {
  const config: ResolvedChartStyle = {
    ...DEFAULT_CHART_STYLE,
    ...overrides,
    palette: overrides.palette ?? DEFAULT_CHART_STYLE.palette,
    paletteOpacities:
      overrides.paletteOpacities ?? DEFAULT_CHART_STYLE.paletteOpacities,
  }

  option = orderBarCategories(option, config.barOrder)

  const seriesSource = asArray(option.series)
  const stackedBarBounds =
    config.barArrangement === 'stacked'
      ? getStackedBarBounds(seriesSource)
      : null
  const hasBarSeries = seriesSource.some((series) => series.type === 'bar')
  const horizontal =
    hasBarSeries &&
    (config.barHorizontal || config.barArrangement === 'horizontal')
  const xAxisSource = horizontal ? option.yAxis : option.xAxis
  const yAxisSource = horizontal ? option.xAxis : option.yAxis
  const xAxes = asArray(xAxisSource).map((axis) =>
    styleAxis(axis, config, 'x'),
  )
  const yAxes = asArray(yAxisSource).map((axis) =>
    styleAxis(axis, config, 'y'),
  )

  const series: EChartsOption[] = []
  seriesSource.forEach((item, index) => {
    if (item.type === 'bar') {
      series.push(
        styleBarSeries(
          item,
          index,
          seriesSource.length,
          stackedBarBounds,
          config,
        ),
      )
      return
    }
    if (item.type === 'line') {
      series.push(styleLineSeries(item, index, seriesSource.length, config))
      return
    }
    if (item.type === 'pie') {
      const styledPie = stylePieSeries(item, index, config)
      series.push(styledPie)
      if (config.presentationMode && config.showPiePercentages) {
        series.push(piePercentageSeries(styledPie, config))
      }
      return
    }
    if (item.type === 'scatter') {
      series.push(styleScatterSeries(item, index, seriesSource.length, config))
      return
    }
    if (item.type === 'radar') {
      series.push(styleRadarSeries(item, index, config))
      return
    }
    series.push({ ...item })
  })

  const hasCartesianAxes =
    xAxisSource !== undefined || yAxisSource !== undefined
  const palette =
    config.palette.length > 0 ? config.palette : DEFAULT_PALETTE
  const titleSource = asArray(option.title)
  const hasTitle = config.showTitle && titleSource.length > 0
  const presentationLine =
    config.presentationMode &&
    seriesSource.some((item) => item.type === 'line')
  const titles = titleSource.map((title) => ({
    ...title,
    show: config.showTitle,
    left: title.left ?? config.labelAlignment,
    textStyle: {
      ...title.textStyle,
      color: config.textColor,
      fontFamily: config.fontFamily,
      fontWeight: config.fontWeight,
    },
  }))
  const chartGrid = gridLayout(config, presentationLine, hasTitle)
  if (
    !presentationLine &&
    config.showTitle &&
    titleSource.length > 0 &&
    typeof chartGrid.top === 'number'
  ) {
    chartGrid.top += 40
  }

  return {
    ...option,
    backgroundColor: config.backgroundColor,
    color: palette.map((color, index) =>
      hexToRgba(color, config.paletteOpacities[index] ?? 100),
    ),
    textStyle: {
      ...option.textStyle,
      color: config.textColor,
      fontFamily: config.fontFamily,
      fontWeight: config.fontWeight,
    },
    title: restoreShape(option.title, titles),
    ...(config.presentationMode ? { animation: false } : {}),
    animationDuration: config.presentationMode ? 0 : config.animationDuration,
    animationDurationUpdate: config.presentationMode
      ? 0
      : config.animationUpdateDuration,
    animationEasing: config.animationEasing,
    animationEasingUpdate: config.animationEasing,
    grid: hasCartesianAxes
      ? {
          ...option.grid,
          ...chartGrid,
        }
      : option.grid,
    legend: option.legend
      ? {
          ...option.legend,
          ...legendLayout(config, presentationLine, hasTitle),
          icon: option.legend.icon ?? 'circle',
          textStyle: {
            ...option.legend?.textStyle,
            color: config.textColor,
            fontFamily: config.fontFamily,
            fontSize: config.legendFontSize,
            fontWeight: config.fontWeight,
          },
          pageTextStyle: {
            ...option.legend?.pageTextStyle,
            color: config.mutedTextColor,
          },
          show: config.showLegend,
          selectedMode: config.presentationMode
            ? false
            : option.legend.selectedMode,
        }
      : option.legend,
    tooltip: option.tooltip
      ? {
          ...option.tooltip,
          show: config.presentationMode ? false : config.showTooltip,
          backgroundColor: hexToRgba(config.tooltipBackgroundColor, 96),
          borderColor: config.tooltipBorderColor,
          borderWidth: 1,
          padding: [10, 12],
          textStyle: {
            ...option.tooltip?.textStyle,
            color: config.textColor,
            fontFamily: config.fontFamily,
            fontSize: config.tooltipFontSize,
          },
        }
      : option.tooltip,
    xAxis: restoreShape(xAxisSource, xAxes),
    yAxis: restoreShape(yAxisSource, yAxes),
    radar: option.radar
      ? {
          ...option.radar,
          center: pieCenter(config),
          radius: `${config.radarRadius}%`,
          shape: config.radarShape,
          splitNumber: config.radarSplitNumber,
          axisName: {
            ...option.radar.axisName,
            show: config.showRadarNames,
            color: config.textColor,
            fontFamily: config.fontFamily,
            fontSize: config.xAxisLabelSize,
            fontWeight: config.fontWeight,
          },
          axisLine: {
            ...option.radar.axisLine,
            lineStyle: {
              ...option.radar.axisLine?.lineStyle,
              color: config.axisLineColor,
            },
          },
          splitLine: {
            ...option.radar.splitLine,
            lineStyle: {
              ...option.radar.splitLine?.lineStyle,
              color: config.gridLineColor,
              width: config.gridLineWidth,
              type: config.gridLineType,
            },
          },
          splitArea: {
            ...option.radar.splitArea,
            show: config.showRadarSplitArea,
            areaStyle: {
              ...option.radar.splitArea?.areaStyle,
              color: [
                hexToRgba(config.textColor, config.radarSplitAreaOpacity),
                hexToRgba(
                  config.textColor,
                  Math.max(0, config.radarSplitAreaOpacity / 2),
                ),
              ],
            },
          },
        }
      : option.radar,
    series,
  }
}
