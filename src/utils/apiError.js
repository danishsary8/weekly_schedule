// ---------------------------------------------------------------------------
// Turning a failed request into a sentence the user can act on.
//
// Every mutation in the app used to share one line — "Could not save. Please try
// again." — regardless of cause. That sentence is wrong more often than it is
// right: it says nothing when a field was invalid, and it blames "saving" when
// the real problem is that the API is not running at all. A user who cannot tell
// "you typed something I can't accept" from "I can't reach the server" has no
// idea whether to edit the form or check their wifi.
//
// The API's error envelope is `{ error: { code, message, details } }`.
// ---------------------------------------------------------------------------

const NETWORK = 'Cannot reach Daycraft. Check your internet connection, then try again.'
const TIMEOUT = 'The server took too long to answer. Please try again.'

/** First validation message, e.g. "The name field is required." */
function firstFieldMessage(details) {
  if (!details || typeof details !== 'object') return null

  for (const messages of Object.values(details)) {
    if (Array.isArray(messages) && typeof messages[0] === 'string') return messages[0]
    if (typeof messages === 'string') return messages
  }
  return null
}

/**
 * Describe a failed API call.
 *
 * Prefers the specific field error, then the server's own message, then a
 * status-appropriate explanation, and only then the caller's fallback.
 *
 * @param {unknown} error     Axios error, or anything thrown.
 * @param {string}  [fallback] Used when the failure is understood but unhelpful.
 * @returns {string}
 */
export function describeApiError(error, fallback = 'Something went wrong. Please try again.') {
  const envelope = error?.response?.data?.error

  const fieldMessage = firstFieldMessage(envelope?.details)
  if (fieldMessage) return fieldMessage

  if (typeof envelope?.message === 'string' && envelope.message) return envelope.message

  if (error?.response) {
    const { status } = error.response
    if (status === 401) return 'Your session has expired. Sign in again to continue.'
    if (status === 403) return 'You do not have permission to do that.'
    if (status === 404) return 'That item no longer exists. Refresh the page and try again.'
    if (status === 429) return 'Too many attempts. Wait a moment, then try again.'
    if (status >= 500) return 'The server could not finish that. Please try again in a moment.'
    return fallback
  }

  // No response at all: the request never reached a server, or timed out on the
  // way. Both are the user's environment, not their input.
  if (error?.code === 'ECONNABORTED' || /timeout/i.test(error?.message ?? '')) return TIMEOUT

  return NETWORK
}
