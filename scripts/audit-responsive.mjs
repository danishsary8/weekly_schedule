// ---------------------------------------------------------------------------
// Repeatable responsive/accessibility audit for the authenticated app.
//
// Uses headless Edge over the CDP WebSocket (same approach as
// audit-landing.mjs) so it adds no dependencies. Verifies, per breakpoint:
//   * no horizontal overflow of the document
//   * no individual element wider than the viewport
//   * every interactive control reaches the 44x44 touch-target floor
//   * no clipped/truncated text nodes
//
// Usage:
//   node scripts/seed-audit-user.mjs        -> prints {token,user}
//   node scripts/audit-responsive.mjs '<json from above>'
// ---------------------------------------------------------------------------
import { spawn } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// Seed comes from a file so shell quoting never mangles the JSON.
const seedPath = process.argv[2] || '.audit-seed.json'
// PowerShell's `>` emits UTF-16LE with a BOM, so decode defensively.
const raw = await (await import('node:fs/promises')).readFile(seedPath)
const text = raw[0] === 0xff && raw[1] === 0xfe
  ? raw.toString('utf16le')
  : raw.toString('utf8').replace(/^\uFEFF/, '')
const seed = JSON.parse(text.trim())
if (!seed.token) throw new Error(`No token in ${seedPath}. Run scripts/seed-audit-user.mjs first.`)

const origin = process.env.DAYCRAFT_WEB || 'http://127.0.0.1:4173'
const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const profile = await mkdtemp(join(tmpdir(), 'daycraft-resp-'))
const port = 9444
// --disable-web-security is AUDIT-ONLY. The local backend/.env currently scopes
// CORS_ALLOWED_ORIGINS to the deployed origin, so a localhost preview would be
// blocked. This keeps the harness self-contained without editing anyone's env.
const browser = spawn(
  edge,
  [
    '--headless',
    '--disable-gpu',
    '--disable-web-security',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    'about:blank',
  ],
  { stdio: 'ignore' },
)
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function debuggerTarget() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const targets = await fetch(`http://127.0.0.1:${port}/json`).then((response) => response.json())
      const page = targets.find((target) => target.type === 'page')
      if (page) return page
    } catch { /* still booting */ }
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
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text)
  return result.result.value
}

const PROBE = `(() => {
  const vw = innerWidth;
  const docOverflow = document.documentElement.scrollWidth - vw;

  const wide = [];
  const smallTargets = [];
  const clipped = [];

  for (const el of document.querySelectorAll('body *')) {
    const style = getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) continue;

    // Purely decorative, non-interactive layers (ambient blobs) are intentionally
    // oversized and are clipped by body{overflow-x:hidden}; they cannot cause a
    // scrollbar or hide content, so they are not layout defects.
    const decorative = el.closest('[aria-hidden="true"]') || style.pointerEvents === 'none';

    // Element extends past the viewport edges.
    if (!decorative && (rect.width > vw + 1 || rect.right > vw + 1 || rect.left < -1)) {
      wide.push({
        tag: el.tagName.toLowerCase(),
        cls: (el.className || '').toString().slice(0, 60),
        w: Math.round(rect.width), left: Math.round(rect.left), right: Math.round(rect.right)
      });
    }

    // Interactive controls must reach 44x44 (WCAG 2.5.5 / 2.5.8).
    const interactive = el.matches('button,a[href],input,select,textarea,[role="switch"],[role="button"]');

    // WCAG 2.5.8 exempts links flowing inline within a sentence, because
    // enlarging them to 44px would break the paragraph. Detect that case by an
    // anchor whose parent paragraph holds real surrounding prose.
    const parent = el.parentElement;
    const inlineInSentence = el.tagName === 'A'
      && parent
      && ['P', 'SPAN', 'LI', 'LABEL'].includes(parent.tagName)
      && parent.textContent.trim().length > el.textContent.trim().length + 12;

    if (interactive && !inlineInSentence && !el.closest('[aria-hidden="true"]') && style.position !== 'absolute') {
      if (rect.height > 0 && (rect.height < 43.5 || rect.width < 43.5)) {
        smallTargets.push({
          tag: el.tagName.toLowerCase(),
          label: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 40),
          h: Math.round(rect.height), w: Math.round(rect.width)
        });
      }
    }

    // Visually-hidden screen-reader text is intentionally 1px and clipped.
    const srOnly = (el.className || '').toString().includes('sr-only');

    // Text that is being cut off horizontally.
    if (!srOnly && el.children.length === 0 && el.textContent.trim() && el.scrollWidth > el.clientWidth + 2) {
      clipped.push({
        tag: el.tagName.toLowerCase(),
        text: el.textContent.trim().slice(0, 40),
        scroll: el.scrollWidth, client: el.clientWidth
      });
    }
  }

  return {
    viewport: vw,
    route: location.pathname,
    docOverflowPx: docOverflow,
    hasMain: Boolean(document.querySelector('main')),
    h1: document.querySelector('h1')?.textContent?.trim()?.slice(0, 50) ?? null,
    wide, smallTargets, clipped,
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches
  };
})()`

async function auditRoute(route, width, height, reducedMotion = false) {
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600 })
  await send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: reducedMotion ? 'reduce' : 'no-preference' }],
  })
  await send('Page.navigate', { url: `${origin}${route}` })
  await pause(3800)
  const report = await evaluate(PROBE)
  return { route, width, reducedMotion, ...report }
}

try {
  await send('Page.enable')
  await send('Runtime.enable')

  // Seed the session the same way the app does, then reload as a real user.
  await send('Page.navigate', { url: `${origin}/login` })
  await pause(2200)
  await evaluate(`localStorage.setItem('auth-token', ${JSON.stringify(seed.token)}); true`)

  const reports = []
  for (const [width, height] of [[375, 812], [768, 1024], [1440, 1000]]) {
    reports.push(await auditRoute('/dashboard', width, height))
    reports.push(await auditRoute('/profile', width, height))
  }
  reports.push(await auditRoute('/dashboard', 375, 812, true))

  // Auth screens are audited signed-out so the real forms render.
  await evaluate(`localStorage.removeItem('auth-token'); localStorage.removeItem('auth-user'); true`)
  for (const route of ['/login', '/register']) {
    reports.push(await auditRoute(route, 375, 812))
  }

  let failures = 0
  for (const report of reports) {
    const problems = []
    if (report.docOverflowPx > 1) problems.push(`document overflows by ${report.docOverflowPx}px`)
    if (report.wide.length) problems.push(`${report.wide.length} element(s) wider than viewport`)
    if (report.smallTargets.length) problems.push(`${report.smallTargets.length} sub-44px target(s)`)
    if (report.clipped.length) problems.push(`${report.clipped.length} clipped text node(s)`)

    const tag = `${report.route} @ ${report.width}px${report.reducedMotion ? ' (reduced-motion)' : ''}`
    if (problems.length) {
      failures += 1
      console.log(`FAIL  ${tag}\n      ${problems.join('\n      ')}`)
      if (report.wide.length) console.log('      wide:', JSON.stringify(report.wide.slice(0, 6)))
      if (report.smallTargets.length) console.log('      small:', JSON.stringify(report.smallTargets.slice(0, 8)))
      if (report.clipped.length) console.log('      clipped:', JSON.stringify(report.clipped.slice(0, 6)))
    } else {
      console.log(`PASS  ${tag}  route=${report.route} main=${report.hasMain}`)
    }
  }

  console.log(failures === 0 ? '\nAll breakpoints clean.' : `\n${failures} breakpoint(s) need attention.`)
} finally {
  socket.close()
  browser.kill()
  await pause(500)
  try { await rm(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 250 }) } catch { /* Windows journal */ }
}
