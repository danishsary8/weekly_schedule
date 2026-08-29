import { motion, useReducedMotion } from 'framer-motion'

const ease = [0.22, 1, 0.36, 1]

export default function SplashScreen() {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex min-h-[100dvh] items-center justify-center overflow-hidden bg-cream px-6"
      exit={{ opacity: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.42, ease }}
      role="status"
      aria-label="Loading Daycraft"
    >
      <div className="flex w-full flex-col items-center text-center">
        <motion.svg viewBox="0 0 64 64" className="h-16 w-16 text-ink" fill="none" aria-hidden="true" initial={reduceMotion ? false : { opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.45, ease }}>
          <motion.rect x="10" y="12" width="44" height="42" rx="13" stroke="currentColor" strokeWidth="3" initial={reduceMotion ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8, ease }} />
          <motion.path d="M21 9v9M43 9v9M20 28h24M23 39l6 6 13-14" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 0.7, delay: 0.2, ease }} />
        </motion.svg>
        <h1 className="display-title mt-5 w-full whitespace-nowrap text-center text-display-sm text-ink min-[400px]:text-4xl sm:text-5xl">
          Daycraft
        </h1>
        <p className="mt-2 font-sans text-xs font-medium tracking-wide text-ink/55 sm:text-sm">
          Craft your day, one routine at a time.
        </p>
        <span className="sr-only">Preparing Daycraft</span>
        <div className="mt-6 flex items-center gap-2" aria-hidden="true">
          {['#C9A227', '#0F766E', '#E11D48'].map((color, index) => (
            <motion.span key={color} className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} animate={reduceMotion ? { opacity: 0.7 } : { y: [0, -4, 0], opacity: [0.45, 1, 0.45] }} transition={{ duration: 1.35, repeat: Infinity, ease: 'easeInOut', delay: index * 0.16 }} />
          ))}
        </div>
      </div>
    </motion.div>
  )
}
