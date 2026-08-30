import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Loader2, Palette } from 'lucide-react'
import { CATEGORIES, CATEGORY_KEYS, getCategory } from '../config/categories.js'
import { validateEntryDraft } from '../utils/validateEntry.js'
import { useFocusTrap } from '../hooks/useFocusTrap.js'

const labelCls = 'block font-sans text-xs font-bold uppercase tracking-wide text-ink/60'
const fieldCls =
  'mt-1 w-full rounded-xl bg-cream/70 px-3 py-2 font-sans text-body font-medium text-ink ring-1 ring-black/15 focus:outline-none focus-visible:ring-2'
const errorCls = 'mt-1 font-sans text-xs font-semibold text-language'

/**
 * Inline editor rendered in place of a timeline card.
 */
export default function EntryEditForm({ entry, accent = '#8A8378', onAccent = '#1A1A1A', onSave, onClose, returnFocusRef }) {
  const [draft, setDraft] = useState({
    start: entry.start,
    end: entry.end,
    category: entry.category,
    description: entry.description,
  })
  const [errors, setErrors] = useState({})
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const savedTimer = useRef(null)
  const firstField = useRef(null)
  const formRef = useRef(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    firstField.current?.focus()
    return () => {
      if (savedTimer.current) clearTimeout(savedTimer.current)
    }
  }, [])

  useFocusTrap(formRef, true, { onEscape: () => onCloseRef.current(), returnFocusRef })

  const set = (field) => (e) => setDraft((d) => ({ ...d, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const found = validateEntryDraft(draft)
    setErrors(found)
    if (Object.keys(found).length > 0) return
    setSaving(true)
    const didSave = await onSave({ start: draft.start, end: draft.end, category: draft.category, description: draft.description.trim() })
    setSaving(false)
    if (didSave === false) return
    setSaved(true)
    savedTimer.current = setTimeout(() => { setSaved(false); onClose() }, 900)
  }

  const cat = getCategory(draft.category)

  return (
    <motion.form
      ref={formRef}
      layout
      onSubmit={handleSubmit}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative overflow-hidden rounded-card bg-paper p-4 shadow-card ring-1 ring-black/10 sm:p-5"
      aria-label="Edit schedule entry"
    >
      <span className="absolute inset-y-0 left-0 w-1.5" style={{ backgroundColor: cat.color }} aria-hidden="true" />
      <div className="mb-4 flex items-start gap-3 pl-2">
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${cat.color}1F`, color: cat.textColor }}>
          <Palette className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h3 className="font-sans text-base font-bold text-ink">Edit schedule block</h3>
          <p className="mt-0.5 font-sans text-xs leading-relaxed text-ink/55">Update the time, description, and color category for this repeating routine.</p>
        </div>
      </div>

      {/* Single column on mobile so fields never get cramped side-by-side. */}
      <div className="grid grid-cols-1 gap-3 pl-2 sm:grid-cols-2">
        <div>
          <label className={labelCls} htmlFor="edit-start">Start time</label>
          <input ref={firstField} id="edit-start" type="text" inputMode="numeric" autoComplete="off" value={draft.start} onChange={set('start')} aria-invalid={!!errors.start} aria-describedby={errors.start ? 'edit-start-error' : undefined} className={fieldCls} style={{ ['--tw-ring-color']: accent }} />
          {errors.start && <p id="edit-start-error" role="alert" className={errorCls}>{errors.start}</p>}
        </div>
        <div>
          <label className={labelCls} htmlFor="edit-end">End time</label>
          <input id="edit-end" type="text" inputMode="numeric" autoComplete="off" value={draft.end} onChange={set('end')} aria-invalid={!!errors.end} aria-describedby={errors.end ? 'edit-end-error' : 'edit-end-hint'} className={fieldCls} style={{ ['--tw-ring-color']: accent }} />
          {errors.end ? <p id="edit-end-error" role="alert" className={errorCls}>{errors.end}</p> : <p id="edit-end-hint" className="mt-1 font-sans text-xs text-ink/50">24-hour, e.g. 22:30. Overnight is fine.</p>}
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls} htmlFor="edit-desc">Description</label>
          <input id="edit-desc" type="text" value={draft.description} onChange={set('description')} aria-invalid={!!errors.description} aria-describedby={errors.description ? 'edit-desc-error' : undefined} className={fieldCls} style={{ ['--tw-ring-color']: accent }} />
          {errors.description && <p id="edit-desc-error" role="alert" className={errorCls}>{errors.description}</p>}
        </div>
        <fieldset className="sm:col-span-2" aria-describedby={errors.category ? 'edit-cat-error' : 'edit-cat-hint'}>
          <legend className={labelCls}>Color &amp; category</legend>
          <p id="edit-cat-hint" className="mt-1 font-sans text-xs text-ink/50">The selected category controls the accent color shown on this block.</p>
          {/*
            Wrapping chip group rather than a fixed grid: the set flows to fill
            each row whatever its length, so retiring or adding a category never
            leaves an empty cell.
          */}
          <div className="mt-2 flex flex-wrap gap-2">
            {CATEGORY_KEYS.map((key) => {
              const option = CATEGORIES[key]
              const selected = draft.category === key
              return (
                <label key={key} className="cursor-pointer">
                  <input type="radio" name="entry-category" value={key} checked={selected} onChange={() => setDraft((current) => ({ ...current, category: key }))} className="peer sr-only" />
                  <span className="flex min-h-touch-lg items-center gap-2 rounded-xl px-3 font-sans text-xs font-bold ring-1 transition-[background-color,box-shadow,transform] peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 active:scale-[0.98]" style={{ backgroundColor: selected ? `${option.color}24` : '#F5EDE6', color: option.textColor, boxShadow: selected ? `inset 0 0 0 2px ${option.color}` : 'inset 0 0 0 1px rgba(26,26,26,0.08)', ['--tw-ring-color']: option.color }}>
                    <span className="h-3 w-3 flex-shrink-0 rounded-full" style={{ backgroundColor: option.color }} aria-hidden="true" />
                    {option.label}
                    {selected && <Check className="ml-auto h-3.5 w-3.5" aria-hidden="true" />}
                  </span>
                </label>
              )
            })}
          </div>
          {errors.category && <p id="edit-cat-error" role="alert" className={errorCls}>{errors.category}</p>}
        </fieldset>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-end gap-2 pl-2">
        <span
          aria-live="polite"
          className={`mr-auto flex items-center gap-1 font-sans text-sm font-bold transition-opacity ${saved ? 'opacity-100' : 'opacity-0'}`}
          style={{ color: accent }}
        >
          <Check className="h-4 w-4" aria-hidden="true" />
          Saved
        </span>
        <button type="button" disabled={saving} onClick={onClose} className="min-h-touch flex-1 rounded-xl px-4 font-sans text-sm font-semibold text-ink/70 ring-1 ring-black/15 transition-colors hover:bg-black/5 focus:outline-none focus-visible:ring-2 disabled:opacity-50 sm:flex-none">Cancel</button>
        <button type="submit" disabled={saving} className="flex min-h-touch flex-1 items-center justify-center gap-2 rounded-xl px-4 font-sans text-sm font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:cursor-wait disabled:opacity-60 sm:flex-none" style={{ backgroundColor: accent, color: onAccent, ['--tw-ring-color']: accent }}>
          {saving && <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" />}
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </motion.form>
  )
}
