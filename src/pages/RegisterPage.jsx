import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore.js'
import AuthLayout from '../components/auth/AuthLayout.jsx'
import FormField from '../components/auth/FormField.jsx'
import SubmitButton from '../components/auth/SubmitButton.jsx'
import GoogleButton from '../components/auth/GoogleButton.jsx'

export default function RegisterPage() {
  const navigate = useNavigate()
  const register = useAuthStore((s) => s.register)

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirmation: '',
  })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (field) => (value) => setForm((f) => ({ ...f, [field]: value }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrors({})
    setFormError('')

    if (form.password !== form.passwordConfirmation) {
      setErrors({ passwordConfirmation: 'Passwords do not match.' })
      return
    }

    setLoading(true)

    try {
      const user = await register(form)
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

  return (
    <AuthLayout
      title="Start crafting your days"
      subtitle="Build routines that fit your life and keep them in sync across devices."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="inline-flex min-h-[44px] items-center rounded-lg px-1 font-semibold text-career underline-offset-2 hover:underline focus-visible:outline-none">
            Sign in
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
          label="Name"
          value={form.name}
          onChange={set('name')}
          error={errors.name}
          autoComplete="name"
          required
        />

        <FormField
          label="Email"
          type="email"
          value={form.email}
          onChange={set('email')}
          error={errors.email}
          autoComplete="email"
          required
        />

        <FormField
          label="Password"
          type="password"
          value={form.password}
          onChange={set('password')}
          error={errors.password}
          autoComplete="new-password"
          hint="Use at least 8 characters."
          required
        />

        <FormField
          label="Confirm password"
          type="password"
          value={form.passwordConfirmation}
          onChange={set('passwordConfirmation')}
          error={errors.passwordConfirmation}
          autoComplete="new-password"
          required
        />

        <p className="font-sans text-xs leading-relaxed text-ink/55">By signing up, you agree to our <Link to="/terms" className="font-semibold text-career underline underline-offset-2">Terms of Service</Link> and acknowledge our <Link to="/privacy" className="font-semibold text-career underline underline-offset-2">Privacy Policy</Link>.</p>

        <SubmitButton loading={loading}>{loading ? 'Creating account…' : 'Create account'}</SubmitButton>
      </form>
      <GoogleButton onError={setFormError} />
    </AuthLayout>
  )
}
