import { useEffect, useId, useRef, useState } from 'react'
import { Check, Clock3, X } from 'lucide-react'
import { to12h } from '../../utils/time.js'
import { TOUCH_TARGET, TOUCH_TARGET_LG } from '../../config/layout.js'

const HOURS = Array.from({ length: 12 }, (_, index) => index + 1)
const MINUTES = Array.from({ length: 60 }, (_, index) => index)
const PERIODS = ['AM', 'PM']

/** Convert stored 24-hour time into the three alarm-wheel values. */
export function timeParts(value) {
  const match = typeof value === 'string' ? /^(\d{2}):(\d{2})$/.exec(value) : null
  const rawHour = match ? Number(match[1]) : 9
  const minute = match && Number(match[2]) <= 59 ? Number(match[2]) : 0
  const hour24 = rawHour >= 0 && rawHour <= 23 ? rawHour : 9

  return {
    hour: hour24 % 12 || 12,
    minute,
    period: hour24 >= 12 ? 'PM' : 'AM',
  }
}

/** Convert alarm-wheel values back to the API's 24-hour `HH:MM` shape. */
export function toTimeValue({ hour, minute, period }) {
  const safeHour = Math.min(12, Math.max(1, Number(hour) || 12))
  const safeMinute = Math.min(59, Math.max(0, Number(minute) || 0))
  const hour24 = period === 'PM' ? (safeHour % 12) + 12 : safeHour % 12

  return `${String(hour24).padStart(2, '0')}:${String(safeMinute).padStart(2, '0')}`
}

function WheelColumn({ label, values, selected, format, onSelect, idPrefix }) {
  const listRef = useRef(null)
  const selectedIndex = values.indexOf(selected)
  const selectedId = `${idPrefix}-${selected}`

  useEffect(() => {
    const list = listRef.current
    const selectedNode = list?.querySelector('[aria-selected="true"]')
    if (!list || !selectedNode) return

    /*
     * Scroll the column itself — never call selectedNode.scrollIntoView(). That
     * method also scrolls ancestor containers, and inside Modal it pulled the
     * whole form upward so the Starts/Ends controls disappeared under the sticky
     * header on short phones.
     */
    list.scrollTop = Math.max(0, selectedNode.offsetTop - ((list.clientHeight - selectedNode.offsetHeight) / 2))
  }, [selected])

  const move = (event) => {
    if (!['ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'].includes(event.key)) return
    event.preventDefault()

    const last = values.length - 1
    const delta = event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : event.key === 'PageUp' ? -5 : event.key === 'PageDown' ? 5 : 0
    const nextIndex = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? last
        : (selectedIndex + delta + values.length) % values.length

    onSelect(values[nextIndex])
  }

  return (
    <div className="min-w-0">
      <span className="mb-1.5 block text-center font-sans text-label font-bold uppercase tracking-wide text-ink/45">{label}</span>
      <div
        ref={listRef}
        role="listbox"
        tabIndex="0"
        aria-label={label}
        aria-activedescendant={selectedId}
        onKeyDown={move}
        className="h-44 snap-y snap-mandatory overflow-y-auto rounded-xl bg-paper p-1 ring-1 ring-black/10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-career"
      >
        {values.map((value) => {
          const active = value === selected
          return (
            <button
              id={`${idPrefix}-${value}`}
              key={value}
              type="button"
              role="option"
              tabIndex="-1"
              aria-selected={active}
              aria-label={format(value)}
              onClick={() => onSelect(value)}
              className={`${TOUCH_TARGET} flex w-full snap-center items-center justify-center rounded-lg font-sans text-base font-bold tabular-nums transition-colors ${active ? 'bg-ink text-white shadow-card' : 'text-ink/55 hover:bg-cream'}`}
            >
              {format(value)}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function TimeWheel({ label, value, onChange, onDone, panelId }) {
  const parts = timeParts(value)
  const uid = useId().replaceAll(':', '')

  const update = (patch) => onChange(toTimeValue({ ...parts, ...patch }))

  return (
    <section id={panelId} className="rounded-2xl bg-cream/65 p-3 ring-1 ring-black/10" aria-label={`Set ${label.toLowerCase()} time`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="eyebrow text-ink/45">Set {label.toLowerCase()} time</p>
          <p className="mt-0.5 font-sans text-lg font-bold tabular-nums text-ink">{to12h(value)}</p>
        </div>
        <button
          type="button"
          onClick={onDone}
          className={`${TOUCH_TARGET} inline-flex items-center gap-1.5 rounded-xl bg-ink px-3 font-sans text-sm font-bold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-career focus-visible:ring-offset-2 focus-visible:ring-offset-cream`}
        >
          <Check className="h-4 w-4" aria-hidden="true" />
          Done
        </button>
      </div>

      <div className="grid grid-cols-[1fr_1fr_.85fr] gap-2">
        <WheelColumn
          label={`${label} hour`}
          values={HOURS}
          selected={parts.hour}
          format={(hour) => String(hour).padStart(2, '0')}
          onSelect={(hour) => update({ hour })}
          idPrefix={`${uid}-hour`}
        />
        <WheelColumn
          label={`${label} minute`}
          values={MINUTES}
          selected={parts.minute}
          format={(minute) => String(minute).padStart(2, '0')}
          onSelect={(minute) => update({ minute })}
          idPrefix={`${uid}-minute`}
        />
        <WheelColumn
          label={`${label} period`}
          values={PERIODS}
          selected={parts.period}
          format={(period) => period}
          onSelect={(period) => update({ period })}
          idPrefix={`${uid}-period`}
        />
      </div>
    </section>
  )
}

/**
 * Alarm-style start/end time control.
 *
 * Browser-native `input[type=time]` renders an enormous three-column dropdown in
 * desktop Chromium and varies completely between platforms. This controlled
 * picker gives phones and desktops the same alarm-clock mental model while the
 * owning form keeps the exact same 24-hour values expected by the API.
 *
 * Only one wheel opens at a time, inline in the current sheet/card. It is not a
 * nested dialog, so it cannot fight Modal's focus trap or body scroll lock.
 */
export default function TimeRangePicker({
  start,
  end,
  onStartChange,
  onEndChange,
  startError,
  endError,
  idPrefix = 'block-time',
  className = '',
}) {
  const [active, setActive] = useState(null)
  const activeValue = active === 'start' ? start : end
  const panelId = `${idPrefix}-wheel`

  const choose = (field) => setActive((current) => current === field ? null : field)
  const change = (value) => active === 'start' ? onStartChange(value) : onEndChange(value)

  return (
    <div className={className}>
      <div className="grid grid-cols-2 gap-3">
        {[
          { field: 'start', label: 'Starts', value: start, error: startError },
          { field: 'end', label: 'Ends', value: end, error: endError },
        ].map((item) => {
          const open = active === item.field
          return (
            <div key={item.field} className="min-w-0">
              <span className="mb-1.5 block font-sans text-xs font-bold uppercase tracking-wide text-ink/60">{item.label}</span>
              <button
                type="button"
                onClick={() => choose(item.field)}
                aria-expanded={open}
                aria-controls={open ? panelId : undefined}
                aria-invalid={Boolean(item.error)}
                aria-label={`Set ${item.field} time, currently ${to12h(item.value)}`}
                className={`${TOUCH_TARGET_LG} flex w-full items-center justify-between gap-2 rounded-xl bg-cream/70 px-3.5 text-left font-sans text-body font-semibold tabular-nums text-ink ring-1 transition-[box-shadow,background-color] focus:outline-none focus-visible:ring-2 focus-visible:ring-career ${open ? 'bg-paper ring-2 ring-career' : 'ring-black/15'}`}
              >
                <span className="truncate">{to12h(item.value)}</span>
                {open ? <X className="h-5 w-5 flex-shrink-0 text-career" aria-hidden="true" /> : <Clock3 className="h-5 w-5 flex-shrink-0 text-ink/55" aria-hidden="true" />}
              </button>
              {item.error && <p role="alert" className="mt-1 font-sans text-body-sm font-semibold text-language">{item.error}</p>}
            </div>
          )
        })}
      </div>

      {active && (
        <div className="mt-3">
          <TimeWheel
            key={active}
            label={active === 'start' ? 'Start' : 'End'}
            value={activeValue}
            onChange={change}
            onDone={() => setActive(null)}
            panelId={panelId}
          />
        </div>
      )}
    </div>
  )
}
