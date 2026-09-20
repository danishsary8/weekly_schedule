import { spawn } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const seed = JSON.parse(await readFile('.audit-seed.json', 'utf8'))
const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const profile = await mkdtemp(join(tmpdir(), 'daycraft-time-wheel-'))
const output = join(process.cwd(), '.tmp-time-wheel')
const port = 9510
await mkdir(output, { recursive: true })

const child = spawn(edge, ['--headless', '--disable-gpu', '--disable-web-security', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' })

async function pageTarget() {
  for (let i = 0; i < 60; i += 1) {
    try {
      const targets = await fetch(`http://127.0.0.1:${port}/json`).then((response) => response.json())
      const page = targets.find((target) => target.type === 'page')
      if (page) return page
    } catch { /* CDP is starting */ }
    await new Promise((resolve) => setTimeout(resolve, 200))
  }
  throw new Error('Edge CDP did not start')
}

const target = await pageTarget()
const socket = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((resolve) => socket.addEventListener('open', resolve))
let id = 0
const pending = new Map()
socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data)
  if (message.id && pending.has(message.id)) {
    pending.get(message.id)(message)
    pending.delete(message.id)
  }
})
const send = (method, params = {}) => new Promise((resolve) => {
  const messageId = ++id
  pending.set(messageId, resolve)
  socket.send(JSON.stringify({ id: messageId, method, params }))
})
const evaluate = async (expression) => {
  const response = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (response.result?.exceptionDetails) throw new Error(response.result.exceptionDetails.exception?.description ?? 'Evaluation failed')
  return response.result.result.value
}
const waitFor = async (expression) => {
  for (let i = 0; i < 120; i += 1) {
    if (await evaluate(`Boolean(${expression})`)) return
    await new Promise((resolve) => setTimeout(resolve, 150))
  }
  throw new Error(`Timed out waiting for ${expression}`)
}

await send('Page.navigate', { url: 'http://127.0.0.1:4173/login' })
await waitFor("document.querySelector('form')")
await evaluate(`localStorage.setItem('auth-token', ${JSON.stringify(seed.token)}); localStorage.setItem('auth-user', ${JSON.stringify(JSON.stringify(seed.user))}); localStorage.setItem('tour-done-${seed.user.id}', '1')`)

const sizes = [[320, 568], [375, 667], [390, 844], [430, 932], [768, 900], [1280, 900]]
let failures = 0

for (const [width, height] of sizes) {
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 768 })
  await send('Page.navigate', { url: 'http://127.0.0.1:4173/dashboard' })
  await waitFor("document.querySelector('[aria-label=\"Daily timeline\"] button[aria-label$=\"Open details.\"]')")
  await evaluate("document.querySelector('[aria-label=\"Daily timeline\"] button[aria-label$=\"Open details.\"]').click()")
  await waitFor("[...document.querySelectorAll('button')].some((button) => button.textContent.trim() === 'Edit')")
  await evaluate("[...document.querySelectorAll('button')].find((button) => button.textContent.trim() === 'Edit').click()")
  await waitFor("document.querySelector('button[aria-label^=\"Set start time\"]')")
  await evaluate("document.querySelector('button[aria-label^=\"Set start time\"]').click()")
  await waitFor("document.querySelector('section[aria-label=\"Set start time\"]')")
  await evaluate('new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))')
  await new Promise((resolve) => setTimeout(resolve, 450))

  const report = await evaluate(`(() => {
    const dialog = document.querySelector('[role="dialog"]')
    const panel = document.querySelector('section[aria-label="Set start time"]')
    const save = [...document.querySelectorAll('button')].find((button) => button.textContent.includes('Save changes'))
    const d = dialog.getBoundingClientRect()
    const p = panel.getBoundingClientRect()
    const s = save.getBoundingClientRect()
    const targets = [...panel.querySelectorAll('button, [role="listbox"]')].map((node) => node.getBoundingClientRect()).filter((rect) => rect.width > 0)
    return {
      docOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      dialogInside: d.left >= -0.5 && d.right <= innerWidth + 0.5 && d.top >= -0.5 && d.bottom <= innerHeight + 0.5,
      panelInsideDialog: p.left >= d.left - 0.5 && p.right <= d.right + 0.5,
      saveVisible: s.top >= 0 && s.bottom <= innerHeight,
      panelWidth: Math.round(p.width),
      panelHeight: Math.round(p.height),
      smallTargets: targets.filter((rect) => rect.height < 43.5 || rect.width < 43.5).length,
    }
  })()`)

  const ok = report.docOverflow <= 0 && report.dialogInside && report.panelInsideDialog && report.saveVisible && report.smallTargets === 0
  if (!ok) failures += 1
  console.log(`${ok ? 'PASS' : 'FAIL'} ${width}x${height} panel=${report.panelWidth}x${report.panelHeight} overflow=${report.docOverflow}px save=${report.saveVisible} targets=${report.smallTargets}`)

  if (width === 320 || width === 768) {
    const screenshot = await send('Page.captureScreenshot', { format: 'png' })
    await writeFile(join(output, `time-wheel-${width}.png`), Buffer.from(screenshot.result.data, 'base64'))
  }
}

socket.close()
child.kill()
try { await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }) } catch { /* OS reclaims */ }
if (failures) process.exitCode = 1
