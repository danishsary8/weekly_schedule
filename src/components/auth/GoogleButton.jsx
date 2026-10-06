import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { fetchGoogleRedirectUrl } from '../../api/services.js'

export default function GoogleButton({ mode = 'signin', intent, onError, showDivider = false }) {
  const reduceMotion = useReducedMotion()
  const [loading, setLoading] = useState(false)

  const isSignUp = mode === 'signup' || intent === 'sign_up'
  const buttonLabel = 'Continue with Google'

  const start = async () => {
    setLoading(true)
    try {
      const resolvedIntent = isSignUp ? 'sign_up' : 'sign_in'
      const data = await fetchGoogleRedirectUrl(resolvedIntent)
      window.location.assign(data.url)
    } catch (error) {
      setLoading(false)
      onError?.(error.message || 'Google sign-in is unavailable.')
    }
  }

  const button = (
    <motion.button
      type="button"
      onClick={start}
      disabled={loading}
      whileHover={reduceMotion || loading ? undefined : { scale: 1.005 }}
      whileTap={reduceMotion || loading ? undefined : { scale: 0.985 }}
      transition={{ duration: 0.15, ease: [0.32, 0.72, 0, 1] }}
      className="flex min-h-[44px] h-11 w-full items-center justify-center gap-2.5 rounded-xl border-2 border-black bg-white px-4 font-sans text-sm font-bold tracking-tight text-ink transition-colors duration-150 hover:bg-slate-50 active:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-career focus-visible:ring-offset-1 disabled:cursor-wait disabled:opacity-60"
      aria-label={buttonLabel}
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin text-slate-600" />
      ) : (
        <img src="/google-g.svg" alt="" className="h-5 w-5 flex-shrink-0" />
      )}
      <span className="font-sans font-bold tracking-tight text-ink">
        {loading ? 'Connecting to Google\u2026' : buttonLabel}
      </span>
    </motion.button>
  )

  if (!showDivider) return button

  return (
    <>
      <div className="my-3 sm:my-3.5 flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-black/10" />
        <span className="font-sans text-label font-bold uppercase tracking-widest text-ink/35">or</span>
        <span className="h-px flex-1 bg-black/10" />
      </div>
      {button}
    </>
  )
}
