// ---------------------------------------------------------------------------
// Single source of truth for the category accent system (cozy planner palette).
//
// Two tiers, deliberately separate:
//
//   CATEGORIES        Selectable. Everything a user can choose lives here, so
//                     pickers, filters, legends and the celebration palette all
//                     derive from this one object and can never drift apart.
//
//   LEGACY_CATEGORIES Retired. No longer offered anywhere in the UI and
//                     rejected by the API for new writes, but still resolvable
//                     so entries created before retirement keep their original
//                     label and accent instead of collapsing into "Other".
//
// Components resolve through getCategory() rather than hardcoding a hex, label
// or icon. Adding or retiring a category should require editing only this file
// (plus the matching backend enum, which mirrors these keys).
// ---------------------------------------------------------------------------

/**
 * @typedef {object} Category
 * @property {string} label     Human-readable name shown in the UI.
 * @property {string} color     Accent hex. Used for fills, strips and dots.
 * @property {string} textColor Accent-derived text hex, WCAG-safe on cream.
 * @property {string} onColor   Text hex used *on top of* `color`.
 * @property {string} token     Icon/Tailwind token. See CategoryIcon.jsx.
 */

/**
 * The five selectable categories, in display order.
 * @type {Readonly<Record<string, Category>>}
 */
export const CATEGORIES = Object.freeze({
  Career: { label: 'Career', color: '#0F766E', textColor: '#0F766E', onColor: '#FFFFFF', token: 'career' }, // teal
  Health: { label: 'Health', color: '#65A30D', textColor: '#456F0A', onColor: '#1A1A1A', token: 'health' }, // sage
  Language: { label: 'Language', color: '#E11D48', textColor: '#BE123C', onColor: '#FFFFFF', token: 'language' }, // rose
  Life: { label: 'Life', color: '#8A8378', textColor: '#5F5A52', onColor: '#1A1A1A', token: 'life' }, // warm gray
  Rest: { label: 'Rest', color: '#7C8B9C', textColor: '#526171', onColor: '#1A1A1A', token: 'rest' }, // dusty blue
})

/**
 * Retired categories, kept resolvable for historical entries only.
 *
 * `Faith` was retired during the category cleanup. Its gold accent survives as
 * the standalone `notice` token in tailwind.config.js, which several unrelated
 * banners depend on, so the hex is intentionally still referenced here for the
 * benefit of pre-existing rows.
 *
 * @type {Readonly<Record<string, Category>>}
 */
export const LEGACY_CATEGORIES = Object.freeze({
  Faith: { label: 'Faith', color: '#C9A227', textColor: '#725C08', onColor: '#1A1A1A', token: 'legacy' },
})

/** Shown when a category key matches neither tier (e.g. a hand-edited row). */
const DEFAULT_CATEGORY = Object.freeze({
  label: 'Other',
  color: '#8A8378',
  textColor: '#5F5A52',
  onColor: '#1A1A1A',
  token: 'legacy',
})

/**
 * Ordered selectable keys. Use this for pickers, filters and legends so a
 * retired category can never reappear in a list.
 * @type {ReadonlyArray<string>}
 */
export const CATEGORY_KEYS = Object.freeze(Object.keys(CATEGORIES))

/**
 * Accent colors of the selectable set, in display order. Used by the
 * celebration palette so it always reflects the live category system.
 * @type {ReadonlyArray<string>}
 */
export const CATEGORY_COLORS = Object.freeze(Object.values(CATEGORIES).map((category) => category.color))

/** True when `key` is a category a user is allowed to choose. */
export function isSelectableCategory(key) {
  return typeof key === 'string' && Object.prototype.hasOwnProperty.call(CATEGORIES, key)
}

/** True when `key` is a retired category that only historical entries can hold. */
export function isLegacyCategory(key) {
  return typeof key === 'string' && Object.prototype.hasOwnProperty.call(LEGACY_CATEGORIES, key)
}

/**
 * Resolve any stored category key to a renderable Category. Never throws and
 * never returns undefined, so callers can read `.color` / `.token` directly.
 *
 * @param {string|null|undefined} key
 * @returns {Category}
 */
export function getCategory(key) {
  if (isSelectableCategory(key)) return CATEGORIES[key]
  if (isLegacyCategory(key)) return LEGACY_CATEGORIES[key]

  return { ...DEFAULT_CATEGORY, label: typeof key === 'string' && key ? key : DEFAULT_CATEGORY.label }
}
