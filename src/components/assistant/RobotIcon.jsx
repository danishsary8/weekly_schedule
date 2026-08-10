/**
 * Original geometric robot mark — designed for this app, not derived from any
 * existing character or franchise. Simple rounded head, antenna, two eyes and a
 * smile, tinted by the current day-group accent.
 */
export default function RobotIcon({ className = 'h-7 w-7', accent = '#F5EDE6', awake = true }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      {/* antenna */}
      <line x1="16" y1="3" x2="16" y2="7" stroke={accent} strokeWidth="2" strokeLinecap="round" />
      <circle cx="16" cy="2.6" r="1.8" fill={accent} />

      {/* head */}
      <rect
        x="5"
        y="7"
        width="22"
        height="17"
        rx="6"
        stroke={accent}
        strokeWidth="2"
        fill="none"
      />

      {/* eyes — closed (dash) when quiet mode is on */}
      {awake ? (
        <>
          <circle cx="12" cy="14.5" r="2.1" fill={accent} />
          <circle cx="20" cy="14.5" r="2.1" fill={accent} />
        </>
      ) : (
        <>
          <line x1="10" y1="14.5" x2="14" y2="14.5" stroke={accent} strokeWidth="2" strokeLinecap="round" />
          <line x1="18" y1="14.5" x2="22" y2="14.5" stroke={accent} strokeWidth="2" strokeLinecap="round" />
        </>
      )}

      {/* smile */}
      <path
        d="M12 19.4c1.3 1.2 2.6 1.8 4 1.8s2.7-.6 4-1.8"
        stroke={accent}
        strokeWidth="1.9"
        strokeLinecap="round"
        fill="none"
      />

      {/* side ears */}
      <line x1="3.4" y1="13" x2="3.4" y2="18" stroke={accent} strokeWidth="2" strokeLinecap="round" />
      <line x1="28.6" y1="13" x2="28.6" y2="18" stroke={accent} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
