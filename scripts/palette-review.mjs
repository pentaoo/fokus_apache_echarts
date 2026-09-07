import {readFileSync,writeFileSync} from 'node:fs'
const root=new URL('../',import.meta.url)
const read=p=>JSON.parse(readFileSync(new URL(p,root),'utf8'))
const palettes=read('public/palette-catalog/palettes.json')
const audit=read('public/palette-catalog/audit.json')
const notes=read('public/palette-catalog/notes.json')
const n=x=>x.toFixed(1), pair=p=>`${String(p.a).padStart(2,'0')}/${String(p.b).padStart(2,'0')}`
const origin=p=>p.origin==='user-reference'?'референс пользователя':p.origin==='editorial-original'?'авторское дополнение':'первоначальный каталог'
let s=`# Каталог палитр для отбора — 07.09.2026

36 кандидатов: 20 из первоначального каталога, 13 из присланных цветовых блоков и 3 новых авторских дополнения. В каждой палитре ровно 10 уникальных цветов \`#RRGGBB\`. Все наборы доступны в основном редакторе.

## Открытие

Запустить \`npm run dev\` и открыть \`http://127.0.0.1:5173/fokus_apache_echarts/palette-catalog.html\`. Каталог включён и в production-сборку \`npm run build\`.

## Что сделано с присланными значениями

Пустые строки интерпретированы как границы палитр: вместе с последним набором получилось 13 референсов. Записи без \`#\`, CSS-значения с альфой \`ff\`, HTML-коды и пять HSLA-значений нормализованы. Все исходные цвета сохранены в соответствующих наборах; порядок изменён для сильных первых 3/6 и кольцевого соседства. Каждый референс дополнен до 10 цветов. Нормализованные исходники отдельно сохранены в \`supplied-colors.json\` и проверяются аудитом.

HSLA преобразованы в sRGB с округлением до 8 бит: \`#9DF6F6\`, \`#F3CA8C\`, \`#DAA386\`, \`#C46E5F\`, \`#F56B61\`.

## Протокол графиков

Рекомендуемые фоны — реальные пресеты редактора \`#FFFFFF\` и \`#050608\`. Данные для всех кандидатов одинаковы: 72, 48, 91, 57, 83, 39, 66, 52, 78, 44. Превью построены настоящими ECharts bar и doughnut: непрозрачность 100%, без анимации, декоративных эффектов и разделителей секторов. Цвет повторяется как \`colors[index % 10]\`.

## Источники метода

- [IBM Carbon — Color palettes](https://carbondesignsystem.com/data-visualization/color-palettes/): фиксированный порядок и различимость соседей.
- [Datawrapper — Colors in data vis style guides](https://www.datawrapper.de/blog/colors-for-data-vis-style-guides): первые цвета, редакционный характер и проверка на графиках.
- [Adobe Color](https://color.adobe.com/create/color-wheel): гармонии как отправная точка.
- [Colorspacious / Machado matrices](https://github.com/njsmith/colorspacious/blob/master/colorspacious/cvd.py): симуляции CVD.
- [OKLab](https://bottosson.github.io/posts/oklab/): сравнительное расстояние цветов.

## Метод и ограничения

Δ — евклидово расстояние в OKLab ×100. Δ < 8 служит рабочим сигналом риска, а не стандартом доступности. Контраст — отношение относительной яркости к фону; 3:1 используется только как скрининговый ориентир. CVD-модель: sRGB → linear RGB → Machado 2009 severity 100 → clip → sRGB → OKLab.

Симуляции протанопии, дейтеранопии и тританопии пересчитаны для всех 36 наборов. Дополнительные CVD-кандидаты первоначального отбора — L04, L09 и D05. Присланные наборы сохраняют исходные цвета, поэтому не получают этот статус автоматически.

Десяти цветов недостаточно для универсальной доступности. Для секторов и столбцов нужны прямые подписи или номера; для линий и точек — символы. Некоторые присланные наборы содержат намеренно близкие оттенки или одновременно очень светлые и очень тёмные цвета. Их слабые места указаны явно.

## Сводная таблица

| ID | Название | Происхождение | Фон | Δ3 | Δ6 | Δ10 | Соседи | Контраст |
|---|---|---|---|---:|---:|---:|---:|---:|
`
for(const p of palettes){const a=audit.palettes.find(a=>a.id===p.id).modes.normal.recommended;s+=`| ${p.id} | ${p.name} | ${origin(p)} | ${p.recommendedBackground} | ${n(a.first3.delta)} | ${n(a.first6.delta)} | ${n(a.all10.delta)} | ${n(a.adjacent.delta)} | ${n(a.minimumContrast.ratio)}:1 |\n`}
s+='\n## Палитры, цвета и слабые места\n\n'
for(const p of palettes){const a=audit.palettes.find(a=>a.id===p.id),r=a.modes.normal.recommended,o=a.modes.normal.opposite;s+=`### ${p.id} — ${p.name}\n\n**${origin(p)}.** ${notes[p.id].character}\n\n${notes[p.id].weakness} Ближайшая пара: ${pair(r.all10)} (Δ ${n(r.all10.delta)}). Минимальный контраст на рекомендуемом / противоположном фоне: ${n(r.minimumContrast.ratio)}:1 / ${n(o.minimumContrast.ratio)}:1.\n\n${p.colors.join(', ')}\n\n`}
s+=`## Проверка и воспроизведение

- \`node scripts/audit-palettes.mjs\` проверяет количество, формат, уникальность, наличие всех присланных цветов, отсутствие точных совпадений с продуктовыми пресетами и пересчитывает \`audit.json\`.
- \`node scripts/palette-review.mjs\` пересобирает этот отчёт.
- \`npm run build\` проверяет TypeScript и собирает основной редактор вместе с каталогом.
`
writeFileSync(new URL('public/palette-catalog/review.md',root),s)
console.log('Wrote review.md for',palettes.length,'palettes')
