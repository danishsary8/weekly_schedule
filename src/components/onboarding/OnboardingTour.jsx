import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

export { hasCompletedTour, markTourComplete, resetTour, tourFlagKey } from './tourState.js'

export const TOUR_STEPS = [
  {
    id: 'routines',
    target: '[data-tour="routines"]',
    title: 'Your Routines',
    content: 'Switch between routines, adjust their schedules, or build a new one.',
  },
  {
    id: 'category-filter',
    target: '[data-tour="category-filter"]',
    title: 'Category Filter',
    content: 'Filter your schedule blocks by category to focus on one part of your day.',
  },
  {
    id: 'routine-block',
    target: '[data-tour="routine-block"]',
    fallbackTarget: '[data-tour="checklist"]',
    title: 'Routine Block',
    content: 'Tap any block in your schedule to view its details or make adjustments.',
  },
  {
    id: 'mark-complete',
    target: '[data-tour="checklist"]',
    fallbackTarget: '[data-tour="today-progress"]',
    title: 'Mark as Complete',
    content: 'Tap the circle next to any habit to mark it complete for today.',
  },
  {
    id: 'profile',
    target: '[data-tour="profile"]',
    title: 'Profile & Settings',
    content: 'Manage your account, customize settings, or replay this tour anytime.',
  },
]

function findTargetElement(step) {
  if (!step) return null
  if (step.target) {
    const el = document.querySelector(step.target)
    if (el) return el
  }
  if (step.fallbackTarget) {
    const el = document.querySelector(step.fallbackTarget)
    if (el) return el
  }
  return null
}

export default function OnboardingTour({
  run = false,
  accent = '#0F766E',
  onFinish,
  steps = TOUR_STEPS,
}) {
  const reduceMotion = useReducedMotion()
  const [stepIndex, setStepIndex] = useState(0)
  const [targetRect, setTargetRect] = useState(null)
  const [tooltipPos, setTooltipPos] = useState({ top: 100, left: 16, width: 320 })

  const currentStep = steps[stepIndex] || steps[0]
  const isFirst = stepIndex === 0
  const isLast = stepIndex === steps.length - 1

  const handleFinish = useCallback(
    (completed = false) => {
      onFinish?.(completed)
    },
    [onFinish],
  )

  const handleNext = () => {
    if (isLast) {
      handleFinish(true)
    } else {
      setStepIndex((idx) => Math.min(steps.length - 1, idx + 1))
    }
  }

  const handleBack = () => {
    setStepIndex((idx) => Math.max(0, idx - 1))
  }

  const handleSkip = () => {
    handleFinish(false)
  }

  // Reset to first step whenever run becomes true
  useEffect(() => {
    if (run) setStepIndex(0)
  }, [run])

  // Keyboard navigation & dismissal
  useEffect(() => {
    if (!run) return
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleSkip()
      } else if (e.key === 'ArrowRight') {
        handleNext()
      } else if (e.key === 'ArrowLeft' && !isFirst) {
        handleBack()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [run, stepIndex, isFirst, isLast])

  // Measure target and calculate clamped tooltip coordinates
  const updatePosition = useCallback(() => {
    if (!run || !currentStep) return

    const el = findTargetElement(currentStep)
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const tooltipWidth = Math.min(340, Math.max(280, viewportWidth - 32))
    const estTooltipHeight = 175
    const edgeMargin = 16
    const pad = 6

    if (!el) {
      setTargetRect(null)
      setTooltipPos({
        top: Math.max(edgeMargin, (viewportHeight - estTooltipHeight) / 2),
        left: Math.max(edgeMargin, (viewportWidth - tooltipWidth) / 2),
        width: tooltipWidth,
      })
      return
    }

    const rect = el.getBoundingClientRect()
    setTargetRect(rect)

    // Calculate vertical position (prefer below, flip above if overflowing bottom)
    const spaceBelow = viewportHeight - (rect.bottom + pad)
    const spaceAbove = rect.top - pad

    let top
    if (spaceBelow >= estTooltipHeight + edgeMargin || spaceBelow >= spaceAbove) {
      top = rect.bottom + pad + 10
    } else {
      top = Math.max(edgeMargin, rect.top - pad - estTooltipHeight - 10)
    }

    // Clamp vertical position so it never overflows viewport
    if (top + estTooltipHeight > viewportHeight - edgeMargin) {
      top = Math.max(edgeMargin, viewportHeight - estTooltipHeight - edgeMargin)
    }

    // Calculate horizontal center aligned with target
    const targetCenter = rect.left + rect.width / 2
    const idealLeft = targetCenter - tooltipWidth / 2

    // Strictly clamp horizontal position within viewport (works safely down to 320px)
    const clampedLeft = Math.max(
      edgeMargin,
      Math.min(idealLeft, viewportWidth - tooltipWidth - edgeMargin),
    )

    setTooltipPos({
      top: Math.round(top),
      left: Math.round(clampedLeft),
      width: tooltipWidth,
    })
  }, [run, currentStep])

  // Scroll target element into view smoothly when step changes
  useEffect(() => {
    if (!run || !currentStep) return
    const el = findTargetElement(currentStep)
    if (el) {
      el.scrollIntoView({
        behavior: reduceMotion ? 'auto' : 'smooth',
        block: 'nearest',
        inline: 'nearest',
      })
    }
  }, [run, stepIndex, currentStep, reduceMotion])

  // Recalculate position on scroll, resize, and target updates
  useEffect(() => {
    if (!run) return
    updatePosition()

    const onScrollResize = () => updatePosition()
    window.addEventListener('resize', onScrollResize, { passive: true })
    window.addEventListener('scroll', onScrollResize, { passive: true })

    // Secondary poll to lock position once smooth scrolling finishes
    const timer = setTimeout(updatePosition, 320)
    return () => {
      window.removeEventListener('resize', onScrollResize)
      window.removeEventListener('scroll', onScrollResize)
      clearTimeout(timer)
    }
  }, [run, stepIndex, updatePosition])

  if (!run) return null

  const pad = 6
  const radius = 16
  const transition = {
    duration: reduceMotion ? 0 : 0.22,
    ease: [0.22, 1, 0.36, 1],
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Product tour"
      className="fixed inset-0 z-[9990] overflow-hidden"
    >
      {/* SVG Mask Spotlight Overlay */}
      <svg
        className="fixed inset-0 h-full w-full pointer-events-none"
        style={{ zIndex: 9991 }}
        aria-hidden="true"
      >
        <defs>
          <mask id="daycraft-spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {targetRect && (
              <motion.rect
                fill="black"
                initial={false}
                animate={{
                  x: targetRect.left - pad,
                  y: targetRect.top - pad,
                  width: Math.max(0, targetRect.width + pad * 2),
                  height: Math.max(0, targetRect.height + pad * 2),
                  rx: radius,
                  ry: radius,
                }}
                transition={transition}
              />
            )}
          </mask>
        </defs>

        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(26, 26, 26, 0.55)"
          mask="url(#daycraft-spotlight-mask)"
          className="pointer-events-auto cursor-pointer"
          onClick={handleSkip}
        />
      </svg>

      {/* Target focus ring */}
      {targetRect && (
        <motion.div
          className="pointer-events-none fixed z-[9992] ring-2"
          style={{ ['--tw-ring-color']: accent }}
          initial={false}
          animate={{
            top: targetRect.top - pad,
            left: targetRect.left - pad,
            width: Math.max(0, targetRect.width + pad * 2),
            height: Math.max(0, targetRect.height + pad * 2),
            borderRadius: radius,
          }}
          transition={transition}
          aria-hidden="true"
        />
      )}

      {/* Tooltip Card */}
      <motion.div
        className="fixed z-[9995] pointer-events-auto rounded-2xl bg-white p-5 shadow-card ring-1 ring-black/10"
        style={{
          borderLeft: `4px solid ${accent}`,
          filter: 'drop-shadow(0 14px 28px rgba(26, 26, 26, 0.2))',
          width: `${tooltipPos.width}px`,
        }}
        initial={false}
        animate={{
          top: tooltipPos.top,
          left: tooltipPos.left,
        }}
        transition={transition}
      >
        {/* Header: step counter & close */}
        <div className="flex items-center justify-between gap-2">
          <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-ink/45">
            {`Step ${stepIndex + 1} of ${steps.length}`}
          </span>
          <button
            type="button"
            onClick={handleSkip}
            aria-label="Close tour"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-ink/40 transition-colors hover:bg-black/5 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Content with smooth 180ms fade/slide transition */}
        <motion.div
          key={currentStep?.id || stepIndex}
          initial={reduceMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.18, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Title: Script heading */}
          <h3 className="mt-1 font-display text-2xl font-bold leading-tight text-ink">
            {currentStep.title}
          </h3>

          {/* Content: single short sentence */}
          <p className="mt-1.5 font-sans text-sm leading-relaxed text-ink/75">
            {currentStep.content}
          </p>
        </motion.div>

        {/* Footer: skip & next/back controls */}
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-black/[0.06] pt-3">
          <button
            type="button"
            onClick={handleSkip}
            className="font-sans text-xs font-semibold text-ink/50 transition-colors hover:text-ink focus:outline-none focus-visible:underline"
          >
            Skip tour
          </button>

          <div className="flex items-center gap-1.5">
            {!isFirst && (
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex min-h-[36px] items-center gap-1 rounded-xl px-2.5 font-sans text-xs font-semibold text-ink/65 transition-colors hover:bg-black/5 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
              >
                <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
                Back
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex min-h-[36px] items-center gap-1 rounded-xl bg-ink px-3.5 font-sans text-xs font-bold text-cream transition-colors hover:bg-black focus:outline-none focus-visible:ring-2 focus-visible:ring-career focus-visible:ring-offset-2"
            >
              {isLast ? 'Got it' : 'Next'}
              {!isLast && <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
