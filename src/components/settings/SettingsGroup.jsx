/**
 * A titled group of SettingsRow children, rendered as one card with hairline
 * dividers between rows — the grouped-list pattern used by native settings
 * screens, which scales to any number of rows without new layout work.
 *
 * Rows are separated with `divide-y` rather than per-row borders so the first
 * and last rows never show a stray edge inside the rounded corners.
 *
 * @param {string} [label]       Small caps heading above the card.
 * @param {string} [description] Optional note under the heading.
 * @param {'default'|'danger'} [tone]
 * @param {string} [className]   Spacing hook supplied by the page.
 */

const TONES = {
  default: { card: 'bg-paper ring-black/10', divide: 'divide-black/[0.06]', label: 'text-ink/45' },
  danger: { card: 'bg-language/[0.035] ring-language/25', divide: 'divide-language/15', label: 'text-language' },
}

export default function SettingsGroup({
  label,
  description,
  tone = 'default',
  className = '',
  children,
}) {
  const palette = TONES[tone] ?? TONES.default

  return (
    <section className={className} aria-label={label}>
      {label && <h2 className={`eyebrow mb-2 px-1 ${palette.label}`}>{label}</h2>}
      {description && <p className="mb-2 px-1 font-sans text-body-sm leading-snug text-ink/55">{description}</p>}

      <div className={`overflow-hidden rounded-card shadow-card ring-1 divide-y ${palette.card} ${palette.divide}`}>
        {children}
      </div>
    </section>
  )
}
