/**
 * Initial-based avatar.
 *
 * Presentational only — never renders a button or link, so callers are free to
 * wrap it in whatever interactive element they need (the dashboard header wraps
 * it in a profile button, the profile page renders it inert).
 *
 * @param {string} name    Full name; the first character becomes the initial.
 * @param {string} color    Background colour (a category accent).
 * @param {'sm'|'md'|'lg'} size
 * @param {boolean} ring   Draw the white outline used on coloured backgrounds.
 */

const SIZES = {
  sm: { box: 'h-11 w-11 min-w-11', text: 'text-sm' },
  md: { box: 'h-14 w-14', text: 'text-lg' },
  lg: { box: 'h-20 w-20', text: 'text-3xl' },
}

const FALLBACK_INITIAL = 'U'

/** First character of a name, uppercased. Safe against empty/whitespace input. */
export function initialFrom(name) {
  const trimmed = typeof name === 'string' ? name.trim() : ''
  return trimmed ? trimmed.charAt(0).toUpperCase() : FALLBACK_INITIAL
}

export default function Avatar({
  name,
  color = '#0F766E',
  size = 'md',
  ring = false,
  className = '',
}) {
  const dimensions = SIZES[size] ?? SIZES.md

  return (
    <span
      className={`flex flex-shrink-0 items-center justify-center rounded-full font-sans font-black text-white ${dimensions.box} ${dimensions.text} ${ring ? 'ring-2 ring-white' : ''} ${className}`}
      style={{ backgroundColor: color }}
      aria-hidden="true"
    >
      {initialFrom(name)}
    </span>
  )
}
