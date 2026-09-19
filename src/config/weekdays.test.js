import { describe, expect, it } from 'vitest'
import { WEEKDAYS, WEEKDAY_SHORTS, formatWeekdays } from './weekdays.js'

describe('weekday configuration', () => {
  it('is Sunday-first so an index matches Date.getDay()', () => {
    expect(WEEKDAYS.map((day) => day.index)).toEqual([0, 1, 2, 3, 4, 5, 6])
    expect(WEEKDAYS[0].long).toBe('Sunday')
    expect(WEEKDAYS[new Date('2026-09-18T12:00:00').getDay()].long).toBe('Friday')
  })

  it('exposes short labels in the same order', () => {
    expect(WEEKDAY_SHORTS).toEqual(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'])
  })
})

describe('formatWeekdays', () => {
  it('lists the chosen days in week order regardless of input order', () => {
    expect(formatWeekdays([5, 1, 3])).toBe('Mon · Wed · Fri')
  })

  it('collapses a full week', () => {
    expect(formatWeekdays([0, 1, 2, 3, 4, 5, 6])).toBe('Every day')
  })

  it('says so when a routine has no days', () => {
    expect(formatWeekdays([])).toBe('No weekdays yet')
    expect(formatWeekdays(undefined)).toBe('No weekdays yet')
  })

  it('ignores duplicates and out-of-range values instead of rendering undefined', () => {
    expect(formatWeekdays([1, 1, 9, -2, 2])).toBe('Mon · Tue')
    expect(formatWeekdays([42])).toBe('No weekdays yet')
  })
})
