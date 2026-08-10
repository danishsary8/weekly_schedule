// Single source of truth for the category accent system (cozy planner palette).
// Components resolve colors/labels through getCategory() rather than hardcoding.

export const CATEGORIES = {
  Faith: { label: 'Faith', color: '#C9A227', textColor: '#725C08', onColor: '#1A1A1A', token: 'faith' }, // gold
  Career: { label: 'Career', color: '#0F766E', textColor: '#0F766E', onColor: '#FFFFFF', token: 'career' }, // teal
  Health: { label: 'Health', color: '#65A30D', textColor: '#456F0A', onColor: '#1A1A1A', token: 'health' }, // sage
  Language: { label: 'Language', color: '#E11D48', textColor: '#BE123C', onColor: '#FFFFFF', token: 'language' }, // rose
  Life: { label: 'Life', color: '#8A8378', textColor: '#5F5A52', onColor: '#1A1A1A', token: 'life' }, // warm gray
  Rest: { label: 'Rest', color: '#7C8B9C', textColor: '#526171', onColor: '#1A1A1A', token: 'rest' }, // dusty blue
}

const DEFAULT_CATEGORY = { label: 'Other', color: '#8A8378', textColor: '#5F5A52', onColor: '#1A1A1A', token: 'life' }

export function getCategory(key) {
  if (key && Object.prototype.hasOwnProperty.call(CATEGORIES, key)) {
    return CATEGORIES[key]
  }
  return { ...DEFAULT_CATEGORY, label: typeof key === 'string' && key ? key : DEFAULT_CATEGORY.label }
}

