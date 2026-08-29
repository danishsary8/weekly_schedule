import { useState } from 'react'
import { AlertTriangle, Loader2, Trash2, X } from 'lucide-react'
import { permanentlyDeleteAccount } from '../api/services.js'

export default function AccountDeletionPanel({ onDeleted }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const close = () => { setOpen(false); setText(''); setError('') }
  const remove = async () => {
    if (text !== 'DELETE') return
    setLoading(true)
    setError('')
    try {
      await permanentlyDeleteAccount()
      await onDeleted?.()
    } catch (err) {
      setError(err.message || 'Could not delete your account. Please try again.')
      setLoading(false)
    }
  }

  return (
    <section className="mt-8 rounded-card border border-language/25 bg-language/[.035] p-5 sm:p-6" aria-labelledby="danger-zone-title">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-language/10 text-language"><AlertTriangle className="h-5 w-5" aria-hidden="true" /></span>
          <div><p className="eyebrow text-language">Permanent actions</p><h2 id="danger-zone-title" className="mt-1 font-sans text-lg font-bold text-ink">Danger Zone</h2><p className="mt-1 font-sans text-sm leading-relaxed text-ink/55">Delete this account and everything connected to it.</p></div>
        </div>
        {open && <button type="button" onClick={close} aria-label="Cancel account deletion" className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-ink/55 hover:bg-black/5"><X className="h-5 w-5" /></button>}
      </div>

      {!open ? <button type="button" onClick={() => setOpen(true)} className="mt-5 inline-flex min-h-touch items-center gap-2 rounded-xl px-4 font-sans text-sm font-bold text-language ring-1 ring-language/35 hover:bg-language/10"><Trash2 className="h-4 w-4" aria-hidden="true" />Delete my account</button> : (
        <div className="mt-5 rounded-2xl bg-white p-4 ring-1 ring-language/20">
          <div className="flex gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-language" aria-hidden="true" /><div><h3 className="font-sans text-sm font-bold text-ink">This permanently deletes everything</h3><p className="mt-1 font-sans text-xs leading-relaxed text-ink/65">Your account, routines, schedule blocks, checklist history, settings, prayer-time cache, and active sessions cannot be recovered. Type <strong>DELETE</strong> to confirm.</p></div></div>
          <label htmlFor="delete-confirmation" className="mt-4 block font-sans text-xs font-bold uppercase tracking-wide text-ink/55">Confirmation</label>
          <input id="delete-confirmation" value={text} onChange={(event) => setText(event.target.value)} autoComplete="off" placeholder="Type DELETE" className="mt-2 min-h-touch-lg w-full rounded-xl bg-cream/50 px-4 font-sans text-sm text-ink ring-1 ring-black/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-language" />
          {error && <p role="alert" className="mt-2 font-sans text-xs font-semibold text-language">{error}</p>}
          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" disabled={loading} onClick={close} className="min-h-touch rounded-xl px-4 font-sans text-sm font-semibold ring-1 ring-black/15">Keep my account</button><button type="button" disabled={loading || text !== 'DELETE'} onClick={remove} className="flex min-h-touch items-center justify-center gap-2 rounded-xl bg-language px-4 font-sans text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-45">{loading ? <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" /> : <Trash2 className="h-4 w-4" aria-hidden="true" />}{loading ? 'Deleting…' : 'Permanently delete account'}</button></div>
        </div>
      )}
    </section>
  )
}
