const baseUrl = (process.env.DAYCRAFT_LOAD_URL || 'http://127.0.0.1:8010/api/v1').replace(/\/$/, '')
const total = Number(process.env.DAYCRAFT_LOAD_REQUESTS || 40)
const concurrency = Number(process.env.DAYCRAFT_LOAD_CONCURRENCY || 10)
let token = process.env.DAYCRAFT_LOAD_TOKEN
let temporaryAccount = false

if (!token) {
  const stamp = `${Date.now()}-${Math.random().toString(16).slice(2)}`
  const response = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Load Test',
      email: `load-${stamp}@example.test`,
      password: 'DaycraftLoad123',
      password_confirmation: 'DaycraftLoad123',
      terms_accepted: true,
      device_name: 'load-test',
    }),
  })
  const payload = await response.json()
  if (!response.ok) throw new Error(`Could not create disposable load user (${response.status}): ${JSON.stringify(payload)}`)
  token = payload.meta?.token
  temporaryAccount = true
}

const headers = { Accept: 'application/json', Authorization: `Bearer ${token}` }
const timings = []
let failures = 0
let cursor = 0

async function worker() {
  while (cursor < total) {
    cursor += 1
    const started = performance.now()
    const response = await fetch(`${baseUrl}/schedule/today`, { headers })
    timings.push(performance.now() - started)
    if (!response.ok) failures += 1
    await response.arrayBuffer()
  }
}

await Promise.all(Array.from({ length: Math.min(concurrency, total) }, worker))
timings.sort((a, b) => a - b)
const percentile = (value) => timings[Math.min(timings.length - 1, Math.ceil(timings.length * value) - 1)]
console.log(JSON.stringify({
  target: `${baseUrl}/schedule/today`,
  requests: total,
  concurrency,
  failures,
  min_ms: Number(timings[0].toFixed(1)),
  median_ms: Number(percentile(.5).toFixed(1)),
  p95_ms: Number(percentile(.95).toFixed(1)),
  max_ms: Number(timings.at(-1).toFixed(1)),
}, null, 2))

if (temporaryAccount) {
  await fetch(`${baseUrl}/account`, {
    method: 'DELETE',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ confirmation: 'DELETE' }),
  })
}
