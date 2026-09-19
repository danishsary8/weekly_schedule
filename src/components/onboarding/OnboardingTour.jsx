import { useCallback, useEffect, useState } from 'react'
import Joyride, { ACTIONS, EVENTS, STATUS } from 'react-joyride'
import { useReducedMotion } from 'framer-motion'
export { hasCompletedTour, markTourComplete, tourFlagKey } from './tourState.js'

// ---------------------------------------------------------------------------
// Library choice: react-joyride over driver.js.
//
// Joyride is React-native (renders through React, so steps can be real JSX and
// restyled via props/components), handles scroll-into-view and focus trapping,
// and exposes a callback with typed events for persisting completion. driver.js
// is framework-agnostic and lighter, but it manipulates the DOM directly, which
// fights React's rendering and would need imperative refs to stay in sync with
// our animated cards.
//
// Completion persistence: a localStorage flag scoped per user id
// (`tour-done-<userId>`), NOT a backend field. Reason: the backend has no
// profile-flags column and I'm not allowed to modify it in this phase. Scoping
// by user id means a second account on the same browser still sees the tour,
// which is the behaviour that actually matters. Trade-off: a returning user on
// a brand-new browser sees it again — acceptable, and arguably useful.
// ---------------------------------------------------------------------------

const STEPS = [
  {
    target: '[data-tour="category-filter"]',
    title: 'Focus on one part of the day',
    content:
      'Every block belongs to a category. Tap one to narrow the plan to just those blocks, and "All" to bring the whole day back.',
    disableBeacon: true,
    placement: 'bottom',
  },
  {
    target: '[data-tour="today-progress"]',
    title: 'Your next small win',
    content:
      'Your next incomplete checklist item stays one tap away here, with today’s completion progress beside it.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="now-card"]',
    title: 'What to do right now',
    content:
      'This card always shows the block you should be in, how far through it you are, and what comes next. It refreshes itself — no need to reload.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="routines"]',
    title: 'Your routines live here',
    content:
      'This button names the routine you are looking at. Open it to switch routines, rename or recolour one, change the days it runs on, or start a new one.',
    placement: 'auto',
  },
  {
    target: '[data-tour="reminders"]',
    title: 'Reminders',
    content:
      'Turn on browser reminders and choose how much notice you want before each scheduled block.',
    placement: 'auto',
  },
  {
    target: '[data-tour="assistant"]',
    title: 'Your Daycraft guide',
    content:
      "I'll help you understand the planner, keep up with upcoming blocks, and celebrate checklist progress. Open the guide whenever you need a hand.",
    placement: 'top',
  },
]

export default function OnboardingTour({ run, accent = '#0F766E', onFinish }) {
  const reduceMotion = useReducedMotion()
  const [stepIndex, setStepIndex] = useState(0)

  useEffect(() => {
    if (run) setStepIndex(0)
  }, [run])

  const handleCallback = useCallback(
    (data) => {
      const { action, index, status, type } = data

      if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
        setStepIndex(index + (action === ACTIONS.PREV ? -1 : 1))
        return
      }

      // Finished, or skipped — either way don't nag again.
      if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
        onFinish?.(status === STATUS.FINISHED)
      }
    },
    [onFinish],
  )

  return (
    <Joyride
      steps={STEPS}
      run={run}
      stepIndex={stepIndex}
      continuous
      showSkipButton
      showProgress
      disableOverlayClose
      scrollOffset={90}
      disableScrolling={false}
      // Joyride's own float animation is jarring next to our card motion; we
      // rely on its fade and keep transitions short (and off for reduced motion).
      floaterProps={{
        disableAnimation: reduceMotion,
        options: {
          preventOverflow: { boundariesElement: 'viewport', padding: 16 },
        },
        styles: {
          floater: {
            filter: 'drop-shadow(0 14px 30px rgba(26,26,26,0.28))',
            maxWidth: 'calc(100vw - 24px)',
          },
        },
      }}
      locale={{ back: 'Back', close: 'Done', last: 'Finish', next: 'Next', skip: 'Skip tour' }}
      callback={handleCallback}
      styles={{
        options: {
          arrowColor: '#FFFFFF',
          backgroundColor: '#FFFFFF',
          overlayColor: 'rgba(26, 26, 26, 0.55)',
          primaryColor: accent,
          textColor: '#1A1A1A',
          width: 'min(340px, calc(100vw - 24px))',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: 20,
          padding: 20,
          fontFamily: "'Poppins', 'Inter', system-ui, sans-serif",
          borderLeft: `5px solid ${accent}`,
          boxSizing: 'border-box',
          maxHeight: 'calc(100dvh - 24px)',
          overflowY: 'auto',
          overscrollBehavior: 'contain',
        },
        tooltipTitle: {
          fontFamily: "'Caveat', cursive",
          fontSize: 26,
          fontWeight: 700,
          textAlign: 'left',
          margin: 0,
        },
        tooltipContent: {
          fontSize: 14,
          lineHeight: 1.5,
          textAlign: 'left',
          padding: '10px 0 4px',
          color: 'rgba(26,26,26,0.7)',
        },
        buttonNext: {
          backgroundColor: '#1A1A1A',
          borderRadius: 12,
          color: '#F5EDE6',
          fontSize: 13,
          fontWeight: 700,
          padding: '11px 18px',
          minHeight: 44,
          outline: 'none',
          cursor: 'pointer',
        },
        buttonBack: {
          color: 'rgba(26,26,26,0.6)',
          fontSize: 13,
          fontWeight: 600,
          marginRight: 8,
          minHeight: 44,
          padding: '8px 10px',
          cursor: 'pointer',
        },
        buttonSkip: {
          color: 'rgba(26,26,26,0.45)',
          fontSize: 12,
          fontWeight: 600,
          minHeight: 44,
          padding: '8px 10px',
          cursor: 'pointer',
        },
        tooltipFooter: {
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 6,
          marginTop: 14,
        },
        tooltipFooterSpacer: { flex: '1 1 12px' },
        spotlight: { borderRadius: 18 },
      }}
    />
  )
}
