import { useCallback, useEffect, useRef, useState } from 'react'
import { readCache, writeCache } from '../api/offlineCache.js'

/**
 * Generic fetch hook with loading / error / stale-cache handling.
 *
 * Behaviour:
 *  - Hydrates instantly from the offline cache when available (no blank flash).
 *  - Marks data `stale` if the network refresh fails but cache existed.
 *  - Exposes `refetch` for retry buttons.
 *
 * @param {Function} fetcher  async () => data
 * @param {object}   options  { cacheKey, userId, deps, enabled }
 */
export function useApiResource(fetcher, { cacheKey, userId, deps = [], enabled = true } = {}) {
  const initialCache = cacheKey ? readCache(userId, cacheKey) : null

  const [data, setDataState] = useState(initialCache)
  const [loading, setLoading] = useState(enabled && initialCache === null)
  const [error, setError] = useState(null)
  const [stale, setStale] = useState(false)

  // Avoid setState after unmount / out-of-order responses.
  const requestId = useRef(0)
  const dataRef = useRef(initialCache)
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const setData = useCallback((value) => {
    setDataState((current) => {
      const next = typeof value === 'function' ? value(current) : value
      dataRef.current = next
      return next
    })
  }, [])

  useEffect(() => {
    requestId.current += 1
    const next = cacheKey ? readCache(userId, cacheKey) : null
    dataRef.current = next
    setDataState(next)
    setError(null)
    setStale(false)
    setLoading(enabled && next === null)
  }, [cacheKey, userId, enabled])

  const load = useCallback(
    async ({ silent = false } = {}) => {
      if (!enabled) return

      const id = ++requestId.current
      if (!silent) setLoading(dataRef.current === null)
      setError(null)

      try {
        const result = await fetcher()
        if (!mounted.current || id !== requestId.current) return

        setData(result)
        setStale(false)
        if (cacheKey) writeCache(userId, cacheKey, result)
      } catch (err) {
        if (!mounted.current || id !== requestId.current) return

        setError(err)
        // If we have something to show, keep showing it and flag staleness.
        setStale(dataRef.current !== null)
      } finally {
        if (mounted.current && id === requestId.current) setLoading(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [enabled, cacheKey, userId, setData, ...deps],
  )

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load])

  return {
    data,
    setData,
    loading,
    error,
    stale,
    refetch: () => load({ silent: false }),
    revalidate: () => load({ silent: true }),
  }
}
