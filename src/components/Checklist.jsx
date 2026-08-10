import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Check, Pencil, Trash2 } from 'lucide-react'
import { getCategory } from '../config/categories.js'

function withAlpha(hex, alpha) {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function AnimatedCheckbox({ color, checkColor = '#FFFFFF', checked, reduceMotion }) {
  return (
    <motion.span
      className="relative flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md border-2"
      style={{ borderColor: color, backgroundColor: checked ? color : 'transparent' }}
      animate={reduceMotion ? {} : { scale: checked ? [1, 1.28, 0.94, 1] : 1 }}
      transition={{ duration: 0.32, ease: 'easeOut', times: [0, 0.4, 0.7, 1] }}
    >
      <motion.svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" initial={false}>
        <motion.path
          d="M5 12.5l4 4L19 6.5"
          stroke={checkColor}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={false}
          animate={{ pathLength: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
          transition={reduceMotion ? { duration: 0 } : { pathLength: { duration: 0.28, ease: [0.22, 1, 0.36, 1], delay: checked ? 0.06 : 0 }, opacity: { duration: 0.1 } }}
        />
      </motion.svg>
    </motion.span>
  )
}

const listVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
}
const rowVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
}

export default function Checklist({
  items = [],
  checkedIds,
  onToggle,
  editable = true,
  accentColor = '#8A8378',
  accentTextColor = '#5F5A52',
  staggerOnMount = false,
  editMode = false,
  onSaveLabel,
  onDeleteItem,
}) {
  const reduceMotion = useReducedMotion()
  const checked = checkedIds ?? new Set()
  const total = items.length
  const done = items.reduce((n, item) => (checked.has(item.id) ? n + 1 : n), 0)
  const pct = total === 0 ? 0 : Math.round((done / total) * 100)
  const allDone = total > 0 && done === total

  const [editingId, setEditingId] = useState(null)
  const [draftLabel, setDraftLabel] = useState('')
  const [labelError, setLabelError] = useState('')
  const [savedId, setSavedId] = useState(null)
  const [savingId, setSavingId] = useState(null)
  const [celebrate, setCelebrate] = useState(false)
  const prevAllDone = useRef(allDone)

  useEffect(() => {
    if (allDone && !prevAllDone.current && editable) {
      setCelebrate(true)
      const t = setTimeout(() => setCelebrate(false), 1300)
      prevAllDone.current = allDone
      return () => clearTimeout(t)
    }
    prevAllDone.current = allDone
  }, [allDone, editable])

  const startEdit = (item) => { setEditingId(item.id); setDraftLabel(item.label); setLabelError('') }
  const cancelEdit = () => { setEditingId(null); setLabelError('') }
  const commitEdit = async (itemId) => {
    const trimmed = draftLabel.trim()
    if (!trimmed) { setLabelError('Label can’t be empty.'); return }
    setSavingId(itemId)
    const didSave = await onSaveLabel?.(itemId, trimmed)
    setSavingId(null)
    if (didSave === false) return
    setEditingId(null)
    setSavedId(itemId)
    setTimeout(() => setSavedId((cur) => (cur === itemId ? null : cur)), 1200)
  }

  return (
    <motion.section
      aria-label="Daily checklist"
      className={`relative overflow-hidden rounded-card bg-paper p-5 shadow-card ring-1 ring-black/10 transition-opacity sm:p-6 ${editable ? '' : 'opacity-60'}`}
      animate={
        celebrate && !reduceMotion
          ? { boxShadow: ['0 6px 18px -8px rgba(26,26,26,0.25)', `0 0 0 2px ${withAlpha(accentColor, 0.8)}, 0 0 30px -2px ${withAlpha(accentColor, 0.55)}`, '0 6px 18px -8px rgba(26,26,26,0.25)'] }
          : {}
      }
      transition={{ duration: 1.3, ease: 'easeInOut' }}
    >
      <span className="absolute inset-y-0 left-0 w-1.5" style={{ backgroundColor: accentColor }} aria-hidden="true" />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="display-title text-3xl text-ink">Daily Checklist</h2>
        {editMode && (
          <span className="rounded-full bg-ink px-2.5 py-1 font-sans text-[10px] font-bold uppercase tracking-wider text-white">Editing</span>
        )}
        {!editable && (
          <span className="font-sans text-xs font-semibold uppercase tracking-wide text-ink/40">Preview · not today</span>
        )}
      </div>

      {editMode && (
        <p className="mt-2 font-sans text-xs leading-relaxed text-ink/55">
          Rename each habit below. These labels repeat with this weekly routine.
        </p>
      )}

      <div className="mt-3">
        <span className="sr-only" aria-live="polite">{done} of {total} checklist items completed.</span>
        <div className="flex items-center justify-between">
          <span className="font-sans text-sm text-ink/70">
            <span className="font-bold text-ink tabular-nums">{done}</span> of <span className="tabular-nums">{total}</span> completed
          </span>
          <span className="font-sans text-xs font-semibold tabular-nums text-ink/50">{pct}%</span>
        </div>
        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-ink/10">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: accentColor }}
            initial={false}
            animate={{ width: `${pct}%` }}
            transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 180, damping: 24 }}
          />
        </div>
      </div>

      <motion.ul className={`mt-4 grid ${editMode ? 'grid-cols-1 gap-3' : 'gap-2 sm:grid-cols-2'}`} variants={listVariants} initial={staggerOnMount ? 'hidden' : 'show'} animate="show">
        {items.map((item) => {
          const cat = getCategory(item.category)
          const isChecked = checked.has(item.id)

          if (editMode) {
            const isEditingThis = editingId === item.id
            return (
              <motion.li key={item.id} variants={rowVariants}>
                <div className="flex w-full min-w-0 items-center gap-3 rounded-2xl bg-cream/65 px-3.5 py-3 ring-1 ring-black/[0.07] transition-shadow focus-within:ring-2" style={{ borderLeft: `4px solid ${cat.color}`, ['--tw-ring-color']: cat.color }}>
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl font-sans text-xs font-black" style={{ backgroundColor: withAlpha(cat.color, 0.16), color: cat.textColor }} aria-hidden="true">
                    {item.label.trim().charAt(0).toUpperCase() || '•'}
                  </span>
                  {isEditingThis ? (
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <input
                          autoFocus
                          type="text"
                          value={draftLabel}
                          onChange={(e) => setDraftLabel(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') { e.preventDefault(); commitEdit(item.id) }
                            if (e.key === 'Escape') { e.preventDefault(); cancelEdit() }
                          }}
                          aria-label="Checklist item label"
                          className="min-h-[44px] min-w-0 flex-1 rounded-lg bg-white px-3 py-2 font-sans text-[15px] text-ink ring-1 ring-black/15 focus:outline-none focus-visible:ring-2"
                          style={{ ['--tw-ring-color']: cat.color }}
                        />
                        <div className="flex gap-2 sm:flex-shrink-0">
                          <button type="button" disabled={savingId === item.id} onClick={() => commitEdit(item.id)} className="min-h-[44px] flex-1 rounded-lg px-3 font-sans text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60 sm:flex-none" style={{ backgroundColor: cat.color, color: cat.onColor, ['--tw-ring-color']: cat.color }}>{savingId === item.id ? 'Saving…' : 'Save'}</button>
                          <button type="button" disabled={savingId === item.id} onClick={cancelEdit} className="min-h-[44px] flex-1 rounded-lg px-3 font-sans text-sm text-ink/70 ring-1 ring-black/15 hover:bg-black/5 focus:outline-none focus-visible:ring-2 disabled:opacity-50 sm:flex-none">Cancel</button>
                        </div>
                      </div>
                      {labelError && <p className="mt-1 font-sans text-xs text-language">{labelError}</p>}
                    </div>
                  ) : (
                    <>
                      <div className="min-w-0 flex-1">
                        <span className="block break-words font-sans text-[15px] font-semibold leading-relaxed text-ink">{item.label}</span>
                        <span className="mt-0.5 block font-sans text-[10px] font-bold uppercase tracking-wider" style={{ color: cat.textColor }}>{cat.label}</span>
                      </div>
                      {savedId === item.id && (
                        <span aria-live="polite"
                          className="flex items-center gap-1 font-sans text-xs font-semibold"
                          style={{ color: cat.textColor }}
                        >
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                          Saved
                        </span>
                      )}
                      <button type="button" onClick={() => startEdit(item)} aria-label={`Rename ${item.label}`} title={`Rename ${item.label}`} className="flex h-11 w-11 items-center justify-center rounded-lg text-ink/60 transition-colors hover:bg-black/5 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2" style={{ ['--tw-ring-color']: cat.color }}><Pencil className="h-4 w-4" /></button>
                      <button type="button" onClick={() => { if (window.confirm(`Delete “${item.label}”?`)) onDeleteItem?.(item.id) }} aria-label={`Delete ${item.label}`} title={`Delete ${item.label}`} className="flex h-11 w-11 items-center justify-center rounded-lg text-language transition-colors hover:bg-language/10 focus:outline-none focus-visible:ring-2"><Trash2 className="h-4 w-4" /></button>
                    </>
                  )}
                </div>
              </motion.li>
            )
          }

          return (
            <motion.li key={item.id} variants={rowVariants}>
              <motion.button
                type="button"
                onClick={editable ? () => onToggle?.(item.id) : undefined}
                aria-pressed={isChecked}
                disabled={!editable}
                animate={reduceMotion ? {} : { scale: isChecked ? [1, 1.015, 1] : 1 }}
                transition={{ duration: 0.26, ease: 'easeOut' }}
                whileHover={editable && !reduceMotion ? { x: 2 } : undefined}
                className={`flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left ring-1 transition-[background-color,opacity,transform] focus:outline-none focus-visible:ring-2 ${editable ? 'cursor-pointer hover:bg-white active:scale-[0.99]' : 'cursor-default'} ${isChecked ? 'bg-black/[0.025] opacity-65 ring-transparent' : 'bg-cream/55 ring-black/[0.06]'}`}
                style={{ ['--tw-ring-color']: cat.color }}
              >
                <AnimatedCheckbox color={cat.color} checkColor={cat.onColor} checked={isChecked} reduceMotion={reduceMotion} />
                <span className={`font-sans text-[15px] font-medium transition-colors ${isChecked ? 'text-ink/40 line-through' : 'text-ink'}`}>{item.label}</span>
              </motion.button>
            </motion.li>
          )
        })}
      </motion.ul>

      {items.length === 0 && (
        <p className="mt-4 rounded-xl bg-cream/60 p-4 text-center font-sans text-sm text-ink/60 ring-1 ring-black/5">
          No checklist items are configured for this day.
        </p>
      )}

      <AnimatePresence>
        {allDone && editable && (
          <motion.p key="alldone" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }} transition={{ duration: 0.3 }} className="mt-3 font-display text-2xl" style={{ color: accentTextColor }}>
            All done for today — nice work!
          </motion.p>
        )}
      </AnimatePresence>
    </motion.section>
  )
}
