import type { CatalogPaletteId, PaletteSelectionId } from './stylePresets'

export interface NewUiPaletteChoice {
  id: Exclude<PaletteSelectionId, 'custom'>
  name: string
  colors: string[]
  group: NewUiPaletteGroup
}

export type NewUiPaletteGroup = 'bright' | 'dark' | 'pastel'

export const NEW_UI_PALETTE_CHOICES: NewUiPaletteChoice[] = [
  {
    id: 'mono',
    name: 'Одноцветная',
    colors: ['#f4f1ff', '#d8ccff', '#b5a0ff', '#8e6dff', '#6a38f0'],
    group: 'bright',
  },
  {
    id: 'fokus',
    name: 'Яркая',
    colors: ['#7559ff', '#00b587', '#ffc548', '#f23f3a', '#fe76b4'],
    group: 'bright',
  },
  {
    id: 'warm',
    name: 'Закат',
    colors: ['#3a0ca3', '#7308b8', '#f72586', '#f97f02', '#ffba0a'],
    group: 'bright',
  },
  {
    id: 'catalog-U02' as CatalogPaletteId,
    name: 'U02 Электрический спектр',
    colors: ['#ffbe0b', '#fb5607', '#ff006e', '#8338ec', '#3a86ff'],
    group: 'bright',
  },
  {
    id: 'catalog-U07' as CatalogPaletteId,
    name: 'U07 Цветная инфографика',
    colors: ['#ef476f', '#ffd166', '#06d6a0', '#118ab2', '#073b4c'],
    group: 'bright',
  },
  {
    id: 'catalog-U12' as CatalogPaletteId,
    name: 'U12 Яркий плакат',
    colors: ['#2274a5', '#f75c03', '#f1c40f', '#d90368', '#00cc66'],
    group: 'bright',
  },
  {
    id: 'contrast',
    name: 'Контрастная',
    colors: ['#101010', '#5500eb', '#00b587', '#ffc548', '#f23f3a'],
    group: 'dark',
  },
  {
    id: 'catalog-U03' as CatalogPaletteId,
    name: 'U03 Глина и олива',
    colors: ['#c9cba3', '#ffe1a8', '#e26d5c', '#723d46', '#472d30'],
    group: 'dark',
  },
  {
    id: 'catalog-U04' as CatalogPaletteId,
    name: 'U04 Охра',
    colors: ['#7c6a0a', '#babd8d', '#ffdac6', '#fa9500', '#eb6424'],
    group: 'dark',
  },
  {
    id: 'catalog-U08' as CatalogPaletteId,
    name: 'U08 Индиго и селадон',
    colors: ['#360568', '#5b2a86', '#7785ac', '#9ac6c5', '#a5e6ba'],
    group: 'dark',
  },
  {
    id: 'catalog-U10' as CatalogPaletteId,
    name: 'U10 Мята и канарейка',
    colors: ['#d6f8d6', '#7fc6a4', '#5d737e', '#55505c', '#faf33e'],
    group: 'dark',
  },
  {
    id: 'catalog-D14' as CatalogPaletteId,
    name: 'D14 Индиго и апельсин',
    colors: ['#5e6883', '#a0550c', '#6c6863', '#5865a1', '#666687'],
    group: 'dark',
  },
  {
    id: 'catalog-D15' as CatalogPaletteId,
    name: 'D15 Атлантика и коралл',
    colors: ['#65696c', '#846334', '#9c5547', '#416c92', '#66696b'],
    group: 'dark',
  },
  {
    id: 'catalog-D16' as CatalogPaletteId,
    name: 'D16 Терракота и туман',
    colors: ['#696962', '#576d6e', '#b44427', '#756564', '#8d5c5b'],
    group: 'dark',
  },
  {
    id: 'catalog-D17' as CatalogPaletteId,
    name: 'D17 Весенняя биржа',
    colors: ['#686d24', '#45743c', '#007848', '#4669a3', '#566b80'],
    group: 'dark',
  },
  {
    id: 'catalog-D18' as CatalogPaletteId,
    name: 'D18 Овсяный графит',
    colors: ['#6d6860', '#8a6035', '#a35139', '#5e6a77', '#626972'],
    group: 'dark',
  },
  {
    id: 'catalog-D20' as CatalogPaletteId,
    name: 'D20 Глубокая весна',
    colors: ['#00203e', '#dbe54c', '#76c365', '#00804c', '#1e4890'],
    group: 'dark',
  },
  {
    id: 'catalog-D21' as CatalogPaletteId,
    name: 'D21 Коралл и лёд',
    colors: ['#351e1f', '#a0c8cb', '#fe6038', '#753435'],
    group: 'dark',
  },
  {
    id: 'catalog-D22' as CatalogPaletteId,
    name: 'D22 Янтарный сланец',
    colors: ['#2c3b4e', '#feb261', '#a45139', '#1c2632', '#c8c2b2'],
    group: 'dark',
  },
  {
    id: 'chalk',
    name: 'Мелки',
    colors: ['#71c1e3', '#82bb89', '#f9ea6e', '#f9b77d', '#fca4b5'],
    group: 'pastel',
  },
  {
    id: 'catalog-U01' as CatalogPaletteId,
    name: 'U01 Сакура',
    colors: ['#cdb4db', '#ffc8dd', '#ffafcc', '#bde0fe', '#a2d2ff'],
    group: 'pastel',
  },
  {
    id: 'catalog-U06' as CatalogPaletteId,
    name: 'U06 Пион и шалфей',
    colors: ['#e06c9f', '#f283b6', '#edbfb7', '#b5bfa1', '#6e9887'],
    group: 'pastel',
  },
  {
    id: 'catalog-U09' as CatalogPaletteId,
    name: 'U09 Чайный сад',
    colors: ['#cae7b9', '#f3de8a', '#eb9486', '#7e7f9a', '#97a7b3'],
    group: 'pastel',
  },
  {
    id: 'catalog-U11' as CatalogPaletteId,
    name: 'U11 Воздушная пастель',
    colors: ['#d3f8e2', '#e4c1f9', '#f694c1', '#ede7b1', '#a9def9'],
    group: 'pastel',
  },
  {
    id: 'catalog-U13' as CatalogPaletteId,
    name: 'U13 Глициния и миндаль',
    colors: ['#7f7eff', '#a390e4', '#c69dd2', '#cc8b8c', '#c68866'],
    group: 'pastel',
  },
]
