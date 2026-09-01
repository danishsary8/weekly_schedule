import { useEffect, useState } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import Modal from '../ui/Modal.jsx'
import { CATEGORY_COLORS } from '../../config/categories.js'
import { TOUCH_TARGET, TOUCH_TARGET_LG } from '../../config/layout.js'

/** Sunday-first, matching the API's `Date.getDay()` convention (0 = Sunday). */
const WEEKDAYS = [
  { index: 0, short: 'Sun', long: 'Sunday' },
  { index: 1, short: 'Mon', long: 'Monday' },
  { index: 2, short: 'Tue', long: 'Tuesday' },
  { index: 3, short: 'Wed', long: 'Wednesday' },
  { index: 4, short: 'Thu', long: 'Thursday' },
  { index: 5, short: 'Fri', long: 'Friday' },
  { index: 6, short: 'Sat', long: 'Saturday' },
]

const labelClasses = 'block font-sans text-xs font-bold uppercase tracking-wide text-ink/60'

/**
 * Rename a routine, recolour it, choose its weekdays, or delete it.
 *
 * Colour is a swatch group drawn from the category palette rather than a raw
 * `<input type="color">`: on mobile that control rendered as an unlabelled
 * filled bar which read as a broken progress element, and it offered millions of
 * colours where six on-brand ones are wanted.
 *
 * @param {boolean}  open
 * @param {Function} onClose
 * @param {object}   group            The routine being edited.
 * @param {Function} onSave           (patch) => Promise<boolean|void>
 * @param {Function} onRequestDelete  Opens the caller's confirm dialog.
 * @param {object}   [returnFocusRef]
 */
export default function RoutineSettingsSheet({ open, onClose, group, onSave, onRequestDelete, returnFocusRef }) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(CATEGORY_COLORS[0])
  const [weekdays, setWeekdays] = useState([])
  const [saving, setSaving] = useState(false)

  // Re-seed on open so a previously edited routine never leaks in.
  useEffect(() => {
    if (!open || !group) return
    setName(group.name ?? '')
    setColor(group.color ?? CATEGORY_COLORS[0])
    setWeekdays(Array.isArray(group.weekdays) ? [...group.weekdays] : [])
    setSaving(false)
  }, [open, group])

  const toggleWeekday = (index) => {
    setWeekdays((current) => current.includes(index)
      ? current.filter((value) => value !== index)
      : [...current, index].sort((a, b) => a - b))
  }

  const trimmedName = name.trim()
  const canSave = trimmedName.length > 0 && weekdays.length > 0 && !saving

  const save = async (event) => {
    event.preventDefault()
    if (!canSave) return
    setSaving(true)
    const result = await onSave?.({ name: trimmedName, color, weekdays })
    setSaving(false)
    if (result !== false) onClose?.()
  }

  return (
    <Modal
      open={open}
      onClose={saving ? () => {} : onClose}
      title="Routine settings"
      description={group?.name ? `Editing “${group.name}”` : undefined}
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
            form="routine-settings-form"
            disabled={!canSave}
            className={`${TOUCH_TARGET} inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-4 font-sans text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-45`}
          >
            {saving && <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" />}
            {saving ? 'Saving…' : 'Save routine'}
          </button>
        </div>
      )}
    >
      <form id="routine-settings-form" onSubmit={save} className="space-y-5" noValidate>
        <div>
          <label className={labelClasses} htmlFor="routine-name">Routine name</label>
          <input
            id="routine-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Weekdays"
            className={`${TOUCH_TARGET_LG} mt-1.5 w-full rounded-xl bg-cream/70 px-3.5 font-sans text-body text-ink ring-1 ring-black/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-career`}
          />
          {!trimmedName && <p className="mt-1 font-sans text-body-sm font-semibold text-language">Give the routine a name.</p>}
        </div>

        <fieldset>
          <legend className={labelClasses}>Accent colour</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {CATEGORY_COLORS.map((value) => (
              <label key={value} className="cursor-pointer">
                <input
                  type="radio"
                  name="routine-color"
                  value={value}
                  checked={color === value}
                  onChange={() => setColor(value)}
                  className="peer sr-only"
                />
                <span
                  className="block h-11 w-11 rounded-xl ring-2 ring-transparent ring-offset-2 ring-offset-paper transition-shadow peer-checked:ring-ink peer-focus-visible:ring-ink"
                  style={{ backgroundColor: value }}
                >
                  <span className="sr-only">Use colour {value}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className={labelClasses}>Repeats on</legend>
          <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-7">
            {WEEKDAYS.map((day) => {
              const active = weekdays.includes(day.index)
              return (
                <button
                  key={day.index}
                  type="button"
                  onClick={() => toggleWeekday(day.index)}
                  aria-pressed={active}
                  aria-label={day.long}
                  className={`${TOUCH_TARGET} rounded-xl font-sans text-xs font-bold ring-1 transition-colors focus:outline-none focus-visible:ring-2`}
                  style={active
                    ? { backgroundColor: color, color: '#FFFFFF', ['--tw-ring-color']: color }
                    : { backgroundColor: 'transparent', color: '#1A1A1A', ['--tw-ring-color']: color }}
                >
                  {day.short}
                </button>
              )
            })}
          </div>
          {weekdays.length === 0 && (
            <p className="mt-2 font-sans text-body-sm font-semibold text-language">Choose at least one weekday.</p>
          )}
        </fieldset>

        <div className="border-t border-black/[0.07] pt-4">
          <button
            type="button"
            onClick={onRequestDelete}
            disabled={saving}
            className={`${TOUCH_TARGET} inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 font-sans text-sm font-bold text-language ring-1 ring-language/35 transition-colors hover:bg-language/10 disabled:opacity-50`}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Delete this routine
          </button>
        </div>
      </form>
    </Modal>
  )
}
