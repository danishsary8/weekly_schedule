// ---------------------------------------------------------------------------
// Mobile-viewport audit for the authenticated dashboard.
//
// The existing audit-responsive.mjs proves nothing overflows or clips. This one
// answers the question that audit cannot: how much of a phone screen is spent
// on chrome before the user reaches real content, and how much width the
// timeline actually gets.
//
// Reports, per phone width:
//   - firstContentTop: y of the first content card. Everything above it is
//     header/tab/button chrome competing with the fold.
//   - aboveFoldCards:  how many content cards are visible without scrolling.
//   - timelineInset:   left space the decorative rail takes from each card.
//   - timelineWidth:   resulting card width, as a share of the viewport.
//   - smallText / smallTargets: legibility and touch-target floors.
//
// Readiness is polled, never slept on (a fixed delay measures the splash).
//
// Usage: node scripts/audit-mobile.mjs   (needs .audit-seed.json + preview)
// ---------------------------------------------------------------------------

import { spawn } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const seed = JSON.parse(await readFile('.audit-seed.json', 'utf8').then((t) => t.replace(/^\uFEFF/, '')))
if (!seed.token) throw new Error('No token in .audit-seed.json. Run scripts/seed-audit-user.mjs first.')

const origin = process.env.DAYCRAFT_WEB || 'http://127.0.0.1:4173'
const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const profile = await mkdtemp(join(tmpdir(), 'daycraft-mobile-'))
const port = 9499

const child = spawn(edge, [
  '--headless', '--disable-gpu', '--disable-web-security',
  `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, 'about:blank',
], { stdio: 'ignore' })

async function firstPageTarget() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const targets = await fetch(`http://127.0.0.1:${port}/json`).then((r) => r.json())
      const page = targets.find((t) => t.type === 'page')
      if (page) return page
    } catch { /* CDP not listening yet */ }
    await new Promise((r) => setTimeout(r, 250))
  }
  throw new Error('Edge CDP did not become ready')
}

const page = await firstPageTarget()
const socket = new WebSocket(page.webSocketDebuggerUrl)
await new Promise((resolve) => socket.addEventListener('open', resolve))

let messageId = 0
const pending = new Map()
socket.addEventListener('message', (event) => {
  const data = JSON.parse(event.data)
  if (data.id && pending.has(data.id)) { pending.get(data.id)(data); pending.delete(data.id) }
})
const send = (method, params = {}) => new Promise((resolve) => {
  const id = ++messageId
  pending.set(id, resolve)
  socket.send(JSON.stringify({ id, method, params }))
})
async function evaluate(expression) {
  const response = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (response.result?.exceptionDetails) {
    throw new Error(response.result.exceptionDetails.exception?.description ?? 'evaluate failed')
  }
  return response.result?.result?.value
}
async function waitFor(predicate) {
  for (let i = 0; i < 100; i += 1) {
    if (await evaluate(`Boolean(${predicate})`)) return true
    await new Promise((r) => setTimeout(r, 250))
  }
  return false
}

async function visit(path, width, height) {
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 2, mobile: true })
  await send('Page.navigate', { url: `${origin}${path}` })
  await waitFor("!document.querySelector('[aria-label=\"Loading Daycraft\"]')")
  return waitFor("document.querySelector('main')")
}

// Authenticate once, then re-enter the dashboard.
await visit('/login', 390, 844)
await evaluate(`localStorage.setItem('auth-token', ${JSON.stringify(seed.token)}); localStorage.setItem('auth-user', ${JSON.stringify(JSON.stringify(seed.user))}); localStorage.setItem('tour-done-${seed.user.id}', '1');`)

const PHONES = [[320, 568], [375, 667], [390, 844], [430, 932]]
let failures = 0

for (const [width, height] of PHONES) {
  await visit('/dashboard', width, height)
  /*
   * Wait for the loaded timeline, not merely for a card: the loading skeleton
   * also carries `rounded-card`, so a looser check measures the skeleton and
   * reports a misleadingly short page.
   */
  const ready = await waitFor("document.querySelector('[aria-label=\"Daily timeline\"] li')")
  if (!ready) {
    console.log(`FAIL  ${width}x${height}: timeline never rendered (title="${await evaluate('document.title')}"). Seed data missing?`)
    failures += 1
    continue
  }
  await evaluate('scrollTo(0,0)')
  await evaluate('new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))')

  const report = await evaluate(`
    (() => {
      const vw = innerWidth
      const vh = innerHeight
      const cards = Array.from(document.querySelectorAll('main [class*="rounded-card"]'))
        .filter((el) => {
          const s = getComputedStyle(el)
          return s.display !== 'none' && s.visibility !== 'hidden' && el.getBoundingClientRect().height > 40
        })
      const firstCard = cards[0]
      const firstContentTop = firstCard ? Math.round(firstCard.getBoundingClientRect().top + scrollY) : null
      const aboveFoldCards = cards.filter((el) => el.getBoundingClientRect().top < vh).length

      // Timeline geometry: the <li> owns the rail inset, the card sits inside it.
      const item = document.querySelector('[aria-label="Daily timeline"] li')
      const itemCard = item?.querySelector('[class*="rounded-card"]') ?? item?.firstElementChild
      const itemRect = item?.getBoundingClientRect()
      const cardRect = itemCard?.getBoundingClientRect()

      const smallText = []
      for (const el of document.querySelectorAll('main p, main span, main li, main label, main h1, main h2')) {
        if (el.children.length > 0) continue
        const text = el.textContent.trim()
        if (!text || text.length < 3) continue
        const s = getComputedStyle(el)
        if (s.display === 'none' || s.visibility === 'hidden') continue
        const size = parseFloat(s.fontSize)
        const upper = s.textTransform === 'uppercase'
        // Uppercase micro-labels are allowed down to 11px; body copy is not.
        if (size < (upper ? 10.5 : 13.5)) smallText.push(text.slice(0, 28) + ' @' + size + 'px' + (upper ? ' (caps)' : ''))
      }

      /*
       * Elements pushing past the layout viewport. Decorative layers are
       * intentionally oversized and are clipped by body{overflow-x:hidden}, so
       * they cannot create a scrollbar and are excluded.
       */
      const wide = []
      for (const el of document.querySelectorAll('body *')) {
        const s = getComputedStyle(el)
        if (s.display === 'none' || s.visibility === 'hidden' || s.pointerEvents === 'none') continue
        if (el.closest('[aria-hidden="true"]')) continue
        const r = el.getBoundingClientRect()
        if (r.width === 0 && r.height === 0) continue
        if (r.right > document.documentElement.clientWidth + 0.5 || r.left < -0.5) {
          const named = el.getAttribute('aria-label') || el.closest('[aria-label]')?.getAttribute('aria-label') || ''
          wide.push(
            el.tagName.toLowerCase()
            + (named ? '(' + named + ')' : '.' + (el.className || '').toString().split(/\\s+/).slice(0, 2).join('.'))
            + ' [' + Math.round(r.left) + '→' + Math.round(r.right) + ' of ' + document.documentElement.clientWidth + ']',
          )
        }
      }

      const smallTargets = []
      for (const el of document.querySelectorAll('main a, main button, main input, main select, main [role="switch"]')) {
        const r = el.getBoundingClientRect()
        const s = getComputedStyle(el)
        if (s.display === 'none' || s.visibility === 'hidden' || r.width === 0) continue
        if (el.tagName === 'A' && el.closest('p')) continue
        if (r.height < 43.5 || r.width < 43.5) {
          smallTargets.push((el.getAttribute('aria-label') || el.textContent || el.tagName).trim().slice(0, 22) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height))
        }
      }

      return {
        viewport: vw + 'x' + vh,
        firstContentTop,
        chromeShareOfFold: firstContentTop === null ? null : Math.round((firstContentTop / vh) * 100),
        aboveFoldCards,
        cardCount: cards.length,
        timelineInset: itemRect && cardRect ? Math.round(cardRect.left - itemRect.left) : null,
        timelineCardWidth: cardRect ? Math.round(cardRect.width) : null,
        timelineWidthShare: cardRect ? Math.round((cardRect.width / vw) * 100) : null,
        pageHeight: document.documentElement.scrollHeight,
        horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
        smallText,
        smallTargets,
        wide: wide.slice(0, 6),
      }
    })()
  `)

  const problems = []
  if (report.horizontalOverflow > 0) problems.push(`horizontal overflow ${report.horizontalOverflow}px`)
  if (report.smallText.length) problems.push(`${report.smallText.length} sub-floor text`)
  if (report.smallTargets.length) problems.push(`${report.smallTargets.length} small targets`)
  if (report.aboveFoldCards === 0) problems.push('no content card above the fold')

  console.log(`${problems.length ? 'FAIL' : 'PASS'}  ${report.viewport}`)
  console.log(`      first content at ${report.firstContentTop}px (${report.chromeShareOfFold}% of the fold is chrome) · ${report.aboveFoldCards}/${report.cardCount} cards above fold`)
  console.log(`      timeline: card ${report.timelineCardWidth}px (${report.timelineWidthShare}% of width), rail inset ${report.timelineInset}px`)
  console.log(`      page height ${report.pageHeight}px · h-overflow ${report.horizontalOverflow}px`)
  if (report.wide.length) console.log(`      past viewport: ${report.wide.join(' | ')}`)
  if (report.smallText.length) console.log(`      sub-floor text: ${report.smallText.join(' | ')}`)
  if (report.smallTargets.length) console.log(`      small targets: ${report.smallTargets.join(' | ')}`)
  if (problems.length) failures += 1
}

console.log(failures === 0 ? '\nMobile viewport clean.' : `\n${failures} viewport(s) with findings.`)

socket.close()
child.kill()
try { await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }) } catch { /* OS reclaims */ }
