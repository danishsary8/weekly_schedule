import { motion, useReducedMotion } from 'framer-motion'

// Three card tones for visual rhythm (rotated across the app, not per-category).
const TONES = {
  black: { bg: '#1A1A1A', text: 'text-white', ring: 'ring-black/10' },
  white: { bg: '#FFFFFF', text: 'text-ink', ring: 'ring-black/10' },
  taupe: { bg: '#8A8378', text: 'text-ink', ring: 'ring-black/10' },
}

/**
 * Reusable card shell: one of three tones + a colored left accent strip.
 *
 * @param {'black'|'white'|'taupe'} tone
 * @param {string} accentColor  - category accent for the left strip
 * @param {boolean} interactive - enable soft hover lift
 */
export default function Card({
  tone = 'white',
  accentColor = '#8A8378',
  interactive = false,
  className = '',
  children,
  ...rest
}) {
  const reduceMotion = useReducedMotion()
  const t = TONES[tone] ?? TONES.white

  return (
    <motion.div
      className={`relative overflow-hidden rounded-card ring-1 ${t.ring} ${t.text} shadow-card ${className}`}
      style={{ backgroundColor: t.bg }}
      whileHover={interactive && !reduceMotion ? { y: -3, boxShadow: '0 14px 30px -10px rgba(26,26,26,0.35)' } : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      {...rest}
    >
      {/* Colored left-edge accent strip */}
      <span
        className="absolute inset-y-0 left-0 w-1.5"
        style={{ backgroundColor: accentColor }}
        aria-hidden="true"
      />
      {children}
    </motion.div>
  )
}

export { TONES }
