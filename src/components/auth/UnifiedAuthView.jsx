import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { CalendarCheck, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/authStore.js'
import FormField from './FormField.jsx'
import SubmitButton from './SubmitButton.jsx'
import GoogleButton from './GoogleButton.jsx'
import AuthDynamicVisual from './AuthDynamicVisual.jsx'
import PublicFooter from '../PublicFooter.jsx'

/**
 * UnifiedAuthView
 *
 * Merges Sign In and Sign Up into a single luxury-feeling auth experience.
 * - Desktop/tablet: Two-panel layout where the branding panel smoothly slides across
 *   between left and right with a curved organic divider edge, while active forms switch cleanly.
 * - Mobile (< 768px): Stacked single-column layout with top branding header and smooth cross-fade forms.
 * - Custom cubic-bezier easing [0.32, 0.72, 0, 1] (360ms duration), tactile button presses,
 *   full prefers-reduced-motion support, and aria-live announcements.
 */
export default function UnifiedAuthView({ initialMode = 'signin' }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const login = useAuthStore((s) => s.login)
  const register = useAuthStore((s) => s.register)
  const reduceMotion = useReducedMotion()

  const [mode, setMode] = useState(initialMode)
  const isSignIn = mode === 'signin'

  // Form states
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')

  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(() => searchParams.get('oauth_error') || '')
  const [loading, setLoading] = useState(false)

  // Sync mode if initialMode changes externally
  useEffect(() => {
    if (initialMode) {
      setMode(initialMode)
    }
  }, [initialMode])

  const switchMode = (newMode) => {
    if (newMode === mode) return
    setErrors({})
    setFormError('')
    setMode(newMode)
    if (typeof window !== 'undefined' && window.history?.pushState) {
      window.history.pushState(null, '', newMode === 'signin' ? '/login' : '/register')
    }
  }

  // Handle Sign In
  const handleSignIn = async (event) => {
    event.preventDefault()
    setErrors({})
    setFormError('')
    setLoading(true)

    try {
      const user = await login({ email, password })
      toast.success(`Welcome back, ${user.name.split(' ')[0]}`)
      navigate('/', { replace: true })
    } catch (error) {
      if (error.status === 422) {
        setErrors({
          email: error.fieldError('email'),
          password: error.fieldError('password'),
        })
      } else if (error.isNetworkError) {
        setFormError("Can't reach the server. Is the backend running?")
      } else {
        setFormError(error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  // Handle Sign Up
  const handleSignUp = async (event) => {
    event.preventDefault()
    setErrors({})
    setFormError('')

    if (password !== passwordConfirmation) {
      setErrors({ passwordConfirmation: 'Passwords do not match.' })
      return
    }

    setLoading(true)

    try {
      const user = await register({
        name,
        email,
        password,
        passwordConfirmation,
      })
      toast.success(`Welcome, ${user.name.split(' ')[0]}. Check your inbox to verify your email.`)
      navigate('/', { replace: true })
    } catch (error) {
      if (error.status === 422) {
        setErrors({
          name: error.fieldError('name'),
          email: error.fieldError('email'),
          password: error.fieldError('password'),
        })
      } else if (error.isNetworkError) {
        setFormError("Can't reach the server. Is the backend running?")
      } else {
        setFormError(error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  // Animation transition spec
  const transitionSpec = {
    duration: reduceMotion ? 0.05 : 0.36,
    ease: [0.32, 0.72, 0, 1],
  }

  /* ------------------------------------------------------------------------- */
  /* Branding / Illustration Panel Content                                     */
  /* ------------------------------------------------------------------------- */
  const brandingPanel = (
    <motion.div
      layout={reduceMotion ? undefined : 'position'}
      transition={transitionSpec}
      className={`relative z-10 flex w-full flex-col justify-between overflow-hidden border-black/10 bg-gradient-to-b from-[#F7EFE8] via-[#EFE6DE] to-[#E6DACF] p-6 sm:p-8 md:w-1/2 md:p-10 ${
        isSignIn ? 'md:order-1' : 'md:order-2'
      }`}
    >
      {/* Curved SVG divider edge on desktop */}
      <div className="hidden md:block pointer-events-none absolute inset-y-0 z-20 w-6" style={isSignIn ? { right: -1 } : { left: -1 }}>
        {isSignIn ? (
          <svg
            className="h-full w-6 text-paper"
            viewBox="0 0 24 600"
            preserveAspectRatio="none"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M 0 0 Q 24 300 0 600 Z" />
          </svg>
        ) : (
          <svg
            className="h-full w-6 text-paper"
            viewBox="0 0 24 600"
            preserveAspectRatio="none"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M 24 0 Q 0 300 24 600 Z" />
          </svg>
        )}
      </div>

      {/* Top: Brand Logo */}
      <div className="inline-flex items-center gap-2.5">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ink text-white shadow-sm">
          <CalendarCheck className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="font-display text-2xl font-bold tracking-tight text-ink/80">
          Daycraft
        </span>
      </div>

      {/* Middle: Dynamic visual composition + animated headlines */}
      <div className="my-auto py-4 text-center md:text-left">
        <AuthDynamicVisual className="my-2" />

        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="mt-3"
          >
            <h1 className="display-title text-3xl font-bold text-ink sm:text-4xl lg:text-[40px] leading-tight">
              {isSignIn ? 'Plan your day, beautifully.' : 'Start building your perfect day.'}
            </h1>
            <p className="mt-2 max-w-sm font-sans text-body-sm leading-relaxed text-ink/70">
              {isSignIn
                ? 'Sign in to pick up right where you left off.'
                : 'Create your account and make routines that stick.'}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom: Mode toggle switch & footer */}
      <div className="space-y-3 pt-2">
        {/* Desktop segmented switch button */}
        <div className="hidden md:block font-sans text-body-sm text-ink/75">
          {isSignIn ? (
            <>
              New here?{' '}
              <motion.span whileTap={reduceMotion ? undefined : { scale: 0.98 }} className="inline-block">
                <Link
                  to="/register"
                  onClick={(e) => {
                    e.preventDefault()
                    switchMode('signup')
                  }}
                  className="inline-flex min-h-touch items-center rounded-lg px-1 font-semibold text-career underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-career"
                >
                  Create an account
                </Link>
              </motion.span>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <motion.span whileTap={reduceMotion ? undefined : { scale: 0.98 }} className="inline-block">
                <Link
                  to="/login"
                  onClick={(e) => {
                    e.preventDefault()
                    switchMode('signin')
                  }}
                  className="inline-flex min-h-touch items-center rounded-lg px-1 font-semibold text-career underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-career"
                >
                  Sign in
                </Link>
              </motion.span>
            </>
          )}
        </div>

        <PublicFooter className="hidden md:flex justify-start pt-1" />
      </div>
    </motion.div>
  )

  /* ------------------------------------------------------------------------- */
  /* Active Form Content                                                       */
  /* ------------------------------------------------------------------------- */
  const formPanel = (
    <motion.div
      layout={reduceMotion ? undefined : 'position'}
      transition={transitionSpec}
      className={`relative flex w-full flex-col justify-center bg-paper p-6 sm:p-8 md:w-1/2 md:p-10 lg:p-12 ${
        isSignIn ? 'md:order-2' : 'md:order-1'
      }`}
    >
      <div className="mx-auto w-full max-w-sm">
        {/* Mobile-only Segmented Pill Switcher */}
        <div role="tablist" aria-label="Authentication mode" className="mb-6 flex w-full rounded-xl bg-black/5 p-1 ring-1 ring-black/10 md:hidden">
          <button
            type="button"
            role="tab"
            aria-selected={isSignIn}
            onClick={() => switchMode('signin')}
            className={`relative flex-1 rounded-lg py-2 font-sans text-xs font-bold transition-colors ${
              isSignIn ? 'text-ink' : 'text-ink/60 hover:text-ink'
            }`}
          >
            {isSignIn && (
              <motion.div
                layoutId="activeAuthTab"
                className="absolute inset-0 rounded-lg bg-white shadow-sm ring-1 ring-black/5"
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              />
            )}
            <span className="relative z-10">Sign in</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={!isSignIn}
            onClick={() => switchMode('signup')}
            className={`relative flex-1 rounded-lg py-2 font-sans text-xs font-bold transition-colors ${
              !isSignIn ? 'text-ink' : 'text-ink/60 hover:text-ink'
            }`}
          >
            {!isSignIn && (
              <motion.div
                layoutId="activeAuthTab"
                className="absolute inset-0 rounded-lg bg-white shadow-sm ring-1 ring-black/5"
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              />
            )}
            <span className="relative z-10">Create account</span>
          </button>
        </div>

        {/* Form Header */}
        <div className="mb-5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-career/10 px-3 py-1 font-sans text-xs font-semibold text-career">
            <Sparkles className="h-3 w-3" />
            {isSignIn ? 'Welcome Back' : 'Get Started'}
          </span>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink">
            {isSignIn ? 'Access your routines' : 'Create your account'}
          </h2>
        </div>

        {/* Smooth Form Switcher */}
        <AnimatePresence mode="wait">
          {isSignIn ? (
            <motion.form
              key="sign-in-form"
              onSubmit={handleSignIn}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
              noValidate
            >
              {formError && (
                <div
                  role="alert"
                  className="rounded-xl bg-language/10 px-3.5 py-3 font-sans text-sm font-medium text-language ring-1 ring-language/20"
                >
                  {formError}
                </div>
              )}

              <FormField
                label="Email"
                type="email"
                value={email}
                onChange={setEmail}
                error={errors.email}
                autoComplete="email"
                required
              />

              <FormField
                label="Password"
                type="password"
                value={password}
                onChange={setPassword}
                error={errors.password}
                autoComplete="current-password"
                required
                labelAction={
                  <Link
                    to="/password/forgot"
                    className="inline-flex min-h-touch items-center font-sans text-body-sm font-semibold text-career hover:underline"
                  >
                    Forgot password?
                  </Link>
                }
              />

              <div className="pt-1">
                <SubmitButton loading={loading}>
                  {loading ? 'Signing in…' : 'Sign in'}
                </SubmitButton>
              </div>

              <GoogleButton onError={setFormError} />

              <p className="mt-4 text-center font-sans text-xs leading-relaxed text-ink/50">
                If Google creates a new account for you, continuing means you agree to the{' '}
                <Link to="/terms" className="inline-block py-1.5 -my-1.5 font-semibold text-career underline">
                  Terms
                </Link>{' '}
                and acknowledge the{' '}
                <Link to="/privacy" className="inline-block py-1.5 -my-1.5 font-semibold text-career underline">
                  Privacy Policy
                </Link>
                .
              </p>
            </motion.form>
          ) : (
            <motion.form
              key="sign-up-form"
              onSubmit={handleSignUp}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 12 }}
              transition={{ duration: 0.2 }}
              className="space-y-3.5"
              noValidate
            >
              {formError && (
                <div
                  role="alert"
                  className="rounded-xl bg-language/10 px-3.5 py-2.5 font-sans text-sm font-medium text-language ring-1 ring-language/20"
                >
                  {formError}
                </div>
              )}

              <FormField
                label="Name"
                value={name}
                onChange={setName}
                error={errors.name}
                autoComplete="name"
                required
              />

              <FormField
                label="Email"
                type="email"
                value={email}
                onChange={setEmail}
                error={errors.email}
                autoComplete="email"
                required
              />

              <FormField
                label="Password"
                type="password"
                value={password}
                onChange={setPassword}
                error={errors.password}
                autoComplete="new-password"
                hint="Use at least 8 characters."
                required
              />

              <FormField
                label="Confirm password"
                type="password"
                value={passwordConfirmation}
                onChange={setPasswordConfirmation}
                error={errors.passwordConfirmation}
                autoComplete="new-password"
                required
              />

              <div className="flex items-start gap-2.5 pt-1">
                <input
                  id="terms-agreement"
                  type="checkbox"
                  defaultChecked
                  required
                  aria-label="I agree to the Terms of Service and Privacy Policy"
                  className="mt-0.5 h-4 w-4 rounded border-black/20 text-career focus:ring-career focus:ring-offset-paper accent-career"
                />
                <label htmlFor="terms-agreement" className="font-sans text-xs leading-relaxed text-ink/65">
                  By signing up, you agree to our{' '}
                  <Link to="/terms" className="inline-block py-1.5 -my-1.5 font-semibold text-career underline underline-offset-2">
                    Terms of Service
                  </Link>{' '}
                  and acknowledge our{' '}
                  <Link to="/privacy" className="inline-block py-1.5 -my-1.5 font-semibold text-career underline underline-offset-2">
                    Privacy Policy
                  </Link>
                  .
                </label>
              </div>

              <div className="pt-1">
                <SubmitButton loading={loading}>
                  {loading ? 'Creating account…' : 'Create account'}
                </SubmitButton>
              </div>

              <GoogleButton onError={setFormError} />
            </motion.form>
          )}
        </AnimatePresence>

        {/* Mobile toggle link and footer */}
        <div className="mt-5 flex flex-col items-center text-center space-y-4 md:hidden">
          <div className="font-sans text-body-sm text-ink/70">
            {isSignIn ? (
              <>
                New here?{' '}
                <motion.span whileTap={reduceMotion ? undefined : { scale: 0.98 }} className="inline-block">
                  <Link
                    to="/register"
                    onClick={(e) => {
                      e.preventDefault()
                      switchMode('signup')
                    }}
                    className="inline-flex min-h-touch items-center rounded-lg px-1 font-semibold text-career underline-offset-2 hover:underline focus-visible:outline-none"
                  >
                    Create an account
                  </Link>
                </motion.span>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <motion.span whileTap={reduceMotion ? undefined : { scale: 0.98 }} className="inline-block">
                  <Link
                    to="/login"
                    onClick={(e) => {
                      e.preventDefault()
                      switchMode('signin')
                    }}
                    className="inline-flex min-h-touch items-center rounded-lg px-1 font-semibold text-career underline-offset-2 hover:underline focus-visible:outline-none"
                  >
                    Sign in
                  </Link>
                </motion.span>
              </>
            )}
          </div>

          <PublicFooter className="justify-center pt-1" />
        </div>
      </div>
    </motion.div>
  )

  return (
    <div className="min-h-viewport flex flex-col justify-between bg-cream px-4 py-8 sm:px-6 md:px-8 lg:px-12 md:py-12 selection:bg-career/20 selection:text-ink">
      {/* Screen reader notification of active mode */}
      <div className="sr-only" role="status" aria-live="polite">
        {isSignIn ? 'Showing sign in form' : 'Showing create account form'}
      </div>

      {/* Ambient background wash */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-32 -top-40 h-96 w-96 rounded-full bg-career opacity-10 blur-3xl" />
        <div className="absolute -bottom-40 -right-24 h-80 w-80 rounded-full bg-ink opacity-5 blur-3xl" />
      </div>

      {/* Main Unified Auth Card (Desktop & Mobile) */}
      <div className="relative mx-auto my-auto flex w-full max-w-5xl flex-col overflow-hidden rounded-[32px] bg-paper shadow-card ring-1 ring-black/10 md:min-h-[660px] md:flex-row">
        {brandingPanel}
        {formPanel}
      </div>
    </div>
  )
}
