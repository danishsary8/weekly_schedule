import { motion, useReducedMotion } from 'framer-motion'
import { CalendarCheck } from 'lucide-react'
import PublicFooter from '../PublicFooter.jsx'
import { BLOCK_GAP, CARD_PADDING_LG, DURATION, EASE, PAGE_GUTTER, TIGHT_GAP } from '../../config/layout.js'

/**
 * Shared shell for Login/Register/password flows.
 *
 * Height strategy — `min-h-viewport` (100dvh with a 100vh fallback) plus
 * `my-auto` on the card column, deliberately not a 100vh shell with
 * `items-center`:
 *
 *  - 100vh measures the viewport as though mobile browser toolbars were
 *    hidden, so a "full height" shell is taller than the visible area.
 *  - `items-center` on a container whose content overflows pushes the top of
 *    that content above the scroll origin, where it cannot be reached.
 *
 * `my-auto` centres the card when there is spare room and collapses to zero
 * when there is not, so tall content simply scrolls. Comfortable centred card at
 * every width; never full-bleed edge-to-edge inputs on mobile.
 */
export default function AuthLayout({ title, subtitle, children, footer }) {
  const reduceMotion = useReducedMotion()

  return (
    <div className={`min-h-viewport flex flex-col bg-cream ${PAGE_GUTTER} py-8`}>
      {/* ambient wash, consistent with the dashboard */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-32 -top-40 h-96 w-96 rounded-full bg-career opacity-10 blur-3xl" />
        <div className="absolute -bottom-40 -right-24 h-80 w-80 rounded-full bg-ink opacity-5 blur-3xl" />
      </div>

      <motion.div
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: DURATION.base, ease: EASE }}
        className="relative mx-auto my-auto w-full max-w-md"
      >
        <div className="mb-6 text-center">
          <span className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-ink text-white">
            <CalendarCheck className="h-6 w-6" aria-hidden="true" />
          </span>
          <h1 className="display-title text-4xl text-ink">
            {title}
          </h1>
          {subtitle && <p className={`${TIGHT_GAP} font-sans text-body-sm text-ink/60`}>{subtitle}</p>}
        </div>

        <div className={`rounded-card bg-paper ${CARD_PADDING_LG} shadow-card ring-1 ring-black/10`}>
          {children}
        </div>

        {footer && <div className={`${BLOCK_GAP} text-center font-sans text-body-sm text-ink/60`}>{footer}</div>}
        <PublicFooter />
      </motion.div>
    </div>
  )
}
