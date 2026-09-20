import { motion, useReducedMotion } from 'framer-motion'

export default function AuthIllustration({ className = '' }) {
  const reduceMotion = useReducedMotion()

  return (
    <div className={`relative flex items-center justify-center select-none ${className}`} aria-hidden="true">
      {/* Ambient background blur glow */}
      <div className="pointer-events-none absolute -inset-4 rounded-full bg-career/10 blur-2xl" />

      <motion.svg
        width="280"
        height="210"
        viewBox="0 0 280 210"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 w-full max-w-[280px] drop-shadow-md"
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <defs>
          <linearGradient id="cardBg" x1="0" y1="0" x2="240" y2="180" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFFFFF" />
            <stop offset="1" stopColor="#F9F5F1" />
          </linearGradient>

          <linearGradient id="badgeGrad" x1="0" y1="0" x2="52" y2="52" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0F766E" />
            <stop offset="1" stopColor="#0B554F" />
          </linearGradient>

          <filter id="badgeShadow" x="-20%" y="-20%" width="140%" height="140%" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#0F766E" floodOpacity="0.25" />
          </filter>

          <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="120%" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#1A1A1A" floodOpacity="0.08" />
          </filter>
        </defs>

        {/* Back secondary layer / card tilt */}
        <rect
          x="28"
          y="18"
          width="220"
          height="160"
          rx="22"
          transform="rotate(3 138 98)"
          fill="#ECE2D8"
          stroke="rgba(26, 26, 26, 0.08)"
          strokeWidth="1"
        />

        {/* Main routine schedule card */}
        <rect
          x="20"
          y="14"
          width="220"
          height="165"
          rx="22"
          fill="url(#cardBg)"
          stroke="rgba(26, 26, 26, 0.1)"
          strokeWidth="1.2"
          filter="url(#cardShadow)"
        />

        {/* Header binder tabs / weekday dots */}
        <g opacity="0.6">
          <circle cx="44" cy="34" r="3.5" fill="#1A1A1A" fillOpacity="0.2" />
          <circle cx="58" cy="34" r="3.5" fill="#1A1A1A" fillOpacity="0.2" />
          <circle cx="72" cy="34" r="3.5" fill="#1A1A1A" fillOpacity="0.2" />
          <circle cx="86" cy="34" r="3.5" fill="#0F766E" />
          <circle cx="100" cy="34" r="3.5" fill="#1A1A1A" fillOpacity="0.2" />
        </g>

        {/* Mini calendar title line */}
        <rect x="156" y="30" width="64" height="7" rx="3.5" fill="#1A1A1A" fillOpacity="0.12" />

        {/* Routine Block 1: Career teal */}
        <g transform="translate(36, 52)">
          <rect width="188" height="32" rx="10" fill="#0F766E" fillOpacity="0.12" stroke="#0F766E" strokeOpacity="0.25" strokeWidth="1" />
          <rect x="10" y="8" width="4" height="16" rx="2" fill="#0F766E" />
          <rect x="22" y="10" width="56" height="5.5" rx="2.75" fill="#0F766E" fillOpacity="0.9" />
          <rect x="22" y="18" width="34" height="4" rx="2" fill="#0F766E" fillOpacity="0.5" />
          <rect x="144" y="11" width="32" height="10" rx="5" fill="#0F766E" fillOpacity="0.18" />
        </g>

        {/* Routine Block 2: Health sage */}
        <g transform="translate(36, 92)">
          <rect width="188" height="32" rx="10" fill="#5E7964" fillOpacity="0.1" stroke="#5E7964" strokeOpacity="0.2" strokeWidth="1" />
          <rect x="10" y="8" width="4" height="16" rx="2" fill="#5E7964" />
          <rect x="22" y="10" width="70" height="5.5" rx="2.75" fill="#1A1A1A" fillOpacity="0.75" />
          <rect x="22" y="18" width="42" height="4" rx="2" fill="#1A1A1A" fillOpacity="0.35" />
          <rect x="148" y="11" width="28" height="10" rx="5" fill="#5E7964" fillOpacity="0.18" />
        </g>

        {/* Routine Block 3: Rest blue */}
        <g transform="translate(36, 132)">
          <rect width="188" height="28" rx="10" fill="#7C8B9C" fillOpacity="0.08" stroke="#7C8B9C" strokeOpacity="0.15" strokeWidth="1" />
          <rect x="10" y="7" width="4" height="14" rx="2" fill="#7C8B9C" />
          <rect x="22" y="9" width="48" height="5" rx="2.5" fill="#1A1A1A" fillOpacity="0.5" />
          <rect x="22" y="16" width="30" height="3.5" rx="1.75" fill="#1A1A1A" fillOpacity="0.25" />
        </g>

        {/* Floating Checkmark Badge */}
        <g transform="translate(206, 128)" filter="url(#badgeShadow)">
          <circle cx="26" cy="26" r="26" fill="url(#badgeGrad)" stroke="#FFFFFF" strokeWidth="3" />
          <path
            d="M17 26.5L23 32.5L35 19.5"
            stroke="#FFFFFF"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        {/* Small decorative sparkle */}
        <g transform="translate(236, 26)" opacity="0.85">
          <path
            d="M12 0L14 8L22 10L14 12L12 20L10 12L2 10L10 8L12 0Z"
            fill="#0F766E"
          />
        </g>
      </motion.svg>
    </div>
  )
}
