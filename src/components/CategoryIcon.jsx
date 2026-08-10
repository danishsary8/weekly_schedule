import { Moon, Code2, Dumbbell, Languages, Home, Coffee } from 'lucide-react'

// Map each category token to a clean lucide icon.
const ICONS = {
  faith: Moon, // crescent — prayer/faith
  career: Code2,
  health: Dumbbell, // fitness
  language: Languages, // language study
  life: Home, // home/life
  rest: Coffee, // rest/relax
}

export default function CategoryIcon({ token, className = 'h-4 w-4', color = 'currentColor', strokeWidth = 2.1 }) {
  const Icon = ICONS[token] ?? Coffee
  return <Icon className={className} color={color} strokeWidth={strokeWidth} aria-hidden="true" />
}
