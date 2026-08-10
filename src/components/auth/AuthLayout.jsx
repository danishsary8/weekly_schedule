import { motion, useReducedMotion } from 'framer-motion'
import { CalendarCheck } from 'lucide-react'
import PublicFooter from '../PublicFooter.jsx'

/**
 * Shared shell for Login/Register. Comfortable centred card at every width
 * (never full-bleed edge-to-edge inputs on mobile).
 */
export default function AuthLayout({ title, subtitle, children, footer }) {
  const reduceMotion = useReducedMotion()

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4 py-10 sm:px-6">
      {/* ambient wash, consistent with the dashboard */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-32 -top-40 h-[26rem] w-[26rem] rounded-full bg-career opacity-[0.08] blur-3xl" />
        <div className="absolute -bottom-40 -right-24 h-[22rem] w-[22rem] rounded-full bg-ink opacity-[0.04] blur-3xl" />
      </div>

      <motion.div
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md"
      >
        <div className="mb-6 text-center">
          <span className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-ink text-white">
            <CalendarCheck className="h-6 w-6" aria-hidden="true" />
          </span>
          <h1 className="display-title text-4xl text-ink sm:text-5xl">
            {title}
          </h1>
          {subtitle && <p className="mt-2 font-sans text-sm text-ink/60">{subtitle}</p>}
        </div>

        <div className="rounded-card bg-paper p-5 shadow-card ring-1 ring-black/10 sm:p-7">
          {children}
        </div>

        {footer && <div className="mt-5 text-center font-sans text-sm text-ink/60">{footer}</div>}
        <PublicFooter />
      </motion.div>
    </div>
  )
}
