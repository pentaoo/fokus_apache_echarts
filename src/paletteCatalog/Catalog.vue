<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import ChartPreview from './ChartPreview.vue'
import { shortlist, values, visions } from './types'
import type { Palette, Audit, Note, Pair, Vision } from './types'
const base = `${import.meta.env.BASE_URL}palette-catalog/`
const palettes = ref<Palette[]>([])
const audits = ref<Audit[]>([])
const notes = ref<Record<string,Note>>({})
const error = ref('')
const filter = ref('all')
const vision = ref<Vision>('normal')
const count = ref(10)
const renderer = ref<'svg'|'canvas'>('svg')
const groups = [{id:'L',name:'На светлом',background:'#FFFFFF'},{id:'D',name:'На чёрном',background:'#050608'}]
const rows = computed(() => palettes.value.map(p=>({...p,audit:audits.value.find(a=>a.id===p.id)!,note:notes.value[p.id]!})).filter(p=>filter.value==='all'||filter.value===p.id[0]||(filter.value==='shortlist'&&shortlist[p.id])||(filter.value==='cvd'&&p.accessibilityCandidate)||(filter.value==='references'&&p.origin==='user-reference')||(filter.value==='originals'&&p.origin==='editorial-original')))
const pair = (p:Pair) => `${String(p.a).padStart(2,'0')} / ${String(p.b).padStart(2,'0')}`
const num = (v:number) => v.toFixed(1)
const opposite = (p:Palette) => p.id.startsWith('L') ? '#050608' : '#FFFFFF'
function reveal(id: string) { filter.value='all'; requestAnimationFrame(()=>document.getElementById(id)?.scrollIntoView({block:'start'})) }
onMounted(async()=>{
  try {
    const load = async (name:string) => {const response=await fetch(base+name);if(!response.ok)throw new Error(`HTTP ${response.status}`);return response.json()}
    const [p,a,n] = await Promise.all([load('palettes.json'),load('audit.json'),load('notes.json')])
    palettes.value=p;audits.value=a.palettes;notes.value=n
  } catch(e) {error.value=`Не удалось загрузить каталог. ${String(e)}. Обновите страницу через локальный Vite-сервер.`}
})
</script>
<template>
  <main>
    <header class="intro">
      <div class="eyebrow">FOKUS / ИССЛЕДОВАНИЕ ЦВЕТА / 07.09.2026</div>
      <div class="headline"><h1>Цвет с характером.</h1><span class="edition">36<br><small>кандидатов</small></span></div>
      <p class="lede">Двадцать исходных. Шестнадцать новых.<br>Сложные оттенки, уверенные акценты, реальные графики.</p>
      <div class="intro-bottom"><p>Рабочий каталог для арт-директорского отбора.<br>13 новых наборов из референсов + 3 авторских.</p><a :href="base+'palettes.json'" download="palettes.json" class="download">Скачать 36 палитр · JSON ↗</a></div>
    </header>
    <section class="selection" aria-label="Рекомендованные кандидаты">
      <div><span class="eyebrow">МОЙ SHORTLIST</span><p>Три характера<br>на каждый фон</p></div>
      <div class="shortlist"><button v-for="(reason,id) in shortlist" :key="id" @click="reveal(String(id))" :title="reason"><strong>{{id}}</strong><span>{{palettes.find(p=>p.id===id)?.name}}</span></button></div>
    </section>
    <div class="toolbar">
      <label>Показать<select v-model="filter"><option value="all">Все 36 кандидатов</option><option value="references">Из референсов · 13</option><option value="originals">Новые авторские · 3</option><option value="L">На светлом · 17</option><option value="D">На чёрном · 19</option><option value="shortlist">Прежний shortlist · 6</option><option value="cvd">Акцент на CVD · 3</option></select></label>
      <label>Восприятие<select v-model="vision"><option v-for="v in visions" :key="v.id" :value="v.id">{{v.name}}</option></select></label>
      <label>Категории<select v-model.number="count"><option :value="10">Все 10</option><option :value="3">Первые 3</option><option :value="6">Первые 6</option></select></label>
      <label>Рендерер<select v-model="renderer"><option value="svg">SVG</option><option value="canvas">Canvas</option></select></label>
    </div>
    <p class="protocol">Одинаковые данные 01–10: {{values.join(' · ')}}. Непрозрачность 100%, без эффектов и разделителей секторов. После десятой категории цвет повторяется с начала.</p>
    <p v-if="vision!=='normal'" class="notice" role="status">Симуляция: {{visions.find(v=>v.id===vision)?.name}} · Machado 2009, severity 100. Меняются образцы и оба графика. Это модель восприятия, а не гарантия доступности.</p>
    <p v-if="count!==10" class="notice">Сейчас графики показывают первые {{count}} категорий общего набора данных. Десять кружков и оценки полной палитры сохранены.</p>
    <p v-if="error" role="alert">{{error}}</p><p v-else-if="!palettes.length" role="status">Загрузка палитр…</p>
    <section v-for="group in groups.filter(g=>rows.some(p=>p.id.startsWith(g.id)))" :key="group.id" class="group">
      <div class="group-heading"><h2>{{group.name}}</h2><p>{{group.background}} <span>· фон редактора</span></p></div>
      <div class="cards">
        <article v-for="p in rows.filter(p=>p.id.startsWith(group.id))" :key="p.id" :id="p.id" class="palette-card">
          <header class="card-heading"><div><a :href="'#'+p.id" class="palette-id">{{p.id}}</a><h3>{{p.name}}</h3></div><span v-if="p.accessibilityCandidate" class="tag">CVD-кандидат</span><span v-else-if="shortlist[p.id]" class="tag">Shortlist</span><span v-else-if="p.origin==='user-reference'" class="tag tag-new">Из референса</span><span v-else-if="p.origin==='editorial-original'" class="tag tag-new">Авторская</span></header>
          <div class="sample" :class="{dark:p.id[0]==='D'}" :style="{backgroundColor:p.audit.modes[vision].recommendedBackground}">
            <div class="swatches" :aria-label="`${p.id}: десять цветов по порядку`"><span v-for="(c,i) in p.audit.modes[vision].colors" :key="i" class="swatch" :style="{backgroundColor:c}" role="img" :aria-label="`Категория ${i+1}: ${c}`" :title="`${i+1}: ${c}`"></span></div>
            <ChartPreview :id="p.id" :colors="p.audit.modes[vision].colors" :background="p.audit.modes[vision].recommendedBackground" :renderer="renderer" :count="count" />
          </div>
          <div class="reverse"><div class="reverse-title"><span>На противоположном</span><code>{{opposite(p)}}</code></div><ChartPreview :id="p.id+' противоположный фон'" :colors="p.audit.modes[vision].colors" :background="p.audit.modes[vision].oppositeBackground" :renderer="renderer" :count="count" compact /></div>
          <div class="card-copy">
            <p class="character">{{p.note.character}}</p>
            <div class="metrics" aria-label="Минимальные цветовые расстояния и контраст">
              <div><span>Первые 3</span><strong>{{num(p.audit.modes[vision].recommended.first3.delta)}}</strong></div>
              <div><span>Первые 6</span><strong>{{num(p.audit.modes[vision].recommended.first6.delta)}}</strong></div>
              <div><span>Все 10</span><strong>{{num(p.audit.modes[vision].recommended.all10.delta)}}</strong></div>
              <div><span>Соседи ↻</span><strong>{{num(p.audit.modes[vision].recommended.adjacent.delta)}}</strong></div>
              <div><span>Контраст ≥</span><strong>{{num(p.audit.modes[vision].recommended.minimumContrast.ratio)}}:1</strong></div>
            </div>
            <p class="weakness"><b>Ограничение.</b> {{p.note.weakness}} Ближайшая пара: {{pair(p.audit.modes[vision].recommended.all10)}} (Δ {{num(p.audit.modes[vision].recommended.all10.delta)}}).</p>
            <p class="weakness"><b>Другой фон.</b> Минимум {{num(p.audit.modes[vision].opposite.minimumContrast.ratio)}}:1; ниже 3:1 — {{p.audit.modes[vision].opposite.below3.map(c=>String(c.category).padStart(2,'0')).join(', ')||'нет категорий'}}.</p>
            <p v-if="shortlist[p.id]" class="pick"><b>В shortlist.</b> {{shortlist[p.id]}}</p>
            <details><summary>HEX, соседство и проверка</summary>
              <ol class="hex-list"><li v-for="(c,i) in p.colors" :key="i"><i :style="{backgroundColor:c}"></i><code>{{c}}</code></li></ol>
              <p>Кольцевое замыкание 10 / 01: Δ {{num(p.audit.modes[vision].recommended.closure.delta)}}. Самые близкие соседи: {{pair(p.audit.modes[vision].recommended.adjacent)}}.</p>
              <p>На рекомендуемом фоне ниже 3:1: {{p.audit.modes[vision].recommended.below3.map(c=>String(c.category).padStart(2,'0')).join(', ')||'нет категорий'}}. Для небольших элементов такие цвета требуют особого внимания.</p>
              <p>Ближайший набор по неупорядоченному составу: {{p.audit.nearestCandidate.id}} (среднее расстояние {{num(p.audit.nearestCandidate.distance)}}). Начальные сочетания и порядок отличаются; родственные цвета в двадцати наборах неизбежны.</p>
              <div v-if="p.accessibilityCandidate" class="cvd-results"><h4>Проверка трёх симуляций</h4><p>Все пары с Δ &lt; 8; номера соответствуют исходным цветам выше.</p>
                <div v-for="v in visions.filter(v=>v.id!=='normal')" :key="v.id"><b>{{v.name}}</b><p>{{p.audit.modes[v.id].recommended.pairsBelow8.map(x=>`${pair(x)} (${num(x.delta)})`).join('; ')||'Пар ниже порога нет'}}.</p><p>Первые 3 / 6 / 10: {{[p.audit.modes[v.id].recommended.first3,p.audit.modes[v.id].recommended.first6,p.audit.modes[v.id].recommended.all10].map(x=>num(x.delta)).join(' / ')}}.</p></div>
              </div>
            </details>
          </div>
        </article>
      </div>
    </section>
    <footer class="method" id="method">
      <h2>Как читать этот каталог</h2>
      <div class="method-grid"><div><h3>Цвет — не единственный код</h3><p>Первые четыре числа в карточке — минимальные расстояния Δ в OKLab × 100. Чем выше, тем сильнее различие по этой модели. Проверяются все пары внутри первых 3, первых 6 и всей десятки; соседи включают 10 / 01.</p><p>Δ &lt; 8 — наш рабочий сигнал риска, не стандарт доступности. Контраст — отношение относительной яркости к фону. 3:1 служит ориентиром для различения границ, а не сертификатом палитры.</p><p>L04, L09 и D05 — кандидаты с дополнительным вниманием к CVD. Симуляции: linear sRGB → матрица Machado 2009 (severity 100) → ограничение гамута → sRGB. Тританопия также проверена, но модель не описывает все индивидуальные особенности зрения.</p><p>Для десяти категорий нужны прямые подписи, номера или символы. В кольце особенно важны подписи секторов; hover недостаточен. После десятой категории повтор цвета делает дополнительные обозначения обязательными.</p></div>
      <div><h3>Источники и происхождение</h3><p>Первые 20 сочетаний собраны для первоначального отбора. Ещё 13 созданы из присланных цветовых блоков: все исходные значения сохранены после нормализации формата, дополнительные оттенки доводят каждый набор до десяти. L16, L17 и D18 — новые авторские дополнения. Исходные наборы продукта сохранены.</p><ul>
        <li><a href="https://carbondesignsystem.com/data-visualization/color-palettes/">IBM Carbon — категориальные палитры</a>: порядок и соседство цветов.</li>
        <li><a href="https://www.datawrapper.de/blog/colors-for-data-vis-style-guides">Datawrapper — редакционные системы цвета</a>: характер, первые цвета, светлый и тёмный фон.</li>
        <li><a href="https://color.adobe.com/create/color-wheel">Adobe Color — цветовые гармонии</a>: комплементарные, раздельно-комплементарные и аналоговые основы.</li>
        <li><a href="https://github.com/njsmith/colorspacious/blob/master/colorspacious/cvd.py">Colorspacious — матрицы Machado et al.</a>: численная симуляция CVD.</li>
        <li><a href="https://bottosson.github.io/posts/oklab/">Björn Ottosson — OKLab</a>: расчёт расстояний.</li>
      </ul><p>Источники просмотрены 04.09.2026; каталог дополнен 07.09.2026. Возраст публикации не равен дате проверки.</p><a :href="base+'audit.json'" download>Полный численный аудит · JSON ↗</a><br><a :href="base+'review.md'" download>Отчёт и shortlist · Markdown ↗</a></div></div>
      <p class="closing">Каталог для обсуждения. Финальный выбор — за арт-директором.</p>
    </footer>
  </main>
</template>
