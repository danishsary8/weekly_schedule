// ---------------------------------------------------------------------------
// Daycraft layout rhythm — the single spacing/radius/motion scale.
//
// Step 1 of the UI overhaul established one scale so screens stop drifting into
// ad-hoc values (mt-3 / mt-5 / mt-7 / mt-10 / p-7 were all in use). Everything
// below maps onto Tailwind's default 4px-based steps: 4, 8, 12, 16, 24, 32.
//
// Import these instead of hand-writing spacing so every screen shares a rhythm.
// ---------------------------------------------------------------------------

/** Vertical gap between major sections of a page. 24px mobile → 32px desktop. */
export const SECTION_GAP = 'mt-6 sm:mt-8'

/** Vertical gap between closely-related blocks (a banner under a header). 16px. */
export const BLOCK_GAP = 'mt-4'

/** Tight gap for a caption/control sitting under its owner. 8px. */
export const TIGHT_GAP = 'mt-2'

/** Standard card padding. 20px mobile → 24px desktop. */
export const CARD_PADDING = 'p-5 sm:p-6'

/** Roomier padding for hero/feature cards. 24px mobile → 32px desktop. */
export const CARD_PADDING_LG = 'p-6 sm:p-8'

/** Page gutters. 16px mobile → 24px desktop; never edge-to-edge on phones. */
export const PAGE_GUTTER = 'px-4 sm:px-6'

/**
 * Page top/bottom padding. Bottom clears the fixed assistant FAB (56px button +
 * 16px inset + breathing room) so nothing is ever hidden behind it on mobile.
 */
export const PAGE_VERTICAL = 'pt-6 pb-32 sm:pt-10 lg:pb-16'

/** Grid gap between the sidebar and timeline columns. 24px. */
export const COLUMN_GAP = 'gap-6'

/** Minimum interactive size. Anything tappable must reach 44px (WCAG 2.5.5). */
export const TOUCH_TARGET = 'min-h-[44px]'

/** Primary action height — slightly larger than the 44px floor. */
export const TOUCH_TARGET_LG = 'min-h-[48px]'

// ---- Motion -----------------------------------------------------------------
// Shared easing/durations so animations feel like one product. All celebration
// and feedback motion stays at or under 400ms per the interaction spec.

/** Standard ease-out curve used across cards, rows and page transitions. */
export const EASE = [0.22, 1, 0.36, 1]

export const DURATION = {
  /** Instant feedback: checkbox pops, row pulses. */
  feedback: 0.28,
  /** Standard element entrance/exit. */
  base: 0.34,
  /** Page/day transitions. */
  page: 0.24,
  /** The one-per-day 100% celebration. */
  celebrate: 1.1,
}

/** Spring used for tactile, physical-feeling controls. */
export const SPRING = { type: 'spring', stiffness: 300, damping: 24 }
