import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useChecklistState } from './useChecklistState.js'

describe('checklist persistence', () => {
  it('persists a toggle and restores the server result after refresh', async () => {
    let server = { checked_ids: [] }
    const save = vi.fn(async (_date, ids) => (server = { checked_ids: [...ids] }))
    const { result, rerender } = renderHook(
      ({ checklist }) => useChecklistState(checklist, '2026-08-07', save),
      { initialProps: { checklist: server } },
    )
    await act(async () => result.current.toggle(42))
    expect(result.current.checkedIds.has(42)).toBe(true)
    rerender({ checklist: { ...server } })
    await waitFor(() => expect(result.current.checkedIds.has(42)).toBe(true))
  })
  it('rolls back when persistence fails', async () => {
    const save = vi.fn().mockRejectedValue(new Error('offline'))
    const initialChecklist = { checked_ids: [] }
    const { result } = renderHook(() => useChecklistState(initialChecklist, '2026-08-07', save))
    await expect(act(async () => result.current.toggle(42))).rejects.toThrow('offline')
    expect(result.current.checkedIds.has(42)).toBe(false)
  })
})
