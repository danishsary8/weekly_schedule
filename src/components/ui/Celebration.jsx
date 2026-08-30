import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { CATEGORY_COLORS } from '../../config/categories.js'
import { DURATION, EASE } from '../../config/layout.js'

// ---------------------------------------------------------------------------
// Confetti-style burst built purely from Framer Motion primitives — no confetti
// or animation library added. Particles are plain divs animated along a
// pre-computed vector, which keeps this to one render and no canvas/RAF loop.
//
// Colours come from the live category accent palette so the celebration reads
// as Daycraft rather than generic party colours, and stays correct whenever the
// category set changes.
// ---------------------------------------------------------------------------

const PALETTE = CATEGORY_COLORS

/**
 * Deterministic pseudo-random so a given particle index always produces the same
 * trajectory. Avoids Math.random() re-renders looking different mid-animation.
 */
function seeded(index, salt) {
  const value = Math.sin((index + 1) * 12.9898 + salt * 78.233) * 43758.5453
  return value - Math.floor(value)
}

function buildParticles(count, seed) {
  return Array.from({ length: count }, (_, index) => {
    const spread = seeded(index, seed)
    const lift = seeded(index, seed + 1)
    const drift = seeded(index, seed + 2)
    const spin = seeded(index, seed + 3)

    // Fan the particles across a wide upward arc, then let them fall.
    const angle = -140 + spread * 100 // degrees, biased upward
    const distance = 90 + lift * 130
    const radians = (angle * Math.PI) / 180

    return {
      id: index,
      color: PALETTE[index % PALETTE.length],
      x: Math.cos(radians) * distance + (drift - 0.5) * 60,
      y: Math.sin(radians) * distance,
      fall: 110 + drift * 90,
      rotate: (spin - 0.5) * 520,
      size: 7 + Math.round(drift * 6),
      round: spin > 0.55,
      delay: spread * 0.12,
    }
  })
}

/**
 * One-shot celebration burst.
 *
 * @param {boolean}  active     mount the burst (parent resets it to false)
 * @param {number}   count      particle count
 * @param {Function} onComplete called once the burst has finished
 */
export default function Celebration({ active, count = 22, onComplete }) {
  const reduceMotion = useReducedMotion()
  const [seed, setSeed] = useState(0)

  useEffect(() => {
    if (active) setSeed((value) => value + 1)
  }, [active])

  const particles = useMemo(() => buildParticles(count, seed), [count, seed])

  // Reduced motion: no flying debris. The parent still shows its calm text
  // confirmation, so the achievement is never silently dropped.
  useEffect(() => {
    if (!active || !reduceMotion) return
    const timer = setTimeout(() => onComplete?.(), 400)
    return () => clearTimeout(timer)
  }, [active, reduceMotion, onComplete])

  if (reduceMotion) return null

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key={`burst-${seed}`}
          className="pointer-events-none absolute inset-0 z-10 overflow-visible"
          aria-hidden="true"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onAnimationComplete={() => onComplete?.()}
        >
          {/* soft radial bloom behind the particles */}
          <motion.span
            className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0) 70%)' }}
            initial={{ scale: 0.3, opacity: 0.9 }}
            animate={{ scale: 2.4, opacity: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
          />

          {particles.map((particle) => (
            <motion.span
              key={particle.id}
              className={`absolute left-1/2 top-1/2 ${particle.round ? 'rounded-full' : 'rounded-[2px]'}`}
              style={{
                width: particle.size,
                height: particle.round ? particle.size : particle.size * 0.5,
                backgroundColor: particle.color,
              }}
              initial={{ x: 0, y: 0, opacity: 0, scale: 0.4, rotate: 0 }}
              animate={{
                x: [0, particle.x, particle.x * 1.08],
                y: [0, particle.y, particle.y + particle.fall],
                opacity: [0, 1, 0],
                scale: [0.4, 1, 0.85],
                rotate: particle.rotate,
              }}
              transition={{
                duration: DURATION.celebrate,
                delay: particle.delay,
                ease: [0.16, 0.8, 0.4, 1],
                times: [0, 0.35, 1],
              }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
