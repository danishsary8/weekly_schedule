import { CalendarCheck, Github } from 'lucide-react'
import { Link } from 'react-router-dom'

/** Social media links configuration for the landing page footer. */
const SOCIAL_LINKS = [
  {
    label: 'GitHub',
    url: 'https://github.com/danishsary8',
    icon: Github,
  },
]

/** Shared public footer. Landing pages use the expanded variant. */
export default function PublicFooter({ showContact = false, expanded = false, className = 'mt-8' }) {
  const currentYear = new Date().getFullYear()

  if (!expanded) {
    return (
      <footer className={`mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-5 gap-y-2 font-sans text-xs text-ink/50 ${className}`}>
        <span>© {currentYear} Loomora</span>
        <Link to="/privacy" className="inline-flex min-h-touch items-center hover:text-ink hover:underline">Privacy Policy</Link>
        <Link to="/terms" className="inline-flex min-h-touch items-center hover:text-ink hover:underline">Terms of Service</Link>
        {showContact && (
          <a
            href="mailto:hello@loomora.app"
            title="Placeholder contact address — replace before public launch"
            className="inline-flex min-h-touch items-center hover:text-ink hover:underline"
          >
            Contact
          </a>
        )}
      </footer>
    )
  }

  const handleHowItWorksClick = (e) => {
    const el = document.getElementById('how-it-works')
    if (el) {
      e.preventDefault()
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  return (
    <footer className="w-full bg-ink text-white">
      <div className="mx-auto max-w-7xl px-6 pt-8 pb-14 sm:px-8 sm:pt-10 sm:pb-16 lg:px-12 lg:pt-12 lg:pb-16">
        {/* Top Row: Brand, Tagline & Social Icons */}
        <div className="border-b border-white/10 pb-5 sm:pb-6">
          <div className="max-w-md">
            <Link
              to="/"
              aria-label="Loomora home"
              className="display-title inline-flex items-center gap-2.5 text-2xl text-white transition-opacity hover:opacity-90 sm:text-3xl focus:outline-none focus-visible:ring-2 focus-visible:ring-career rounded-md"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-career text-white shadow-sm ring-1 ring-white/10 sm:h-9 sm:w-9">
                <CalendarCheck className="h-[18px] w-[18px] sm:h-5 sm:w-5" strokeWidth={2.2} aria-hidden="true" />
              </span>
              <span>Loomora</span>
            </Link>
            <p className="mt-2 sm:mt-2.5 font-sans text-sm leading-6 text-white/65">
              Craft your day, one routine at a time.
            </p>

            {/* Extensible Social Icons Row */}
            <div className="mt-3.5 flex items-center gap-1.5 sm:gap-2">
              {SOCIAL_LINKS.map(({ label, url, icon: Icon }) => (
                <a
                  key={label}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/60 transition-colors duration-150 hover:bg-white/10 hover:text-career focus:outline-none focus-visible:ring-2 focus-visible:ring-career"
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Link Columns: 2 columns, side by side on desktop, stacked on mobile */}
        <div className="grid grid-cols-1 gap-6 py-6 sm:grid-cols-2 sm:gap-8 md:max-w-xl md:gap-12 sm:py-7">
          {/* Quick Links Column */}
          <nav aria-label="Quick Links" className="flex flex-col">
            <p className="font-sans text-xs font-bold uppercase tracking-widest text-white/90">
              Quick Links
            </p>
            <ul className="mt-2.5 flex flex-col space-y-1.5 font-sans text-sm sm:space-y-2">
              <li>
                <Link
                  to="/"
                  className="inline-flex py-0.5 text-white/60 transition-colors duration-150 hover:text-white"
                >
                  Home
                </Link>
              </li>
              <li>
                <a
                  href="#how-it-works"
                  onClick={handleHowItWorksClick}
                  className="inline-flex py-0.5 text-white/60 transition-colors duration-150 hover:text-white"
                >
                  How it works
                </a>
              </li>
              <li>
                <Link
                  to="/register"
                  className="inline-flex py-0.5 text-white/60 transition-colors duration-150 hover:text-white"
                >
                  Get started
                </Link>
              </li>
            </ul>
          </nav>

          {/* Legal Column */}
          <nav aria-label="Legal Links" className="flex flex-col">
            <p className="font-sans text-xs font-bold uppercase tracking-widest text-white/90">
              Legal
            </p>
            <ul className="mt-2.5 flex flex-col space-y-1.5 font-sans text-sm sm:space-y-2">
              <li>
                <Link
                  to="/privacy"
                  className="inline-flex py-0.5 text-white/60 transition-colors duration-150 hover:text-white"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="inline-flex py-0.5 text-white/60 transition-colors duration-150 hover:text-white"
                >
                  Terms of Service
                </Link>
              </li>
              {showContact && (
                <li>
                  <a
                    href="mailto:hello@loomora.app"
                    title="Support email"
                    className="inline-flex py-0.5 text-white/60 transition-colors duration-150 hover:text-white"
                  >
                    Contact
                  </a>
                </li>
              )}
            </ul>
          </nav>
        </div>

        {/* Bottom Bar: Centered copyright */}
        <div className="border-t border-white/10 pt-5 sm:pt-6 text-center">
          <p className="font-sans text-xs text-white/50">
            © {currentYear} Loomora. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
