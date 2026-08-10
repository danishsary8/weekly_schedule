import { useState } from 'react'
import { Loader2, Plus, Sparkles } from 'lucide-react'
import { CATEGORIES } from '../config/categories.js'
import { createChecklistItem, createDayGroup, createTimelineEntry } from '../api/services.js'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const COLORS = ['#0F766E', '#E11D48', '#C9A227', '#65A30D', '#8A8378', '#7C8B9C']
const field = 'min-h-[48px] w-full rounded-xl bg-cream/70 px-4 font-sans text-sm text-ink ring-1 ring-black/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-career'

export default function DayGroupBuilder({ onComplete, onCancel, compact = false }) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [weekdays, setWeekdays] = useState([new Date().getDay()])
  const [entry, setEntry] = useState({ start: '09:00', end: '10:00', description: '', category: 'Life' })
  const [habits, setHabits] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const toggleDay = (day) => setWeekdays((current) => current.includes(day) ? current.filter((d) => d !== day) : [...current, day])
  const submit = async (event) => {
    event.preventDefault()
    if (!name.trim() || weekdays.length === 0 || !entry.description.trim()) { setError('Name your group, choose at least one weekday, and add the first schedule block.'); return }
    setSaving(true); setError('')
    try {
      const group = await createDayGroup({ name: name.trim(), color, weekdays })
      await createTimelineEntry(group.id, { ...entry, description: entry.description.trim() })
      const labels = habits.split('\n').map((v) => v.trim()).filter(Boolean)
      await Promise.all(labels.map((label) => createChecklistItem(group.id, label)))
      await onComplete?.(group.id)
    } catch (err) { setError(err?.response?.data?.error?.message || 'Could not create this routine. Check your connection and try again.') }
    finally { setSaving(false) }
  }
  return (
    <section className={`rounded-card bg-paper shadow-card ring-1 ring-black/10 ${compact ? 'p-5' : 'mx-auto max-w-2xl p-6 sm:p-8'}`} data-tour="group-builder">
      <div className="flex items-start gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ink text-white"><Sparkles className="h-5 w-5" /></span><div><h2 className="display-title text-3xl text-ink">Build a day group</h2><p className="mt-1 font-sans text-sm leading-relaxed text-ink/60">Create a reusable routine and choose exactly which weekdays it covers.</p></div></div>
      <form onSubmit={submit} className="mt-6 space-y-5">
        <div><label htmlFor="group-name" className="font-sans text-xs font-bold uppercase tracking-wide text-ink/60">Group name</label><input id="group-name" autoFocus value={name} onChange={(e)=>setName(e.target.value)} placeholder="e.g. Weekdays or Study days" className={`${field} mt-2`} /></div>
        <fieldset><legend className="font-sans text-xs font-bold uppercase tracking-wide text-ink/60">Group color</legend><div className="mt-2 flex flex-wrap gap-2">{COLORS.map((value)=><label key={value} className="cursor-pointer"><input className="peer sr-only" type="radio" name="color" checked={color===value} onChange={()=>setColor(value)} /><span className="block h-11 w-11 rounded-xl ring-2 ring-transparent ring-offset-2 ring-offset-paper peer-checked:ring-ink" style={{backgroundColor:value}}><span className="sr-only">Choose {value}</span></span></label>)}</div></fieldset>
        <fieldset><legend className="font-sans text-xs font-bold uppercase tracking-wide text-ink/60">Repeats on</legend><div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-7">{DAYS.map((day,index)=><button key={day} type="button" aria-pressed={weekdays.includes(index)} onClick={()=>toggleDay(index)} className="min-h-[44px] rounded-xl font-sans text-xs font-bold ring-1 ring-black/15" style={weekdays.includes(index)?{backgroundColor:color,color:'#fff'}:{}}>{day}</button>)}</div></fieldset>
        <fieldset className="rounded-2xl bg-cream/55 p-4 ring-1 ring-black/[0.07]"><legend className="px-2 font-sans text-xs font-bold uppercase tracking-wide text-ink/60">First schedule block</legend><div className="grid gap-3 sm:grid-cols-2"><div><label htmlFor="first-start" className="sr-only">Start time</label><input id="first-start" type="time" value={entry.start} onChange={(e)=>setEntry({...entry,start:e.target.value})} className={field} /></div><div><label htmlFor="first-end" className="sr-only">End time</label><input id="first-end" type="time" value={entry.end} onChange={(e)=>setEntry({...entry,end:e.target.value})} className={field} /></div><input aria-label="Block description" value={entry.description} onChange={(e)=>setEntry({...entry,description:e.target.value})} placeholder="What will you do?" className={`${field} sm:col-span-2`} /><select aria-label="Block category" value={entry.category} onChange={(e)=>setEntry({...entry,category:e.target.value})} className={`${field} sm:col-span-2`}>{Object.keys(CATEGORIES).map((key)=><option key={key}>{key}</option>)}</select></div></fieldset>
        <div><label htmlFor="first-habits" className="font-sans text-xs font-bold uppercase tracking-wide text-ink/60">Checklist items <span className="normal-case font-medium">(optional, one per line)</span></label><textarea id="first-habits" value={habits} onChange={(e)=>setHabits(e.target.value)} rows="3" placeholder={'Drink water\nReview today’s priorities'} className={`${field} mt-2 py-3`} /></div>
        {error && <p role="alert" className="rounded-xl bg-language/10 p-3 font-sans text-sm font-semibold text-language">{error}</p>}
        <div className="flex flex-wrap justify-end gap-2">{onCancel&&<button type="button" onClick={onCancel} className="min-h-[46px] rounded-xl px-5 font-sans text-sm font-semibold ring-1 ring-black/15">Cancel</button>}<button disabled={saving} className="flex min-h-[46px] items-center gap-2 rounded-xl bg-ink px-5 font-sans text-sm font-bold text-white disabled:opacity-60">{saving?<Loader2 className="h-4 w-4 animate-spin"/>:<Plus className="h-4 w-4"/>}{saving?'Creating…':'Create routine'}</button></div>
      </form>
    </section>
  )
}
