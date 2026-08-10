import { describe, expect, it } from 'vitest'
import { getLiveEntryId, toMinutes } from './time.js'

describe('live schedule time logic', () => {
  it('uses an exclusive end boundary for daytime blocks', () => {
    const entries = [{ id: 7, start: '09:00', end: '10:00' }]
    expect(getLiveEntryId(entries, new Date(2026, 0, 1, 9, 30))).toBe(7)
    expect(getLiveEntryId(entries, new Date(2026, 0, 1, 10, 0))).toBeNull()
  })
  it('handles overnight blocks on both sides of midnight', () => {
    const entries = [{ id: 9, start: '22:30', end: '04:40' }]
    expect(getLiveEntryId(entries, new Date(2026, 0, 1, 23, 0))).toBe(9)
    expect(getLiveEntryId(entries, new Date(2026, 0, 2, 4, 39))).toBe(9)
    expect(getLiveEntryId(entries, new Date(2026, 0, 2, 4, 40))).toBeNull()
  })
  it('rejects malformed clock values', () => {
    expect(toMinutes('24:00')).toBeNull()
    expect(toMinutes('9:00')).toBeNull()
  })
})
