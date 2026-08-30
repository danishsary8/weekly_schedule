import { CircleDashed, Code2, Coffee, Dumbbell, Home, Languages } from 'lucide-react'

/**
 * Maps a category `token` (see config/categories.js) to a lucide icon.
 *
 * Keys mirror the tokens in CATEGORIES / LEGACY_CATEGORIES exactly. `legacy`
 * covers retired categories and unknown keys with a neutral outline so a
 * historical entry never borrows another category's identity.
 */
const ICONS = {
  career: Code2,
  health: Dumbbell, // fitness
  language: Languages, // language study
  life: Home, // home/life
  rest: Coffee, // rest/relax
  legacy: CircleDashed, // retired or unrecognized category
}

const FALLBACK_ICON = CircleDashed

export default function CategoryIcon({ token, className = 'h-4 w-4', color = 'currentColor', strokeWidth = 2.1 }) {
  const Icon = ICONS[token] ?? FALLBACK_ICON
  return <Icon className={className} color={color} strokeWidth={strokeWidth} aria-hidden="true" />
}
