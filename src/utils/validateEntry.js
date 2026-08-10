import { toMinutes } from './time.js'

/**
 * Client-side validation for the inline entry edit form.
 *
 * Mirrors the backend's rules so the user gets instant per-field feedback, but
 * the server remains the authority (a 422 is still surfaced if they diverge).
 * Overnight ranges (end earlier than start) are allowed; only equal or
 * malformed times are rejected.
 *
 * @returns {Record<string,string>} field -> message (empty object when valid)
 */
export function validateEntryDraft(draft) {
  const errors = {}
  const startMin = toMinutes(draft.start)
  const endMin = toMinutes(draft.end)

  if (startMin === null) errors.start = 'Use a 24-hour time like 09:00.'
  if (endMin === null) errors.end = 'Use a 24-hour time like 14:30.'

  if (startMin !== null && endMin !== null && startMin === endMin) {
    errors.end = 'End time can’t match the start time.'
  }

  if (!draft.description || !draft.description.trim()) {
    errors.description = 'Add a short description.'
  }

  if (!draft.category) errors.category = 'Pick a category.'

  return errors
}
