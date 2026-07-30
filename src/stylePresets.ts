import {
  createDefaultChartStyle,
  type ChartStyleConfig,
  type ResolvedChartStyle,
} from './chartStyle'

export type ChartType =
  | 'line'
  | 'bar'
  | 'pie'
  | 'doughnut'
  | 'area'
  | 'scatter'
  | 'radar'

export type PalettePresetId =
  | 'fokus'
  | 'cool'
  | 'warm'
  | 'contrast'
  | 'mono'
  | 'accessible'
  | 'custom'

export interface PalettePreset {
  id: Exclude<PalettePresetId, 'custom'>
  name: string
  colors: string[]
}

export const PALETTE_PRESETS: PalettePreset[] = [
  {
    id: 'fokus',
    name: 'Fokus',
    colors: [
      '#4D0AE2',
      '#6E32E8',
      '#8E5BEB',
      '#B00AE2',
      '#E20AB3',
      '#E20A6B',
      '#E20A0E',
      '#FF7A00',
      '#FFC252',
    ],
  },
  {
    id: 'cool',
    name: 'Холодная',
    colors: [
      '#142BFF',
      '#0D6EFD',
      '#00A6FB',
      '#00C2D1',
      '#00A896',
      '#4D0AE2',
      '#875CFF',
      '#B8A1FF',
    ],
  },
  {
    id: 'warm',
    name: 'Тёплая',
    colors: [
      '#E20A0E',
      '#FF4D00',
      '#FF7A00',
      '#FF9F1C',
      '#FFC252',
      '#E20A6B',
      '#E20AB3',
      '#B00AE2',
    ],
  },
  {
    id: 'contrast',
    name: 'Контраст',
    colors: [
      '#4D0AE2',
      '#FF7A00',
      '#00A896',
      '#E20A6B',
      '#FFC252',
      '#00A6FB',
      '#B00AE2',
      '#E20A0E',
    ],
  },
  {
    id: 'mono',
    name: 'Моно',
    colors: [
      '#F4F1FF',
      '#D8CCFF',
      '#B5A0FF',
      '#8E6DFF',
      '#6A38F0',
      '#4D0AE2',
      '#31078F',
      '#1B064B',
    ],
  },
  {
    id: 'accessible',
    name: 'Доступная',
    colors: [
      '#0072B2',
      '#E69F00',
      '#009E73',
      '#CC79A7',
      '#56B4E9',
      '#D55E00',
      '#F0E442',
      '#000000',
    ],
  },
]

const TYPE_OVERRIDES: Record<ChartType, ChartStyleConfig> = {
  line: {
    showValueLabels: false,
    lineWidth: 6,
    lineOpacity: 100,
    lineType: 'solid',
    smoothLines: true,
    showLineSymbols: false,
    areaOpacity: 0,
    showEndLabel: false,
  },
  bar: {
    showValueLabels: true,
    barArrangement: 'grouped',
    barGapPercent: 21,
    barSeriesGapPercent: 30,
    barRadius: 100,
    barRoundPeaks: true,
    barMaxWidth: 120,
    barValuePosition: 'top',
    colorBarsByData: true,
  },
  pie: {
    showValueLabels: false,
    pieInnerRadius: 0,
    pieOuterRadius: 64,
    piePadAngle: 2,
    pieLabelPosition: 'outside',
    showPieLabels: true,
    showPieLabelLines: true,
  },
  doughnut: {
    showValueLabels: false,
    pieInnerRadius: 46,
    pieOuterRadius: 70,
    piePadAngle: 2,
    pieLabelPosition: 'outside',
    showPieLabels: true,
    showPieLabelLines: true,
  },
  area: {
    showValueLabels: false,
    lineWidth: 5,
    smoothLines: true,
    showLineSymbols: false,
    areaOpacity: 30,
    showEndLabel: false,
  },
  scatter: {
    showValueLabels: false,
    scatterSymbol: 'circle',
    scatterSymbolSize: 18,
    scatterOpacity: 90,
    scatterShadowBlur: 18,
    scatterShadowOffsetY: 4,
  },
  radar: {
    showValueLabels: false,
    showRadarNames: true,
    radarShape: 'polygon',
    radarRadius: 60,
    radarSplitNumber: 4,
    radarAreaOpacity: 20,
    radarLineWidth: 3,
    showRadarSplitArea: true,
  },
}

export function createStylePreset(type: ChartType): ResolvedChartStyle {
  const defaults = createDefaultChartStyle()
  return {
    ...defaults,
    ...TYPE_OVERRIDES[type],
    palette: [...defaults.palette],
    paletteOpacities: [...defaults.paletteOpacities],
  }
}
