import { readFileSync, writeFileSync } from 'node:fs'
import assert from 'node:assert/strict'
import { assess, simulate, setDistance } from './palette-color.mjs'
const root = new URL('../', import.meta.url)
const read = p => readFileSync(new URL(p,root),'utf8')
const palettes = JSON.parse(read('public/palette-catalog/palettes.json'))
assert.equal(palettes.length,36)
assert.equal(palettes.filter(p=>p.origin==='user-reference').length,13)
assert.equal(palettes.filter(p=>p.origin==='editorial-original').length,3)
assert.equal(new Set(palettes.map(p=>p.id)).size,palettes.length)
assert.equal(palettes.filter(p=>p.accessibilityCandidate).length,3)
const supplied = JSON.parse(read('public/palette-catalog/supplied-colors.json'))
const referenceIds = ['L11','L12','D11','D12','D13','D14','L13','L14','D15','L15','D16','D17','D19']
supplied.forEach((colors,index)=>{ const palette=palettes.find(p=>p.id===referenceIds[index]); assert(palette); colors.forEach(color=>assert(palette.colors.includes(color), `${referenceIds[index]}: missing supplied color ${color}`)) })
const presets = read('src/stylePresets.ts')
const existing = [...presets.matchAll(/id: '(\w+)',\s*name: '[^']+',\s*colors: \[([^\]]+)\]/g)].map(m=>({id:m[1],colors:m[2].match(/#[\da-f]{6}/gi).map(c=>c.toUpperCase())}))
existing.push({id:'chalk',colors:presets.match(/CHALK_PALETTE = \[([^\]]+)/)[1].match(/#[\da-f]{6}/gi).map(c=>c.toUpperCase())})
const modes = ['normal','protanopia','deuteranopia','tritanopia']
const result = palettes.map((p,i)=>{
 assert.match(p.id,/^[LD]\d{2}$/)
 assert.equal(p.colors.length,10)
 assert.equal(new Set(p.colors).size,10)
 assert.equal(p.recommendedBackground, p.id.startsWith('L') ? '#FFFFFF' : '#050608')
 p.colors.forEach(c=>assert.match(c,/^#[0-9A-F]{6}$/))
 assert(!p.colors.includes(p.recommendedBackground))
 assert(!p.colors.some(c=>existing.some(x=>x.colors.includes(c))), `${p.id}: color already in a product preset`)
 const old = existing.map(x=>({id:x.id,distance:setDistance(p.colors,x.colors)})).sort((a,b)=>a.distance-b.distance)[0]
 const nearest = palettes.filter(x=>x.id!==p.id).map(x=>({id:x.id,distance:setDistance(p.colors,x.colors)})).sort((a,b)=>a.distance-b.distance)[0]
 assert(old.distance > 8, `${p.id}: review similarity to existing preset ${old.id}`)
 assert(nearest.distance > 0, `${p.id}: duplicate palette set`)
 const opposite = p.id.startsWith('L')?'#050608':'#FFFFFF'
 return {id:p.id,nearestExisting:old,nearestCandidate:nearest,exactExistingColors:p.colors.filter(c=>existing.some(x=>x.colors.includes(c))),modes:Object.fromEntries(modes.map(mode=>{
 const colors=p.colors.map(c=>simulate(c,mode))
 return [mode,{colors,recommendedBackground:simulate(p.recommendedBackground,mode),oppositeBackground:simulate(opposite,mode),recommended:assess(colors,simulate(p.recommendedBackground,mode)),opposite:assess(colors,simulate(opposite,mode))}]
 }))}
})
const output={method:'sRGB → linear RGB → Machado 2009 severity 100 → clip [0,1] → sRGB 8-bit → OKLab. Δ = Euclidean OKLab ×100. Δ<8 is an editorial risk flag, not an accessibility standard. Contrast is relative luminance ratio; 3:1 is a screening flag, not certification.',existingCount:existing.length,palettes:result}
writeFileSync(new URL('public/palette-catalog/audit.json',root),JSON.stringify(output,null,2)+'\n')
for(const p of result){const r=p.modes.normal.recommended;console.log(p.id, 'Δ3/6/10',...[r.first3,r.first6,r.all10].map(p=>p.delta.toFixed(1)),'adj',r.adjacent.delta.toFixed(1),'contrast',r.minimumContrast.ratio.toFixed(1),'nearest',p.nearestCandidate.id,p.nearestCandidate.distance.toFixed(1),'old',p.nearestExisting.id,p.nearestExisting.distance.toFixed(1))}
console.log('Validated', palettes.length, 'palettes, 10 unique HEX per palette, 13 supplied references, 3 additions and 3 CVD candidates; compared with', existing.length, 'existing palettes.')
