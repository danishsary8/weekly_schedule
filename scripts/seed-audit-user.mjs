// Creates a disposable verified-looking account with one routine so the
// responsive audit can measure the real dashboard. Prints JSON for the auditor.
const api = process.env.DAYCRAFT_API || 'http://127.0.0.1:8000/api/v1'

const stamp = Date.now()
const email = `audit${stamp}@example.test`
const password = 'Str0ng-Routine-Pass!42'

async function call(path, options = {}, token) {
  const response = await fetch(`${api}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(`${options.method || 'GET'} ${path} -> ${response.status} ${JSON.stringify(body)}`)
  }
  return body
}

const registration = await call('/auth/register', {
  method: 'POST',
  body: JSON.stringify({
    name: 'Audit Person',
    email,
    password,
    password_confirmation: password,
    terms_accepted: true,
  }),
})

const token = registration.meta?.token
if (!token) throw new Error('No token returned from registration.')

// Schedule mutations require a verified email (documented in backend/API.md).
// Local mail uses Laravel's `log` driver, so we complete the real signed
// verification flow by reading the emitted link rather than touching the DB.
const { readFile } = await import('node:fs/promises')
const userId = registration.data?.id
if (!userId) throw new Error('No user id returned from registration.')

// The log is append-only and shared, so match this account's id specifically
// instead of assuming the last link belongs to us.
// Stop at quote/whitespace/`<` so trailing HTML never corrupts the signature.
const pattern = new RegExp(`http://127\\.0\\.0\\.1:8000/api/v1/email/verify/${userId}/[^"\\s<]+`, 'g')
let verifyUrl = null
for (let attempt = 0; attempt < 20 && !verifyUrl; attempt += 1) {
  const log = await readFile(new URL('../backend/storage/logs/laravel.log', import.meta.url), 'utf8')
  const found = [...log.matchAll(pattern)].map((match) => match[0].replaceAll('&amp;', '&'))
  verifyUrl = found.at(-1) ?? null
  if (!verifyUrl) await new Promise((resolve) => setTimeout(resolve, 250))
}
if (!verifyUrl) throw new Error(`No verification link for user ${userId} in the Laravel log.`)
await fetch(verifyUrl, { redirect: 'manual' })

// Long labels + a long description on purpose: this is what actually exposes
// overflow and truncation bugs at 375px.
const group = await call('/day-groups', {
  method: 'POST',
  body: JSON.stringify({
    name: 'Weekday mornings and focused deep work',
    color: '#0F766E',
    weekdays: [0, 1, 2, 3, 4, 5, 6],
  }),
}, token).then((response) => response.data)

await call(`/day-groups/${group.id}/timeline-entries`, {
  method: 'POST',
  body: JSON.stringify({
    start_time: '05:30',
    end_time: '07:00',
    description: 'Extremely long block description to stress test wrapping behaviour on very narrow phones',
    category: 'Career',
  }),
}, token)

await call(`/day-groups/${group.id}/timeline-entries`, {
  method: 'POST',
  body: JSON.stringify({ start_time: '22:30', end_time: '05:30', description: 'Overnight rest', category: 'Rest' }),
}, token)

for (const label of [
  'Drink a full glass of water right after waking up today',
  'Review priorities',
  'Stretch',
]) {
  await call(`/day-groups/${group.id}/checklist-items`, { method: 'POST', body: JSON.stringify({ label }) }, token)
}

const me = await call('/auth/me', {}, token)

console.log(JSON.stringify({ token, user: me.data, groupId: group.id }))
