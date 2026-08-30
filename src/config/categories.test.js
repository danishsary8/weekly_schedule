import { describe, expect, it } from 'vitest'
import {
  CATEGORIES,
  CATEGORY_COLORS,
  CATEGORY_KEYS,
  LEGACY_CATEGORIES,
  getCategory,
  isLegacyCategory,
  isSelectableCategory,
} from './categories.js'

describe('category configuration', () => {
  it('offers exactly the five selectable categories', () => {
    expect(CATEGORY_KEYS).toEqual(['Career', 'Health', 'Language', 'Life', 'Rest'])
  })

  it('never offers a retired category in the selectable set', () => {
    for (const key of Object.keys(LEGACY_CATEGORIES)) {
      expect(CATEGORY_KEYS).not.toContain(key)
      expect(isSelectableCategory(key)).toBe(false)
      expect(isLegacyCategory(key)).toBe(true)
    }
  })

  it('still resolves a retired category so historical entries keep their identity', () => {
    const faith = getCategory('Faith')
    expect(faith.label).toBe('Faith')
    expect(faith.color).toBe('#C9A227')
    // Retired entries use the neutral icon rather than borrowing another
    // category's glyph.
    expect(faith.token).toBe('legacy')
  })

  it('falls back to a renderable shape for unknown keys', () => {
    const unknown = getCategory('Gardening')
    expect(unknown.label).toBe('Gardening')
    expect(unknown.color).toBeTruthy()
    expect(unknown.token).toBe('legacy')

    for (const empty of [null, undefined, '']) {
      expect(getCategory(empty).label).toBe('Other')
    }
  })

  it('derives the accent palette from the selectable set in order', () => {
    expect(CATEGORY_COLORS).toEqual(CATEGORY_KEYS.map((key) => CATEGORIES[key].color))
    expect(CATEGORY_COLORS).toHaveLength(5)
  })

  it('gives every selectable category a complete, unique accent definition', () => {
    for (const key of CATEGORY_KEYS) {
      const category = CATEGORIES[key]
      expect(category.label).toBeTruthy()
      expect(category.token).toBeTruthy()
      for (const field of ['color', 'textColor', 'onColor']) {
        expect(category[field]).toMatch(/^#[0-9A-F]{6}$/i)
      }
    }

    expect(new Set(CATEGORY_COLORS).size).toBe(CATEGORY_COLORS.length)
    expect(new Set(CATEGORY_KEYS.map((key) => CATEGORIES[key].token)).size).toBe(CATEGORY_KEYS.length)
  })

  it('is frozen so callers cannot mutate shared config', () => {
    expect(Object.isFrozen(CATEGORIES)).toBe(true)
    expect(Object.isFrozen(LEGACY_CATEGORIES)).toBe(true)
  })
})
