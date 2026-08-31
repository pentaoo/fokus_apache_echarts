<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import tableClearIcon from '../assets/new-ui/table-clear.svg'

interface DataSeries {
  id: number
  name: string
  values: Array<number | null>
}

const props = defineProps<{
  categories: string[]
  series: DataSeries[]
}>()

const emit = defineEmits<{
  'update-category': [index: number, value: string]
  'update-series-name': [seriesId: number, value: string]
  'update-number': [seriesId: number, rowIndex: number, value: string]
  'remove-series': [seriesId: number]
  'remove-row': [rowIndex: number]
  'add-row': []
  'add-series': []
  transpose: []
  clear: []
}>()

const scrollElement = ref<HTMLElement | null>(null)
const menuButton = ref<HTMLButtonElement | null>(null)
const menuRoot = ref<HTMLElement | null>(null)
const menuOpen = ref(false)
const importOpen = ref(false)
const showBottomFade = ref(false)
const notice = ref('')
let noticeTimer = 0

const tableStyle = computed(() => {
  const seriesColumnCount = Math.max(1, props.series.length)
  return {
    '--series-column-count': String(seriesColumnCount),
    '--category-column-width': props.series.length > 0 ? '153px' : 'calc(100% - 40px)',
  }
})

function updateOverflowState() {
  const element = scrollElement.value
  if (!element) return
  showBottomFade.value =
    element.scrollHeight > element.clientHeight + 1 &&
    element.scrollTop + element.clientHeight < element.scrollHeight - 1
}

function closeMenu(returnFocus = false) {
  const wasOpen = menuOpen.value
  menuOpen.value = false
  importOpen.value = false
  if (returnFocus && wasOpen) nextTick(() => menuButton.value?.focus())
}

function onDocumentPointerDown(event: PointerEvent) {
  if (menuOpen.value && !menuRoot.value?.contains(event.target as Node)) {
    closeMenu()
  }
}

function announceImport() {
  notice.value = 'Импорт будет доступен позже'
  window.clearTimeout(noticeTimer)
  noticeTimer = window.setTimeout(() => (notice.value = ''), 2400)
}

function editableCells() {
  return Array.from(
    scrollElement.value?.querySelectorAll<HTMLInputElement>('[data-grid-cell]') ?? [],
  )
}

function focusCell(row: number, column: number) {
  const target = editableCells().find(
    (cell) => Number(cell.dataset.row) === row && Number(cell.dataset.column) === column,
  )
  target?.focus()
}

function onCellKeydown(event: KeyboardEvent) {
  const input = event.currentTarget as HTMLInputElement
  const row = Number(input.dataset.row)
  const column = Number(input.dataset.column)
  let nextRow = row
  let nextColumn = column

  if (event.key === 'Escape') {
    input.blur()
    return
  }
  if (event.key === 'Enter') nextRow += 1
  else if (event.key === 'ArrowUp') nextRow -= 1
  else if (event.key === 'ArrowDown') nextRow += 1
  else if (event.key === 'ArrowLeft' && input.selectionStart === 0 && input.selectionEnd === 0) nextColumn -= 1
  else if (
    event.key === 'ArrowRight' &&
    input.selectionStart === input.value.length &&
    input.selectionEnd === input.value.length
  ) nextColumn += 1
  else return

  const exists = editableCells().some(
    (cell) => Number(cell.dataset.row) === nextRow && Number(cell.dataset.column) === nextColumn,
  )
  if (!exists) return
  event.preventDefault()
  focusCell(nextRow, nextColumn)
}

function updateCategory(index: number, event: Event) {
  const value = (event.target as HTMLInputElement).value
  if (value.trim() !== '' && /^[-+]?\d+(?:[.,]\d+)?$/.test(value.trim())) return
  emit('update-category', index, value)
}

function normalizeCategory(index: number, event: FocusEvent) {
  const input = event.target as HTMLInputElement
  if (/^[-+]?\d+(?:[.,]\d+)?$/.test(input.value.trim())) input.value = props.categories[index] ?? ''
}

function normalizeNumber(seriesId: number, rowIndex: number, event: FocusEvent) {
  if ((event.target as HTMLInputElement).value.trim() === '') {
    emit('update-number', seriesId, rowIndex, '0')
  }
}

async function addRow() {
  const row = props.categories.length + 1
  emit('add-row')
  await nextTick()
  requestAnimationFrame(() => {
    if (scrollElement.value) scrollElement.value.scrollTop = scrollElement.value.scrollHeight
    focusCell(row, 0)
    updateOverflowState()
  })
}

async function addSeries() {
  const column = props.series.length + 1
  emit('add-series')
  await nextTick()
  requestAnimationFrame(() => {
    focusCell(0, column)
  })
}

function runMenuAction(action: 'transpose' | 'clear') {
  if (action === 'transpose') emit('transpose')
  else emit('clear')
  closeMenu(true)
  nextTick(updateOverflowState)
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocumentPointerDown)
  nextTick(updateOverflowState)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown)
  window.clearTimeout(noticeTimer)
})
</script>

<template>
  <section class="new-data-editor" aria-label="Данные графика">
    <div class="new-data-main">
      <div
        ref="scrollElement"
        class="new-data-scroll"
        :class="{ 'has-bottom-fade': showBottomFade }"
        @scroll="updateOverflowState"
      >
        <table :style="tableStyle">
          <thead>
            <tr>
              <th class="row-index corner" aria-hidden="true" />
              <th class="content-column category-header">
                <input value="Месяц" readonly aria-label="Название колонки категорий" />
              </th>
              <th v-for="(seriesItem, seriesIndex) in series" :key="seriesItem.id" class="content-column series-header">
                <input
                  :value="seriesItem.name"
                  type="text"
                  data-grid-cell
                  data-row="0"
                  :data-column="seriesIndex + 1"
                  :aria-label="`Название серии ${seriesItem.name}`"
                  @input="emit('update-series-name', seriesItem.id, ($event.target as HTMLInputElement).value)"
                  @keydown="onCellKeydown"
                />
                <button
                  type="button"
                  class="delete-series"
                  :aria-label="`Удалить серию ${seriesItem.name}`"
                  @click="emit('remove-series', seriesItem.id)"
                >
                  <img :src="tableClearIcon" alt="" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(category, rowIndex) in categories" :key="rowIndex">
              <th class="row-index" scope="row">
                <span>{{ rowIndex + 1 }}</span>
                <button type="button" :aria-label="`Удалить строку ${rowIndex + 1}`" @click="emit('remove-row', rowIndex)">
                  <img :src="tableClearIcon" alt="" />
                </button>
              </th>
              <td class="content-column category-cell">
                <input
                  :value="category"
                  type="text"
                  data-grid-cell
                  :data-row="rowIndex + 1"
                  data-column="0"
                  :aria-label="`Категория, строка ${rowIndex + 1}`"
                  @input="updateCategory(rowIndex, $event)"
                  @blur="normalizeCategory(rowIndex, $event)"
                  @keydown="onCellKeydown"
                />
              </td>
              <td v-for="(seriesItem, seriesIndex) in series" :key="seriesItem.id" class="content-column series-cell">
                <input
                  :value="seriesItem.values[rowIndex] ?? ''"
                  type="number"
                  step="any"
                  data-grid-cell
                  :data-row="rowIndex + 1"
                  :data-column="seriesIndex + 1"
                  :aria-label="`${seriesItem.name}, ${category}`"
                  @input="emit('update-number', seriesItem.id, rowIndex, ($event.target as HTMLInputElement).value)"
                  @blur="normalizeNumber(seriesItem.id, rowIndex, $event)"
                  @keydown="onCellKeydown"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <button type="button" class="add-series-button" aria-label="Добавить серию" @click="addSeries">+</button>
    </div>

    <div class="new-data-footer">
      <button type="button" class="add-row-button" @click="addRow">Добавить строку</button>
      <div ref="menuRoot" class="data-menu-root">
        <button
          ref="menuButton"
          type="button"
          class="data-menu-button"
          :class="{ open: menuOpen }"
          aria-label="Меню данных"
          :aria-expanded="menuOpen"
          @click="menuOpen = !menuOpen; importOpen = false"
          @keydown.esc.prevent="closeMenu(true)"
        ><span aria-hidden="true">•••</span></button>
        <div v-if="menuOpen" class="data-menu" @keydown.esc.prevent="closeMenu(true)">
          <button type="button" @click="importOpen = !importOpen">Импортировать</button>
          <div v-if="importOpen" class="import-menu">
            <button type="button" @click="announceImport">XLSX</button>
            <button type="button" @click="announceImport">Google Sheets</button>
            <button type="button" @click="announceImport">Другие форматы</button>
          </div>
          <button type="button" @click="runMenuAction('transpose')">Транспонировать</button>
          <button type="button" @click="runMenuAction('clear')">Очистить</button>
        </div>
      </div>
    </div>
    <p v-if="notice" class="data-notice" role="status">{{ notice }}</p>
  </section>
</template>

<style scoped>
.new-data-editor { position: relative; width: 100%; font-family: "ALS Hauss", Arial, sans-serif; }
.new-data-main { display: flex; width: 100%; align-items: stretch; gap: 2px; }
.new-data-scroll { position: relative; flex: 1 1 auto; width: 0; max-height: 240px; overflow-x: hidden; overflow-y: auto; overscroll-behavior-y: none; border-radius: 26px 4px 4px 4px; scrollbar-width: none; }
.new-data-scroll::-webkit-scrollbar { display: none; }
.new-data-scroll::after { position: sticky; z-index: 5; bottom: 0; left: 0; display: block; width: 100%; height: 24px; margin-top: -24px; background: linear-gradient(transparent, #f6f6f6); content: ""; opacity: 0; pointer-events: none; transition: opacity 120ms ease; }
.new-data-scroll.has-bottom-fade::after { opacity: 1; }
table { width: 100%; min-width: 0; border-collapse: separate; border-spacing: 0; table-layout: fixed; }
th, td { box-sizing: border-box; height: 40px; padding: 0; border: .5px solid #e9e9ea; background: #fff; box-shadow: none; }
thead th { position: sticky; z-index: 4; top: 0; border-top: 0; color: #9a999f; font-size: 12px; font-weight: 400; }
.row-index { position: sticky; z-index: 3; left: 0; width: 40px; min-width: 40px; max-width: 40px; border-left: 0; text-align: center; color: #9a999f; font-size: 12px; font-weight: 400; }
thead .row-index { z-index: 6; border-radius: 26px 0 0; }
.content-column { min-width: 0; }
.category-header, .category-cell { width: var(--category-column-width); }
.series-header, .series-cell { width: calc((100% - 40px - var(--category-column-width)) / var(--series-column-count)); }
thead .content-column:last-of-type { border-radius: 0 4px 0 0; }
tbody tr:last-child .row-index { border-radius: 0 0 0 4px; }
tbody tr:last-child td.content-column:last-of-type { border-radius: 0 0 4px; }
input { box-sizing: border-box; width: 100%; min-width: 0; height: 39px; min-height: 39px; overflow: hidden; padding: 11.5px 18px; border: 0; border-radius: 0; outline: 0; color: #000; background: transparent; box-shadow: none; font: 400 16px/16px "ALS Hauss", Arial, sans-serif; text-overflow: ellipsis; white-space: nowrap; }
thead input { color: #9a999f; font-size: 12px; }
input:read-only { cursor: default; }
input::-webkit-inner-spin-button { appearance: none; }
input[type="number"] { appearance: textfield; }
.series-header { position: sticky; }
.series-header input { padding-left: min(18px, 15%); padding-right: min(42px, 30%); }
.series-cell input { padding-inline: min(18px, 15%); }
.delete-series, .row-index button { position: absolute; display: grid; width: 16px; min-width: 16px; height: 16px; min-height: 16px; padding: 2px; border: 0; border-radius: 999px; background: transparent; box-shadow: none; opacity: 0; place-items: center; }
.delete-series img, .row-index button img { display: block; width: 12px; height: 12px; }
.delete-series { top: 12px; right: 16px; }
.row-index button { top: 12px; left: 12px; }
.series-header:hover .delete-series, .row-index:hover button, .delete-series:focus-visible, .row-index button:focus-visible { opacity: 1; }
.row-index:hover span, .row-index:focus-within span { opacity: 0; }
.delete-series:hover, .row-index button:hover, .delete-series:focus-visible, .row-index button:focus-visible { background: transparent; outline: 0; opacity: 1; }
.add-series-button { flex: 0 0 40px; align-self: stretch; width: 40px; min-width: 40px; height: auto; min-height: 40px; padding: 0; border: 0; border-radius: 4px 26px 4px 4px; color: #5500eb; background: #fff; box-shadow: none; font-size: 25px; }
.add-series-button:hover, .add-series-button:focus-visible { background: #ececec; outline: 0; }
.new-data-footer { display: flex; gap: 2px; margin-top: 2px; }
.add-row-button { display: flex; flex: 1; height: 40px; align-items: center; justify-content: center; padding: 8px 10px 8px 52px; border: 0; border-radius: 4px 4px 4px 20px; color: #000; background: #fff; font-size: 16px; line-height: 24px; text-align: center; }
.add-row-button:hover, .add-row-button:focus-visible { background: #ececec; outline: 0; }
.data-menu-root { position: relative; flex: 0 0 40px; }
.data-menu-button { display: grid; width: 40px; height: 40px; padding: 0; border: 0; border-radius: 4px 4px 16px 4px; color: #5500eb; background: #fff; place-items: center; }
.data-menu-button span { transform: rotate(90deg); font-size: 13px; letter-spacing: 1px; }
.data-menu-button:hover { color: #fff; background: #5500eb; }
.data-menu-button.open { position: absolute; right: 0; bottom: 4px; width: 40px; min-width: 40px; height: 40px; min-height: 40px; border: 0; border-radius: 50%; color: #fff; background: #000; }
.data-menu { position: absolute; z-index: 20; right: 0; top: 44px; display: flex; min-width: 148px; flex-direction: column; overflow: visible; padding: 4px 0; border-radius: 12px 4px 12px 12px; background: #000; }
.data-menu button { min-height: 32px; padding: 8px 12px; border: 0; color: #fff; background: transparent; font-size: 12px; text-align: left; white-space: nowrap; }
.data-menu button:hover, .data-menu button:focus-visible { background: #242424; outline: 0; }
.import-menu { position: absolute; top: 4px; right: calc(100% + 4px); display: flex; min-width: 132px; flex-direction: column; overflow: hidden; border-radius: 12px; background: #000; }
.data-notice { position: absolute; z-index: 30; right: 0; top: calc(100% + 8px); margin: 0; padding: 8px 12px; border-radius: 12px; color: #fff; background: #000; font-size: 12px; }
.new-data-editor :is(input, button):focus,
.new-data-editor :is(input, button):focus-visible { outline: 0 !important; box-shadow: none !important; }
</style>
