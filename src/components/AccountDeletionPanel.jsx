import { useEffect, useState } from 'react'
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react'
import { permanentlyDeleteAccount } from '../api/services.js'
import { TOUCH_TARGET, TOUCH_TARGET_LG } from '../config/layout.js'

const CONFIRMATION_WORD = 'DELETE'

/**
 * Type-to-confirm panel for permanent account deletion.
 *
 * Controlled on purpose: the caller owns the trigger and the `open` flag, so the
 * trigger can be an ordinary settings row instead of this component having to
 * render its own heading and button. That keeps the destructive confirmation
 * logic in one place while letting the surrounding screen decide presentation.
 *
 * @param {boolean}  open        Whether the confirmation form is shown.
 * @param {Function} onCancel    Called when the user backs out.
 * @param {Function} onDeleted   Called after the account is deleted.
 */
export default function AccountDeletionPanel({ open = false, onCancel, onDeleted }) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Reopening must never inherit a half-typed confirmation or a stale error.
  useEffect(() => {
    if (!open) {
      setText('')
      setError('')
    }
  }, [open])

  if (!open) return null

  const canDelete = text === CONFIRMATION_WORD && !loading

  // No top border of its own: inside a SettingsGroup, `divide-y` already draws
  // the separator, and two would stack into a visible double line.

  const remove = async () => {
    if (!canDelete) return
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
    <div className="bg-language/[0.04] p-4" role="group" aria-label="Confirm account deletion">
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-language" aria-hidden="true" />
        <div className="min-w-0">
          <h3 className="font-sans text-body font-bold text-ink">This permanently deletes everything</h3>
          <p className="mt-1 font-sans text-body-sm leading-relaxed text-ink/65">
            Your account, routines, schedule blocks, checklist history, settings, prayer-time cache, and active
            sessions cannot be recovered. Type <strong>{CONFIRMATION_WORD}</strong> to confirm.
          </p>
        </div>
      </div>

      <label htmlFor="delete-confirmation" className="mt-4 block font-sans text-xs font-bold uppercase tracking-wide text-ink/55">
        Confirmation
      </label>
      <input
        id="delete-confirmation"
        value={text}
        onChange={(event) => setText(event.target.value)}
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck="false"
        placeholder={`Type ${CONFIRMATION_WORD}`}
        className={`${TOUCH_TARGET_LG} mt-2 w-full rounded-xl bg-white px-4 font-sans text-body text-ink ring-1 ring-black/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-language`}
      />

      {error && <p role="alert" className="mt-2 font-sans text-body-sm font-semibold text-language">{error}</p>}

      <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          disabled={loading}
          onClick={onCancel}
          className={`${TOUCH_TARGET} rounded-xl px-4 font-sans text-sm font-semibold ring-1 ring-black/15 disabled:opacity-50`}
        >
          Keep my account
        </button>
        <button
          type="button"
          disabled={!canDelete}
          onClick={remove}
          className={`${TOUCH_TARGET} inline-flex items-center justify-center gap-2 rounded-xl bg-language px-4 font-sans text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-45`}
        >
          {loading
            ? <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" />
            : <Trash2 className="h-4 w-4" aria-hidden="true" />}
          {loading ? 'Deleting…' : 'Permanently delete account'}
        </button>
      </div>
    </div>
  )
}
