import { motion, useReducedMotion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

export default function SubmitButton({ children, loading = false, disabled = false }) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.button
      type="submit"
      disabled={loading || disabled}
      whileHover={reduceMotion || loading ? undefined : { scale: 1.01 }}
      whileTap={reduceMotion || loading ? undefined : { scale: 0.98 }}
      transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
      className="flex min-h-touch-lg w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 font-sans text-sm font-bold text-white transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] focus:outline-none focus-visible:ring-2 focus-visible:ring-career focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:opacity-60"
    >
      {loading && <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" />}
      {children}
    </motion.button>
  )
}
