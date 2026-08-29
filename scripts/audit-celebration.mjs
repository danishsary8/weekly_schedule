// ---------------------------------------------------------------------------
// Functional proof for the daily-completion celebration.
//
// Drives the real dashboard in headless Edge: ticks every checklist item, then
// asserts that (a) the progress ring reaches 100%, (b) the confetti burst is
// actually mounted, and (c) the burst does NOT re-appear on reload — i.e. the
// once-per-day rule holds against real API state, not just unit tests.
// ---------------------------------------------------------------------------
import { spawn } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const raw = await readFile(process.argv[2] || '.audit-seed.json')
const text = raw[0] === 0xff && raw[1] === 0xfe ? raw.toString('utf16le') : raw.toString('utf8').replace(/^\uFEFF/, '')
const seed = JSON.parse(text.trim())

const origin = process.env.DAYCRAFT_WEB || 'http://127.0.0.1:4173'
const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const profile = await mkdtemp(join(tmpdir(), 'daycraft-celebrate-'))
const port = 9445
const browser = spawn(
  edge,
  ['--headless', '--disable-gpu', '--disable-web-security', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, 'about:blank'],
  { stdio: 'ignore' },
)
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function debuggerTarget() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const targets = await fetch(`http://127.0.0.1:${port}/json`).then((response) => response.json())
      const page = targets.find((target) => target.type === 'page')
      if (page) return page
    } catch { /* booting */ }
    await pause(200)
  }
  throw new Error('Edge DevTools endpoint did not become ready.')
}

const target = await debuggerTarget()
const socket = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject })
let id = 0
const pending = new Map()
socket.onmessage = ({ data }) => {
  const message = JSON.parse(data)
  if (!message.id || !pending.has(message.id)) return
  const { resolve, reject } = pending.get(message.id)
  pending.delete(message.id)
  message.error ? reject(new Error(message.error.message)) : resolve(message.result)
}
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const commandId = ++id
  pending.set(commandId, { resolve, reject })
  socket.send(JSON.stringify({ id: commandId, method, params }))
})
async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || 'evaluate failed')
  return result.result.value
}

// Counts the confetti particles Celebration.jsx renders inside the ring wrapper.
const BURST_COUNT = `document.querySelectorAll('[aria-label="Today\\'s progress"] [aria-hidden="true"] span').length`
const PERCENT = `document.querySelector('[role="img"][aria-label*="% of today complete"]')?.getAttribute('aria-label') ?? null`

try {
  await send('Page.enable')
  await send('Runtime.enable')
  const consoleErrors = []
  await send('Log.enable').catch(() => {})
  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data)
    if (message.method === 'Log.entryAdded' && message.params?.entry?.level === 'error') {
      consoleErrors.push(message.params.entry.text)
    }
  })

  await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 1, mobile: true })
  await send('Page.navigate', { url: `${origin}/login` })
  await pause(2000)
  await evaluate(`localStorage.setItem('auth-token', ${JSON.stringify(seed.token)}); true`)
  await send('Page.navigate', { url: `${origin}/dashboard` })

  /*
   * The local `php artisan serve` is single-process and serializes the six
   * parallel dashboard requests (see RELIABILITY.md), so wait for the checklist
   * to actually mount rather than guessing a fixed delay. Also dismiss the
   * first-run tour, whose overlay would otherwise swallow our clicks.
   */
  async function waitFor(expression, label, timeoutMs = 45000) {
    const started = Date.now()
    while (Date.now() - started < timeoutMs) {
      if (await evaluate(expression)) return true
      await evaluate(`[...document.querySelectorAll('button')].find(b => /skip tour/i.test(b.textContent))?.click(); true`)
      await pause(700)
    }
    throw new Error(`Timed out waiting for ${label}`)
  }

  // Wait for the actual interactive rows, not merely the section shell.
  await waitFor(
    `document.querySelectorAll('[aria-label="Daily checklist"] button[aria-pressed]').length > 0`,
    'checklist rows to render',
  )
  await pause(800)

  const before = await evaluate(`({ percent: ${PERCENT}, burst: ${BURST_COUNT} })`)
  console.log('initial            ->', JSON.stringify(before))

  // Tick every checklist row via the real UI, pausing for each API write.
  const rows = await evaluate(`document.querySelectorAll('[aria-label="Daily checklist"] button[aria-pressed]').length`)
  console.log('checklist rows     ->', rows)

  const clickNext = () => evaluate(`(() => {
    const next = [...document.querySelectorAll('[aria-label="Daily checklist"] button[aria-pressed="false"]')][0];
    if (next) next.click();
    return Boolean(next);
  })()`)

  // Complete everything except the final item, giving each write time to land.
  for (let index = 0; index < rows - 1; index += 1) {
    await clickNext()
    await pause(2600)
  }

  // The final tap triggers the burst, which only lives ~1.1s — poll fast so we
  // observe it at its peak rather than after it has already cleaned up.
  await clickNext()
  let peakBurst = 0
  let peakPercent = null
  for (let sample = 0; sample < 24; sample += 1) {
    const snapshot = await evaluate(`({ percent: ${PERCENT}, burst: ${BURST_COUNT} })`)
    peakBurst = Math.max(peakBurst, snapshot.burst)
    if (snapshot.percent) peakPercent = snapshot.percent
    if (peakBurst > 5 && snapshot.burst === 0) break
    await pause(150)
  }
  const after = { percent: peakPercent, burst: peakBurst }
  console.log('after completing   ->', JSON.stringify(after), '(peak burst observed)')

  // The burst is transient; confirm it cleans itself up.
  await pause(2600)
  const settled = await evaluate(`({ percent: ${PERCENT}, burst: ${BURST_COUNT} })`)
  console.log('after burst ends   ->', JSON.stringify(settled))

  // Reload: an already-complete day must stay calm (no repeat celebration).
  await send('Page.navigate', { url: `${origin}/dashboard` })
  await waitFor(`Boolean(document.querySelector('[aria-label="Today\\'s progress"]'))`, 'progress card after reload')
  await pause(1200)
  const reloaded = await evaluate(`({ percent: ${PERCENT}, burst: ${BURST_COUNT} })`)
  console.log('after reload       ->', JSON.stringify(reloaded))

  const checks = [
    ['reaches 100%', after.percent?.includes('100%')],
    ['burst mounted on completion', after.burst > 5],
    ['burst cleans up', settled.burst === 0],
    ['no repeat burst after reload', reloaded.burst === 0],
    ['still 100% after reload (persisted)', reloaded.percent?.includes('100%')],
    ['no console errors', consoleErrors.length === 0],
  ]

  console.log('')
  let failed = 0
  for (const [label, ok] of checks) {
    if (!ok) failed += 1
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`)
  }
  if (consoleErrors.length) console.log('console errors:', consoleErrors.slice(0, 5))
  console.log(failed === 0 ? '\nCelebration behaves correctly.' : `\n${failed} check(s) failed.`)
} finally {
  socket.close()
  browser.kill()
  await pause(500)
  try { await rm(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 250 }) } catch { /* journal */ }
}
