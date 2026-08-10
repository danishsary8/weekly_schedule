const dsn = import.meta.env.VITE_SENTRY_DSN?.trim()
let sentryPromise = null

export function initializeMonitoring() {
  if (!dsn) return false

  sentryPromise = import('@sentry/react').then((Sentry) => {
    Sentry.init({
      dsn,
      environment: import.meta.env.MODE,
      release: import.meta.env.VITE_SENTRY_RELEASE || undefined,
      sendDefaultPii: false,
      sampleRate: 1,
      tracesSampleRate: Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || 0.05),
      beforeSend(event) {
        if (event.request) {
          delete event.request.data
          delete event.request.cookies
          delete event.request.query_string
          if (event.request.headers) {
            for (const key of Object.keys(event.request.headers)) {
              if (['authorization', 'cookie', 'x-xsrf-token'].includes(key.toLowerCase())) event.request.headers[key] = '[Filtered]'
            }
          }
        }
        if (event.user) event.user = event.user.id ? { id: String(event.user.id) } : undefined
        return event
      },
    })
    if (import.meta.env.VITE_SENTRY_TEST === 'true') {
      Sentry.captureException(new Error('Daycraft frontend Sentry verification event'))
    }
    return Sentry
  })
  return true
}

export function setMonitoringUser(userId) {
  sentryPromise?.then((Sentry) => Sentry.setUser(userId ? { id: String(userId) } : null))
}
