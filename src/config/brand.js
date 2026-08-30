// ---------------------------------------------------------------------------
// Brand constants that belong to neither the category system nor the layout
// rhythm. Kept separate so neither of those modules grows a second concern.
// ---------------------------------------------------------------------------

// Each hex is named exactly once. The sequences below compose from these, so a
// palette tweak is a one-line change and the two boot surfaces cannot drift.
const AMBER = '#C9A227' // the standalone `notice` accent
const TEAL = '#0F766E'
const SAGE = '#65A30D'
const ROSE = '#E11D48'

/**
 * Bar sequence for the full-screen boot loader.
 * @type {ReadonlyArray<string>}
 */
export const BRAND_PULSE_COLORS = Object.freeze([AMBER, TEAL, SAGE, ROSE])

/**
 * Shorter dot sequence for the splash screen, where three reads calmer than
 * four at the small size used there.
 * @type {ReadonlyArray<string>}
 */
export const BRAND_PULSE_COLORS_COMPACT = Object.freeze([AMBER, TEAL, ROSE])
