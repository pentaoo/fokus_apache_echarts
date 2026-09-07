// Numerical matrices: Machado, Oliveira & Fernandes (2009), severity 100.
// Reference transcription: https://github.com/njsmith/colorspacious/blob/master/colorspacious/cvd.py
export const matrices = {
  protanopia: [[.152286,1.052583,-.204868],[.114503,.786281,.099216],[-.003882,-.048116,1.051998]],
  deuteranopia: [[.367322,.860646,-.227968],[.280085,.672501,.047413],[-.011820,.042940,.968881]],
  tritanopia: [[1.255528,-.076749,-.178779],[-.078411,.930809,.147602],[.004733,.691367,.303900]],
}
export const linear = c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4
const encode = c => c <= .0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - .055
const rgb = hex => [1,3,5].map(i => parseInt(hex.slice(i,i+2),16)/255)
export function simulate(hex, mode) {
  if (mode === 'normal') return hex
  const channels = rgb(hex).map(linear)
  return '#' + matrices[mode].map(row => Math.round(255 * encode(Math.min(1, Math.max(0, row.reduce((s,v,i) => s + v*channels[i],0))))).toString(16).padStart(2,'0')).join('').toUpperCase()
}
// OKLab, Björn Ottosson: https://bottosson.github.io/posts/oklab/
export function lab(hex) {
  const [r,g,b] = rgb(hex).map(linear)
  const l = Math.cbrt(.4122214708*r+.5363325363*g+.0514459929*b)
  const m = Math.cbrt(.2119034982*r+.6806995451*g+.1073969566*b)
  const s = Math.cbrt(.0883024619*r+.2817188376*g+.6299787005*b)
  return [.2104542553*l+.793617785*m-.0040720468*s,1.9779984951*l-2.428592205*m+.4505937099*s,.0259040371*l+.7827717662*m-.808675766*s]
}
export const distance = (a,b) => Math.hypot(...lab(a).map((v,i)=>v-lab(b)[i]))*100
export function contrast(a,b) {
  const lum = hex => rgb(hex).map(linear).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0)
  return (Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05)
}
export function assess(colors, background) {
  const pairs = colors.flatMap((c,i)=>colors.slice(i+1).map((d,j)=>({a:i+1,b:i+j+2,delta:distance(c,d)}))).sort((a,b)=>a.delta-b.delta)
  const adjacent = colors.map((c,i)=>({a:i+1,b:(i+1)%colors.length+1,delta:distance(c,colors[(i+1)%colors.length])})).sort((a,b)=>a.delta-b.delta)
  const c = colors.map((color,i)=>({category:i+1,ratio:contrast(color,background)})).sort((a,b)=>a.ratio-b.ratio)
  return {first3:pairs.find(p=>p.b<=3),first6:pairs.find(p=>p.b<=6),all10:pairs[0],adjacent:adjacent[0],closure:adjacent.find(p=>p.a===10),pairsBelow8:pairs.filter(p=>p.delta<8),minimumContrast:c[0],below3:c.filter(p=>p.ratio<3)}
}
// Symmetric nearest-neighbour distance between unordered sets. Screening heuristic, not a perceptual guarantee.
export function setDistance(a,b) {
 return (a.reduce((s,c)=>s+Math.min(...b.map(d=>distance(c,d))),0)/a.length+b.reduce((s,c)=>s+Math.min(...a.map(d=>distance(c,d))),0)/b.length)/2
}
