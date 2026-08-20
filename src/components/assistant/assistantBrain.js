// ---------------------------------------------------------------------------
// Rule-based assistant logic. Deliberately NOT an LLM call — every message is
// derived from real app state (live entry, prayer times, checklist progress),
// and the canned help text only describes capabilities the app actually has.
// ---------------------------------------------------------------------------

import { toMinutes } from '../../utils/time.js'

/**
 * Build the highest-priority proactive message for the current state, or null.
 *
 * @param {object} state
 * @param {Array}  state.timeline       merged timeline entries
 * @param {string} state.liveId         currently active entry id
 * @param {object} state.prayerTimings  { Fajr: "04:32", ... }
 * @param {number} state.completed      checklist items done
 * @param {number} state.total          checklist items total
 * @param {Date}   state.now
 * @returns {{id: string, text: string, tone: string}|null}
 */
export function buildProactiveMessage({
  timeline = [],
  liveId = null,
  prayerTimings = null,
  completed = 0,
  total = 0,
  now = new Date(),
}) {
  const nowMin = now.getHours() * 60 + now.getMinutes()

  // --- 1. Imminent optional faith event (highest priority when configured) ---
  if (prayerTimings) {
    for (const [name, hm] of Object.entries(prayerTimings)) {
      const start = toMinutes(hm)
      if (start === null) continue

      const diff = (start - nowMin + 1440) % 1440
      if (diff > 0 && diff <= 15) {
        return {
          id: `prayer-${name}-${hm}`,
          text: `🕌 ${name} is coming up in ${diff} minute${diff === 1 ? '' : 's'}.`,
          tone: 'faith',
        }
      }
    }
  }

  // --- 2. A focus block is about to start ---
  const upcoming = timeline.find((entry) => {
    const start = toMinutes(entry.start)
    if (start === null) return false
    const diff = (start - nowMin + 1440) % 1440
    return diff > 0 && diff <= 10
  })

  if (upcoming && ['Career', 'Language'].includes(upcoming.category)) {
    const start = toMinutes(upcoming.start)
    const diff = (start - nowMin + 1440) % 1440
    const label = upcoming.category === 'Career' ? 'Deep work' : 'Language practice'

    return {
      id: `upcoming-${upcoming.id}`,
      text: `${label} starts in ${diff} min — ${upcoming.description}. Worth clearing your desk now.`,
      tone: upcoming.category.toLowerCase(),
    }
  }

  // --- 3. Checklist progress nudges ---
  if (total > 0) {
    if (completed === total) {
      return {
        id: `checklist-complete-${total}`,
        text: `All ${total} boxes ticked today. That's a full sweep — well done.`,
        tone: 'health',
      }
    }

    if (completed > 0 && completed >= Math.ceil(total / 2)) {
      return {
        id: `checklist-progress-${completed}-${total}`,
        text: `You're ${completed}/${total} through today's checklist — nice pace!`,
        tone: 'health',
      }
    }
  }

  // --- 4. What's happening now (fallback, still state-derived) ---
  if (liveId) {
    const live = timeline.find((entry) => entry.id === liveId)
    if (live) {
      return {
        id: `live-${live.id}`,
        text: `Right now: ${live.description} (until ${live.end}).`,
        tone: (live.category ?? 'life').toLowerCase(),
      }
    }
  }

  return null
}

// ---- Canned help (keyword matched) ----------------------------------------
// Each answer describes only things this app genuinely does.
const HELP_RULES = [
  {
    keywords: ['edit', 'change', 'rename', 'modify'],
    answer:
      'Tap the pencil button at the top-right to manage the selected day group. You can change its name, color and weekdays, add blocks or habits, and edit or remove existing items.',
  },
  {
    keywords: ['delete', 'remove', 'undo'],
    answer:
      'Open edit mode, then use the delete control at the bottom of the routine settings. Daycraft asks for confirmation before removing the group and its contents.',
  },
  {
    keywords: ['notification', 'notifications', 'reminder', 'reminders', 'alert', 'bell'],
    answer:
      'Open the Reminders button under the day tabs. You can switch reminders on or off and set how many minutes before each block you want a heads-up (default 5). Prayer blocks get their own distinct reminder text.',
  },
  {
    keywords: ['checklist', 'check', 'tick', 'progress'],
    answer:
      "The checklist only accepts ticks for today — other days are read-only previews. Your progress saves to your account automatically and starts fresh each calendar day. The bar shows how many of today's items you've completed.",
  },
  {
    keywords: ['now', 'current', 'highlight', 'happening', 'live'],
    answer:
      'The card at the top shows what you should be doing right now, with a live progress bar and what\'s up next. On the timeline, the active block glows and carries a "Now" badge. It refreshes itself every 30 seconds.',
  },
  {
    keywords: ['prayer', 'fajr', 'dhuhr', 'asr', 'maghrib', 'isha'],
    answer:
      'Prayer times are fetched for your location each day and shown as a small line under each Faith block. If you have edited a Faith block yourself, your time stays the headline and the real time appears beneath it.',
  },
  {
    keywords: ['day', 'switch', 'tab', 'week', 'monday', 'sunday'],
    answer:
      'Use the colored group pills to move between your routines. Any group assigned to today is marked with a “Today” badge and selected automatically when you open the app.',
  },
  {
    keywords: ['logout', 'log out', 'sign out', 'account'],
    answer: 'Open your profile from the initial button in the top-right. You can sign out there, and your routines stay saved to your account.',
  },
  {
    keywords: ['tour', 'guide', 'onboarding', 'help me', 'walkthrough'],
    answer: 'Tap the "?" button next to me to replay the guided tour of the app any time.',
  },
  {
    keywords: ['quiet', 'stop', 'annoying', 'chatty', 'mute'],
    answer:
      'Fair enough — flip the "Fewer proactive tips" switch at the bottom of this panel and I will only speak when you open me.',
  },
]

const FALLBACK_ANSWER =
  "I can help with: building and editing day groups, reminders, the checklist, the live \"now\" highlight, prayer times, switching routines, and replaying the tour. Try asking about one of those."

/** Keyword-match a user question to canned help text. */
export function answerQuestion(rawInput) {
  const input = (rawInput ?? '').toLowerCase().trim()
  if (!input) return FALLBACK_ANSWER

  let best = null
  let bestScore = 0

  for (const rule of HELP_RULES) {
    const score = rule.keywords.reduce((sum, kw) => (input.includes(kw) ? sum + kw.length : sum), 0)
    if (score > bestScore) {
      bestScore = score
      best = rule
    }
  }

  return best ? best.answer : FALLBACK_ANSWER
}

export const ASSISTANT_SUGGESTIONS = [
  'How do I edit a block?',
  'How do I delete a group?',
  'Notifications',
  'What is happening now?',
]
