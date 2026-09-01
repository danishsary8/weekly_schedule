import { Clock, Hourglass, Pencil, Trash2 } from 'lucide-react'
import Modal from '../ui/Modal.jsx'
import CategoryIcon from '../CategoryIcon.jsx'
import { getCategory } from '../../config/categories.js'
import { formatRange, to12h, toMinutes } from '../../utils/time.js'
import { matchPrayerKey } from '../../utils/prayerTimes.js'
import { TOUCH_TARGET } from '../../config/layout.js'

/** Human duration for a block, wrapping past midnight. */
function formatDuration(start, end) {
  const startMin = toMinutes(start)
  const endMin = toMinutes(end)
  if (startMin === null || endMin === null) return null

  const total = (endMin - startMin + 1440) % 1440 || 1440
  const hours = Math.floor(total / 60)
  const minutes = total % 60
  if (hours && minutes) return `${hours}h ${minutes}m`
  return hours ? `${hours}h` : `${minutes}m`
}

/**
 * Read-only detail for a schedule block, with its actions.
 *
 * This is the discoverability fix: tapping a block previously did nothing unless
 * the user had first found a global "edit mode", so Edit and Delete were
 * effectively hidden. Details and actions now live where the user already
 * tapped.
 *
 * @param {object|null} entry          Block to show; null closes the sheet.
 * @param {Function}    onClose
 * @param {Function}    onEdit
 * @param {Function}    onDelete
 * @param {boolean}     [canModify]    False when the account cannot mutate yet.
 * @param {object}      [prayerTimings]
 * @param {object}      [returnFocusRef]
 */
export default function BlockDetailSheet({
  entry,
  onClose,
  onEdit,
  onDelete,
  canModify = true,
  prayerTimings = null,
  returnFocusRef,
}) {
  const category = entry ? getCategory(entry.category) : null
  const duration = entry ? formatDuration(entry.start, entry.end) : null
  const prayerKey = entry ? matchPrayerKey(entry.description) : null
  const prayerTime = prayerKey && prayerTimings ? prayerTimings[prayerKey] : null

  return (
    <Modal
      open={Boolean(entry)}
      onClose={onClose}
      title={entry?.description ?? 'Block'}
      returnFocusRef={returnFocusRef}
      footer={canModify ? (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onEdit}
            className={`${TOUCH_TARGET} inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-ink px-4 font-sans text-sm font-bold text-white`}
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
            Edit
          </button>
          <button
            type="button"
            onClick={onDelete}
            className={`${TOUCH_TARGET} inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 font-sans text-sm font-bold text-language ring-1 ring-language/35 transition-colors hover:bg-language/10`}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Delete
          </button>
        </div>
      ) : (
        <p className="font-sans text-body-sm text-ink/60">Verify your email to edit this routine.</p>
      )}
    >
      {entry && (
        <div className="space-y-3">
          <span
            className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-sans text-body-sm font-bold"
            style={{ backgroundColor: `${category.color}1F`, color: category.textColor }}
          >
            <CategoryIcon token={category.token} color={category.color} className="h-4 w-4" />
            {category.label}
          </span>

          <dl className="divide-y divide-black/[0.06] rounded-2xl bg-cream/60 ring-1 ring-black/[0.07]">
            <div className="flex items-center gap-3 px-3.5 py-3">
              <Clock className="h-5 w-5 flex-shrink-0 text-ink/45" aria-hidden="true" />
              <dt className="font-sans text-body-sm text-ink/60">Time</dt>
              <dd className="ml-auto font-sans text-body font-semibold tabular-nums">{formatRange(entry.start, entry.end)}</dd>
            </div>
            {duration && (
              <div className="flex items-center gap-3 px-3.5 py-3">
                <Hourglass className="h-5 w-5 flex-shrink-0 text-ink/45" aria-hidden="true" />
                <dt className="font-sans text-body-sm text-ink/60">Duration</dt>
                <dd className="ml-auto font-sans text-body font-semibold tabular-nums">{duration}</dd>
              </div>
            )}
            {prayerTime && (
              <div className="flex items-center gap-3 px-3.5 py-3">
                <Clock className="h-5 w-5 flex-shrink-0 text-ink/45" aria-hidden="true" />
                <dt className="font-sans text-body-sm text-ink/60">{prayerKey} today</dt>
                <dd className="ml-auto font-sans text-body font-semibold tabular-nums">{to12h(prayerTime)}</dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </Modal>
  )
}
