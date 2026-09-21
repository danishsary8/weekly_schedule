import { useEffect, useState } from 'react'
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
 * Professional two-panel authentication experience for Daycraft with reversible sliding panel-swap.
 *
 * Left/Right Panels:
 * - Sign In: Brand Panel is on LEFT (cream), Form is on RIGHT (paper/white).
 * - Sign Up: Form is on LEFT (paper/white), Brand Panel is on RIGHT (cream).
 * - Toggling modes animates a coordinated horizontal slide-swap (desktop) or vertical slide (mobile).
 * - Fixed empty image placeholder with graceful fallback (no broken alt-text).
 * - Script font tagline ("Made for days that matter.") between placeholder and benefit bullets.
 * - Single-line script headings.
 * - Progress bar without "STEP X OF Y" text label.
 * - Progressive single-field step flow with email/phone toggle.
 * - Google & Facebook social buttons.
 * - Card sized to fit standard screens without vertical overflow.
 */
export default function UnifiedAuthView({
  initialMode = 'signin',
  imageSrc = '/Gemini_Generated_Image_yvzsxyvzsxyvzsxy.jpg',
  imageAlt = '',
}) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const login = useAuthStore((s) => s.login)
  const register = useAuthStore((s) => s.register)
  const reduceMotion = useReducedMotion()

  const [mode, setMode] = useState(initialMode)
  const isSignIn = mode === 'signin'

  const resolvedImageSrc = imageSrc
    ? imageSrc.startsWith('public/')
      ? '/' + imageSrc.slice('public/'.length)
      : imageSrc
    : '/Gemini_Generated_Image_yvzsxyvzsxyvzsxy.jpg'

  // Image load error fallback state (prevents broken alt-text)
  const [imgFailed, setImgFailed] = useState(false)

  // Progressive Step state: Sign In has 2 steps, Sign Up has 3 steps
  const [step, setStep] = useState(1)
  const [stepDirection, setStepDirection] = useState(1) // 1 = forward, -1 = backward
  const totalSteps = isSignIn ? 2 : 3

  // Form field state (retained across step navigation and panel swaps)
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
      setStepDirection(1)
      setErrors({})
      setFormError('')
    }
  }, [initialMode])

  const switchMode = (newMode) => {
    if (newMode === mode) return
    setMode(newMode)
    setStep(1)
    setStepDirection(1)
    setErrors({})
    setFormError('')

    if (typeof window !== 'undefined' && window.history?.pushState) {
      window.history.pushState(null, '', newMode === 'signin' ? '/login' : '/register')
    }
  }

  // Validation helpers
  const isValidEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())
  const isValidPhone = (val) => /^[+]?[\d\s().-]{7,20}$/.test(val.trim())

  // Step navigation: forward
  const handleNextStep = (e) => {
    e?.preventDefault()
    setErrors({})
    setFormError('')

    if (isSignIn) {
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
        setStepDirection(1)
        setStep(2)
      }
    } else {
      if (step === 1) {
        if (!name.trim()) {
          setErrors({ name: 'Please enter your name.' })
          return
        }
        if (name.trim().length < 2) {
          setErrors({ name: 'Name must be at least 2 characters.' })
          return
        }
        setStepDirection(1)
        setStep(2)
      } else if (step === 2) {
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
        setStepDirection(1)
        setStep(3)
      }
    }
  }

  // Step navigation: backward
  const handlePrevStep = () => {
    setErrors({})
    setFormError('')
    setStepDirection(-1)
    setStep((prev) => Math.max(1, prev - 1))
  }

  // Submit Sign In (Step 2)
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

  // Submit Sign Up (Step 3)
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

  // Step transition animation specs (silky slide show feel)
  const stepVariants = {
    enter: (dir) => ({
      x: reduceMotion ? 0 : dir > 0 ? 28 : -28,
      opacity: 0,
      scale: reduceMotion ? 1 : 0.985,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir) => ({
      x: reduceMotion ? 0 : dir > 0 ? -28 : 28,
      opacity: 0,
      scale: reduceMotion ? 1 : 0.985,
    }),
  }

  const stepTransition = {
    duration: reduceMotion ? 0.05 : 0.32,
    ease: [0.32, 0.72, 0, 1],
  }

  // Panel-swap transition spec
  const panelSwapTransition = {
    duration: reduceMotion ? 0.05 : 0.45,
    ease: [0.32, 0.72, 0, 1],
  }

  return (
    <div className="min-h-viewport flex flex-col justify-center bg-cream px-3 py-4 sm:px-6 md:px-8 lg:px-12 md:py-6 selection:bg-career/20 selection:text-ink">
      {/* Screen reader announcement */}
      <div className="sr-only" role="status" aria-live="polite">
        {isSignIn
          ? `Sign in step ${step} of ${totalSteps}`
          : `Create account step ${step} of ${totalSteps}`}
      </div>

      {/* Ambient background decoration */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-32 -top-40 h-96 w-96 rounded-full bg-career opacity-10 blur-3xl" />
        <div className="absolute -bottom-40 -right-24 h-80 w-80 rounded-full bg-ink opacity-5 blur-3xl" />
      </div>

      {/* Main Two-Panel Card Container */}
      <motion.div
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: reduceMotion ? 0.1 : 0.4, ease: [0.32, 0.72, 0, 1] }}
        className="relative mx-auto my-auto flex w-full max-w-5xl flex-col overflow-hidden rounded-[28px] bg-paper shadow-card ring-1 ring-black/10 md:min-h-[580px] md:flex-row md:rounded-[32px]"
      >

        {/* ================================================================= */}
        {/* BRAND / ILLUSTRATION PANEL                                       */}
        {/* Sign In: Left (md:order-1) | Sign Up: Right (md:order-2)          */}
        {/* ================================================================= */}
        <motion.div
          layout={reduceMotion ? undefined : 'position'}
          transition={panelSwapTransition}
          className={`flex w-full flex-col justify-between border-b border-black/5 bg-[#F5EDE6] p-5 sm:p-6 md:w-1/2 md:border-b-0 md:p-8 lg:p-9 ${
            isSignIn ? 'md:order-1 md:border-r' : 'md:order-2 md:border-l'
          }`}
        >
          {/* Top: Brand Logo & Wordmark */}
          <div className="inline-flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-ink text-white shadow-sm sm:h-11 sm:w-11">
              <CalendarCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="font-display text-2xl font-bold tracking-tight text-ink/80">
              Daycraft
            </span>
          </div>

          {/* Middle: Headline, Subtext, Brand Image, Tagline & Benefits */}
          <div className="my-auto py-3">
            {/* Page Headline & Subtext with smooth motion glide on mode switch */}
            <motion.div
              key={isSignIn ? 'signin-header' : 'signup-header'}
              initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduceMotion ? 0.05 : 0.32, ease: [0.32, 0.72, 0, 1] }}
            >
              <h1 className="mt-2.5 sm:mt-3 display-title text-2xl sm:text-3xl lg:text-[32px] font-bold leading-tight text-ink text-left">
                {isSignIn ? 'Plan your day, beautifully.' : 'Start building your perfect day.'}
              </h1>

              <p className="mt-1 font-sans text-xs sm:text-body-sm font-light text-ink/60 leading-relaxed text-left">
                {isSignIn
                  ? 'Sign in to pick up right where you left off.'
                  : 'Create your account and make routines that stick.'}
              </p>
            </motion.div>

            {/* Brand Illustration Image (wired to real asset, rounded 4:3 container, object-cover) */}
            <div
              data-testid="brand-visual-container"
              className="relative mx-auto my-3 w-full max-w-[240px] aspect-[4/3] overflow-hidden rounded-2xl shadow-card ring-1 ring-black/10 bg-white"
            >
              {!imgFailed ? (
                <img
                  src={resolvedImageSrc}
                  alt=""
                  onError={() => setImgFailed(true)}
                  className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center bg-[#F5EDE6]/60 p-4 text-center">
                  <Sparkles className="h-6 w-6 text-career" aria-hidden="true" />
                  <span className="mt-1 font-display text-base font-bold text-ink/70">Daycraft</span>
                </div>
              )}
            </div>

            {/* Script Font Tagline below image */}
            <p className="text-left font-display text-xl sm:text-2xl font-bold leading-snug text-ink">
              Made for days that matter.
            </p>

            {/* 3 Benefit Bullets with Lucide Icons in Category Accent Colors */}
            <div className="mt-2.5 space-y-1.5 text-left">
              <div className="flex items-center gap-2.5 font-sans text-xs text-ink/75 sm:text-body-sm">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0F766E]/15 text-[#0F766E]">
                  <CheckCircle2 className="h-3.5 w-3.5 stroke-[2.5]" aria-hidden="true" />
                </span>
                <span>Build routines that actually stick</span>
              </div>

              <div className="flex items-center gap-2.5 font-sans text-xs text-ink/75 sm:text-body-sm">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#5E7964]/15 text-[#5E7964]">
                  <Calendar className="h-3.5 w-3.5 stroke-[2.5]" aria-hidden="true" />
                </span>
                <span>See your whole day, at a glance</span>
              </div>

              <div className="flex items-center gap-2.5 font-sans text-xs text-ink/75 sm:text-body-sm">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#7C8B9C]/15 text-[#7C8B9C]">
                  <Sparkles className="h-3.5 w-3.5 stroke-[2.5]" aria-hidden="true" />
                </span>
                <span>Free to start, no clutter</span>
              </div>
            </div>
          </div>

          {/* Anchored Footer */}
          <PublicFooter className="flex justify-start pt-2" />
        </motion.div>

        {/* ================================================================= */}
        {/* FORM PANEL (RIGHT ON SIGN IN, LEFT ON SIGN UP)                    */}
        {/* Sign In: Right (md:order-2) | Sign Up: Left (md:order-1)          */}
        {/* ================================================================= */}
        <motion.div
          layout={reduceMotion ? undefined : 'position'}
          transition={panelSwapTransition}
          className={`flex w-full flex-col justify-center bg-paper p-5 sm:p-6 md:w-1/2 md:p-8 lg:p-9 ${
            isSignIn ? 'md:order-2' : 'md:order-1'
          }`}
        >
          <div className="mx-auto my-auto w-full max-w-sm py-3 sm:py-6">
            {/* Step Progress Bar (without "STEP X OF Y" text label) */}
            <div className="mb-4 flex items-center gap-1.5" aria-label={`Step ${step} of ${totalSteps}`}>
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-all duration-400 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                    i + 1 <= step ? 'bg-career' : 'bg-black/10'
                  }`}
                />
              ))}
            </div>

            {/* Error Alert Box with smooth glide */}
            <AnimatePresence>
              {formError && (
                <motion.div
                  role="alert"
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: reduceMotion ? 0.05 : 0.25, ease: [0.32, 0.72, 0, 1] }}
                  className="mb-3 rounded-xl bg-language/10 px-3.5 py-2 font-sans text-sm font-medium text-language ring-1 ring-language/20"
                >
                  {formError}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Progressive Single-Field Flow */}
            <AnimatePresence mode="wait" custom={stepDirection}>
              {isSignIn ? (
                /* ------------------------------------------------------------- */
                /* SIGN IN STEPS                                                 */
                /* ------------------------------------------------------------- */
                step === 1 ? (
                  <motion.form
                    key="signin-step-1"
                    custom={stepDirection}
                    variants={stepVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={stepTransition}
                    onSubmit={handleNextStep}
                    className="space-y-3"
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
                          className="mt-1.5 inline-block font-sans text-xs font-semibold text-career transition-colors duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] hover:underline focus:outline-none"
                        >
                          Use phone number
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
                          className="mt-1.5 inline-block font-sans text-xs font-semibold text-career transition-colors duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] hover:underline focus:outline-none"
                        >
                          Use email
                        </button>
                      </div>
                    )}

                    <div className="pt-1.5">
                      <SubmitButton>Continue</SubmitButton>
                    </div>
                  </motion.form>
                ) : (
                  <motion.form
                    key="signin-step-2"
                    custom={stepDirection}
                    variants={stepVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={stepTransition}
                    onSubmit={handleSignInSubmit}
                    className="space-y-3"
                    noValidate
                  >
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

                    <div className="pt-1.5">
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
                    custom={stepDirection}
                    variants={stepVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={stepTransition}
                    onSubmit={handleNextStep}
                    className="space-y-3"
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

                    <div className="pt-1.5">
                      <SubmitButton>Continue</SubmitButton>
                    </div>
                  </motion.form>
                ) : step === 2 ? (
                  <motion.form
                    key="signup-step-2"
                    custom={stepDirection}
                    variants={stepVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={stepTransition}
                    onSubmit={handleNextStep}
                    className="space-y-3"
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
                          className="mt-1.5 inline-block font-sans text-xs font-semibold text-career transition-colors duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] hover:underline focus:outline-none"
                        >
                          Use phone number
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
                          className="mt-1.5 inline-block font-sans text-xs font-semibold text-career transition-colors duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] hover:underline focus:outline-none"
                        >
                          Use email
                        </button>
                      </div>
                    )}

                    <div className="pt-1.5">
                      <SubmitButton>Continue</SubmitButton>
                    </div>
                  </motion.form>
                ) : (
                  <motion.form
                    key="signup-step-3"
                    custom={stepDirection}
                    variants={stepVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={stepTransition}
                    onSubmit={handleSignUpSubmit}
                    className="space-y-3"
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
                    <div className="flex items-start gap-2 pt-0.5">
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

                    <div className="pt-1.5">
                      <SubmitButton loading={loading}>
                        {loading ? 'Creating account…' : 'Create account'}
                      </SubmitButton>
                    </div>
                  </motion.form>
                )
              )}
            </AnimatePresence>

            {/* Social Logins: Google & Facebook */}
            <div className="mt-3.5">
              <GoogleButton onError={setFormError} />
              <FacebookButton />
            </div>

            {/* Disclaimer text */}
            <p className="mt-2.5 text-center font-sans text-xs leading-relaxed text-ink/50">
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
            <div className="mt-4 text-center font-sans text-body-sm text-ink/70">
              {isSignIn ? (
                <>
                  New here?{' '}
                  <motion.span
                    whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                    transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
                    className="inline-block"
                  >
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
                  <motion.span
                    whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                    transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
                    className="inline-block"
                  >
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
        </motion.div>

      </motion.div>
    </div>
  )
}
