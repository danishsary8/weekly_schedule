import { useEffect, useId, useRef, useState } from 'react'
import { Check, Clock3, X } from 'lucide-react'
import { to12h } from '../../utils/time.js'
import { TOUCH_TARGET_LG } from '../../config/layout.js'

const HOURS = Array.from({ length: 12 }, (_, index) => index + 1)
const MINUTES = Array.from({ length: 60 }, (_, index) => index)
const PERIODS = ['AM', 'PM']

const ITEM_HEIGHT = 44
const VISIBLE_COUNT = 5
const CONTAINER_HEIGHT = ITEM_HEIGHT * VISIBLE_COUNT // 220px
const PADDING_Y = (CONTAINER_HEIGHT - ITEM_HEIGHT) / 2 // 88px

function triggerHaptic() {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(5)
    } catch {
      /* ignore */
    }
  }
}

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

/**
 * iOS Clock-style cylindrical 3D drum wheel column.
 */
function WheelColumn({ label, values, selected, format, onSelect, idPrefix }) {
  const listRef = useRef(null)
  const isScrollingRef = useRef(false)
  const scrollTimeoutRef = useRef(null)
  const isDraggingRef = useRef(false)
  const startYRef = useRef(0)
  const startScrollTopRef = useRef(0)

  const selectedIndex = Math.max(0, values.indexOf(selected))
  const selectedId = `${idPrefix}-${selected}`

  // Center the selected item when value changes from outside
  useEffect(() => {
    const list = listRef.current
    if (!list) return
    if (isScrollingRef.current) return

    const targetTop = selectedIndex >= 0 ? selectedIndex * ITEM_HEIGHT : 0
    if (Math.abs(list.scrollTop - targetTop) > 2) {
      list.scrollTop = targetTop
    }
  }, [selected, selectedIndex])

  // Native scroll handler with debounce to capture scroll snap
  const handleScroll = () => {
    const list = listRef.current
    if (!list) return

    isScrollingRef.current = true
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)

    const rawIndex = Math.round(list.scrollTop / ITEM_HEIGHT)
    const clampedIndex = Math.max(0, Math.min(values.length - 1, rawIndex))

    if (clampedIndex !== selectedIndex && values[clampedIndex] !== undefined) {
      triggerHaptic()
      onSelect(values[clampedIndex])
    }

    scrollTimeoutRef.current = setTimeout(() => {
      isScrollingRef.current = false
    }, 100)
  }

  const handleSelectClick = (index, value) => {
    const list = listRef.current
    if (list) {
      if (typeof list.scrollTo === 'function') {
        list.scrollTo({ top: index * ITEM_HEIGHT, behavior: 'smooth' })
      } else {
        list.scrollTop = index * ITEM_HEIGHT
      }
    }
    triggerHaptic()
    onSelect(value)
  }

  // Mouse drag support for desktop emulation of iOS touch wheels
  const handleMouseDown = (e) => {
    const list = listRef.current
    if (!list) return
    isDraggingRef.current = true
    startYRef.current = e.clientY
    startScrollTopRef.current = list.scrollTop
  }

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current || !listRef.current) return
    const deltaY = e.clientY - startYRef.current
    listRef.current.scrollTop = startScrollTopRef.current - deltaY
  }

  const handleMouseUp = () => {
    isDraggingRef.current = false
  }

  const move = (event) => {
    if (!['ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'].includes(event.key)) return
    event.preventDefault()

    const last = values.length - 1
    const delta =
      event.key === 'ArrowUp'
        ? -1
        : event.key === 'ArrowDown'
          ? 1
          : event.key === 'PageUp'
            ? -5
            : event.key === 'PageDown'
              ? 5
              : 0
    const nextIndex =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? last
          : (selectedIndex + delta + values.length) % values.length

    const list = listRef.current
    if (list) {
      list.scrollTop = nextIndex * ITEM_HEIGHT
    }
    triggerHaptic()
    onSelect(values[nextIndex])
  }

  return (
    <div className="relative flex flex-col items-center">
      <span className="mb-2 block text-center font-sans text-[10px] font-bold uppercase tracking-wider text-white/40">
        {label.replace(/^(Start|End)\s+/i, '')}
      </span>

      <div
        ref={listRef}
        role="listbox"
        tabIndex="0"
        aria-label={label}
        aria-activedescendant={selectedId}
        onKeyDown={move}
        onScroll={handleScroll}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="w-full snap-y snap-mandatory overflow-y-auto select-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden focus:outline-none focus-visible:ring-1 focus-visible:ring-white/30 rounded-xl cursor-grab active:cursor-grabbing"
        style={{
          height: `${CONTAINER_HEIGHT}px`,
          paddingTop: `${PADDING_Y}px`,
          paddingBottom: `${PADDING_Y}px`,
          perspective: '500px',
        }}
      >
        {values.map((value, index) => {
          const distance = index - selectedIndex
          const isSelected = distance === 0
          const absDist = Math.abs(distance)

          // 3D cylindrical drum curvature calculation
          let rotateX = 0
          let scale = 1
          let opacity = 1

          if (isSelected) {
            scale = 1.05
            opacity = 1
          } else {
            rotateX = distance > 0 ? -Math.min(55, absDist * 18) : Math.min(55, absDist * 18)
            scale = Math.max(0.78, 1 - absDist * 0.08)
            opacity = Math.max(0.12, 0.55 - absDist * 0.16)
          }

          return (
            <button
              id={`${idPrefix}-${value}`}
              key={value}
              type="button"
              role="option"
              tabIndex="-1"
              aria-selected={isSelected}
              aria-label={format(value)}
              onClick={() => handleSelectClick(index, value)}
              className="flex w-full snap-center items-center justify-center font-sans tabular-nums transition-[transform,opacity,color] duration-150 ease-out focus:outline-none"
              style={{
                height: `${ITEM_HEIGHT}px`,
                transform: `rotateX(${rotateX}deg) scale(${scale})`,
                transformOrigin: distance > 0 ? 'top center' : 'bottom center',
                opacity,
              }}
            >
              <span
                className={`transition-colors duration-150 ${
                  isSelected
                    ? 'text-2xl font-bold tracking-tight text-white'
                    : 'text-xl font-medium text-white/70'
                }`}
              >
                {format(value)}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/**
 * iPhone Clock-style time picker card.
 */
function TimeWheel({ label, value, onChange, onDone, panelId }) {
  const parts = timeParts(value)
  const uid = useId().replaceAll(':', '')

  const update = (patch) => onChange(toTimeValue({ ...parts, ...patch }))

  return (
    <section
      id={panelId}
      className="relative overflow-hidden rounded-3xl bg-[#18181A] p-4 text-white shadow-2xl ring-1 ring-white/10"
      aria-label={`Set ${label.toLowerCase()} time`}
    >
      {/* Header with statement & Done button */}
      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <div>
          <p className="font-sans text-[11px] font-bold uppercase tracking-wider text-white/45">
            Set {label.toLowerCase()} time
          </p>
          <p className="mt-0.5 font-sans text-xl font-bold tabular-nums text-white">
            {to12h(value)}
          </p>
        </div>
        <button
          type="button"
          onClick={onDone}
          className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full bg-white px-4 font-sans text-xs font-bold text-[#18181A] shadow-md transition-transform hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <Check className="h-4 w-4 stroke-[2.5]" aria-hidden="true" />
          Done
        </button>
      </div>

      {/* Wheel cylindrical chamber */}
      <div className="relative rounded-2xl bg-[#111113] p-2 ring-1 ring-white/5 overflow-hidden">
        {/* iOS Selection Capsule Bar (centered behind active row) */}
        <div
          className="pointer-events-none absolute inset-x-2 top-1/2 -translate-y-1/2 rounded-2xl bg-white/[0.13] border border-white/[0.08] shadow-sm z-0"
          style={{ height: `${ITEM_HEIGHT}px` }}
          aria-hidden="true"
        />

        {/* Top & Bottom 3D Vignette Fade Gradients */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#111113] via-[#111113]/85 to-transparent z-20"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#111113] via-[#111113]/85 to-transparent z-20"
          aria-hidden="true"
        />

        {/* 3 Wheel Columns */}
        <div className="relative z-10 grid grid-cols-[1fr_1fr_.85fr] items-center">
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
      </div>
    </section>
  )
}

/**
 * Alarm-style start/end time control with iOS Clock drum wheel.
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

  const choose = (field) => setActive((current) => (current === field ? null : field))
  const change = (value) => (active === 'start' ? onStartChange(value) : onEndChange(value))

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
              <span className="mb-1.5 block font-sans text-xs font-bold uppercase tracking-wide text-ink/60">
                {item.label}
              </span>
              <button
                type="button"
                onClick={() => choose(item.field)}
                aria-expanded={open}
                aria-controls={open ? panelId : undefined}
                aria-invalid={Boolean(item.error)}
                aria-label={`Set ${item.field} time, currently ${to12h(item.value)}`}
                className={`${TOUCH_TARGET_LG} flex w-full items-center justify-between gap-2 rounded-xl bg-cream/70 px-3.5 text-left font-sans text-body font-semibold tabular-nums text-ink ring-1 transition-[box-shadow,background-color] focus:outline-none focus-visible:ring-2 focus-visible:ring-career ${
                  open ? 'bg-paper ring-2 ring-career' : 'ring-black/15'
                }`}
              >
                <span className="truncate">{to12h(item.value)}</span>
                {open ? (
                  <X className="h-5 w-5 flex-shrink-0 text-career" aria-hidden="true" />
                ) : (
                  <Clock3 className="h-5 w-5 flex-shrink-0 text-ink/55" aria-hidden="true" />
                )}
              </button>
              {item.error && (
                <p role="alert" className="mt-1 font-sans text-body-sm font-semibold text-language">
                  {item.error}
                </p>
              )}
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
