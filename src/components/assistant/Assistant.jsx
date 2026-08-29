import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { HelpCircle, MessageCircle, Send, X } from 'lucide-react'
import RobotIcon from './RobotIcon.jsx'
import { ASSISTANT_SUGGESTIONS, answerQuestion, buildProactiveMessage } from './assistantBrain.js'
import { useFocusTrap } from '../../hooks/useFocusTrap.js'

const QUIET_KEY = 'assistant-quiet'

function loadQuiet() {
  try {
    return localStorage.getItem(QUIET_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * Floating assistant. Fixed bottom-right, respects safe-area insets, never
 * covers core UI (panel is a compact anchored card, not a takeover).
 */
export default function Assistant({
  accent = '#0F766E',
  timeline = [],
  liveId = null,
  prayerTimings = null,
  completed = 0,
  total = 0,
  isViewingToday = true,
  onReplayTour,
}) {
  const reduceMotion = useReducedMotion()
  const [open, setOpen] = useState(false)
  const [quiet, setQuiet] = useState(loadQuiet)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [pendingTip, setPendingTip] = useState(null)

  const lastTipId = useRef(null)
  const inputRef = useRef(null)
  const panelRef = useRef(null)
  const logRef = useRef(null)
  const fabRef = useRef(null)

  const closeAssistant = useCallback(() => {
    setOpen(false)
  }, [])

  useFocusTrap(panelRef, open, { onEscape: closeAssistant, returnFocusRef: fabRef })

  useEffect(() => {
    try {
      localStorage.setItem(QUIET_KEY, quiet ? '1' : '0')
    } catch {
      /* non-fatal */
    }
  }, [quiet])

  // ---- Proactive tips, derived from real state ----------------------------
  useEffect(() => {
    // Only speak about today; other tabs are previews where nothing is "live".
    if (!isViewingToday) return

    const tick = () => {
      const tip = buildProactiveMessage({
        timeline,
        liveId,
        prayerTimings,
        completed,
        total,
        now: new Date(),
      })

      // Never repeat the same message twice in a row.
      if (!tip || tip.id === lastTipId.current) return

      lastTipId.current = tip.id

      if (quiet) return

      setPendingTip(tip)
      setMessages((prev) => [...prev, { from: 'bot', text: tip.text, id: `${tip.id}-${Date.now()}` }])
    }

    tick()
    const timer = setInterval(tick, 60000)
    return () => clearInterval(timer)
  }, [timeline, liveId, prayerTimings, completed, total, quiet, isViewingToday])

  // Clear the FAB badge once the panel is opened.
  useEffect(() => {
    if (open) setPendingTip(null)
  }, [open])

  // Autofocus the field and keep the log scrolled to the newest message.
  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open || !logRef.current || messages.length === 0) return
    const latest = messages[messages.length - 1]
    const node = logRef.current.querySelector(`[data-message-id="${latest.id}"]`)
    if (!node) return
    logRef.current.scrollTo({
      top: Math.max(0, node.offsetTop - logRef.current.offsetTop - 10),
      behavior: reduceMotion ? 'auto' : 'smooth',
    })
  }, [messages, open, reduceMotion])

  const ask = useCallback((question) => {
    const trimmed = question.trim()
    if (!trimmed) return

    const answer = answerQuestion(trimmed)
    setMessages((prev) => [
      ...prev,
      { from: 'user', text: trimmed, id: `u-${Date.now()}` },
      { from: 'bot', text: answer, id: `b-${Date.now()}` },
    ])
    setInput('')
  }, [])

  return (
    <div
      className="pointer-events-none fixed bottom-0 right-0 z-40 flex max-w-full flex-col items-end gap-3 p-4 sm:p-6"
      style={{
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)',
        paddingRight: 'calc(env(safe-area-inset-right, 0px) + 1rem)',
      }}
    >
      {/* ---- Panel ---- */}
      <AnimatePresence>
        {open && (
          <motion.section
            ref={panelRef}
            key="assistant-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Routine assistant"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-auto flex max-h-[calc(100dvh-6.5rem)] w-[min(24rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-card bg-paper shadow-lift ring-1 ring-black/10 sm:max-h-[min(78dvh,42rem)]"
          >
            <header
              className="flex flex-shrink-0 items-center gap-3 px-4 py-3.5 text-white"
              style={{ backgroundColor: '#1A1A1A' }}
            >
              <span
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: accent }}
              >
                <RobotIcon className="h-5 w-5" accent="#1A1A1A" awake={!quiet} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-sans text-body font-bold leading-tight">Daycraft guide</p>
                <p className="mt-0.5 font-sans text-label text-white/65">
                  {quiet ? 'Quiet mode — tips paused' : 'Here to keep you on track'}
                </p>
              </div>
              <button
                type="button"
                onClick={closeAssistant}
                aria-label="Close assistant"
                className="flex h-11 w-11 items-center justify-center rounded-xl text-white/70 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            {/* messages */}
            <div ref={logRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-white px-4 py-4 [scrollbar-gutter:stable]" aria-live="polite">
              {messages.length === 0 && (
                <div className="rounded-2xl bg-cream/70 p-4 text-center ring-1 ring-black/5">
                  <MessageCircle className="mx-auto h-5 w-5" style={{ color: accent }} aria-hidden="true" />
                  <p className="mt-2 font-sans text-sm font-semibold text-ink/75">How can I help?</p>
                  <p className="mt-1 font-sans text-xs leading-relaxed text-ink/55">Ask about your schedule, checklist, reminders, or what to do now.</p>
                </div>
              )}

              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  data-message-id={message.id}
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22 }}
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 font-sans text-body-sm leading-relaxed shadow-sm ${
                    message.from === 'user'
                      ? 'ml-auto bg-ink text-white'
                      : 'bg-cream text-ink ring-1 ring-black/5'
                  }`}
                  style={message.from === 'bot' ? { borderLeft: `3px solid ${accent}` } : undefined}
                >
                  <span className={`mb-1 block text-label font-bold uppercase tracking-wider ${message.from === 'user' ? 'text-white/55' : 'text-ink/45'}`}>
                    {message.from === 'user' ? 'You' : 'Daycraft guide'}
                  </span>
                  <span className="break-words">{message.text}</span>
                </motion.div>
              ))}
            </div>

            {/* suggestions */}
            <div className="flex-shrink-0 border-t border-black/5 bg-paper px-4 pb-3 pt-3">
              <p className="eyebrow mb-2 text-ink/40">Quick questions</p>
              <div className="grid grid-cols-2 gap-2">
              {ASSISTANT_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => ask(suggestion)}
                  className="inline-flex min-h-touch items-center justify-center rounded-xl bg-cream px-2.5 text-center font-sans text-label font-semibold leading-tight text-ink/70 ring-1 ring-black/10 transition-colors hover:bg-black/5 focus:outline-none focus-visible:ring-2"
                  style={{ ['--tw-ring-color']: accent }}
                >
                  {suggestion}
                </button>
              ))}
              </div>
            </div>

            {/* input */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                ask(input)
              }}
              className="flex flex-shrink-0 items-center gap-2 border-t border-black/5 bg-white px-3 py-3"
            >
              <label htmlFor="assistant-input" className="sr-only">
                Ask the assistant
              </label>
              <input
                ref={inputRef}
                id="assistant-input"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask how something works…"
                className="min-h-touch-lg min-w-0 flex-1 rounded-xl bg-cream px-3.5 font-sans text-body-sm text-ink ring-1 ring-black/15 placeholder:text-ink/45 focus:outline-none focus-visible:ring-2"
                style={{ ['--tw-ring-color']: accent }}
              />
              <button
                type="submit"
                disabled={!input.trim()}
                aria-label="Send message"
                className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:cursor-not-allowed disabled:opacity-40"
                style={{ backgroundColor: accent, ['--tw-ring-color']: accent }}
              >
                <Send className="h-4 w-4" />
              </button>
            </form>

            {/* quiet toggle */}
            <div className="flex flex-shrink-0 items-center justify-between gap-3 border-t border-black/5 bg-cream/60 px-4 py-2.5">
              <label htmlFor="assistant-quiet" className="font-sans text-xs font-semibold text-ink/70">
                Fewer proactive tips
              </label>
              <button
                id="assistant-quiet"
                type="button"
                role="switch"
                aria-checked={quiet}
                onClick={() => setQuiet((v) => !v)}
                className="relative flex h-11 w-14 flex-shrink-0 items-center justify-center rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
                style={{ ['--tw-ring-color']: accent }}
              >
                <span className="relative h-6 w-11 rounded-full transition-colors" style={{ backgroundColor: quiet ? accent : 'rgba(26,26,26,0.2)' }}>
                  <motion.span className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow" animate={{ left: quiet ? 22 : 2 }} transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 500, damping: 30 }} />
                </span>
              </button>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ---- FAB row ---- */}
      <div className="pointer-events-auto flex items-center gap-2">
        {/* Replay tour */}
        {onReplayTour && (
          <button
            type="button"
            onClick={() => {
              closeAssistant()
              window.requestAnimationFrame(() => onReplayTour())
            }}
            aria-label="Replay the guided tour"
            title="Replay tour"
            data-tour="replay"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-paper text-ink/70 shadow-card ring-1 ring-black/10 transition-colors hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
            style={{ ['--tw-ring-color']: accent }}
          >
            <HelpCircle className="h-5 w-5" />
          </button>
        )}

        {/* Speech bubble badge */}
        <AnimatePresence>
          {pendingTip && !open && (
            <motion.button
              key="assistant-bubble"
              type="button"
              onClick={() => setOpen(true)}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 10, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 6, scale: 0.95 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              /* min-h keeps this tappable badge at the 44px accessibility floor. */
              className="flex min-h-touch max-w-[min(15rem,60vw)] items-center rounded-2xl bg-ink px-3.5 py-2.5 text-left font-sans text-xs font-medium leading-snug text-white shadow-lift focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
              style={{ borderRight: `4px solid ${accent}`, ['--tw-ring-color']: accent }}
            >
              {pendingTip.text}
            </motion.button>
          )}
        </AnimatePresence>

        {/* Main FAB */}
        <motion.button
          ref={fabRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close assistant' : 'Open assistant'}
          aria-expanded={open}
          data-tour="assistant"
          whileHover={reduceMotion ? undefined : { scale: 1.06 }}
          whileTap={reduceMotion ? undefined : { scale: 0.94 }}
          className="relative flex h-14 w-14 items-center justify-center rounded-full shadow-lift focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
          style={{ backgroundColor: '#1A1A1A', ['--tw-ring-color']: accent }}
        >
          <RobotIcon className="h-7 w-7" accent={accent} awake={!quiet} />

          {/* unread dot */}
          {pendingTip && !open && (
            <motion.span
              className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full ring-2 ring-cream"
              style={{ backgroundColor: accent }}
              animate={reduceMotion ? {} : { scale: [1, 1.25, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </motion.button>
      </div>
    </div>
  )
}
