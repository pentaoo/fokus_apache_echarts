/**
 * Чистый слой стилизации Apache ECharts.
 *
 * Функция не зависит от Vue, не мутирует исходный option и использует только
 * стандартные свойства Apache ECharts 6.
 */
export type EChartsOption = Record<string, any>
export type BarArrangement = 'grouped' | 'stacked' | 'horizontal'
export type LabelAlignment = 'left' | 'center' | 'right'
export type BarValuePosition = 'inside' | 'top'
export type BarCategoryPosition = 'axis' | 'inside'
export type LineStep = 'none' | 'start' | 'middle' | 'end'
export type LineStyleType = 'solid' | 'dashed' | 'dotted'
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

  showXAxisLabels?: boolean
  showYAxisLabels?: boolean
  showValueLabels?: boolean
  labelAlignment?: LabelAlignment
  xAxisLabelSize?: number
  yAxisLabelSize?: number
  valueLabelSize?: number
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
  smoothLines?: boolean
  showLineSymbols?: boolean
  lineSymbolSize?: number
  lineSymbol?: SymbolShape
  connectNulls?: boolean
  lineStep?: LineStep
  areaOpacity?: number
  lineStacked?: boolean
  showEndLabel?: boolean

  pieInnerRadius?: number
  pieOuterRadius?: number
  piePadAngle?: number
  pieStartAngle?: number
  pieEndAngle?: number
  pieClockwise?: boolean
  pieRoseType?: PieRoseType
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
  fontFamily: 'Inter, Arial, sans-serif',
  fontWeight: 700,
  chartPadding: 28,

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

  showXAxisLabels: true,
  showYAxisLabels: true,
  showValueLabels: false,
  labelAlignment: 'center',
  xAxisLabelSize: 14,
  yAxisLabelSize: 12,
  valueLabelSize: 22,
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
  smoothLines: true,
  showLineSymbols: false,
  lineSymbolSize: 10,
  lineSymbol: 'circle',
  connectNulls: false,
  lineStep: 'none',
  areaOpacity: 24,
  lineStacked: false,
  showEndLabel: false,

  pieInnerRadius: 0,
  pieOuterRadius: 66,
  piePadAngle: 2,
  pieStartAngle: 90,
  pieEndAngle: 360,
  pieClockwise: true,
  pieRoseType: 'none',
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

function getPaletteColor(config: ResolvedChartStyle, index: number) {
  const palette = config.palette.length > 0 ? config.palette : DEFAULT_PALETTE
  const paletteIndex = index % palette.length
  const opacity =
    config.paletteOpacities[paletteIndex] ??
    config.paletteOpacities[0] ??
    100
  return hexToRgba(palette[paletteIndex], opacity)
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

function styleAxis(
  axis: EChartsOption,
  config: ResolvedChartStyle,
  dimension: 'x' | 'y',
) {
  const isCategory = axis.type === 'category' || Array.isArray(axis.data)
  const showLabels =
    dimension === 'x' ? config.showXAxisLabels : config.showYAxisLabels
  const labelSize =
    dimension === 'x' ? config.xAxisLabelSize : config.yAxisLabelSize
  const labelRotate =
    dimension === 'x' ? config.xAxisLabelRotate : config.yAxisLabelRotate
  const labelMargin =
    dimension === 'x' ? config.xAxisLabelMargin : config.yAxisLabelMargin
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
    ...valueRange,
    ...(isCategory ? { boundaryGap: config.boundaryGap } : {}),
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
      inside: isCategory && config.barCategoryPosition === 'inside',
      align: dimension === 'x' ? config.labelAlignment : axis.axisLabel?.align,
      color: isCategory ? config.textColor : config.mutedTextColor,
      fontFamily: config.fontFamily,
      fontSize: labelSize,
      fontWeight: isCategory ? config.fontWeight : 500,
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

function styleBarSeries(
  series: EChartsOption,
  seriesIndex: number,
  config: ResolvedChartStyle,
) {
  const horizontal = config.barArrangement === 'horizontal'
  const { stack: _sourceStack, ...seriesWithoutStack } = series
  const base =
    config.barArrangement === 'stacked'
      ? { ...series, stack: '__poster_total__' }
      : seriesWithoutStack

  const styledData = Array.isArray(series.data)
    ? series.data.map((item: any, dataIndex: number) => {
        const paletteIndex = config.commonBarColor
          ? 0
          : config.colorBarsByData
            ? dataIndex
            : seriesIndex
        const itemColor = getPaletteColor(config, paletteIndex)
        const palette = config.palette.length > 0
          ? config.palette
          : DEFAULT_PALETTE
        const rawColor = palette[paletteIndex % palette.length]
        const opacity =
          config.paletteOpacities[
            paletteIndex % config.paletteOpacities.length
          ] ?? 100
        const source =
          item !== null && typeof item === 'object' && !Array.isArray(item)
            ? item
            : { value: item }

        return {
          ...source,
          itemStyle: {
            ...source.itemStyle,
            color: config.gradientBars
              ? makeGradient(rawColor, opacity, horizontal)
              : itemColor,
          },
          label: {
            ...source.label,
            color:
              config.barValuePosition === 'inside'
                ? config.textColor
                : itemColor,
          },
        }
      })
    : series.data

  const radius = config.barRadius
  const borderRadius = config.barRoundPeaks
    ? horizontal
      ? [0, radius, radius, 0]
      : [radius, radius, 0, 0]
    : radius
  const color = getPaletteColor(config, seriesIndex)

  return {
    ...base,
    data: styledData,
    ...(config.barWidth > 0 ? { barWidth: config.barWidth } : {}),
    barMaxWidth: config.barMaxWidth,
    barMinHeight: config.barMinHeight,
    barCategoryGap: `${config.barGapPercent}%`,
    barGap: `${config.barSeriesGapPercent}%`,
    showBackground: config.showBarBackground,
    backgroundStyle: {
      ...series.backgroundStyle,
      color: config.barBackgroundColor,
      borderRadius,
    },
    itemStyle: {
      ...series.itemStyle,
      opacity: config.barOpacity / 100,
      borderRadius,
      borderColor: config.barBorderColor,
      borderWidth: config.barBorderWidth,
    },
    label: {
      ...series.label,
      show: config.showValueLabels,
      position:
        config.barValuePosition === 'inside'
          ? horizontal
            ? 'insideRight'
            : 'insideTop'
          : horizontal
            ? 'right'
            : 'top',
      distance: 10,
      align: config.labelAlignment,
      color,
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

function styleLineSeries(
  series: EChartsOption,
  seriesIndex: number,
  config: ResolvedChartStyle,
) {
  const color = getPaletteColor(config, seriesIndex)
  const hasArea = series.areaStyle !== undefined
  const { stack: _sourceStack, ...seriesWithoutStack } = series
  const base = config.lineStacked
    ? { ...series, stack: '__poster_line_total__' }
    : seriesWithoutStack

  return {
    ...base,
    smooth: config.smoothLines,
    showSymbol: config.showLineSymbols,
    symbol: config.lineSymbol,
    symbolSize: config.lineSymbolSize,
    connectNulls: config.connectNulls,
    step: config.lineStep === 'none' ? false : config.lineStep,
    lineStyle: {
      ...series.lineStyle,
      width: config.lineWidth,
      opacity: config.lineOpacity / 100,
      type: config.lineType,
      cap: 'round',
      join: 'round',
      color: series.lineStyle?.color ?? color,
    },
    itemStyle: {
      ...series.itemStyle,
      color,
    },
    label: {
      ...series.label,
      show: config.showValueLabels,
      position: 'top',
      color: config.textColor,
      fontFamily: config.fontFamily,
      fontSize: config.valueLabelSize,
      fontWeight: config.fontWeight,
      ...(series.label?.formatter === undefined
        ? { formatter: valueFormatter(config) }
        : {}),
    },
    endLabel: {
      ...series.endLabel,
      show: config.showEndLabel,
      color: config.textColor,
      fontFamily: config.fontFamily,
      fontSize: config.valueLabelSize,
      fontWeight: config.fontWeight,
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
  const innerRadius =
    config.pieInnerRadius === 0 && sourceInnerRadius > 0
      ? sourceInnerRadius
      : config.pieInnerRadius
  const color = getPaletteColor(config, seriesIndex)

  return {
    ...series,
    center: pieCenter(config),
    radius: [`${innerRadius}%`, `${config.pieOuterRadius}%`],
    padAngle: config.piePadAngle,
    startAngle: config.pieStartAngle,
    endAngle: config.pieEndAngle === 360 ? 'auto' : config.pieEndAngle,
    clockwise: config.pieClockwise,
    roseType: config.pieRoseType === 'none' ? false : config.pieRoseType,
    minAngle: config.pieMinAngle,
    selectedMode: config.pieSelectedMode ? 'single' : false,
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
      show: config.showPieLabels,
      position: config.pieLabelPosition,
      align: config.labelAlignment,
      color: config.textColor,
      fontFamily: config.fontFamily,
      fontSize: config.xAxisLabelSize,
      fontWeight: config.fontWeight,
      ...(series.label?.formatter === undefined
        ? {
            formatter: pieFormatter(config),
          }
        : {}),
    },
    labelLine: {
      ...series.labelLine,
      show:
        config.showPieLabels &&
        config.showPieLabelLines &&
        config.pieLabelPosition === 'outside',
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

function styleScatterSeries(
  series: EChartsOption,
  seriesIndex: number,
  config: ResolvedChartStyle,
) {
  const color = getPaletteColor(config, seriesIndex)

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

  return {
    ...series,
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

function legendLayout(config: ResolvedChartStyle) {
  const common = {
    type: 'scroll',
    itemWidth: config.legendItemSize,
    itemHeight: config.legendItemSize,
    itemGap: config.legendGap,
  }

  if (config.legendPosition === 'top') {
    return { ...common, top: 18, left: 'center', orient: 'horizontal' }
  }
  if (config.legendPosition === 'bottom') {
    return { ...common, bottom: 18, left: 'center', orient: 'horizontal' }
  }
  if (config.legendPosition === 'left') {
    return { ...common, left: 18, top: 'middle', orient: 'vertical' }
  }
  return { ...common, right: 18, top: 'middle', orient: 'vertical' }
}

function gridLayout(config: ResolvedChartStyle) {
  const padding = config.chartPadding
  const reserved = 66

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

  const seriesSource = asArray(option.series)
  const hasBarSeries = seriesSource.some((series) => series.type === 'bar')
  const horizontal =
    hasBarSeries && config.barArrangement === 'horizontal'
  const xAxisSource = horizontal ? option.yAxis : option.xAxis
  const yAxisSource = horizontal ? option.xAxis : option.yAxis
  const xAxes = asArray(xAxisSource).map((axis) =>
    styleAxis(axis, config, 'x'),
  )
  const yAxes = asArray(yAxisSource).map((axis) =>
    styleAxis(axis, config, 'y'),
  )

  const series = seriesSource.map((item, index) => {
    if (item.type === 'bar') return styleBarSeries(item, index, config)
    if (item.type === 'line') return styleLineSeries(item, index, config)
    if (item.type === 'pie') return stylePieSeries(item, index, config)
    if (item.type === 'scatter') {
      return styleScatterSeries(item, index, config)
    }
    if (item.type === 'radar') return styleRadarSeries(item, index, config)
    return { ...item }
  })

  const hasCartesianAxes =
    xAxisSource !== undefined || yAxisSource !== undefined
  const palette =
    config.palette.length > 0 ? config.palette : DEFAULT_PALETTE

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
    animationDuration: config.animationDuration,
    animationDurationUpdate: config.animationUpdateDuration,
    animationEasing: config.animationEasing,
    animationEasingUpdate: config.animationEasing,
    grid: hasCartesianAxes
      ? {
          ...option.grid,
          ...gridLayout(config),
        }
      : option.grid,
    legend: option.legend
      ? {
          ...option.legend,
          ...legendLayout(config),
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
        }
      : option.legend,
    tooltip: option.tooltip
      ? {
          ...option.tooltip,
          show: config.showTooltip,
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
