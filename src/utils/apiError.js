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

/**
 * The error envelope, from either shape this app produces.
 *
 * Two shapes exist and both reach this function. `api/client.js` has a response
 * interceptor that unwraps `{ error: { code, message, details } }` into an
 * `ApiError` instance — so by the time a page catches it there is no `response`
 * property left to read. Anything bypassing that client still has the raw axios
 * error. Reading only the axios shape (as this file first did) meant every
 * normalised validation failure fell through to the network message, telling the
 * user their connection was broken when the server had in fact answered.
 */
function envelopeOf(error) {
  if (error?.response?.data?.error) return error.response.data.error
  if (error?.name === 'ApiError') return { code: error.code, message: error.message, details: error.details }

  return null
}

/** HTTP status from either shape, or null when the request never got a reply. */
function statusOf(error) {
  return error?.response?.status ?? error?.status ?? null
}

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
  // The client already writes a specific, user-facing line for an unreachable
  // server (including "it may be waking up"); don't overwrite it with a generic.
  if (error?.isNetworkError) return error.message || NETWORK

  const envelope = envelopeOf(error)

  const fieldMessage = firstFieldMessage(envelope?.details)
  if (fieldMessage) return fieldMessage

  if (typeof envelope?.message === 'string' && envelope.message) return envelope.message

  const status = statusOf(error)
  if (status !== null) {
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
