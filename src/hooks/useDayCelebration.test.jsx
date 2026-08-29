import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useDayCelebration } from './useDayCelebration.js'

const DATE = '2026-08-06'

function setup(initial) {
  return renderHook((props) => useDayCelebration(props), { initialProps: initial })
}

describe('useDayCelebration', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('celebrates when the final item is checked', () => {
    const { result, rerender } = setup({ completed: 1, total: 2, date: DATE, userId: 7 })
    expect(result.current.celebrating).toBe(false)

    act(() => rerender({ completed: 2, total: 2, date: DATE, userId: 7 }))
    expect(result.current.celebrating).toBe(true)
  })

  it('stays calm when a already-complete day simply loads', () => {
    const { result } = setup({ completed: 3, total: 3, date: DATE, userId: 7 })
    // First settled observation establishes a baseline; no burst on arrival.
    expect(result.current.celebrating).toBe(false)
  })

  it('does not celebrate the same day twice', () => {
    const first = setup({ completed: 1, total: 2, date: DATE, userId: 7 })
    act(() => first.rerender({ completed: 2, total: 2, date: DATE, userId: 7 }))
    expect(first.result.current.celebrating).toBe(true)

    // Un-check then re-complete: the achievement was already awarded today.
    act(() => first.rerender({ completed: 1, total: 2, date: DATE, userId: 7 }))
    act(() => first.result.current.dismiss())
    act(() => first.rerender({ completed: 2, total: 2, date: DATE, userId: 7 }))
    expect(first.result.current.celebrating).toBe(false)
  })

  it('celebrates again on a new calendar date', () => {
    const { result, rerender } = setup({ completed: 1, total: 2, date: DATE, userId: 7 })
    act(() => rerender({ completed: 2, total: 2, date: DATE, userId: 7 }))
    expect(result.current.celebrating).toBe(true)

    act(() => rerender({ completed: 1, total: 2, date: '2026-08-07', userId: 7 }))
    act(() => rerender({ completed: 2, total: 2, date: '2026-08-07', userId: 7 }))
    expect(result.current.celebrating).toBe(true)
  })

  it('never celebrates an empty day', () => {
    const { result, rerender } = setup({ completed: 0, total: 0, date: DATE, userId: 7 })
    act(() => rerender({ completed: 0, total: 0, date: DATE, userId: 7 }))
    expect(result.current.celebrating).toBe(false)
  })

  it('stays quiet while previewing another day', () => {
    const { result, rerender } = setup({ completed: 1, total: 2, date: DATE, userId: 7, enabled: false })
    act(() => rerender({ completed: 2, total: 2, date: DATE, userId: 7, enabled: false }))
    expect(result.current.celebrating).toBe(false)
  })

  it('isolates the once-per-day marker per account', () => {
    const first = setup({ completed: 1, total: 2, date: DATE, userId: 7 })
    act(() => first.rerender({ completed: 2, total: 2, date: DATE, userId: 7 }))
    expect(first.result.current.celebrating).toBe(true)

    const second = setup({ completed: 1, total: 2, date: DATE, userId: 99 })
    act(() => second.rerender({ completed: 2, total: 2, date: DATE, userId: 99 }))
    expect(second.result.current.celebrating).toBe(true)
  })
})
