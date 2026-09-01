import { useEffect, useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import Modal from '../ui/Modal.jsx'
import { CATEGORIES, CATEGORY_KEYS } from '../../config/categories.js'
import { validateEntryDraft } from '../../utils/validateEntry.js'
import { TOUCH_TARGET, TOUCH_TARGET_LG } from '../../config/layout.js'

const EMPTY_DRAFT = { start: '09:00', end: '10:00', description: '', category: 'Life' }

const fieldClasses = `${TOUCH_TARGET_LG} w-full rounded-xl bg-cream/70 px-3.5 font-sans text-body text-ink ring-1 ring-black/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-career`
const labelClasses = 'block font-sans text-xs font-bold uppercase tracking-wide text-ink/60'
const errorClasses = 'mt-1 font-sans text-body-sm font-semibold text-language'

/**
 * Create or edit a schedule block, in a sheet rather than inline.
 *
 * One form for both operations: the fields are identical, and a single component
 * keeps validation and category presentation from drifting between "add" and
 * "edit" — previously two separate surfaces.
 *
 * @param {boolean}  open
 * @param {Function} onClose
 * @param {Function} onSubmit  (draft) => Promise<boolean|void>; falsy `false`
 *                             keeps the sheet open so a server error stays visible.
 * @param {object}   [entry]   Existing block; omit to create a new one.
 * @param {object}   [returnFocusRef]
 */
export default function BlockFormSheet({ open, onClose, onSubmit, entry = null, returnFocusRef }) {
  const isEditing = Boolean(entry)
  const [draft, setDraft] = useState(EMPTY_DRAFT)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  // Re-seed whenever the sheet opens so it never shows a previous block's values.
  useEffect(() => {
    if (!open) return
    setDraft(entry
      ? { start: entry.start, end: entry.end, description: entry.description, category: entry.category }
      : EMPTY_DRAFT)
    setErrors({})
    setSaving(false)
  }, [open, entry])

  const update = (field) => (event) => {
    setDraft((current) => ({ ...current, [field]: event.target.value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const submit = async (event) => {
    event.preventDefault()
    const found = validateEntryDraft(draft)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setSaving(true)
    const result = await onSubmit?.({ ...draft, description: draft.description.trim() })
    setSaving(false)
    if (result !== false) onClose?.()
  }

  return (
    <Modal
      open={open}
      onClose={saving ? () => {} : onClose}
      title={isEditing ? 'Edit block' : 'Add a block'}
      description={isEditing ? undefined : 'A start time, an end time, and what you’ll be doing.'}
      returnFocusRef={returnFocusRef}
      footer={(
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className={`${TOUCH_TARGET} rounded-xl px-4 font-sans text-sm font-semibold text-ink/75 ring-1 ring-black/15 transition-colors hover:bg-black/5 disabled:opacity-50`}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="block-form"
            disabled={saving}
            className={`${TOUCH_TARGET} inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-4 font-sans text-sm font-bold text-white disabled:cursor-wait disabled:opacity-60`}
          >
            {saving && <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" />}
            {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Add block'}
          </button>
        </div>
      )}
    >
      <form id="block-form" onSubmit={submit} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClasses} htmlFor="block-start">Starts</label>
            <input
              id="block-start"
              type="time"
              value={draft.start}
              onChange={update('start')}
              aria-invalid={Boolean(errors.start)}
              className={`${fieldClasses} mt-1.5`}
            />
            {errors.start && <p role="alert" className={errorClasses}>{errors.start}</p>}
          </div>
          <div>
            <label className={labelClasses} htmlFor="block-end">Ends</label>
            <input
              id="block-end"
              type="time"
              value={draft.end}
              onChange={update('end')}
              aria-invalid={Boolean(errors.end)}
              className={`${fieldClasses} mt-1.5`}
            />
            {errors.end && <p role="alert" className={errorClasses}>{errors.end}</p>}
          </div>
        </div>
        <p className="font-sans text-body-sm text-ink/55">Overnight blocks are fine — end before start works.</p>

        <div>
          <label className={labelClasses} htmlFor="block-description">What will you do?</label>
          <input
            id="block-description"
            type="text"
            value={draft.description}
            onChange={update('description')}
            placeholder="e.g. Deep work on the API"
            aria-invalid={Boolean(errors.description)}
            className={`${fieldClasses} mt-1.5`}
          />
          {errors.description && <p role="alert" className={errorClasses}>{errors.description}</p>}
        </div>

        <fieldset>
          <legend className={labelClasses}>Category</legend>
          {/* Wrapping chips rather than a <select>: the accent colour is part of
              the choice, so it has to be visible while choosing. */}
          <div className="mt-2 flex flex-wrap gap-2">
            {CATEGORY_KEYS.map((key) => {
              const option = CATEGORIES[key]
              const selected = draft.category === key
              return (
                <label key={key} className="cursor-pointer">
                  <input
                    type="radio"
                    name="block-category"
                    value={key}
                    checked={selected}
                    onChange={() => setDraft((current) => ({ ...current, category: key }))}
                    className="peer sr-only"
                  />
                  <span
                    className={`${TOUCH_TARGET} flex items-center gap-2 rounded-xl px-3 font-sans text-sm font-bold ring-1 transition-[background-color,box-shadow] peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2`}
                    style={{
                      backgroundColor: selected ? `${option.color}24` : '#F5EDE6',
                      color: option.textColor,
                      boxShadow: selected ? `inset 0 0 0 2px ${option.color}` : 'inset 0 0 0 1px rgba(26,26,26,0.08)',
                      ['--tw-ring-color']: option.color,
                    }}
                  >
                    <span className="h-3 w-3 flex-shrink-0 rounded-full" style={{ backgroundColor: option.color }} aria-hidden="true" />
                    {option.label}
                    {selected && <Check className="h-4 w-4" aria-hidden="true" />}
                  </span>
                </label>
              )
            })}
          </div>
          {errors.category && <p role="alert" className={errorClasses}>{errors.category}</p>}
        </fieldset>
      </form>
    </Modal>
  )
}
