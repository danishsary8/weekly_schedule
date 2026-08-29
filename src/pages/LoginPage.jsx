import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore.js'
import AuthLayout from '../components/auth/AuthLayout.jsx'
import FormField from '../components/auth/FormField.jsx'
import SubmitButton from '../components/auth/SubmitButton.jsx'
import GoogleButton from '../components/auth/GoogleButton.jsx'

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const login = useAuthStore((s) => s.login)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(() => searchParams.get('oauth_error') || '')
  const [loading, setLoading] = useState(false)

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
    <AuthLayout
      title="Welcome back"
      subtitle="Welcome back. Your day is ready when you are."
      footer={
        <>
          New here?{' '}
          <Link to="/register" className="inline-flex min-h-[44px] items-center rounded-lg px-1 font-semibold text-career underline-offset-2 hover:underline focus-visible:outline-none">
            Create an account
          </Link>
        </>
      }
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
        />

        <div className="text-right"><Link to="/password/forgot" className="inline-flex min-h-[44px] items-center font-sans text-sm font-semibold text-career hover:underline">Forgot password?</Link></div>

        <SubmitButton loading={loading}>{loading ? 'Signing in…' : 'Sign in'}</SubmitButton>
      </form>
      <GoogleButton onError={setFormError} />
      {/*
        Inline links inside a sentence are exempt from WCAG 2.5.8 target size,
        so they stay in the text flow. The negative-margin padding still widens
        the tap area vertically without shifting the surrounding layout, and the
        body size was raised from 11px to 12px for legibility.
      */}
      <p className="mt-3 text-center font-sans text-xs leading-relaxed text-ink/50">If Google creates a new account for you, continuing means you agree to the <Link to="/terms" className="inline-block py-1.5 -my-1.5 font-semibold text-career underline">Terms</Link> and acknowledge the <Link to="/privacy" className="inline-block py-1.5 -my-1.5 font-semibold text-career underline">Privacy Policy</Link>.</p>
    </AuthLayout>
  )
}
