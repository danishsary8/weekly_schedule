import { useReducedMotion } from 'framer-motion'

/** Design-system skeleton block (warm tone, not a generic grey shimmer). */
export function Skeleton({ className = '' }) {
  const reduceMotion = useReducedMotion()

  return (
    <div
      className={`rounded-xl bg-ink/[0.07] ${reduceMotion ? '' : 'animate-pulse'} ${className}`}
      aria-hidden="true"
    />
  )
}

/** Placeholder matching the Checklist card's shape. */
export function ChecklistSkeleton() {
  return (
    <section className="relative overflow-hidden rounded-card bg-paper p-5 shadow-card ring-1 ring-black/10 sm:p-6">
      <span className="absolute inset-y-0 left-0 w-1.5 bg-ink/10" aria-hidden="true" />
      <Skeleton className="h-8 w-48" />
      <Skeleton className="mt-4 h-2 w-full" />
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-11" />
        ))}
      </div>
    </section>
  )
}

/** Placeholder matching the Timeline's shape. */
export function TimelineSkeleton({ rows = 6 }) {
  return (
    <section>
      <Skeleton className="mb-4 h-8 w-40" />
      <div className="relative space-y-3 pl-14 sm:pl-16">
        <span className="absolute bottom-3 left-rail top-3 w-0.5 -translate-x-1/2 rounded-full bg-ink/10 sm:left-rail-sm" aria-hidden="true" />
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    </section>
  )
}

/** Placeholder for the "happening now" hero. */
/** Padding mirrors NowCard exactly, so no shift when the real card swaps in. */
export function NowCardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-card bg-ink/[0.06] p-5 ring-1 ring-black/5 sm:p-6">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-3 h-7 w-3/4" />
      <Skeleton className="mt-3 h-2 w-full" />
      <Skeleton className="mt-4 h-5 w-1/2" />
    </div>
  )
}
