import { describe, expect, it } from 'vitest'
import { contrastRatio, contrastTextOn, isHex, normalizeHex, relativeLuminance } from './color.js'
import { CATEGORY_COLORS } from '../config/categories.js'

describe('normalizeHex', () => {
  it('expands shorthand to the six digits the API requires', () => {
    // Both DayGroup requests validate ^#[0-9A-Fa-f]{6}$ — shorthand would 422.
    expect(normalizeHex('#abc')).toBe('#AABBCC')
    expect(normalizeHex('abc')).toBe('#AABBCC')
  })

  it('adds the missing hash and uppercases', () => {
    expect(normalizeHex('7c3aed')).toBe('#7C3AED')
    expect(normalizeHex('#7c3aed')).toBe('#7C3AED')
  })

  it('tolerates surrounding whitespace from a paste', () => {
    expect(normalizeHex('  #7C3AED \n')).toBe('#7C3AED')
  })

  it('rejects anything the API would not store', () => {
    for (const input of ['', '#', '#ab', '#abcd', '#abcdefff', 'rebeccapurple', 'rgb(1,2,3)', '#12345g', null, undefined, 0x7c3aed]) {
      expect(normalizeHex(input)).toBeNull()
    }
  })

  it('is idempotent, so re-normalising a stored value is safe', () => {
    expect(normalizeHex(normalizeHex('#abc'))).toBe('#AABBCC')
  })
})

describe('isHex', () => {
  it('agrees with normalizeHex', () => {
    expect(isHex('#abc')).toBe(true)
    expect(isHex('nope')).toBe(false)
  })
})

describe('relativeLuminance', () => {
  it('anchors at black and white', () => {
    expect(relativeLuminance('#000000')).toBe(0)
    expect(relativeLuminance('#FFFFFF')).toBeCloseTo(1, 5)
  })

  it('returns null for invalid input rather than NaN', () => {
    expect(relativeLuminance('nope')).toBeNull()
  })
})

describe('contrastRatio', () => {
  it('reports the known 21:1 extreme', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 4)
  })

  it('is symmetric', () => {
    expect(contrastRatio('#0F766E', '#FFFFFF')).toBeCloseTo(contrastRatio('#FFFFFF', '#0F766E'), 10)
  })
})

describe('contrastTextOn', () => {
  it('chooses white on a dark accent and ink on a pale one', () => {
    expect(contrastTextOn('#0F766E')).toBe('#FFFFFF')
    expect(contrastTextOn('#FFF3B0')).toBe('#1A1A1A')
  })

  it('falls back to ink for unusable input', () => {
    expect(contrastTextOn(undefined)).toBe('#1A1A1A')
  })

  it('always beats the alternative it rejected', () => {
    // The guarantee the callers rely on: whatever comes back is the more
    // readable of the two, for every colour including user-chosen ones.
    for (const accent of [...CATEGORY_COLORS, '#FFFFFF', '#000000', '#FFF3B0', '#7C3AED', '#808080']) {
      const chosen = contrastTextOn(accent)
      const rejected = chosen === '#FFFFFF' ? '#1A1A1A' : '#FFFFFF'
      expect(contrastRatio(accent, chosen)).toBeGreaterThanOrEqual(contrastRatio(accent, rejected))
    }
  })
})
