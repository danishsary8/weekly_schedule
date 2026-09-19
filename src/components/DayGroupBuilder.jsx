import { useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Check, CheckCircle2, ChevronDown, Loader2, Sparkles } from 'lucide-react'
import { CATEGORY_COLORS, CATEGORY_KEYS } from '../config/categories.js'
import { contrastTextOn } from '../utils/color.js'
import { describeApiError } from '../utils/apiError.js'
import { createChecklistItem, createDayGroup, createTimelineEntry } from '../api/services.js'
import Card from './Card.jsx'
import ColorPicker from './ui/ColorPicker.jsx'
import { WEEKDAY_SHORTS } from '../config/weekdays.js'

const DAYS = WEEKDAY_SHORTS

/*
 * Group accent swatches reuse the live category palette instead of repeating
 * hexes, so the two can never fall out of sync.
 */
const COLORS = CATEGORY_COLORS
const field = 'min-h-touch-lg w-full rounded-xl bg-cream/70 px-4 font-sans text-sm text-ink ring-1 ring-black/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-career'

export default function DayGroupBuilder({ onComplete, onCancel, compact = false }) {
  const reduceMotion = useReducedMotion()
  const [name, setName] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [weekdays, setWeekdays] = useState([new Date().getDay()])
  const [entry, setEntry] = useState({ start: '09:00', end: '10:00', description: '', category: 'Life' })
  const [habits, setHabits] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [complete, setComplete] = useState(false)

  const ready = Boolean(name.trim() && weekdays.length && entry.description.trim())
  const step = entry.description.trim() ? 3 : name.trim() ? 2 : 1
  const progress = useMemo(() => [name.trim(), entry.description.trim(), ready], [name, entry.description, ready])
  const toggleDay = (day) => setWeekdays((current) => current.includes(day) ? current.filter((value) => value !== day) : [...current, day])

  const submit = async (event) => {
    event.preventDefault()
    if (!ready) {
      setError('Name your routine, choose at least one weekday, and describe the first schedule block.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const group = await createDayGroup({ name: name.trim(), color, weekdays })
      await createTimelineEntry(group.id, { ...entry, description: entry.description.trim() })
      const labels = habits.split('\n').map((value) => value.trim()).filter(Boolean)
      await Promise.all(labels.map((label) => createChecklistItem(group.id, label)))
      setComplete(true)
      window.setTimeout(() => onComplete?.(group.id), reduceMotion ? 50 : 700)
    } catch (err) {
      // Says which field, or that the API is unreachable — the old copy blamed
      // the connection even when the server had answered with a validation error.
      setError(describeApiError(err, 'Could not create this routine. Please try again.'))
      setSaving(false)
    }
  }

  if (complete) {
    return (
      <motion.section role="status" aria-live="polite" className="mx-auto flex min-h-[360px] max-w-2xl items-center justify-center px-2 py-8 text-center" initial={reduceMotion ? false : { opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
        <Card tone="black" accentColor={color} className="w-full p-8 sm:p-12">
          <motion.span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-ink" initial={reduceMotion ? false : { scale: 0.5, rotate: -12 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 280, damping: 18 }}>
            <Check className="h-8 w-8" aria-hidden="true" />
          </motion.span>
          <h2 className="mt-5 display-title text-4xl text-white sm:text-5xl">Your routine is ready.</h2>
          <p className="mx-auto mt-3 max-w-sm font-sans text-sm leading-relaxed text-white/65">Nice work. Taking you to your first day so you can start with one small win.</p>
        </Card>
      </motion.section>
    )
  }

  return (
    <section className={compact ? '' : 'mx-auto max-w-2xl'} data-tour="group-builder" aria-labelledby="builder-title">
      {/* Standard card ramp (20→24) when inline; hero ramp (24→32) standalone —
          previously 20→32, which skipped a step in the scale. */}
      <Card tone="white" accentColor={color} className={compact ? 'p-5 sm:p-6' : 'p-6 sm:p-8'}>
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-ink text-white"><Sparkles className="h-5 w-5" aria-hidden="true" /></span>
          <div className="min-w-0 flex-1">
            <p className="eyebrow text-career">Step {step} of 3</p>
            <h2 id="builder-title" className="mt-1 display-title text-3xl text-ink sm:text-4xl">Build your first rhythm</h2>
            <p className="mt-1 font-sans text-sm leading-relaxed text-ink/60">Two quick details are enough. You can refine everything later.</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2" aria-label={`Onboarding step ${step} of 3`}>
          {['Name it', 'Add a block', 'Ready'].map((label, index) => (
            <div key={label}>
              <span className="block h-1.5 rounded-full bg-ink/10"><motion.span className="block h-full rounded-full" style={{ backgroundColor: color }} animate={{ width: progress[index] ? '100%' : index < step ? '45%' : '0%' }} transition={reduceMotion ? { duration: 0 } : { duration: 0.3 }} /></span>
              <span className="mt-1.5 block font-sans text-label font-semibold text-ink/50">{label}</span>
            </div>
          ))}
        </div>

        <form onSubmit={submit} className="mt-6 space-y-5">
          <div><label htmlFor="group-name" className="font-sans text-xs font-bold uppercase tracking-wide text-ink/60">Routine name</label><input id="group-name" autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Weekdays or Study days" className={`${field} mt-2`} /></div>

          <fieldset><legend className="font-sans text-xs font-bold uppercase tracking-wide text-ink/60">Repeats on</legend><p className="mt-1 font-sans text-xs text-ink/50">Today is selected to get you started.</p><div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-7">{DAYS.map((day, index) => <button key={day} type="button" aria-pressed={weekdays.includes(index)} onClick={() => toggleDay(index)} className="min-h-touch rounded-xl font-sans text-xs font-bold ring-1 ring-black/15" style={weekdays.includes(index) ? { backgroundColor: color, color: contrastTextOn(color) } : {}}>{day}</button>)}</div></fieldset>

          <fieldset className="rounded-2xl bg-cream/55 p-4 ring-1 ring-black/[0.07]">
            <legend className="px-2 font-sans text-xs font-bold uppercase tracking-wide text-ink/60">Your first schedule block</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label htmlFor="first-start" className="mb-1.5 block font-sans text-xs font-semibold text-ink/55">Starts</label><input id="first-start" type="time" value={entry.start} onChange={(event) => setEntry({ ...entry, start: event.target.value })} className={field} /></div>
              <div><label htmlFor="first-end" className="mb-1.5 block font-sans text-xs font-semibold text-ink/55">Ends</label><input id="first-end" type="time" value={entry.end} onChange={(event) => setEntry({ ...entry, end: event.target.value })} className={field} /></div>
              <div className="sm:col-span-2"><label htmlFor="first-description" className="mb-1.5 block font-sans text-xs font-semibold text-ink/55">What will you do?</label><input id="first-description" aria-label="Block description" value={entry.description} onChange={(event) => setEntry({ ...entry, description: event.target.value })} placeholder="e.g. Plan the day" className={field} /></div>
              <div className="sm:col-span-2"><label htmlFor="first-category" className="mb-1.5 block font-sans text-xs font-semibold text-ink/55">Category</label><select id="first-category" aria-label="Block category" value={entry.category} onChange={(event) => setEntry({ ...entry, category: event.target.value })} className={field}>{CATEGORY_KEYS.map((key) => <option key={key}>{key}</option>)}</select></div>
            </div>
          </fieldset>

          <div className="rounded-2xl bg-cream/35 p-4 ring-1 ring-black/[0.07]"><label htmlFor="first-habits" className="font-sans text-xs font-bold uppercase tracking-wide text-ink/60">Your first quick win · checklist items <span className="normal-case font-medium">(optional)</span></label><p className="mt-1 font-sans text-xs leading-relaxed text-ink/50">Add one or more checklist items so you have something satisfying to complete today.</p><textarea id="first-habits" value={habits} onChange={(event) => setHabits(event.target.value)} rows="2" placeholder={'Drink water\nReview today’s priorities'} className={`${field} mt-2 py-3`} /></div>

          <details className="group rounded-2xl bg-cream/35 p-4 ring-1 ring-black/[0.07]">
            <summary className="flex min-h-touch cursor-pointer list-none items-center justify-between gap-3 font-sans text-sm font-bold text-ink">Choose another accent color <span className="flex items-center gap-2 font-sans text-xs font-medium text-ink/45">Optional<ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden="true" /></span></summary>
            <ColorPicker
              value={color}
              onChange={setColor}
              presets={COLORS}
              name="color"
              legend="Accent color"
              hideLegend
              className="mt-4 border-t border-black/10 pt-4"
            />
          </details>

          {error && <p role="alert" className="rounded-xl bg-language/10 p-3 font-sans text-sm font-semibold text-language">{error}</p>}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{onCancel && <button type="button" onClick={onCancel} className="min-h-touch-lg rounded-xl px-5 font-sans text-sm font-semibold ring-1 ring-black/15">Cancel</button>}<button disabled={saving || !ready} className="flex min-h-touch-lg items-center justify-center gap-2 rounded-xl bg-ink px-5 font-sans text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-45">{saving ? <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" /> : <CheckCircle2 className="h-4 w-4" aria-hidden="true" />}{saving ? 'Creating…' : 'Create my routine'}</button></div>
        </form>
      </Card>
    </section>
  )
}
