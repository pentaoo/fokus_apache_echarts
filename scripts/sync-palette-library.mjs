import { readFileSync, writeFileSync } from 'node:fs'

const root = new URL('../', import.meta.url)
const source = new URL('public/palette-catalog/palettes.json', root)
const target = new URL('src/paletteCatalog/paletteLibrary.ts', root)
const palettes = JSON.parse(readFileSync(source, 'utf8'))

const output = `// Generated from public/palette-catalog/palettes.json. Keep both files in sync.\nimport type { Palette } from './types'\n\nexport const PALETTE_LIBRARY: Palette[] = ${JSON.stringify(palettes, null, 2)}\n`

writeFileSync(target, output)
console.log('Synced', palettes.length, 'palettes with the main editor.')
