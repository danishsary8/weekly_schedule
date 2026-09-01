import { useState } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import Modal from './Modal.jsx'
import { TOUCH_TARGET } from '../../config/layout.js'

/**
 * Confirmation dialog for a single consequential action.
 *
 * Replaces `window.confirm`, which cannot be styled, is not focus-trapped, and
 * on iOS shows the origin hostname — alarming for a routine deletion.
 *
 * Awaits `onConfirm` so the button can show progress and stay disabled for the
 * whole request, preventing a double submit.
 *
 * @param {boolean}  open
 * @param {Function} onClose
 * @param {Function} onConfirm      May return a promise.
 * @param {string}   title
 * @param {string}   [description]
 * @param {string}   [confirmLabel]
 * @param {string}   [cancelLabel]
 * @param {'default'|'danger'} [tone]
 * @param {object}   [returnFocusRef]
 */
export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  returnFocusRef,
  children,
}) {
  const [busy, setBusy] = useState(false)

  const confirm = async () => {
    if (busy) return
    setBusy(true)
    try {
      await onConfirm?.()
    } finally {
      setBusy(false)
    }
  }

  const confirmClasses = tone === 'danger'
    ? 'bg-language text-white'
    : 'bg-ink text-white'

  return (
    <Modal
      open={open}
      onClose={busy ? () => {} : onClose}
      title={title}
      description={description}
      tone={tone}
      returnFocusRef={returnFocusRef}
      footer={(
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className={`${TOUCH_TARGET} rounded-xl px-4 font-sans text-sm font-semibold text-ink/75 ring-1 ring-black/15 transition-colors hover:bg-black/5 disabled:opacity-50`}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={busy}
            className={`${TOUCH_TARGET} inline-flex items-center justify-center gap-2 rounded-xl px-4 font-sans text-sm font-bold transition-opacity disabled:cursor-wait disabled:opacity-60 ${confirmClasses}`}
          >
            {busy && <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" />}
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      )}
    >
      {children ?? (
        <div className="flex gap-3 rounded-2xl bg-language/[0.06] p-3.5 ring-1 ring-language/15">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-language" aria-hidden="true" />
          <p className="min-w-0 font-sans text-body-sm leading-relaxed text-ink/75">
            This cannot be undone.
          </p>
        </div>
      )}
    </Modal>
  )
}
