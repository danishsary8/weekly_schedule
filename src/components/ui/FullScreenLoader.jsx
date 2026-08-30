import { motion, useReducedMotion } from 'framer-motion'
import { BRAND_PULSE_COLORS } from '../../config/brand.js'

/** Branded boot/loading state — never a bare white screen. */
export default function FullScreenLoader({ label = 'Loading…' }) {
  const reduceMotion = useReducedMotion()

  return (
    <div className="min-h-viewport flex flex-col items-center justify-center gap-4 bg-cream px-6">
      <div className="flex items-end gap-1.5" aria-hidden="true">
        {BRAND_PULSE_COLORS.map((color, i) => (
          <motion.span
            key={color}
            className="block h-8 w-2.5 rounded-full"
            style={{ backgroundColor: color }}
            animate={reduceMotion ? { opacity: 0.6 } : { scaleY: [0.45, 1, 0.45], opacity: [0.6, 1, 0.6] }}
            transition={reduceMotion ? { duration: 0 } : { duration: 1.1, repeat: Infinity, ease: 'easeInOut', delay: i * 0.12 }}
          />
        ))}
      </div>
      <p className="font-sans text-sm font-medium text-ink/55" role="status">
        {label}
      </p>
    </div>
  )
}
