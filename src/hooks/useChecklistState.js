import { useCallback, useEffect, useState } from 'react'

/** Keeps checklist UI optimistic while treating the API as the source of truth. */
export function useChecklistState(checklist, date, save) {
  const [checkedIds, setCheckedIds] = useState(new Set())

  useEffect(() => {
    setCheckedIds(new Set(checklist?.checked_ids ?? []))
  }, [checklist])

  const toggle = useCallback(async (id) => {
    const previous = new Set(checkedIds)
    const next = new Set(checkedIds)
    next.has(id) ? next.delete(id) : next.add(id)
    setCheckedIds(next)
    try {
      const persisted = await save(date, next)
      setCheckedIds(new Set(persisted?.checked_ids ?? next))
      return { checked: next.has(id) }
    } catch (error) {
      setCheckedIds(previous)
      throw error
    }
  }, [checkedIds, date, save])

  return { checkedIds, toggle }
}
