// ---------------------------------------------------------------------------
// Hex colour helpers.
//
// Exists because routine accents became user-chosen. Two jobs:
//
//   1. Normalise whatever a user types into the exact shape the API accepts.
//      Both DayGroup requests validate `^#[0-9A-Fa-f]{6}$`, so `#abc` — which
//      every browser and designer treats as valid — would 422 unless expanded
//      first. Normalising in one place keeps that rule out of the components.
//
//   2. Decide whether text sitting on an accent should be dark or light. With a
//      fixed five-colour palette every accent was dark enough for white text and
//      the components hardcoded '#FFFFFF'. A user can now pick pale yellow, so
//      that assumption has to be computed instead of assumed.
// ---------------------------------------------------------------------------

const SHORTHAND = /^#?([0-9a-f])([0-9a-f])([0-9a-f])$/i
const FULL = /^#?([0-9a-f]{6})$/i

/** Text colours used when nothing else is specified. Mirrors the design system. */
export const INK = '#1A1A1A'
export const PAPER_WHITE = '#FFFFFF'

/**
 * Coerce user input to `#RRGGBB` (uppercase), or null when it isn't a colour.
 *
 * Accepts `abc`, `#abc`, `aabbcc`, `#AABBCC` and surrounding whitespace.
 * Rejects named colours, `rgb()`, and 4/8-digit hex with alpha — the API stores
 * six digits and nothing else.
 *
 * @param {unknown} input
 * @returns {string|null}
 */
export function normalizeHex(input) {
  if (typeof input !== 'string') return null

  const trimmed = input.trim()

  const shorthand = SHORTHAND.exec(trimmed)
  if (shorthand) {
    const [, r, g, b] = shorthand
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase()
  }

  const full = FULL.exec(trimmed)
  if (full) return `#${full[1]}`.toUpperCase()

  return null
}

/** True when `input` can be stored as a colour. */
export function isHex(input) {
  return normalizeHex(input) !== null
}

/**
 * WCAG relative luminance (0 = black, 1 = white).
 *
 * @param {string} hex
 * @returns {number|null} null when `hex` isn't a colour.
 */
export function relativeLuminance(hex) {
  const normalized = normalizeHex(hex)
  if (!normalized) return null

  const linear = [1, 3, 5].map((offset) => {
    const channel = parseInt(normalized.slice(offset, offset + 2), 16) / 255
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  })

  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]
}

/**
 * WCAG contrast ratio between two colours, 1–21.
 *
 * @returns {number|null} null when either colour is unreadable input.
 */
export function contrastRatio(a, b) {
  const first = relativeLuminance(a)
  const second = relativeLuminance(b)
  if (first === null || second === null) return null

  const lighter = Math.max(first, second)
  const darker = Math.min(first, second)

  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Pick the more readable of two text colours for a given background.
 *
 * Used anywhere a routine accent is a fill behind a label. Falls back to ink for
 * invalid input, which is the safe choice on this app's cream and white cards.
 *
 * @param {string} background
 * @param {{dark?: string, light?: string}} [options]
 * @returns {string}
 */
export function contrastTextOn(background, { dark = INK, light = PAPER_WHITE } = {}) {
  const againstDark = contrastRatio(background, dark)
  const againstLight = contrastRatio(background, light)
  if (againstDark === null || againstLight === null) return dark

  return againstLight >= againstDark ? light : dark
}
