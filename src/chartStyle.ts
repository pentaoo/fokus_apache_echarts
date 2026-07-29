/**
 * Чистый слой стилизации Apache ECharts.
 *
 * Функция не зависит от Vue, не мутирует исходный option и использует только
 * стандартные свойства Apache ECharts.
 */
export type EChartsOption = Record<string, any>
export type BarArrangement = 'grouped' | 'stacked' | 'horizontal'
export type LabelAlignment = 'left' | 'center' | 'right'
export type BarValuePosition = 'inside' | 'top'
export type BarCategoryPosition = 'axis' | 'inside'
export type LineStep = 'none' | 'start' | 'middle' | 'end'
export type PieRoseType = 'none' | 'radius'

export interface ChartStyleConfig {
  backgroundColor?: string
  textColor?: string
  mutedTextColor?: string
  palette?: string[]
  paletteOpacities?: number[]
  fontFamily?: string
  fontWeight?: number
  categoryLabelSize?: number
  valueLabelSize?: number
  showAllLabels?: boolean
  labelAlignment?: LabelAlignment
  showLegend?: boolean
  showTooltip?: boolean
  showGridLines?: boolean
  showAxisLines?: boolean
  showAxisTicks?: boolean
  animationDuration?: number
  barArrangement?: BarArrangement
  barGapPercent?: number
  barRadius?: number
  barRoundPeaks?: boolean
  barMaxWidth?: number
  barOpacity?: number
  barValuePosition?: BarValuePosition
  barCategoryPosition?: BarCategoryPosition
  colorBarsByData?: boolean
  commonBarColor?: boolean
  gradientBars?: boolean
  lineWidth?: number
  smoothLines?: boolean
  showLineSymbols?: boolean
  lineSymbolSize?: number
  connectNulls?: boolean
  lineStep?: LineStep
  areaOpacity?: number
  pieInnerRadius?: number
  pieOuterRadius?: number
  piePadAngle?: number
  pieStartAngle?: number
  pieClockwise?: boolean
  pieRoseType?: PieRoseType
  showPieLabels?: boolean
  scatterSymbolSize?: number
  scatterOpacity?: number
  showScatterLabels?: boolean
  radarAreaOpacity?: number
}

const DEFAULT_PALETTE = [
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

const DEFAULT_CONFIG: Required<ChartStyleConfig> = {
  backgroundColor: '#050505',
  textColor: '#FFFFFF',
  mutedTextColor: '#B8B8C2',
  palette: DEFAULT_PALETTE,
  paletteOpacities: DEFAULT_PALETTE.map(() => 100),
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
}

function asArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return []
  return Array.isArray(value) ? value : [value]
}

function restoreShape<T>(source: T | T[] | undefined, values: T[]) {
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
    x: horizontal ? 0 : 0,
    y: horizontal ? 0 : 1,
    x2: horizontal ? 1 : 0,
    y2: horizontal ? 0 : 0,
    colorStops: [
      { offset: 0, color: transparent },
      { offset: 1, color: solid },
    ],
  }
}

function getPaletteColor(
  config: Required<ChartStyleConfig>,
  index: number,
) {
  const paletteIndex = index % config.palette.length
  const opacity =
    config.paletteOpacities[paletteIndex] ??
    config.paletteOpacities[0] ??
    100
  return hexToRgba(config.palette[paletteIndex], opacity)
}

function styleAxis(
  axis: EChartsOption,
  config: Required<ChartStyleConfig>,
) {
  const isCategory = axis.type === 'category' || Array.isArray(axis.data)

  return {
    ...axis,
    axisLine: {
      ...axis.axisLine,
      show: config.showAxisLines,
      lineStyle: {
        color: 'rgba(255, 255, 255, 0.22)',
        ...axis.axisLine?.lineStyle,
      },
    },
    axisTick: {
      ...axis.axisTick,
      show: config.showAxisTicks,
    },
    axisLabel: {
      ...axis.axisLabel,
      show: config.showAllLabels,
      inside: isCategory && config.barCategoryPosition === 'inside',
      align: config.labelAlignment,
      color: isCategory ? config.textColor : config.mutedTextColor,
      fontFamily: config.fontFamily,
      fontSize: isCategory ? config.categoryLabelSize : 12,
      fontWeight: isCategory ? config.fontWeight : 500,
      margin: 18,
      interval: 0,
    },
    splitLine: {
      ...axis.splitLine,
      show: config.showGridLines,
      lineStyle: {
        color: 'rgba(255, 255, 255, 0.12)',
        ...axis.splitLine?.lineStyle,
      },
    },
  }
}

function styleBarSeries(
  series: EChartsOption,
  seriesIndex: number,
  config: Required<ChartStyleConfig>,
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
        const rawColor = config.palette[paletteIndex % config.palette.length]
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

  return {
    ...base,
    data: styledData,
    barMaxWidth: config.barMaxWidth,
    barCategoryGap: `${config.barGapPercent}%`,
    itemStyle: {
      ...series.itemStyle,
      opacity: config.barOpacity / 100,
      borderRadius,
    },
    label: {
      ...series.label,
      show: config.showAllLabels,
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
      color: getPaletteColor(config, seriesIndex),
      fontFamily: config.fontFamily,
      fontSize: config.valueLabelSize,
      fontWeight: config.fontWeight,
    },
    emphasis: {
      focus: 'series',
      ...series.emphasis,
    },
  }
}

function styleLineSeries(
  series: EChartsOption,
  seriesIndex: number,
  config: Required<ChartStyleConfig>,
) {
  const color = getPaletteColor(config, seriesIndex)
  const hasArea = series.areaStyle !== undefined

  return {
    ...series,
    smooth: config.smoothLines,
    showSymbol: config.showLineSymbols,
    symbolSize: config.lineSymbolSize,
    connectNulls: config.connectNulls,
    step: config.lineStep === 'none' ? false : config.lineStep,
    lineStyle: {
      ...series.lineStyle,
      width: config.lineWidth,
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
      show: config.showAllLabels && config.showLineSymbols,
      position: 'top',
      color: config.textColor,
      fontFamily: config.fontFamily,
      fontSize: config.valueLabelSize,
      fontWeight: config.fontWeight,
    },
    areaStyle: hasArea
      ? {
          ...series.areaStyle,
          opacity: config.areaOpacity / 100,
          color,
        }
      : undefined,
    emphasis: {
      focus: 'series',
      ...series.emphasis,
    },
  }
}

function stylePieSeries(
  series: EChartsOption,
  config: Required<ChartStyleConfig>,
) {
  const sourceInnerRadius =
    Array.isArray(series.radius) && typeof series.radius[0] === 'string'
      ? Number.parseFloat(series.radius[0])
      : 0
  const innerRadius =
    config.pieInnerRadius === 0 && sourceInnerRadius > 0
      ? sourceInnerRadius
      : config.pieInnerRadius

  return {
    ...series,
    radius: [`${innerRadius}%`, `${config.pieOuterRadius}%`],
    padAngle: config.piePadAngle,
    startAngle: config.pieStartAngle,
    clockwise: config.pieClockwise,
    roseType: config.pieRoseType === 'none' ? false : config.pieRoseType,
    minAngle: 2,
    itemStyle: {
      ...series.itemStyle,
      borderColor: config.backgroundColor,
      borderWidth: config.piePadAngle > 0 ? 3 : 0,
      borderRadius: Math.min(12, config.barRadius),
    },
    label: {
      ...series.label,
      show: config.showPieLabels,
      align: config.labelAlignment,
      color: config.textColor,
      fontFamily: config.fontFamily,
      fontSize: config.categoryLabelSize,
      fontWeight: config.fontWeight,
    },
    labelLine: {
      ...series.labelLine,
      show: config.showPieLabels,
      lineStyle: {
        color: config.mutedTextColor,
        ...series.labelLine?.lineStyle,
      },
    },
    emphasis: {
      focus: 'self',
      scale: true,
      scaleSize: 8,
      ...series.emphasis,
    },
  }
}

function styleScatterSeries(
  series: EChartsOption,
  seriesIndex: number,
  config: Required<ChartStyleConfig>,
) {
  const color = getPaletteColor(config, seriesIndex)

  return {
    ...series,
    symbolSize: config.scatterSymbolSize,
    itemStyle: {
      ...series.itemStyle,
      color,
      opacity: config.scatterOpacity / 100,
      shadowBlur: 18,
      shadowColor: color,
    },
    label: {
      ...series.label,
      show: config.showScatterLabels,
      position: 'top',
      color: config.textColor,
      fontFamily: config.fontFamily,
      fontSize: config.valueLabelSize,
      fontWeight: config.fontWeight,
    },
    emphasis: {
      focus: 'series',
      scale: true,
      ...series.emphasis,
    },
  }
}

function styleRadarSeries(
  series: EChartsOption,
  seriesIndex: number,
  config: Required<ChartStyleConfig>,
) {
  const color = getPaletteColor(config, seriesIndex)

  return {
    ...series,
    symbolSize: config.lineSymbolSize,
    lineStyle: {
      ...series.lineStyle,
      width: Math.max(2, config.lineWidth / 2),
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
    emphasis: {
      focus: 'series',
      ...series.emphasis,
    },
  }
}

export function applyChartStyle(
  option: EChartsOption,
  overrides: ChartStyleConfig = {},
): EChartsOption {
  const config: Required<ChartStyleConfig> = {
    ...DEFAULT_CONFIG,
    ...overrides,
    palette: overrides.palette ?? DEFAULT_CONFIG.palette,
    paletteOpacities:
      overrides.paletteOpacities ?? DEFAULT_CONFIG.paletteOpacities,
  }

  const seriesSource = asArray(option.series)
  const hasBarSeries = seriesSource.some((series) => series.type === 'bar')
  const horizontal =
    hasBarSeries && config.barArrangement === 'horizontal'
  const xAxisSource = horizontal ? option.yAxis : option.xAxis
  const yAxisSource = horizontal ? option.xAxis : option.yAxis
  const xAxes = asArray(xAxisSource).map((axis) => styleAxis(axis, config))
  const yAxes = asArray(yAxisSource).map((axis) => styleAxis(axis, config))

  const series = seriesSource.map((item, index) => {
    if (item.type === 'bar') return styleBarSeries(item, index, config)
    if (item.type === 'line') return styleLineSeries(item, index, config)
    if (item.type === 'pie') return stylePieSeries(item, config)
    if (item.type === 'scatter') {
      return styleScatterSeries(item, index, config)
    }
    if (item.type === 'radar') return styleRadarSeries(item, index, config)
    return { ...item }
  })

  const hasCartesianAxes = xAxisSource !== undefined || yAxisSource !== undefined

  return {
    ...option,
    backgroundColor: config.backgroundColor,
    color: config.palette.map((color, index) =>
      hexToRgba(color, config.paletteOpacities[index] ?? 100),
    ),
    textStyle: {
      ...option.textStyle,
      color: config.textColor,
      fontFamily: config.fontFamily,
      fontWeight: config.fontWeight,
    },
    animationDuration: config.animationDuration,
    animationEasing: option.animationEasing ?? 'cubicOut',
    grid: hasCartesianAxes
      ? {
          left: 28,
          right: 28,
          top: config.showLegend ? 72 : 36,
          bottom: 28,
          outerBoundsMode: 'same',
          outerBoundsContain: 'axisLabel',
          ...option.grid,
        }
      : option.grid,
    legend: option.legend
      ? {
          ...option.legend,
          top: option.legend.top ?? 20,
          right: option.legend.right ?? 24,
          itemWidth: option.legend.itemWidth ?? 12,
          itemHeight: option.legend.itemHeight ?? 12,
          icon: option.legend.icon ?? 'circle',
          textStyle: {
            ...option.legend?.textStyle,
            color: config.textColor,
            fontFamily: config.fontFamily,
            fontSize: 13,
            fontWeight: config.fontWeight,
          },
          show: config.showLegend,
        }
      : option.legend,
    tooltip: option.tooltip
      ? {
          ...option.tooltip,
          show: config.showTooltip,
          backgroundColor: 'rgba(24, 24, 29, 0.96)',
          borderColor: 'rgba(255, 255, 255, 0.16)',
          borderWidth: 1,
          padding: [10, 12],
          textStyle: {
            ...option.tooltip?.textStyle,
            color: config.textColor,
            fontFamily: config.fontFamily,
          },
        }
      : option.tooltip,
    xAxis: restoreShape(xAxisSource, xAxes),
    yAxis: restoreShape(yAxisSource, yAxes),
    radar: option.radar
      ? {
          ...option.radar,
          splitNumber: 4,
          axisName: {
            ...option.radar.axisName,
            color: config.textColor,
            fontFamily: config.fontFamily,
            fontWeight: config.fontWeight,
          },
          axisLine: {
            ...option.radar.axisLine,
            lineStyle: {
              color: 'rgba(255, 255, 255, 0.18)',
              ...option.radar.axisLine?.lineStyle,
            },
          },
          splitLine: {
            ...option.radar.splitLine,
            lineStyle: {
              color: 'rgba(255, 255, 255, 0.14)',
              ...option.radar.splitLine?.lineStyle,
            },
          },
          splitArea: {
            ...option.radar.splitArea,
            areaStyle: {
              color: [
                'rgba(255,255,255,0.015)',
                'rgba(255,255,255,0.045)',
              ],
              ...option.radar.splitArea?.areaStyle,
            },
          },
        }
      : option.radar,
    series,
  }
}
