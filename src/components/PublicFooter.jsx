import { Link } from 'react-router-dom'

/**
 * Shared legal/footer link row for public pages.
 *
 * @param {boolean} showContact Include the provisional contact address.
 * @param {string}  className   Spacing hook. Defaults to the standard `mt-8`
 *                              gap; the auth shell overrides it because it
 *                              positions the footer inside a grid cell that
 *                              already owns the spacing.
 */
export default function PublicFooter({ showContact = false, className = 'mt-8' }) {
  return <footer className={`mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-5 gap-y-2 font-sans text-xs text-ink/50 ${className}`}>
    <span>© {new Date().getFullYear()} Daycraft</span>
    <Link to="/privacy" className="inline-flex min-h-touch items-center hover:text-ink hover:underline">Privacy Policy</Link>
    <Link to="/terms" className="inline-flex min-h-touch items-center hover:text-ink hover:underline">Terms of Service</Link>
    {showContact && <a href="mailto:hello@daycraft.app" title="Placeholder contact address — replace before public launch" className="inline-flex min-h-touch items-center hover:text-ink hover:underline">Contact</a>}
  </footer>
}
