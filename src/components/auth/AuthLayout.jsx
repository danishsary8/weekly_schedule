import { motion, useReducedMotion } from 'framer-motion'
import { CalendarCheck } from 'lucide-react'
import PublicFooter from '../PublicFooter.jsx'
import { CARD_PADDING, DURATION, EASE, PAGE_GUTTER, TIGHT_GAP } from '../../config/layout.js'

/**
 * Shared shell for Login/Register/password flows.
 *
 * Height strategy — `min-h-viewport` (100dvh with a 100vh fallback) plus
 * `my-auto` on the content column, deliberately not a 100vh shell with
 * `items-center`:
 *
 *  - 100vh measures the viewport as though mobile browser toolbars were
 *    hidden, so a "full height" shell is taller than the visible area.
 *  - `items-center` on a container whose content overflows pushes the top of
 *    that content above the scroll origin, where it cannot be reached.
 *
 * `my-auto` centres the column when there is spare room and collapses to zero
 * when there is not, so tall content simply scrolls.
 *
 * Layout — one column on phones and tablets. From `lg` (1024px) the brand block
 * and legal footer move into a left column beside the form card. Laptops are
 * wide but often short (a 1024×768 window has roughly 480px of usable height
 * after browser chrome), so stacking brand above form is what pushed the card
 * off-screen. Side-by-side spends the width that is actually available.
 *
 * Grid placement is explicit rather than order-based so the footer lands after
 * the card on phones but under the brand block on desktop, without rendering
 * the legal links twice.
 */
export default function AuthLayout({ title, subtitle, children, footer }) {
  const reduceMotion = useReducedMotion()

  return (
    <div className={`min-h-viewport flex flex-col bg-cream ${PAGE_GUTTER} py-8 lg:py-4`}>
      {/* ambient wash, consistent with the dashboard */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-32 -top-40 h-96 w-96 rounded-full bg-career opacity-10 blur-3xl" />
        <div className="absolute -bottom-40 -right-24 h-80 w-80 rounded-full bg-ink opacity-5 blur-3xl" />
      </div>

      <motion.div
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: DURATION.base, ease: EASE }}
        className="relative mx-auto my-auto w-full max-w-md lg:max-w-4xl"
      >
        <div className="grid gap-y-6 lg:grid-cols-2 lg:items-center lg:gap-x-12 lg:gap-y-4">
          {/* Brand block — centred when stacked, left-aligned beside the form. */}
          <div className="text-center lg:col-start-1 lg:row-start-1 lg:text-left">
            <span className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-ink text-white">
              <CalendarCheck className="h-6 w-6" aria-hidden="true" />
            </span>
            <h1 className="display-title text-4xl text-ink lg:text-5xl">
              {title}
            </h1>
            {subtitle && <p className={`${TIGHT_GAP} font-sans text-body-sm text-ink/60`}>{subtitle}</p>}
          </div>

          {/* Form card — spans both rows on desktop so it centres against the
              brand block and the secondary links. */}
          <div className="lg:col-start-2 lg:row-start-1 lg:row-end-3">
            <div className={`rounded-card bg-paper ${CARD_PADDING} shadow-card ring-1 ring-black/10`}>
              {children}
            </div>
          </div>

          {/*
            Secondary action and legal links. Directly beneath the card on
            phones, where they belong to the primary flow; moved under the brand
            block on desktop so the form column stays as short as possible.
          */}
          <div className="lg:col-start-1 lg:row-start-2">
            {footer && <div className="text-center font-sans text-body-sm text-ink/60 lg:text-left">{footer}</div>}
            <PublicFooter className={`${footer ? 'mt-4 lg:mt-3' : 'mt-0'} lg:justify-start`} />
          </div>
        </div>
      </motion.div>
    </div>
  )
}
