import { Link } from 'react-router-dom'

export default function PublicFooter({ showContact = false }) {
  return <footer className="mx-auto mt-8 flex max-w-7xl flex-wrap items-center justify-center gap-x-5 gap-y-2 font-sans text-xs text-ink/50">
    <span>© {new Date().getFullYear()} Daycraft</span>
    <Link to="/privacy" className="inline-flex min-h-touch items-center hover:text-ink hover:underline">Privacy Policy</Link>
    <Link to="/terms" className="inline-flex min-h-touch items-center hover:text-ink hover:underline">Terms of Service</Link>
    {showContact && <a href="mailto:hello@daycraft.app" title="Placeholder contact address — replace before public launch" className="inline-flex min-h-touch items-center hover:text-ink hover:underline">Contact</a>}
  </footer>
}
