import axios from 'axios'

// ---------------------------------------------------------------------------
// Token storage decision: localStorage.
//
// Rationale: the backend issues Sanctum *bearer* tokens (not httpOnly cookies),
// so the token has to be readable by JS regardless. In-memory only would force
// a re-login on every page refresh, which is unacceptable for an app you open
// several times a day. localStorage is the pragmatic choice here: this is a
// authenticated planner, and the XSS surface is small (no user-generated
// HTML is ever rendered). If this ever became multi-tenant, the correct upgrade
// is httpOnly refresh cookies + short-lived in-memory access tokens.
// ---------------------------------------------------------------------------
const TOKEN_KEY = 'auth-token'

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* storage unavailable — request interceptor will simply send no token */
  }
}

export function clearToken() {
  setToken(null)
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1',
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
  timeout: 15000,
})

// Attach the bearer token to every outgoing request.
api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Allow the app to react to auth loss without importing the store here
// (avoids a circular dependency between client.js and the auth store).
let onUnauthorized = null
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler
}

/**
 * Normalised error shape from the backend's { error: { code, message, details } }
 * envelope, so callers never have to dig through axios internals.
 */
export class ApiError extends Error {
  constructor({ code, message, details, status, isNetworkError = false }) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.details = details ?? {}
    this.status = status
    this.isNetworkError = isNetworkError
  }

  /** First validation message for a given field, if any. */
  fieldError(field) {
    const messages = this.details?.[field]
    return Array.isArray(messages) ? messages[0] : undefined
  }
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // No response at all → backend unreachable / timeout / CORS.
    if (!error.response) {
      return Promise.reject(
        new ApiError({
          code: 'network_error',
          message: "Can't reach the server right now.",
          isNetworkError: true,
        }),
      )
    }

    const { status, data } = error.response
    const envelope = data?.error ?? {}

    if (status === 401) {
      clearToken()
      // Let the app redirect to /login rather than hard-navigating here.
      if (typeof onUnauthorized === 'function') onUnauthorized()
    }

    return Promise.reject(
      new ApiError({
        code: envelope.code ?? 'unknown_error',
        message: envelope.message ?? 'Something went wrong.',
        details: envelope.details,
        status,
      }),
    )
  },
)

/** Unwrap the backend's success envelope: { data, meta }. */
export function unwrap(response) {
  return response.data?.data
}

export function unwrapMeta(response) {
  return response.data?.meta ?? {}
}

export default api
