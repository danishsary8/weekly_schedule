import { spawn } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const profile = await mkdtemp(join(tmpdir(), 'daycraft-edge-'))
const port = 9333
const browser = spawn(edge, [`--headless`, `--disable-gpu`, `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' })
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function debuggerTarget() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const targets = await fetch(`http://127.0.0.1:${port}/json`).then((response) => response.json())
      const page = targets.find((target) => target.type === 'page')
      if (page) return page
    } catch { /* browser is still starting */ }
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
  const result = await send('Runtime.evaluate', { expression, returnByValue: true })
  return result.result.value
}

async function audit(width, height, reducedMotion = false) {
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600 })
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: reducedMotion ? 'reduce' : 'no-preference' }] })
  await send('Page.navigate', { url: 'http://127.0.0.1:4173/' })
  await pause(3600)
  return evaluate(`(() => ({
    width: innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    overflow: document.documentElement.scrollWidth > innerWidth,
    route: location.pathname,
    h1: document.querySelector('h1')?.textContent?.trim(),
    primaryCta: document.querySelector('a[href="/register"]')?.textContent?.trim(),
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches
  }))()`)
}

try {
  await send('Page.enable')
  const reports = []
  for (const [width, height] of [[375, 812], [768, 1024], [1440, 1000]]) reports.push(await audit(width, height))
  reports.push(await audit(375, 812, true))

  await evaluate(`localStorage.setItem('auth-token','audit-token'); localStorage.setItem('auth-user', JSON.stringify({id:999,name:'Audit User',email:'audit@example.test',email_verified_at:'2026-01-01'}));`)
  await send('Page.navigate', { url: 'http://127.0.0.1:4173/' })
  await pause(3800)
  const authenticatedRoot = await evaluate(`({ route: location.pathname, hasDashboardMain: Boolean(document.querySelector('main')) })`)
  console.log(JSON.stringify({ landing: reports, authenticatedRoot }, null, 2))
} finally {
  socket.close()
  browser.kill()
  await pause(500)
  try { await rm(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 250 }) } catch { /* Windows may retain an Edge journal briefly. */ }
}
