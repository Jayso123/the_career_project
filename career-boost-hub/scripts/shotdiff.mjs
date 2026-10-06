// Screenshot diff: live site vs local dev server (http://127.0.0.1:5173), per top-level section of <main>.
// Usage: node scripts/shotdiff.mjs   (dev server must be running). Exit 1 if any section > 0.5% or height differs.
//
// Approach
//  - Scroll the full page in steps first so whileInView / ScrollTrigger animations reach their end state.
//  - Targets: every child of <main> (nav, sections, footer); GSAP pin-spacers are unwrapped to their <section>.
//  - Normal targets: scroll to the element, hide other fixed overlays (progress bar, badge), element screenshot.
//  - Pinned targets (CareerPaths, CareerJourney): shot twice with the page scrolled to progress 0 ("start",
//    spacer top) and progress 1 ("end", spacer bottom - viewport), so the pinned viewport-sized frame is compared.
//  - Intentional differences: #lovable-badge is hidden; the navbar Login button is display:none'd (all pages; a mask would not
//    absorb the layout shift it causes in the justify-between row).
import { chromium } from 'playwright'
import pixelmatch from 'pixelmatch'
import { PNG } from 'pngjs'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const LIVE = 'https://careerboostmentor.lovable.app/'
const LOCAL = 'http://127.0.0.1:5173/'
const LIMIT = 0.5
const OUT = fileURLToPath(new URL('./shots/', import.meta.url))
fs.mkdirSync(OUT, { recursive: true })

const settle = (p, ms) => p.waitForTimeout(ms)

async function prep(page, url, width) {
  await page.setViewportSize({ width, height: 800 })
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.addStyleTag({ content: '#lovable-badge{display:none!important}' })
  // Intended difference: hide the navbar Login button on the local page so the flex row lays out like live.
  await page.addStyleTag({ content: 'nav a[href="/login"]{display:none!important}' })
  await page.evaluate(() => document.fonts.ready)
  const h = await page.evaluate(() => document.documentElement.scrollHeight)
  for (let y = 0; y < h + 800; y += 300) { await page.evaluate((y) => window.scrollTo(0, y), y); await settle(page, 90) }
  await page.evaluate(() => window.scrollTo(0, 0))
  await settle(page, 1500)
  await page.evaluate(() => Promise.all([...document.images].map((i) => i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r }))))
}

// Describe targets in document order. pinned: [spacerTop, spacerBottom] in page coords.
const listTargets = (page) => page.evaluate(() => {
  const main = document.querySelector('main'), out = []
  for (const c of main.children) {
    const el = c.classList.contains('pin-spacer') ? c.firstElementChild : c
    const r = c.getBoundingClientRect()
    out.push({ tag: el.tagName.toLowerCase(), id: el.id || '', pinned: c.classList.contains('pin-spacer'), top: r.top + scrollY, bottom: r.bottom + scrollY })
  }
  return out
})

async function shoot(page, i, t, phase, width) {
  const vh = 800
  const sel = `main > :nth-child(${i + 1})`
  await page.evaluate(({ isNav, pinned }) => {
    document.querySelectorAll('body *').forEach((e) => {
      if (e.closest('main > .pin-spacer') || e.closest('nav')) return
      if (getComputedStyle(e).position === 'fixed') e.style.visibility = 'hidden'
    })
    const nav = document.querySelector('main > nav'); if (nav) nav.style.visibility = isNav ? 'visible' : 'hidden'
  }, { isNav: t.tag === 'nav', pinned: t.pinned })
  let buf
  if (t.pinned) {
    await page.evaluate((y) => window.scrollTo(0, y), phase === 'start' ? t.top : t.bottom - vh)
    await settle(page, 900)
    buf = await page.locator(`${sel} > section`).first().screenshot()
  } else {
    await page.evaluate((y) => window.scrollTo(0, y), t.tag === 'nav' ? 0 : t.top)
    await settle(page, 400)
    buf = await page.locator(sel).screenshot()
  }
  const png = PNG.sync.read(buf)
  return png
}

async function run() {
  const browser = await chromium.launch()
  let bad = 0
  const rows = []
  for (const width of [1280, 375]) {
    const live = await browser.newPage(), local = await browser.newPage()
    await prep(live, LIVE, width); await prep(local, LOCAL, width)
    const [tl, tc] = [await listTargets(live), await listTargets(local)]
    console.log(`\n== ${width}px ==  (live sections: ${tl.length}, local: ${tc.length})`)
    for (let i = 0; i < Math.max(tl.length, tc.length); i++) {
      for (const phase of tl[i]?.pinned ? ['start', 'end'] : ['-']) {
        const label = `${i} ${tl[i]?.tag}${tl[i]?.id ? '#' + tl[i].id : ''}${phase === '-' ? '' : ' ' + phase}`
        if (!tl[i] || !tc[i]) { console.log(`${label} FAIL missing on one side`); bad++; continue }
        const a = await shoot(live, i, tl[i], phase, width), b = await shoot(local, i, tc[i], phase, width)
        const f = `${OUT}${width}-${i}-${tl[i].tag}${phase === '-' ? '' : '-' + phase}`
        fs.writeFileSync(`${f}-live.png`, PNG.sync.write(a)); fs.writeFileSync(`${f}-local.png`, PNG.sync.write(b))
        let line, pct = null
        const w = Math.min(a.width, b.width), h = Math.min(a.height, b.height)
        const crop = (p) => { const o = new PNG({ width: w, height: h }); PNG.bitblt(p, o, 0, 0, w, h, 0, 0); return o }
        const A = crop(a), B = crop(b), d = new PNG({ width: w, height: h })
        pct = (pixelmatch(A.data, B.data, d.data, w, h, { threshold: 0.1 }) / (w * h)) * 100
        fs.writeFileSync(`${f}-diff.png`, PNG.sync.write(d))
        if (a.height !== b.height || a.width !== b.width) { line = `${label} FAIL heights live=${a.height} local=${b.height} (overlap diff ${pct.toFixed(2)}%)`; bad++ }
        else { line = `${label} ${pct.toFixed(2)}%${pct > LIMIT ? ' FAIL' : ''}`; if (pct > LIMIT) bad++ }
        console.log(line); rows.push(line)
      }
    }
    await live.close(); await local.close()
  }
  await browser.close()
  console.log(bad ? `\n${bad} section(s) over target` : '\nAll sections within target')
  process.exit(bad ? 1 : 0)
}
run()
