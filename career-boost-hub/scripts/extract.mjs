import { readFileSync } from 'node:fs'
const [anchor, width = '3000'] = process.argv.slice(2)
const src = readFileSync(new URL('../../.superpowers/ref/site.js', import.meta.url), 'utf8')
let i = -1, n = 0
while ((i = src.indexOf(anchor, i + 1)) !== -1 && n < 5) {
  console.log(`--- match ${++n} @${i} ---\n` + src.slice(Math.max(0, i - width / 2), i + width / 2) + '\n')
}
if (!n) { console.error('no match'); process.exit(1) }
