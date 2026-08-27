<script setup lang="ts">
interface DataSeries {
  id: number
  name: string
  values: Array<number | null>
}

defineProps<{
  categories: string[]
  series: DataSeries[]
  headingId: string
}>()

const emit = defineEmits<{
  'update-category': [index: number, value: string]
  'update-series-name': [seriesId: number, value: string]
  'update-number': [seriesId: number, rowIndex: number, value: string]
  'remove-series': [seriesId: number]
  'remove-row': [rowIndex: number]
  'add-row': []
  'add-series': []
}>()
</script>

<template>
  <section class="panel editor-panel" :aria-labelledby="headingId">
    <div class="panel-heading">
      <div>
        <h2 :id="headingId">Редактор данных</h2>
        <p>{{ categories.length }} строк · {{ series.length }} серий</p>
      </div>
    </div>

    <div class="table-scroll">
      <table>
        <thead>
          <tr>
            <th scope="col">Категория</th>
            <th
              v-for="seriesItem in series"
              :key="seriesItem.id"
              scope="col"
            >
              <div class="series-heading">
                <input
                  :value="seriesItem.name"
                  class="series-name"
                  type="text"
                  :aria-label="`Название серии ${seriesItem.id}`"
                  @input="emit('update-series-name', seriesItem.id, ($event.target as HTMLInputElement).value)"
                />
                <button
                  class="icon-button"
                  type="button"
                  :aria-label="`Удалить ${seriesItem.name}`"
                  title="Удалить серию"
                  @click="emit('remove-series', seriesItem.id)"
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
          <tr v-for="(category, rowIndex) in categories" :key="rowIndex">
            <td>
              <input
                :value="category"
                type="text"
                :aria-label="`Категория, строка ${rowIndex + 1}`"
                @input="emit('update-category', rowIndex, ($event.target as HTMLInputElement).value)"
              />
            </td>
            <td
              v-for="seriesItem in series"
              :key="seriesItem.id"
            >
              <input
                :value="seriesItem.values[rowIndex] ?? ''"
                type="number"
                step="any"
                :aria-label="`${seriesItem.name}, ${category}`"
                @input="emit('update-number', seriesItem.id, rowIndex, ($event.target as HTMLInputElement).value)"
              />
            </td>
            <td class="delete-column">
              <button
                class="icon-button"
                type="button"
                :aria-label="`Удалить строку ${rowIndex + 1}`"
                title="Удалить строку"
                @click="emit('remove-row', rowIndex)"
              >
                ×
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="editor-actions">
      <button type="button" @click="emit('add-row')">+ Добавить строку</button>
      <button type="button" @click="emit('add-series')">+ Добавить серию</button>
    </div>
  </section>
</template>
