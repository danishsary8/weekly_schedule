import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, Calendar, CalendarCheck, CheckCircle2, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/authStore.js'
import FormField from './FormField.jsx'
import SubmitButton from './SubmitButton.jsx'
import GoogleButton from './GoogleButton.jsx'
import FacebookButton from './FacebookButton.jsx'
import PublicFooter from '../PublicFooter.jsx'

/**
 * UnifiedAuthView
 *
 * Professional two-panel authentication experience for Daycraft.
 *
 * Left Panel:
 * - Daycraft logo + wordmark
 * - Fixed 4:3 aspect ratio designated empty brand visual placeholder
 * - Warm brand statement + 3 category-colored benefit bullets
 * - Anchored footer
 *
 * Right Panel:
 * - Script font heading + muted subtext
 * - Step progress indicator
 * - Progressive single-field step-by-step form flow with forward/backward animated transitions
 * - Email / Phone number toggle on the identifier step
 * - Social login buttons (Continue with Google + Continue with Facebook)
 * - Mode switch link (Sign In <-> Sign Up)
 */
export default function UnifiedAuthView({
  initialMode = 'signin',
  imageSrc = 'public/Gemini_Generated_Image_yvzsxyvzsxyvzsxy.jpg',
  imageAlt = 'Daycraft daily routine planner',
}) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const login = useAuthStore((s) => s.login)
  const register = useAuthStore((s) => s.register)
  const reduceMotion = useReducedMotion()

  const [mode, setMode] = useState(initialMode)
  const isSignIn = mode === 'signin'

  // Step state: Sign In has 2 steps, Sign Up has 3 steps
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(1) // 1 = forward, -1 = backward
  const totalSteps = isSignIn ? 2 : 3

  // Form field state (persists across step navigation)
  const [contactMethod, setContactMethod] = useState('email') // 'email' | 'phone'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(true)

  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(() => searchParams.get('oauth_error') || '')
  const [loading, setLoading] = useState(false)

  // Sync mode if initialMode prop changes (e.g. browser back/forward)
  useEffect(() => {
    if (initialMode) {
      setMode(initialMode)
      setStep(1)
      setDirection(1)
      setErrors({})
      setFormError('')
    }
  }, [initialMode])

  const switchMode = (newMode) => {
    if (newMode === mode) return
    setMode(newMode)
    setStep(1)
    setDirection(1)
    setErrors({})
    setFormError('')
    if (typeof window !== 'undefined' && window.history?.pushState) {
      window.history.pushState(null, '', newMode === 'signin' ? '/login' : '/register')
    }
  }

  // Email format validation helper
  const isValidEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())
  // Phone format validation helper (international or local format with at least 7 digits)
  const isValidPhone = (val) => /^[+]?[\d\s().-]{7,20}$/.test(val.trim())

  // Go to next step in flow after local client-side validation
  const handleNextStep = (e) => {
    e?.preventDefault()
    setErrors({})
    setFormError('')

    if (isSignIn) {
      // Step 1: Identifier (Email or Phone)
      if (step === 1) {
        if (contactMethod === 'email') {
          if (!email.trim()) {
            setErrors({ email: 'Please enter your email.' })
            return
          }
          if (!isValidEmail(email)) {
            setErrors({ email: 'Please enter a valid email address.' })
            return
          }
        } else {
          if (!phone.trim()) {
            setErrors({ phone: 'Please enter your phone number.' })
            return
          }
          if (!isValidPhone(phone)) {
            setErrors({ phone: 'Please enter a valid phone number.' })
            return
          }
        }
        setDirection(1)
        setStep(2)
      }
    } else {
      // Sign Up Flow
      if (step === 1) {
        // Name validation
        if (!name.trim()) {
          setErrors({ name: 'Please enter your name.' })
          return
        }
        if (name.trim().length < 2) {
          setErrors({ name: 'Name must be at least 2 characters.' })
          return
        }
        setDirection(1)
        setStep(2)
      } else if (step === 2) {
        // Email / Phone validation
        if (contactMethod === 'email') {
          if (!email.trim()) {
            setErrors({ email: 'Please enter your email.' })
            return
          }
          if (!isValidEmail(email)) {
            setErrors({ email: 'Please enter a valid email address.' })
            return
          }
        } else {
          if (!phone.trim()) {
            setErrors({ phone: 'Please enter your phone number.' })
            return
          }
          if (!isValidPhone(phone)) {
            setErrors({ phone: 'Please enter a valid phone number.' })
            return
          }
        }
        setDirection(1)
        setStep(3)
      }
    }
  }

  // Go to previous step
  const handlePrevStep = () => {
    setErrors({})
    setFormError('')
    setDirection(-1)
    setStep((prev) => Math.max(1, prev - 1))
  }

  // Final submit for Sign In (Step 2)
  const handleSignInSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setFormError('')

    if (!password) {
      setErrors({ password: 'Password is required.' })
      return
    }

    setLoading(true)
    const identifier = contactMethod === 'email' ? email.trim() : phone.trim()

    try {
      const user = await login({ email: identifier, password })
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

  // Final submit for Sign Up (Step 3)
  const handleSignUpSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setFormError('')

    if (!password) {
      setErrors({ password: 'Password is required.' })
      return
    }
    if (password.length < 8) {
      setErrors({ password: 'Password must be at least 8 characters.' })
      return
    }
    if (password !== passwordConfirmation) {
      setErrors({ passwordConfirmation: 'Passwords do not match.' })
      return
    }
    if (!termsAccepted) {
      setFormError('You must agree to the Terms of Service to create an account.')
      return
    }

    setLoading(true)
    const identifier = contactMethod === 'email' ? email.trim() : phone.trim()

    try {
      const user = await register({
        name: name.trim(),
        email: identifier,
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

  // Animation variants for progressive step slide + fade
  const stepVariants = {
    enter: (dir) => ({
      x: reduceMotion ? 0 : dir > 0 ? 24 : -24,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir) => ({
      x: reduceMotion ? 0 : dir > 0 ? -24 : 24,
      opacity: 0,
    }),
  }

  const stepTransition = {
    duration: reduceMotion ? 0.05 : 0.28,
    ease: [0.32, 0.72, 0, 1],
  }

  return (
    <div className="min-h-viewport flex flex-col justify-between bg-cream px-4 py-6 sm:px-6 md:px-8 lg:px-12 md:py-10 selection:bg-career/20 selection:text-ink">
      {/* Screen reader announcement of step and mode */}
      <div className="sr-only" role="status" aria-live="polite">
        {isSignIn
          ? `Sign in step ${step} of ${totalSteps}`
          : `Create account step ${step} of ${totalSteps}`}
      </div>

      {/* Ambient decorative backdrop */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-32 -top-40 h-96 w-96 rounded-full bg-career opacity-10 blur-3xl" />
        <div className="absolute -bottom-40 -right-24 h-80 w-80 rounded-full bg-ink opacity-5 blur-3xl" />
      </div>

      {/* Main Two-Panel Card Container */}
      <motion.div
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: reduceMotion ? 0.1 : 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="relative mx-auto my-auto flex w-full max-w-5xl flex-col overflow-hidden rounded-[32px] bg-paper shadow-card ring-1 ring-black/10 md:min-h-[660px] md:flex-row"
      >
        
        {/* ================================================================= */}
        {/* LEFT PANEL: Branding, Placeholder Asset, Brand Statement, Footer  */}
        {/* ================================================================= */}
        <div className="flex w-full flex-col justify-between border-b border-black/5 bg-[#F5EDE6] p-6 sm:p-8 md:w-1/2 md:border-b-0 md:border-r md:p-10 lg:p-12">
          {/* Brand Logo & Wordmark */}
          <div className="inline-flex items-center gap-2.5">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ink text-white shadow-sm">
              <CalendarCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="font-display text-2xl font-bold tracking-tight text-ink/80">
              Daycraft
            </span>
          </div>

          {/* Middle: Image Placeholder & Value Statement */}
          <div className="my-auto py-6">
            {/* -------------------------------------------------------------
                IMAGE ASSET SLOT:
                To place your own image here:
                Option 1: Put your image in the `public/` directory (e.g. `public/auth-hero.png`)
                          and set `imageSrc="/auth-hero.png"`.
                Option 2: Import an image file and pass it to `imageSrc`.
               ------------------------------------------------------------- */}
            {imageSrc ? (
              <div
                data-testid="brand-visual-placeholder"
                className="relative mx-auto mb-6 hidden w-full max-w-[340px] aspect-[4/3] overflow-hidden rounded-2xl shadow-card ring-1 ring-black/10 sm:flex items-center justify-center bg-white"
              >
                <img
                  src={imageSrc}
                  alt={imageAlt}
                  className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                />
              </div>
            ) : (
              <div
                data-testid="brand-visual-placeholder"
                className="relative mx-auto mb-6 hidden w-full max-w-[340px] aspect-[4/3] rounded-2xl border-2 border-dashed border-ink/20 bg-ink/[0.03] p-5 sm:flex flex-col items-center justify-center text-center transition-colors hover:border-career/40"
              >
                <div className="mb-2.5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-xs ring-1 ring-black/10 text-ink/40">
                  <Sparkles className="h-6 w-6 text-career" aria-hidden="true" />
                </div>
                <p className="font-sans text-xs font-bold uppercase tracking-wider text-ink/70">
                  Brand Visual Placeholder
                </p>
                <p className="mt-0.5 font-sans text-[11px] text-ink/45">
                  Fixed 4:3 container • Ready for asset
                </p>
              </div>
            )}

            {/* Warm Brand Statement */}
            <p className="text-center font-sans text-body font-medium leading-relaxed text-ink/80 sm:text-base md:text-left">
              Routines crafted for intentional, calmer days.
            </p>

            {/* 3 Benefit Bullets with Lucide Icons in Category Accent Colors */}
            <div className="mt-4 space-y-2.5 text-left">
              <div className="flex items-center gap-2.5 font-sans text-xs sm:text-body-sm text-ink/75">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0F766E]/15 text-[#0F766E]">
                  <CheckCircle2 className="h-3.5 w-3.5 stroke-[2.5]" aria-hidden="true" />
                </span>
                <span>Build routines that actually stick</span>
              </div>

              <div className="flex items-center gap-2.5 font-sans text-xs sm:text-body-sm text-ink/75">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#5E7964]/15 text-[#5E7964]">
                  <Calendar className="h-3.5 w-3.5 stroke-[2.5]" aria-hidden="true" />
                </span>
                <span>See your whole day, at a glance</span>
              </div>

              <div className="flex items-center gap-2.5 font-sans text-xs sm:text-body-sm text-ink/75">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#7C8B9C]/15 text-[#7C8B9C]">
                  <Sparkles className="h-3.5 w-3.5 stroke-[2.5]" aria-hidden="true" />
                </span>
                <span>Free to start, no clutter</span>
              </div>
            </div>
          </div>

          {/* Anchored Footer on Desktop */}
          <PublicFooter className="hidden md:flex justify-start pt-2" />
        </div>

        {/* ================================================================= */}
        {/* RIGHT PANEL: Form Side (Headings, Steps, Social Logins, Toggles)  */}
        {/* ================================================================= */}
        <div className="flex w-full flex-col justify-between bg-paper p-6 sm:p-8 md:w-1/2 md:p-10 lg:p-12">
          <div className="mx-auto w-full max-w-sm">
            {/* Script Font Heading & Muted Subtext */}
            <div className="mb-5">
              <h1 className="display-title text-3xl sm:text-4xl font-bold leading-tight text-ink">
                {isSignIn ? 'Plan your day, beautifully.' : 'Start building your perfect day.'}
              </h1>
              <p className="mt-1 font-sans text-body-sm text-ink/65 leading-relaxed">
                {isSignIn
                  ? 'Sign in to pick up right where you left off.'
                  : 'Create your account and make routines that stick.'}
              </p>
            </div>

            {/* Step-Progress Indicator */}
            <div className="mb-5 flex items-center justify-between gap-3">
              <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-ink/50">
                Step {step} of {totalSteps}
              </span>
              <div className="flex flex-1 items-center gap-1.5" aria-hidden="true">
                {Array.from({ length: totalSteps }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                      i + 1 <= step ? 'bg-career' : 'bg-black/10'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Error Alert Box */}
            {formError && (
              <div
                role="alert"
                className="mb-4 rounded-xl bg-language/10 px-3.5 py-2.5 font-sans text-sm font-medium text-language ring-1 ring-language/20"
              >
                {formError}
              </div>
            )}

            {/* Progressive Single-Field Flow with Slide + Fade Transitions */}
            <AnimatePresence mode="wait" custom={direction}>
              {isSignIn ? (
                /* ------------------------------------------------------------- */
                /* SIGN IN STEPS                                                 */
                /* ------------------------------------------------------------- */
                step === 1 ? (
                  <motion.form
                    key="signin-step-1"
                    custom={direction}
                    variants={stepVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={stepTransition}
                    onSubmit={handleNextStep}
                    className="space-y-3.5"
                    noValidate
                  >
                    {contactMethod === 'email' ? (
                      <div>
                        <FormField
                          label="Email"
                          type="email"
                          value={email}
                          onChange={setEmail}
                          error={errors.email}
                          autoComplete="email"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setContactMethod('phone')
                            setErrors({})
                          }}
                          className="mt-1.5 inline-block font-sans text-xs font-semibold text-career hover:underline focus:outline-none"
                        >
                          Use phone number instead
                        </button>
                      </div>
                    ) : (
                      <div>
                        <FormField
                          label="Phone number"
                          type="tel"
                          value={phone}
                          onChange={setPhone}
                          error={errors.phone}
                          autoComplete="tel"
                          placeholder="+1 (555) 000-0000"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setContactMethod('email')
                            setErrors({})
                          }}
                          className="mt-1.5 inline-block font-sans text-xs font-semibold text-career hover:underline focus:outline-none"
                        >
                          Use email instead
                        </button>
                      </div>
                    )}

                    <div className="pt-2">
                      <SubmitButton>Continue</SubmitButton>
                    </div>
                  </motion.form>
                ) : (
                  <motion.form
                    key="signin-step-2"
                    custom={direction}
                    variants={stepVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={stepTransition}
                    onSubmit={handleSignInSubmit}
                    className="space-y-3.5"
                    noValidate
                  >
                    {/* Return to Step 1 without losing entered data */}
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="inline-flex items-center gap-1.5 font-sans text-xs font-semibold text-career hover:underline focus:outline-none"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>
                        Change {contactMethod === 'email' ? 'email' : 'phone'} (
                        {contactMethod === 'email' ? email : phone})
                      </span>
                    </button>

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

                    <div className="pt-2">
                      <SubmitButton loading={loading}>
                        {loading ? 'Signing in…' : 'Sign in'}
                      </SubmitButton>
                    </div>
                  </motion.form>
                )
              ) : (
                /* ------------------------------------------------------------- */
                /* SIGN UP STEPS                                                 */
                /* ------------------------------------------------------------- */
                step === 1 ? (
                  <motion.form
                    key="signup-step-1"
                    custom={direction}
                    variants={stepVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={stepTransition}
                    onSubmit={handleNextStep}
                    className="space-y-3.5"
                    noValidate
                  >
                    <FormField
                      label="Name"
                      value={name}
                      onChange={setName}
                      error={errors.name}
                      autoComplete="name"
                      required
                    />

                    <div className="pt-2">
                      <SubmitButton>Continue</SubmitButton>
                    </div>
                  </motion.form>
                ) : step === 2 ? (
                  <motion.form
                    key="signup-step-2"
                    custom={direction}
                    variants={stepVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={stepTransition}
                    onSubmit={handleNextStep}
                    className="space-y-3.5"
                    noValidate
                  >
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="inline-flex items-center gap-1.5 font-sans text-xs font-semibold text-career hover:underline focus:outline-none"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Back to name</span>
                    </button>

                    {contactMethod === 'email' ? (
                      <div>
                        <FormField
                          label="Email"
                          type="email"
                          value={email}
                          onChange={setEmail}
                          error={errors.email}
                          autoComplete="email"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setContactMethod('phone')
                            setErrors({})
                          }}
                          className="mt-1.5 inline-block font-sans text-xs font-semibold text-career hover:underline focus:outline-none"
                        >
                          Use phone number instead
                        </button>
                      </div>
                    ) : (
                      <div>
                        <FormField
                          label="Phone number"
                          type="tel"
                          value={phone}
                          onChange={setPhone}
                          error={errors.phone}
                          autoComplete="tel"
                          placeholder="+1 (555) 000-0000"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setContactMethod('email')
                            setErrors({})
                          }}
                          className="mt-1.5 inline-block font-sans text-xs font-semibold text-career hover:underline focus:outline-none"
                        >
                          Use email instead
                        </button>
                      </div>
                    )}

                    <div className="pt-2">
                      <SubmitButton>Continue</SubmitButton>
                    </div>
                  </motion.form>
                ) : (
                  <motion.form
                    key="signup-step-3"
                    custom={direction}
                    variants={stepVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={stepTransition}
                    onSubmit={handleSignUpSubmit}
                    className="space-y-3.5"
                    noValidate
                  >
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="inline-flex items-center gap-1.5 font-sans text-xs font-semibold text-career hover:underline focus:outline-none"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Back</span>
                    </button>

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

                    {/* Terms agreement checkbox */}
                    <div className="flex items-start gap-2.5 pt-1">
                      <input
                        id="terms-agreement"
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        required
                        aria-label="I agree to the Terms of Service and Privacy Policy"
                        className="mt-0.5 h-4 w-4 rounded border-black/20 text-career focus:ring-career accent-career"
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

                    <div className="pt-2">
                      <SubmitButton loading={loading}>
                        {loading ? 'Creating account…' : 'Create account'}
                      </SubmitButton>
                    </div>
                  </motion.form>
                )
              )}
            </AnimatePresence>

            {/* Social Logins: Google & Facebook */}
            <div className="mt-4">
              <GoogleButton onError={setFormError} />
              <FacebookButton />
            </div>

            {/* Disclaimer text */}
            <p className="mt-3 text-center font-sans text-xs leading-relaxed text-ink/50">
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

            {/* Mode-switch link */}
            <div className="mt-5 text-center font-sans text-body-sm text-ink/70">
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
          </div>

          {/* Mobile Footer */}
          <div className="mt-6 flex justify-center md:hidden">
            <PublicFooter className="justify-center pt-1" />
          </div>
        </div>

      </motion.div>
    </div>
  )
}
