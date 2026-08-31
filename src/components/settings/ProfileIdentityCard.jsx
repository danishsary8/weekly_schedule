import { CalendarDays, ShieldAlert, ShieldCheck } from 'lucide-react'
import Avatar from '../ui/Avatar.jsx'
import { CARD_PADDING_LG } from '../../config/layout.js'

/**
 * Identity header for the profile screen: avatar, name, email and status chips.
 *
 * Centred on phones (the reference pattern for account screens — it reads as a
 * portrait) and left-aligned from `sm` where a row uses the width better.
 *
 * Verification state is a chip rather than body copy so it stays scannable, and
 * it carries an icon as well as colour so it is not colour-only information.
 *
 * @param {string}  name
 * @param {string}  email
 * @param {string}  [memberSince]  Preformatted label; the page owns formatting.
 * @param {boolean} [isVerified]
 * @param {string}  [accentColor]
 * @param {string}  [className]
 */
export default function ProfileIdentityCard({
  name,
  email,
  memberSince,
  isVerified = false,
  accentColor = '#0F766E',
  className = '',
}) {
  const displayName = name?.trim() || 'Daycraft member'

  return (
    <section
      className={`overflow-hidden rounded-card bg-paper shadow-card ring-1 ring-black/10 ${CARD_PADDING_LG} ${className}`}
      aria-label="Account identity"
    >
      <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:gap-5 sm:text-left">
        <Avatar name={displayName} color={accentColor} size="lg" />

        <div className="mt-4 min-w-0 flex-1 sm:mt-0">
          <h2 className="break-words font-sans text-xl font-bold text-ink">{displayName}</h2>
          {email && <p className="mt-1 break-all font-sans text-body-sm text-ink/60">{email}</p>}

          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            {memberSince && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-black/[0.05] px-3 py-1 font-sans text-body-sm font-semibold text-ink/65">
                <CalendarDays className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                {memberSince}
              </span>
            )}

            {isVerified ? (
              /* Teal, not the raw sage accent: `text-career` is the palette's
                 WCAG-safe colour for text on light surfaces. */
              <span className="inline-flex items-center gap-1.5 rounded-full bg-career/10 px-3 py-1 font-sans text-body-sm font-semibold text-career">
                <ShieldCheck className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-notice/15 px-3 py-1 font-sans text-body-sm font-semibold text-ink/75">
                <ShieldAlert className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                Verification pending
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
