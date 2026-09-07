export type Vision = 'normal' | 'protanopia' | 'deuteranopia' | 'tritanopia'
export interface Palette { id: string; name: string; recommendedBackground: string; colors: string[]; accessibilityCandidate: boolean; origin?: 'user-reference' | 'editorial-original' }
export interface Pair { a: number; b: number; delta: number }
export interface Assessment {
  first3: Pair; first6: Pair; all10: Pair; adjacent: Pair; closure: Pair
  pairsBelow8: Pair[]; minimumContrast: {category: number; ratio: number}; below3: {category: number; ratio: number}[]
}
export interface Audit {
  id: string; nearestExisting: {id: string; distance: number}; nearestCandidate: {id: string; distance: number}
  modes: Record<Vision, { colors: string[]; recommendedBackground: string; oppositeBackground: string; recommended: Assessment; opposite: Assessment }>
}
export interface Note { character: string; weakness: string }
export const values = [72, 48, 91, 57, 83, 39, 66, 52, 78, 44]
export const visions: {id: Vision; name: string}[] = [
  {id:'normal',name:'Обычное зрение'}, {id:'protanopia',name:'Протанопия'},
  {id:'deuteranopia',name:'Дейтеранопия'}, {id:'tritanopia',name:'Тританопия'},
]
export const shortlist: Record<string, string> = {
  L01: 'Универсальная редакционная основа: чернила, глина и патина. Сильное начало, спокойное продолжение.',
  L06: 'Для выразительных графиков: плотный кобальт и ягодный акцент, при этом первые шесть хорошо разнесены.',
  L09: 'Сдержанный вариант с акцентом на CVD: сильная первая тройка и более спокойные минералы. Для десяти категорий нужны подписи.',
  D02: 'Самое выразительное ювелирное сочетание: бирюза, медь и ирис. Хорошая различимость всей десятки.',
  D05: 'Спокойный технический вариант с широким диапазоном светлоты; сильные первые шесть в симуляциях.',
  D07: 'Насыщенный ягодный вариант для чёрного фона. Хорошо различимые десять цветов и крупный контраст соседних секторов.',
}
