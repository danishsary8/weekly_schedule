import api, { unwrap, unwrapMeta } from './client.js'

export function toDateString(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export async function fetchDayGroups() { return unwrap(await api.get('/day-groups')) }
export async function fetchAnalyticsSummary() { return unwrap(await api.get('/internal/analytics')) }
export async function permanentlyDeleteAccount() { return unwrap(await api.delete('/account', { data: { confirmation: 'DELETE' } })) }
export async function resendVerificationEmail() { return unwrap(await api.post('/email/verification-notification')) }
export async function requestPasswordReset(email) { return unwrap(await api.post('/password/forgot', { email })) }
export async function resetPassword(payload) { return unwrap(await api.post('/password/reset', payload)) }
export async function fetchGoogleRedirectUrl() { return unwrap(await api.get('/auth/google/redirect')) }
export async function createDayGroup(payload) { return unwrap(await api.post('/day-groups', payload)) }
export async function updateDayGroup(id, payload) { return unwrap(await api.patch(`/day-groups/${id}`, payload)) }
export async function deleteDayGroup(id) { return unwrap(await api.delete(`/day-groups/${id}`, { params: { confirm: true } })) }
export async function createTimelineEntry(groupId, entry) { return unwrap(await api.post(`/day-groups/${groupId}/timeline-entries`, { start_time: entry.start, end_time: entry.end, description: entry.description, category: entry.category })) }
export async function updateTimelineEntry(id, entry) { return unwrap(await api.patch(`/timeline-entries/${id}`, { start_time: entry.start, end_time: entry.end, description: entry.description, category: entry.category })) }
export async function deleteTimelineEntry(id) { return unwrap(await api.delete(`/timeline-entries/${id}`)) }
export async function createChecklistItem(groupId, label) { return unwrap(await api.post(`/day-groups/${groupId}/checklist-items`, { label })) }
export async function updateChecklistItem(id, label) { return unwrap(await api.patch(`/checklist-items/${id}`, { label })) }
export async function deleteChecklistItem(id) { return unwrap(await api.delete(`/checklist-items/${id}`)) }
export async function fetchTodaySchedule(now = new Date()) { const response = await api.get('/schedule/today', { params: { date: toDateString(now) } }); return { ...unwrap(response), meta: unwrapMeta(response) } }
export async function fetchSchedule(dayGroupId) { const response = await api.get(`/schedule/day-groups/${dayGroupId}`); return { ...unwrap(response), meta: unwrapMeta(response) } }
export async function fetchChecklist(dateStr) { return unwrap(await api.get(`/checklist/${dateStr}`)) }
export async function saveChecklist(dateStr, checkedIds) { return unwrap(await api.put(`/checklist/${dateStr}`, { checked_ids: Array.from(checkedIds ?? []) })) }
export async function fetchNotificationSettings() { return unwrap(await api.get('/notification-settings')) }
export async function saveNotificationSettings({ enabled, minutesBefore }) { const payload = {}; if (enabled !== undefined) payload.enabled = enabled; if (minutesBefore !== undefined) payload.minutes_before = minutesBefore; return unwrap(await api.put('/notification-settings', payload)) }
export async function fetchPrayerTimes(dateStr, coords = null) { const params = {}; if (coords) { params.lat = coords.latitude; params.lng = coords.longitude }; const response = await api.get(`/prayer-times/${dateStr}`, { params }); return { ...unwrap(response), source: unwrapMeta(response).source } }
export function getBrowserCoords() { return new Promise((resolve) => { if (typeof navigator === 'undefined' || !('geolocation' in navigator)) return resolve(null); navigator.geolocation.getCurrentPosition((pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }), () => resolve(null), { timeout: 8000, maximumAge: 3600000 }) }) }
