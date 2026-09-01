import { useState } from 'react'
import { Loader2, Plus } from 'lucide-react'
import { TOUCH_TARGET, TOUCH_TARGET_LG } from '../config/layout.js'

/**
 * Inline "add a habit" field.
 *
 * Kept inline rather than in a sheet: adding several habits in a row is a common
 * flow, and a dialog per habit would mean open/type/confirm/reopen each time.
 * The field clears and keeps focus so the next one can be typed straight away.
 *
 * @param {Function} onAdd    (label) => Promise<boolean|void>
 * @param {string}   [accentColor]
 */
export default function AddHabitForm({ onAdd, accentColor = '#0F766E' }) {
  const [label, setLabel] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    const trimmed = label.trim()
    if (!trimmed || saving) return

    setSaving(true)
    const result = await onAdd?.(trimmed)
    setSaving(false)
    if (result !== false) setLabel('')
  }

  return (
    <form onSubmit={submit} className="mt-4 flex gap-2">
      <label htmlFor="add-habit" className="sr-only">New habit</label>
      <input
        id="add-habit"
        type="text"
        value={label}
        onChange={(event) => setLabel(event.target.value)}
        placeholder="Add a habit…"
        disabled={saving}
        className={`${TOUCH_TARGET_LG} min-w-0 flex-1 rounded-xl bg-cream/70 px-3.5 font-sans text-body text-ink ring-1 ring-black/15 focus:outline-none focus-visible:ring-2`}
        style={{ ['--tw-ring-color']: accentColor }}
      />
      <button
        type="submit"
        disabled={!label.trim() || saving}
        className={`${TOUCH_TARGET} inline-flex flex-shrink-0 items-center justify-center gap-1.5 rounded-xl bg-ink px-4 font-sans text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-45`}
      >
        {saving ? <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
        Add
      </button>
    </form>
  )
}
