import { forwardRef } from 'react'
import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

/**
 * One row in a settings list: icon, label, optional description, trailing slot.
 *
 * Polymorphic by intent rather than by an `as` prop, so a caller cannot pick a
 * semantically wrong element:
 *
 *   to       -> react-router <Link>   (internal navigation)
 *   href     -> <a>                   (external, opens in a new tab)
 *   onClick  -> <button type="button">(in-page action)
 *   none     -> <div>                 (read-only row)
 *
 * A navigation chevron is supplied automatically for `to`/`href` rows; pass
 * `trailing` to override it (a value, a switch, a badge…).
 *
 * @param {import('react').ElementType} icon        lucide icon component
 * @param {string}    label
 * @param {string}    [description]  secondary line, wraps freely
 * @param {string}    [to]
 * @param {string}    [href]
 * @param {Function}  [onClick]
 * @param {import('react').ReactNode} [trailing]
 * @param {'default'|'danger'} [tone]
 * @param {boolean}   [disabled]
 * @param {boolean}   [loading]
 */

const TONES = {
  default: { label: 'text-ink', icon: 'text-ink/70', iconBg: 'bg-black/[0.05]' },
  danger: { label: 'text-language', icon: 'text-language', iconBg: 'bg-language/10' },
}

const SettingsRow = forwardRef(function SettingsRow({
  icon: Icon,
  label,
  description,
  to,
  href,
  onClick,
  trailing,
  tone = 'default',
  disabled = false,
  loading = false,
}, ref) {
  const palette = TONES[tone] ?? TONES.default
  const isNavigation = Boolean(to || href)
  const isInteractive = Boolean(to || href || onClick)

  // Full-row 48px target, comfortably above the 44px floor.
  const base = `flex min-h-touch-lg w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
    isInteractive && !disabled ? 'hover:bg-black/[0.03] active:bg-black/[0.05]' : ''
  } ${disabled ? 'cursor-not-allowed opacity-50' : ''} focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-career`

  const content = (
    <>
      {Icon && (
        <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${palette.iconBg}`}>
          <Icon className={`h-5 w-5 ${palette.icon}`} aria-hidden="true" />
        </span>
      )}

      <span className="min-w-0 flex-1">
        <span className={`block break-words font-sans text-body font-semibold ${palette.label}`}>{label}</span>
        {description && (
          <span className="mt-0.5 block break-words font-sans text-body-sm leading-snug text-ink/55">{description}</span>
        )}
      </span>

      <span className="flex flex-shrink-0 items-center gap-2 font-sans text-body-sm text-ink/45">
        {loading ? 'Working…' : trailing}
        {isNavigation && !trailing && !loading && (
          <ChevronRight className="h-5 w-5 text-ink/30" aria-hidden="true" />
        )}
      </span>
    </>
  )

  if (to && !disabled) {
    return <Link ref={ref} to={to} className={base}>{content}</Link>
  }

  if (href && !disabled) {
    return (
      <a ref={ref} href={href} target="_blank" rel="noopener noreferrer" className={base}>
        {content}
      </a>
    )
  }

  if (onClick) {
    return (
      <button ref={ref} type="button" onClick={onClick} disabled={disabled || loading} className={base}>
        {content}
      </button>
    )
  }

  return <div ref={ref} className={base}>{content}</div>
})

export default SettingsRow
