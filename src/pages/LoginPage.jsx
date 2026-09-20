import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { CalendarCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore.js'
import FormField from '../components/auth/FormField.jsx'
import SubmitButton from '../components/auth/SubmitButton.jsx'
import GoogleButton from '../components/auth/GoogleButton.jsx'
import AuthIllustration from '../components/auth/AuthIllustration.jsx'
import PublicFooter from '../components/PublicFooter.jsx'

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const login = useAuthStore((s) => s.login)
  const reduceMotion = useReducedMotion()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(() => searchParams.get('oauth_error') || '')
  const [loading, setLoading] = useState(false)
  const [canHover, setCanHover] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      const media = window.matchMedia('(hover: hover) and (pointer: fine)')
      setCanHover(media.matches)
      const listener = (e) => setCanHover(e.matches)
      media.addEventListener?.('change', listener)
      return () => media.removeEventListener?.('change', listener)
    }
  }, [])

  const handleSubmit = async (event) => {
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
        setErrors({ email: error.fieldError('email'), password: error.fieldError('password') })
      } else if (error.isNetworkError) {
        setFormError("Can't reach the server. Is the backend running?")
      } else {
        // 401 invalid_credentials, 429 too_many_requests, etc.
        setFormError(error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-viewport flex flex-col justify-between bg-cream px-4 py-8 sm:px-6 md:px-8 lg:px-12 md:py-12">
      {/* Ambient background wash, consistent with Daycraft branding */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-32 -top-40 h-96 w-96 rounded-full bg-career opacity-10 blur-3xl" />
        <div className="absolute -bottom-40 -right-24 h-80 w-80 rounded-full bg-ink opacity-5 blur-3xl" />
      </div>

      {/* Main two-panel container */}
      <div className="relative mx-auto my-auto w-full max-w-5xl">
        <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-12 md:gap-8 lg:gap-14">
          
          {/* LEFT PANEL: Logo, Visual Element, Heading & Meta */}
          <div className="flex flex-col items-center text-center md:col-span-6 lg:col-span-6 md:items-start md:text-left">
            {/* Logo Badge */}
            <div className="mb-4 inline-flex items-center gap-2.5">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink text-white shadow-sm">
                <CalendarCheck className="h-6 w-6" aria-hidden="true" />
              </span>
              <span className="font-display text-2xl font-bold tracking-tight text-ink/75">
                Daycraft
              </span>
            </div>

            {/* Visual Graphic Element (visible on tablet and desktop) */}
            <div className="my-2 hidden w-full md:block">
              <AuthIllustration />
            </div>

            {/* Welcome back Heading & Subtitle */}
            <h1 className="display-title text-4xl font-bold text-ink sm:text-5xl lg:text-5xl">
              Welcome back
            </h1>
            <p className="mt-2 max-w-md font-sans text-body-sm sm:text-base leading-relaxed text-ink/65">
              Welcome back. Your day is ready when you are.
            </p>

            {/* Desktop / Tablet: Secondary link and footer in left panel */}
            <div className="mt-8 hidden w-full space-y-4 md:block">
              <div className="font-sans text-body-sm text-ink/70">
                New here?{' '}
                <motion.span whileTap={reduceMotion ? undefined : { scale: 0.98 }} className="inline-block">
                  <Link
                    to="/register"
                    className="inline-flex min-h-touch items-center rounded-lg px-1 font-semibold text-career underline-offset-2 hover:underline focus-visible:outline-none"
                  >
                    Create an account
                  </Link>
                </motion.span>
              </div>

              <PublicFooter className="justify-start pt-1" />
            </div>
          </div>

          {/* RIGHT PANEL: Form Card */}
          <div className="w-full md:col-span-6 lg:col-span-6">
            <motion.div
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                type: 'spring',
                stiffness: 260,
                damping: 22,
                duration: reduceMotion ? 0.15 : 0.28,
              }}
              whileHover={
                reduceMotion || !canHover
                  ? undefined
                  : {
                      scale: 1.01,
                      rotate: 1.0,
                      boxShadow: '0 24px 48px -12px rgba(26, 26, 26, 0.16), 0 0 0 1px rgba(26, 26, 26, 0.08)',
                    }
              }
              className="relative mx-auto w-full max-w-md rounded-3xl bg-paper p-6 sm:p-8 md:p-9 shadow-card ring-1 ring-black/10 transition-shadow duration-200"
            >
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
              </form>

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
            </motion.div>
          </div>

          {/* MOBILE ONLY: Footer & Secondary link stacked below the form card */}
          <div className="mt-2 flex flex-col items-center text-center space-y-4 md:hidden">
            <div className="font-sans text-body-sm text-ink/70">
              New here?{' '}
              <motion.span whileTap={reduceMotion ? undefined : { scale: 0.98 }} className="inline-block">
                <Link
                  to="/register"
                  className="inline-flex min-h-touch items-center rounded-lg px-1 font-semibold text-career underline-offset-2 hover:underline focus-visible:outline-none"
                >
                  Create an account
                </Link>
              </motion.span>
            </div>

            <PublicFooter className="justify-center pt-1" />
          </div>

        </div>
      </div>
    </div>
  )
}
