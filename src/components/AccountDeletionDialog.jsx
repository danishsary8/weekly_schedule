import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react'
import Modal from './ui/Modal.jsx'
import { permanentlyDeleteAccount } from '../api/services.js'
import { TOUCH_TARGET, TOUCH_TARGET_LG } from '../config/layout.js'

const CONFIRMATION_WORD = 'DELETE'

/** What deletion removes. Kept as data so the copy stays consistent and scannable. */
const REMOVED_ITEMS = [
  'Your routines and schedule blocks',
  'Checklist habits and completion history',
  'Reminder settings and cached times',
  'Every signed-in session',
]

/**
 * Confirmation dialog for permanent account deletion.
 *
 * Re-authentication depends on how the account signs in:
 *
 *   hasPassword  -> the current password must be entered
 *   otherwise    -> the word DELETE is typed (Google accounts store no
 *                   password, so there is no credential to check)
 *
 * Controlled by the caller so the trigger can live wherever it belongs in the
 * page; this component owns only the confirmation and the API call.
 *
 * @param {boolean}  open
 * @param {Function} onClose
 * @param {Function} onDeleted    Called after a successful deletion.
 * @param {boolean}  hasPassword  From the user resource's `has_password`.
 * @param {object}   [returnFocusRef]
 */
export default function AccountDeletionDialog({ open, onClose, onDeleted, hasPassword = true, returnFocusRef }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)

  // A reopened dialog must never inherit a typed credential or a stale error.
  useEffect(() => {
    if (!open) {
      setValue('')
      setError('')
      setLoading(false)
    }
  }, [open])

  const canSubmit = hasPassword ? value.length > 0 : value === CONFIRMATION_WORD

  const submit = async (event) => {
    event?.preventDefault()
    if (!canSubmit || loading) return

    setLoading(true)
    setError('')
    try {
      await permanentlyDeleteAccount(hasPassword ? { password: value } : { confirmation: value })
      await onDeleted?.()
    } catch (err) {
      // 422 carries field details; surface the field message when present.
      const fieldMessage = err?.fieldError?.(hasPassword ? 'password' : 'confirmation')
      setError(fieldMessage || err?.message || 'Could not delete your account. Please try again.')
      setLoading(false)
      setValue('')
      inputRef.current?.focus()
    }
  }

  return (
    <Modal
      open={open}
      onClose={loading ? () => {} : onClose}
      tone="danger"
      title="Delete your account?"
      description="This is permanent. Your data cannot be recovered afterwards."
      returnFocusRef={returnFocusRef}
      footer={(
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className={`${TOUCH_TARGET} rounded-xl px-4 font-sans text-sm font-semibold text-ink/75 ring-1 ring-black/15 transition-colors hover:bg-black/5 disabled:opacity-50`}
          >
            Keep my account
          </button>
          <button
            type="submit"
            form="delete-account-form"
            disabled={!canSubmit || loading}
            className={`${TOUCH_TARGET} inline-flex items-center justify-center gap-2 rounded-xl bg-language px-4 font-sans text-sm font-bold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-45`}
          >
            {loading
              ? <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" />
              : <Trash2 className="h-4 w-4" aria-hidden="true" />}
            {loading ? 'Deleting…' : 'Delete forever'}
          </button>
        </div>
      )}
    >
      <div className="flex gap-3 rounded-2xl bg-language/[0.06] p-3.5 ring-1 ring-language/15">
        <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-language" aria-hidden="true" />
        <ul className="min-w-0 space-y-1 font-sans text-body-sm leading-relaxed text-ink/75">
          {REMOVED_ITEMS.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </div>

      <form id="delete-account-form" onSubmit={submit} className="mt-4">
        <label htmlFor="delete-account-credential" className="block font-sans text-xs font-bold uppercase tracking-wide text-ink/60">
          {hasPassword ? 'Confirm your password' : `Type ${CONFIRMATION_WORD} to confirm`}
        </label>
        <input
          ref={inputRef}
          id="delete-account-credential"
          type={hasPassword ? 'password' : 'text'}
          value={value}
          onChange={(event) => { setValue(event.target.value); setError('') }}
          autoComplete={hasPassword ? 'current-password' : 'off'}
          autoCapitalize={hasPassword ? 'none' : 'characters'}
          spellCheck="false"
          disabled={loading}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'delete-account-error' : 'delete-account-hint'}
          placeholder={hasPassword ? 'Your current password' : CONFIRMATION_WORD}
          className={`${TOUCH_TARGET_LG} mt-2 w-full rounded-xl bg-cream/70 px-4 font-sans text-body text-ink ring-1 transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-language ${error ? 'ring-language' : 'ring-black/15'}`}
        />
        {error ? (
          <p id="delete-account-error" role="alert" className="mt-2 font-sans text-body-sm font-semibold text-language">{error}</p>
        ) : (
          <p id="delete-account-hint" className="mt-2 font-sans text-body-sm text-ink/55">
            {hasPassword
              ? 'We ask for your password so nobody else can delete your account.'
              : 'You signed in with Google, so there is no password to check.'}
          </p>
        )}
      </form>
    </Modal>
  )
}
