import { useId, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

/**
 * Labelled input with inline error text (visible label, not placeholder-only).
 * 44px min height for comfortable touch targets.
 */
export default function FormField({
  label,
  labelAction = null,
  type = 'text',
  value,
  onChange,
  error,
  autoComplete,
  hint,
  required = false,
}) {
  const id = useId()
  const [revealed, setRevealed] = useState(false)
  const isPassword = type === 'password'
  const resolvedType = isPassword && revealed ? 'text' : type
  const labelClass = 'block font-sans text-xs font-bold uppercase tracking-wide text-ink/60'

  return (
    <div>
      {/*
        `labelAction` lets a related control (e.g. "Forgot password?") share the
        label's row instead of claiming a separate 44px row beneath the input.
        That keeps the tap target full size while removing ~60px of height from
        the form, which matters on short laptop viewports.
      */}
      {labelAction ? (
        <div className="flex items-center justify-between gap-3">
          <label htmlFor={id} className={labelClass}>{label}</label>
          {labelAction}
        </div>
      ) : (
        <label htmlFor={id} className={labelClass}>{label}</label>
      )}

      <div className="relative mt-1.5">
        <input
          id={id}
          type={resolvedType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={`min-h-touch w-full rounded-xl bg-cream/70 px-3.5 font-sans text-body font-medium text-ink ring-1 transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] placeholder:text-ink/30 focus:outline-none focus-visible:ring-2 ${
            error ? 'ring-language' : 'ring-black/15'
          } ${isPassword ? 'pr-12' : ''}`}
          style={{ ['--tw-ring-color']: error ? '#E11D48' : '#0F766E' }}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            aria-label={revealed ? 'Hide password' : 'Show password'}
            className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-ink/50 transition-colors duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-black/5 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-career"
          >
            {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>

      {error ? (
        <p id={`${id}-error`} className="mt-1 font-sans text-xs font-semibold text-language">
          {error}
        </p>
      ) : hint ? (
        /* 14px on phones (was 12px) — hints are body copy the user must read to
           complete the form, so they respect the mobile legibility floor. */
        <p id={`${id}-hint`} className="mt-1.5 font-sans text-body-sm text-ink/55 sm:text-xs">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
