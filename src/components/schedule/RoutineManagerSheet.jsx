import { Check, Plus, Settings2 } from 'lucide-react'
import Modal from '../ui/Modal.jsx'
import { formatWeekdays } from '../../config/weekdays.js'
import { contrastTextOn } from '../../utils/color.js'
import { TOUCH_TARGET, TOUCH_TARGET_LG } from '../../config/layout.js'

/**
 * Switch between routines, or reach the controls that change them.
 *
 * Why routines moved into a sheet
 * -------------------------------
 * Switching routines is a low-frequency act — most days you open the app to see
 * today's plan, which is already selected. The old layout spent the two most
 * valuable rows on the screen (directly under the header, above the fold on a
 * phone) on a pill per routine plus an "Edit routine" / "New routine" pair, so
 * the daily reason for visiting was pushed down by controls that are used
 * occasionally. That space now belongs to the category nav and the plan itself.
 *
 * Every routine action lives here: switch, rename/recolour/reschedule via the
 * settings sheet, delete from inside that, and create.
 *
 * Only one Modal is ever mounted at a time. `Modal` locks body scroll and traps
 * focus, so two open at once would fight over both; the caller therefore closes
 * this sheet before opening the settings sheet.
 *
 * @param {boolean}  open
 * @param {Function} onClose
 * @param {Array}    groups          Routines, in API order.
 * @param {number}   selectedId
 * @param {Array}    todayGroupIds   Routines assigned to the current weekday.
 * @param {Function} onSelect        (id) => void. Caller closes the sheet.
 * @param {Function} onEditRoutine   (group) => void. Caller swaps in the settings sheet.
 * @param {Function} onCreateRoutine () => void.
 * @param {boolean}  [canManage]     False until the account's email is verified.
 * @param {object}   [returnFocusRef]
 */
export default function RoutineManagerSheet({
  open,
  onClose,
  groups = [],
  selectedId,
  todayGroupIds = [],
  onSelect,
  onEditRoutine,
  onCreateRoutine,
  canManage = true,
  returnFocusRef,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Your routines"
      description={groups.length > 1 ? 'Pick the one you want to look at.' : undefined}
      returnFocusRef={returnFocusRef}
      footer={canManage ? (
        <button
          type="button"
          onClick={onCreateRoutine}
          className={`${TOUCH_TARGET} inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 font-sans text-sm font-bold text-white`}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          New routine
        </button>
      ) : (
        <p className="font-sans text-body-sm text-ink/60">Verify your email to add or change routines.</p>
      )}
    >
      {groups.length === 0 ? (
        <p className="font-sans text-body text-ink/60">You don’t have any routines yet.</p>
      ) : (
        <ul className="space-y-2">
          {groups.map((group) => {
            const active = group.id === selectedId
            const isToday = todayGroupIds.includes(group.id)

            return (
              <li key={group.id} className="flex items-stretch gap-2">
                {/*
                  Two adjacent buttons rather than a row with a nested control:
                  switching and editing are different intents, and a button inside
                  a button is invalid markup that swallows one of the two taps.
                */}
                <button
                  type="button"
                  onClick={() => onSelect?.(group.id)}
                  aria-current={active ? 'true' : undefined}
                  /*
                   * Spelled out rather than derived: the visible pieces (name,
                   * days, badges) run together into one unpunctuated string when
                   * a screen reader concatenates them, and "Show" is what the tap
                   * actually does.
                   */
                  aria-label={[
                    `Show ${group.name}`,
                    formatWeekdays(group.weekdays),
                    isToday ? 'today' : null,
                    active ? 'currently showing' : null,
                  ].filter(Boolean).join(', ')}
                  className={`${TOUCH_TARGET_LG} flex min-w-0 flex-1 items-center gap-3 rounded-xl px-3 text-left ring-1 transition-colors focus:outline-none focus-visible:ring-2`}
                  style={{
                    backgroundColor: active ? `${group.color}1F` : 'transparent',
                    ['--tw-ring-color']: active ? group.color : 'rgba(26,26,26,0.12)',
                  }}
                >
                  <span
                    className="h-3 w-3 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: group.color }}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-sans text-body font-bold text-ink">{group.name}</span>
                    <span className="block truncate font-sans text-body-sm text-ink/55">
                      {formatWeekdays(group.weekdays)}
                    </span>
                  </span>
                  {isToday && (
                    <span
                      className="flex-shrink-0 rounded-full px-2 py-0.5 font-sans text-label font-bold uppercase"
                      style={{ backgroundColor: group.color, color: contrastTextOn(group.color) }}
                    >
                      Today
                    </span>
                  )}
                  {active && <Check className="h-4 w-4 flex-shrink-0" style={{ color: group.color }} aria-hidden="true" />}
                </button>

                {canManage && (
                  <button
                    type="button"
                    onClick={() => onEditRoutine?.(group)}
                    aria-label={`Settings for ${group.name}`}
                    className={`${TOUCH_TARGET_LG} flex w-12 flex-shrink-0 items-center justify-center rounded-xl text-ink/55 ring-1 ring-black/[0.12] transition-colors hover:bg-black/5 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-career`}
                  >
                    <Settings2 className="h-5 w-5" aria-hidden="true" />
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </Modal>
  )
}
