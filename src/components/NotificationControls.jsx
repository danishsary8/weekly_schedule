import { useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Bell, BellRing } from 'lucide-react'
import { useFocusTrap } from '../hooks/useFocusTrap.js'
import { CARD_PADDING, TIGHT_GAP } from '../config/layout.js'

function withAlpha(hex, alpha) {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function BellIcon({ active, color }) {
  const Icon = active ? BellRing : Bell
  return <Icon className="h-4 w-4" color={active ? color : 'currentColor'} strokeWidth={2} aria-hidden="true" />
}

/**
 * Notification permission banner + compact settings panel.
 * Renders nothing when the Notification API is unsupported.
 */
export default function NotificationControls({
  supported,
  permission,
  settings,
  accentColor = '#8A8378',
  accentTextColor = '#5F5A52',
  onRequestPermission,
  onToggleEnabled,
  onLeadChange,
  saveStatus = 'idle',
}) {
  const reduceMotion = useReducedMotion()
  const [panelOpen, setPanelOpen] = useState(false)
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const [permissionBusy, setPermissionBusy] = useState(false)
  const panelRef = useRef(null)
  const triggerRef = useRef(null)

  useFocusTrap(panelRef, panelOpen, { onEscape: () => setPanelOpen(false), returnFocusRef: triggerRef })

  if (!supported) return null

  const showBanner = permission === 'default' && !bannerDismissed
  const on = settings.enabled && permission === 'granted'

  return (
    <div className="relative">
      <AnimatePresence>
        {showBanner && (
          <motion.div
            key="notif-banner"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            /* Shares CARD_PADDING with every sibling dashboard card. A flat
               p-4 here read 16px against their 20/24px and showed up as a
               padding variant in the responsive audit. */
            className={`mb-4 flex flex-wrap items-center justify-between gap-3 rounded-card bg-ink ${CARD_PADDING} text-white`}
          >
            <div className="flex items-center gap-2.5">
              <BellIcon active color={accentColor} />
              <p className="font-sans text-sm font-medium">Get a quiet heads-up before each scheduled block.</p>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" disabled={permissionBusy} onClick={async () => { setPermissionBusy(true); await onRequestPermission(); setPermissionBusy(false) }} className="min-h-touch rounded-full px-4 font-sans text-sm font-bold text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-ink disabled:cursor-wait disabled:opacity-60" style={{ backgroundColor: '#FFFFFF', ['--tw-ring-color']: accentColor }}>{permissionBusy ? 'Requesting…' : 'Turn on reminders'}</button>
              <button type="button" disabled={permissionBusy} onClick={() => setBannerDismissed(true)} className="min-h-touch rounded-full px-3 font-sans text-sm text-white/70 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:opacity-50">Not now</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-end">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setPanelOpen((v) => !v)}
          aria-expanded={panelOpen}
          aria-label="Reminder settings"
          className="flex min-h-touch items-center gap-2 rounded-full border-2 px-4 font-sans text-xs font-bold text-ink/70 transition-colors hover:bg-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
          style={{ borderColor: on ? accentColor : 'rgba(26,26,26,0.15)', color: on ? accentTextColor : undefined, ['--tw-ring-color']: accentColor }}
        >
          <BellIcon active={on} color={accentColor} />
          {on ? 'Reminders on' : 'Reminders'}
        </button>
      </div>

      <AnimatePresence>
        {panelOpen && (
          <motion.div
            ref={panelRef}
            key="notif-panel"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className={`${TIGHT_GAP} rounded-card bg-paper ${CARD_PADDING} ring-1 ring-black/10`}>
              {permission === 'denied' ? (
                <p className="font-sans text-sm text-ink/70">Reminders are blocked in your browser settings. Re-enable notifications for this site to turn them on.</p>
              ) : (
                <div className="space-y-4">
                  <p className="sr-only" aria-live="polite">
                    {saveStatus === 'saving' ? 'Saving reminder settings.' : saveStatus === 'saved' ? 'Reminder settings saved.' : saveStatus === 'error' ? 'Reminder settings could not be saved.' : ''}
                  </p>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-sans text-sm font-bold text-ink">Block reminders</p>
                      <p className="font-sans text-xs text-ink/50">A heads-up before each schedule block begins.</p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={on}
                      onClick={() => onToggleEnabled(!on)}
                      className="relative flex h-11 w-14 flex-shrink-0 items-center justify-center rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
                      style={{ ['--tw-ring-color']: accentColor }}
                    >
                      <span className="relative h-6 w-11 rounded-full transition-colors" style={{ backgroundColor: on ? accentColor : 'rgba(26,26,26,0.2)' }}>
                        <motion.span className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow" animate={{ left: on ? 22 : 2 }} transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 500, damping: 30 }} />
                      </span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <label htmlFor="notif-lead" className="font-sans text-sm text-ink/80">Remind me</label>
                    <div className="flex items-center gap-2">
                      <input id="notif-lead" type="number" min={0} max={120} value={settings.leadMinutes} onChange={(e) => onLeadChange(e.target.value)} className="min-h-touch w-16 rounded-lg bg-cream/70 px-2 py-2 text-right font-sans text-sm font-semibold tabular-nums text-ink ring-1 ring-black/15 focus:outline-none focus-visible:ring-2" style={{ ['--tw-ring-color']: accentColor }} />
                      <span className="font-sans text-sm text-ink/60">min before</span>
                    </div>
                  </div>

                  {permission === 'default' && <p className="font-sans text-xs text-ink/50">Turning this on will ask your browser for notification permission.</p>}
                  {permission !== 'default' && (
                    <p className="font-sans text-xs font-medium text-ink/55" aria-hidden="true">
                      {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved ✓' : saveStatus === 'error' ? 'Save failed — try again.' : 'Changes save automatically.'}
                    </p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
