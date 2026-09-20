import { motion, useReducedMotion } from 'framer-motion'
import toast from 'react-hot-toast'

/**
 * FacebookButton
 *
 * Matching social login button for Facebook authentication.
 * NOTE: UI-only for now with a placeholder handler until backend Facebook OAuth is configured.
 * // TODO: connect to backend Facebook OAuth endpoint once configured
 */
export default function FacebookButton() {
  const reduceMotion = useReducedMotion()

  // TODO: connect to backend Facebook OAuth endpoint once configured
  const handleFacebookLogin = () => {
    toast('Facebook sign-in is coming soon. Please use Google or your email.', {
      icon: 'ℹ️',
      duration: 3500,
    })
  }

  return (
    <motion.button
      type="button"
      onClick={handleFacebookLogin}
      whileHover={reduceMotion ? undefined : { scale: 1.01 }}
      whileTap={reduceMotion ? undefined : { scale: 0.98 }}
      className="mt-2.5 flex min-h-touch-lg w-full items-center justify-center gap-3 rounded-xl bg-white px-4 font-sans text-sm font-bold text-ink ring-1 ring-black/15 transition-colors hover:bg-cream/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1877F2]"
      aria-label="Continue with Facebook (coming soon)"
    >
      {/* Official Facebook 'f' logo SVG */}
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"
          fill="#1877F2"
        />
        <path
          d="M16.671 15.563l.532-3.49h-3.328V9.805c0-.956.465-1.886 1.956-1.886h1.513v-2.97s-1.374-.236-2.686-.236c-2.741 0-4.533 1.672-4.533 4.697v2.663H7.078v3.49h3.047V24c.618.098 1.252.148 1.875.148s1.257-.05 1.875-.148v-8.437h2.796z"
          fill="#FFFFFF"
        />
      </svg>
      <span>Continue with Facebook</span>
    </motion.button>
  )
}
