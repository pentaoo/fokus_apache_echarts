<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import menuDeleteIcon from '../assets/new-ui/menu-delete.svg'
import menuImportIcon from '../assets/new-ui/menu-import.svg'
import moreVertPurpleIcon from '../assets/new-ui/more-vert-purple.svg'
import moreVertWhiteIcon from '../assets/new-ui/more-vert-white.svg'
import tableAddIcon from '../assets/new-ui/table-add.svg'
import tableClearIcon from '../assets/new-ui/table-clear.svg'
import tableTransposeIcon from '../assets/new-ui/table-transpose.svg'

interface DataSeries {
  id: number
  name: string
  values: Array<number | null>
}

interface ImportedSeries {
  name: string
  values: Array<number | null>
}

interface ImportedTableData {
  categories: string[]
  series: ImportedSeries[]
}

type SpreadsheetCell = string | number | boolean | Date | null | undefined

const IMPORT_FILE_TYPES = '.xlsx,.csv,.tsv,text/csv,text/tab-separated-values,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
const MAX_IMPORT_FILE_SIZE = 10 * 1024 * 1024

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
  import: [data: ImportedTableData]
  clear: []
}>()

const scrollElement = ref<HTMLElement | null>(null)
const menuButton = ref<HTMLButtonElement | null>(null)
const importButton = ref<HTMLButtonElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const menuRoot = ref<HTMLElement | null>(null)
const menuOpen = ref(false)
const showBottomFade = ref(false)
const importMessage = ref('')
const importMessageKind = ref<'success' | 'error'>('success')
let importMessageTimer: ReturnType<typeof setTimeout> | undefined

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
  if (returnFocus && wasOpen) nextTick(() => menuButton.value?.focus())
}

async function toggleMenu() {
  menuOpen.value = !menuOpen.value
  if (menuOpen.value) {
    await nextTick()
    importButton.value?.focus()
  }
}

function onDocumentPointerDown(event: PointerEvent) {
  if (menuOpen.value && !menuRoot.value?.contains(event.target as Node)) {
    closeMenu()
  }
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

function clearTable() {
  emit('clear')
  closeMenu(true)
  nextTick(updateOverflowState)
}

function showImportMessage(message: string, kind: 'success' | 'error') {
  if (importMessageTimer) clearTimeout(importMessageTimer)
  importMessage.value = message
  importMessageKind.value = kind
  importMessageTimer = setTimeout(() => {
    importMessage.value = ''
  }, 5000)
}

function openImportDialog() {
  closeMenu()
  fileInput.value?.click()
}

function countDelimiter(line: string, delimiter: string) {
  let count = 0
  let quoted = false
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index]
    if (character === '"') {
      if (quoted && line[index + 1] === '"') index += 1
      else quoted = !quoted
    } else if (!quoted && character === delimiter) {
      count += 1
    }
  }
  return count
}

function detectDelimiter(text: string) {
  const firstRecord = text.split(/\r?\n/, 1)[0] ?? ''
  return ['\t', ';', ','].reduce((best, candidate) =>
    countDelimiter(firstRecord, candidate) > countDelimiter(firstRecord, best) ? candidate : best,
  '\t')
}

function parseDelimitedText(text: string): SpreadsheetCell[][] {
  const source = text.replace(/^\uFEFF/, '')
  const delimiter = detectDelimiter(source)
  const rows: SpreadsheetCell[][] = []
  let row: SpreadsheetCell[] = []
  let cell = ''
  let quoted = false

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index]
    if (character === '"') {
      if (quoted && source[index + 1] === '"') {
        cell += '"'
        index += 1
      } else {
        quoted = !quoted
      }
    } else if (!quoted && character === delimiter) {
      row.push(cell)
      cell = ''
    } else if (!quoted && (character === '\n' || character === '\r')) {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
      if (character === '\r' && source[index + 1] === '\n') index += 1
    } else {
      cell += character
    }
  }

  row.push(cell)
  rows.push(row)
  return rows
}

function isBlankCell(cell: SpreadsheetCell) {
  return cell == null || (typeof cell === 'string' && cell.trim() === '')
}

function cellToLabel(cell: SpreadsheetCell) {
  if (cell instanceof Date) return cell.toLocaleDateString('ru-RU')
  return cell == null ? '' : String(cell).trim()
}

function cellToNumber(cell: SpreadsheetCell): number | null {
  if (typeof cell === 'number') return Number.isFinite(cell) ? cell : null
  if (typeof cell !== 'string') return null

  let value = cell.trim().replace(/[\s\u00a0]/g, '').replace('−', '-')
  if (!value) return null
  if (value.includes(',') && value.includes('.')) {
    if (value.lastIndexOf(',') > value.lastIndexOf('.')) value = value.replace(/\./g, '').replace(',', '.')
    else value = value.replace(/,/g, '')
  } else {
    value = value.replace(',', '.')
  }
  const result = Number(value)
  return Number.isFinite(result) ? result : null
}

function normalizeImportedTable(sourceRows: SpreadsheetCell[][]): ImportedTableData {
  const rows = sourceRows
    .map((sourceRow) => {
      const row = [...sourceRow]
      while (row.length > 0 && isBlankCell(row[row.length - 1])) row.pop()
      return row
    })
    .filter((row) => row.some((cell) => !isBlankCell(cell)))

  if (rows.length < 2 || Math.max(...rows.map((row) => row.length), 0) < 2) {
    throw new Error('В таблице нужны заголовки и хотя бы одна строка данных')
  }

  const columnCount = Math.max(...rows.map((row) => row.length))
  const seriesCount = columnCount - 1
  const body = rows.slice(1)
  const categories = body.map((row, index) => cellToLabel(row[0]) || `Категория ${index + 1}`)
  const series = Array.from({ length: seriesCount }, (_, seriesIndex) => ({
    name: cellToLabel(rows[0]?.[seriesIndex + 1]) || `Серия ${seriesIndex + 1}`,
    values: body.map((row) => cellToNumber(row[seriesIndex + 1])),
  }))

  if (!series.some((item) => item.values.some((value) => value !== null))) {
    throw new Error('Не найдено числовых значений для графика')
  }

  return { categories, series }
}

async function readSpreadsheet(file: File): Promise<SpreadsheetCell[][]> {
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (extension === 'csv' || extension === 'tsv') return parseDelimitedText(await file.text())
  if (extension === 'xlsx') {
    const { readSheet } = await import('read-excel-file/browser')
    // Runtime dates are Date instances; the package currently types them as DateConstructor.
    return readSheet(file) as unknown as SpreadsheetCell[][]
  }
  throw new Error('Поддерживаются файлы XLSX, CSV и TSV')
}

async function importFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  try {
    if (file.size > MAX_IMPORT_FILE_SIZE) throw new Error('Файл должен быть меньше 10 МБ')
    const importedData = normalizeImportedTable(await readSpreadsheet(file))
    emit('import', importedData)
    showImportMessage(`Импортировано: ${file.name}`, 'success')
    await nextTick()
    updateOverflowState()
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось прочитать файл'
    showImportMessage(message, 'error')
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocumentPointerDown)
  nextTick(updateOverflowState)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown)
  if (importMessageTimer) clearTimeout(importMessageTimer)
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
              <th class="row-index corner">
                <button
                  type="button"
                  class="transpose-button"
                  aria-label="Транспонировать данны"
                  @click="emit('transpose')"
                >
                  <img :src="tableTransposeIcon" alt="" />
                </button>
              </th>
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
      <button type="button" class="add-series-button" aria-label="Добавить серию" @click="addSeries">
        <img :src="tableAddIcon" alt="" />
      </button>
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
          aria-haspopup="menu"
          @click="toggleMenu"
          @keydown.esc.prevent="closeMenu(true)"
        >
          <img class="menu-icon-default" :src="moreVertPurpleIcon" alt="" />
          <img class="menu-icon-active" :src="moreVertWhiteIcon" alt="" />
        </button>
        <div v-if="menuOpen" class="data-menu" role="menu" @keydown.esc.prevent="closeMenu(true)">
          <button ref="importButton" type="button" role="menuitem" @click="openImportDialog">
            <img :src="menuImportIcon" alt="" />
            <span>Импортировать</span>
          </button>
          <button type="button" role="menuitem" @click="clearTable">
            <img :src="menuDeleteIcon" alt="" />
            <span>Очистить</span>
          </button>
        </div>
      </div>
      <input
        ref="fileInput"
        class="import-file-input"
        type="file"
        :accept="IMPORT_FILE_TYPES"
        aria-label="Импортировать таблицу"
        @change="importFile"
      />
    </div>
    <p
      v-if="importMessage"
      class="import-message"
      :class="`is-${importMessageKind}`"
      role="status"
      aria-live="polite"
    >
      {{ importMessage }}
    </p>
  </section>
</template>

<style scoped>
.new-data-editor { position: relative; width: 100%; font-family: "ALS Hauss", Arial, sans-serif; }
.new-data-main { display: flex; width: 100%; align-items: stretch; gap: 2px; }
.new-data-scroll { position: relative; flex: 1 1 auto; width: 0; max-height: 240px; overflow-x: hidden; overflow-y: auto; overscroll-behavior-y: none; border-radius: 16px 4px 4px 4px; scrollbar-width: none; }
.new-data-scroll::-webkit-scrollbar { display: none; }
.new-data-scroll::after { position: sticky; z-index: 5; bottom: 0; left: 0; display: block; width: 100%; height: 24px; margin-top: -24px; background: linear-gradient(transparent, #f6f6f6); content: ""; opacity: 0; pointer-events: none; transition: opacity 120ms ease; }
.new-data-scroll.has-bottom-fade::after { opacity: 1; }
table { width: 100%; min-width: 0; border-collapse: separate; border-spacing: 0; table-layout: fixed; }
th, td { box-sizing: border-box; height: 40px; padding: 0; border: .5px solid #e9e9ea; background: #fff; box-shadow: none; }
thead th { position: sticky; z-index: 4; top: 0; border-top: 0; color: #9a999f; font-size: 12px; font-weight: 400; }
.row-index { position: sticky; z-index: 3; left: 0; width: 40px; min-width: 40px; max-width: 40px; border-left: 0; text-align: center; color: #9a999f; font-size: 12px; font-weight: 400; }
thead .row-index { z-index: 6; border-radius: 16px 0 0; }
.content-column { min-width: 0; }
.category-header, .category-cell { width: var(--category-column-width); }
.series-header, .series-cell { width: calc((100% - 40px - var(--category-column-width)) / var(--series-column-count)); }
thead .content-column:last-of-type { border-radius: 0 4px 0 0; }
tbody tr:last-child .row-index { border-radius: 0 0 0 4px; }
tbody tr:last-child td.content-column:last-of-type { border-radius: 0 0 4px; }
tbody tr:last-child > :is(th, td) { border-bottom: 0; }
input { box-sizing: border-box; width: 100%; min-width: 0; height: 39px; min-height: 39px; overflow: hidden; padding: 11.5px 18px; border: 0; border-radius: 0; outline: 0; color: #000; background: transparent; box-shadow: none; font: 400 16px/16px "ALS Hauss", Arial, sans-serif; text-overflow: ellipsis; white-space: nowrap; }
thead input { color: #9a999f; font-size: 12px; }
input:read-only { cursor: default; }
input::-webkit-inner-spin-button { appearance: none; }
input[type="number"] { appearance: textfield; }
.series-header { position: sticky; }
.series-header input { padding-left: min(18px, 15%); padding-right: min(42px, 30%); }
.series-cell input { padding-inline: min(18px, 15%); }
.delete-series, tbody .row-index button { position: absolute; display: grid; width: 16px; min-width: 16px; height: 16px; min-height: 16px; padding: 2px; border: 0; border-radius: 999px; background: transparent; box-shadow: none; opacity: 0; place-items: center; }
.delete-series img, tbody .row-index button img { display: block; width: 12px; height: 12px; }
.delete-series { top: 12px; right: 16px; }
tbody .row-index button { top: 12px; left: 12px; }
.series-header:hover .delete-series, .row-index:hover button, .delete-series:focus-visible, .row-index button:focus-visible { opacity: 1; }
.row-index:not(.corner):hover span, .row-index:not(.corner):focus-within span { opacity: 0; }
.delete-series:hover, .row-index button:hover, .delete-series:focus-visible, .row-index button:focus-visible { background: transparent; outline: 0; opacity: 1; }
.transpose-button { display: grid; width: 40px; min-width: 40px; height: 40px; min-height: 40px; padding: 8px; border: 0; border-radius: 16px 0 0; background: transparent; place-items: center; }
.transpose-button img, .add-series-button img { display: block; width: 24px; min-width: 24px; height: 24px; min-height: 24px; }
.transpose-button:hover, .transpose-button:focus-visible { background: #ececec; }
.add-series-button { flex: 0 0 40px; align-self: stretch; display: grid; width: 40px; min-width: 40px; height: auto; min-height: 40px; padding: 8px; border: 0; border-radius: 4px 26px 4px 4px; background: #fff; box-shadow: none; place-items: center; }
.add-series-button:hover, .add-series-button:focus-visible { background: #ececec; outline: 0; }
.new-data-footer { display: flex; gap: 2px; margin-top: 2px; }
.add-row-button { display: flex; flex: 1; height: 40px; align-items: center; justify-content: center; padding: 8px 10px 8px 52px; border: 0; border-radius: 8px 4px 4px 26px; color: #000; background: #fff; font-size: 16px; line-height: 24px; text-align: center; }
.add-row-button:hover, .add-row-button:focus-visible { background: #ececec; outline: 0; }
.data-menu-root { position: relative; flex: 0 0 40px; }
.data-menu-button { display: flex; width: 40px; min-width: 40px; height: 40px; min-height: 40px; align-items: center; justify-content: center; padding: 6px 12px; border: 0; border-radius: 4px 4px 20px 4px; background: #fff; }
.data-menu-button img { display: block; width: 24px; min-width: 24px; height: 24px; min-height: 24px; }
.data-menu-button .menu-icon-active { display: none; }
.data-menu-button:hover, .data-menu-button:focus-visible { background: #ccc; }
.data-menu-button.open .menu-icon-default { display: none; }
.data-menu-button.open .menu-icon-active { display: block; }
.data-menu-button.open { padding: 8px; border-radius: 20px; background: #000; }
.data-menu { position: absolute; z-index: 20; right: 0; top: 44px; display: flex; width: 193px; flex-direction: column; align-items: stretch; gap: 2px; overflow: hidden; box-sizing: border-box; padding: 6px; border-radius: 16px 4px 16px 16px; background: #000; }
.data-menu button { display: flex; width: 181px; min-height: 32px; align-items: center; gap: 6px; padding: 6px 9px 6px 6px; border: 0; border-radius: 10px; color: #fff; background: transparent; font: 400 14px/16px "ALS Hauss", Arial, sans-serif; text-align: left; white-space: nowrap; }
.data-menu button img { display: block; width: 20px; min-width: 20px; height: 20px; min-height: 20px; }
.data-menu button:hover, .data-menu button:focus-visible { background: rgb(255 255 255 / 20%); outline: 0; }
.import-file-input { position: fixed; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.import-message { position: absolute; z-index: 21; right: 0; top: calc(100% + 8px); max-width: min(320px, 100%); margin: 0; padding: 8px 12px; border-radius: 10px; color: #fff; background: #000; font: 400 13px/16px "ALS Hauss", Arial, sans-serif; }
.import-message.is-error { background: #b42318; }
.new-data-editor :is(input, button):focus,
.new-data-editor :is(input, button):focus-visible { outline: 0 !important; box-shadow: none !important; }
</style>
