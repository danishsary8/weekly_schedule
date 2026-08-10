import { motion, useReducedMotion } from 'framer-motion'
import { CloudOff, RefreshCw, TriangleAlert } from 'lucide-react'

/**
 * Friendly, actionable failure state. Distinguishes "server unreachable" from
 * other errors, because the remedy differs.
 */
export default function ErrorState({
  error,
  onRetry,
  title,
  stale = false,
  compact = false,
}) {
  const reduceMotion = useReducedMotion()
  const isNetwork = Boolean(error?.isNetworkError)
  const Icon = isNetwork ? CloudOff : TriangleAlert

  const heading =
    title ?? (isNetwork ? "Can't reach the server right now" : 'Something went wrong')

  const body = isNetwork
    ? stale
      ? 'Showing your last loaded data. Reconnect to sync the latest.'
      : 'Check that the backend is running, then try again.'
    : (error?.message ?? 'Please try again.')

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      role="alert"
      className={`rounded-card bg-paper ring-1 ring-black/10 ${compact ? 'p-4' : 'p-6'}`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex flex-shrink-0 items-center justify-center rounded-xl ${compact ? 'h-9 w-9' : 'h-11 w-11'}`}
          style={{ backgroundColor: 'rgba(225, 29, 72, 0.12)' }}
        >
          <Icon className="h-5 w-5 text-language" aria-hidden="true" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="font-sans text-sm font-bold text-ink">{heading}</p>
          <p className="mt-1 font-sans text-sm text-ink/60">{body}</p>

          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-ink px-4 font-sans text-sm font-bold text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-career focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Try again
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

/** Slim inline banner used when we *do* have data but the last refresh failed. */
export function StaleBanner({ onRetry }) {
  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl bg-faith/10 px-3.5 py-2.5 ring-1 ring-faith/25"
    >
      <CloudOff className="h-4 w-4 flex-shrink-0 text-faith" aria-hidden="true" />
      <p className="font-sans text-xs font-semibold text-ink/70">
        Offline — showing your last saved data.
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="ml-auto inline-flex min-h-[44px] items-center rounded-lg px-3 font-sans text-xs font-bold text-career underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-career"
        >
          Retry
        </button>
      )}
    </div>
  )
}
