import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import toast from 'react-hot-toast'
import { CalendarPlus, Plus, Settings2, Sunrise } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore.js'
import { useApiResource } from '../hooks/useScheduleData.js'
import { useChecklistState } from '../hooks/useChecklistState.js'
import { useDayCelebration } from '../hooks/useDayCelebration.js'
import {
  createChecklistItem,
  createTimelineEntry,
  deleteChecklistItem,
  deleteDayGroup,
  deleteTimelineEntry,
  fetchChecklist,
  fetchDayGroups,
  fetchNotificationSettings,
  fetchPrayerTimes,
  fetchSchedule,
  fetchTodaySchedule,
  getBrowserCoords,
  saveChecklist,
  saveNotificationSettings,
  toDateString,
  updateChecklistItem,
  updateDayGroup,
  updateTimelineEntry,
} from '../api/services.js'
import { getLiveEntryId } from '../utils/time.js'
import {
  fireNotification,
  getDueEntries,
  getPermission,
  isNotificationSupported,
  minutesUntilStart,
  requestPermission,
} from '../utils/notifications.js'
import { trackNotificationPermission } from '../analytics.js'
import {
  BLOCK_GAP,
  COLUMN_GAP,
  DURATION,
  EASE,
  PAGE_GUTTER,
  PAGE_VERTICAL,
  SECTION_GAP,
  TIGHT_GAP,
  TOUCH_TARGET,
  TOUCH_TARGET_LG,
} from '../config/layout.js'
import DashboardHeader from '../components/DashboardHeader.jsx'
import DaySwitcher from '../components/DaySwitcher.jsx'
import DayGroupBuilder from '../components/DayGroupBuilder.jsx'
import Checklist from '../components/Checklist.jsx'
import Timeline from '../components/Timeline.jsx'
import CategoryFilter, { ALL_CATEGORIES } from '../components/schedule/CategoryFilter.jsx'
import BlockDetailSheet from '../components/schedule/BlockDetailSheet.jsx'
import BlockFormSheet from '../components/schedule/BlockFormSheet.jsx'
import RoutineSettingsSheet from '../components/schedule/RoutineSettingsSheet.jsx'
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx'
import NowCard from '../components/NowCard.jsx'
import TodayProgressCard from '../components/TodayProgressCard.jsx'
import NotificationControls from '../components/NotificationControls.jsx'
import Assistant from '../components/assistant/Assistant.jsx'
import ErrorState from '../components/ui/ErrorState.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import { ChecklistSkeleton, NowCardSkeleton, Skeleton, TimelineSkeleton } from '../components/ui/Skeleton.jsx'
import EmailVerificationBanner from '../components/EmailVerificationBanner.jsx'
import { hasCompletedTour, markTourComplete } from '../components/onboarding/tourState.js'

const OnboardingTour = lazy(() => import('../components/onboarding/OnboardingTour.jsx'))
const EMPTY = []

/** Designed first-paint state — replaces the previous bare "Loading…" text. */
function DashboardSkeleton() {
  return (
    <div className={`min-h-viewport bg-cream ${PAGE_GUTTER} ${PAGE_VERTICAL}`}>
      {/* <main> keeps the landmark stable between the loading and loaded views. */}
      <main className="mx-auto w-full max-w-5xl">
        <Skeleton className="h-10 w-3/4 max-w-sm" />
        <Skeleton className={`${TIGHT_GAP} h-4 w-40`} />
        <div className={`${SECTION_GAP} flex gap-2`}>
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-11 w-24 rounded-full" />
          ))}
        </div>
        <div className={SECTION_GAP}>
          <NowCardSkeleton />
        </div>
        <div className={`${SECTION_GAP} grid grid-cols-1 items-start ${COLUMN_GAP} lg:grid-cols-[380px_minmax(0,1fr)]`}>
          <ChecklistSkeleton />
          <TimelineSkeleton rows={5} />
        </div>
      </main>
      <span className="sr-only" role="status">Loading your routines…</span>
    </div>
  )
}

export default function DashboardPage() {
  const reduceMotion = useReducedMotion()
  const user = useAuthStore((state) => state.user)
  const navigate = useNavigate()
  const userId = user?.id
  const [now, setNow] = useState(() => new Date())
  const [selectedId, setSelectedId] = useState(null)
  const [building, setBuilding] = useState(false)
  const [runTour, setRunTour] = useState(false)
  // Sheet-driven editing. `activeEntry` is the block whose details are open;
  // `blockForm` holds the create/edit target (null entry means "create").
  const [activeEntry, setActiveEntry] = useState(null)
  const [blockForm, setBlockForm] = useState(null)
  const [routineSheetOpen, setRoutineSheetOpen] = useState(false)
  const [confirmDeleteEntry, setConfirmDeleteEntry] = useState(null)
  const [confirmDeleteRoutine, setConfirmDeleteRoutine] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState(ALL_CATEGORIES)
  const date = toDateString(now)
  const weekday = now.getDay()
  const groups = useApiResource(fetchDayGroups, { cacheKey: 'day-groups', userId })
  const today = useApiResource(() => fetchTodaySchedule(now), { cacheKey: `today:${date}`, userId, deps: [date] })
  const list = groups.data ?? EMPTY
  const todayIds = (today.data?.groups ?? EMPTY).map((group) => group.id)

  useEffect(() => {
    if (!selectedId && list.length) setSelectedId(todayIds[0] ?? list[0].id)
    if (selectedId && !list.some((group) => group.id === selectedId)) setSelectedId(list[0]?.id ?? null)
  }, [list, selectedId, todayIds.join(',')])

  const selected = useApiResource(() => fetchSchedule(selectedId), { cacheKey: selectedId ? `group:${selectedId}` : null, userId, deps: [selectedId], enabled: !!selectedId })
  const group = selected.data
  const timeline = group?.timeline ?? EMPTY
  const items = group?.checklist ?? EMPTY
  const viewingToday = todayIds.includes(selectedId)
  const visibleTimeline = useMemo(
    () => (categoryFilter === ALL_CATEGORIES ? timeline : timeline.filter((entry) => entry.category === categoryFilter)),
    [timeline, categoryFilter],
  )
  const checklist = useApiResource(() => fetchChecklist(date), { cacheKey: `checklist:${date}`, userId, deps: [date] })
  const { checkedIds: checked, toggle: toggleChecklist } = useChecklistState(checklist.data, date, saveChecklist)

  // Completion count for today's own checklist drives both the ring and the
  // once-a-day celebration. Derived from data already returned by the API.
  const completedToday = useMemo(
    () => items.reduce((count, item) => count + (checked.has(item.id) ? 1 : 0), 0),
    [items, checked],
  )
  const { celebrating, dismiss: endCelebration } = useDayCelebration({
    completed: completedToday,
    total: items.length,
    date,
    userId,
    enabled: viewingToday,
  })

  const toggle = async (id) => {
    // Suppress the generic toast when this tap finishes the day — the
    // celebration is the feedback, and stacking both feels noisy.
    const finishesDay = viewingToday && items.length > 0 && !checked.has(id) && completedToday + 1 === items.length
    try {
      const result = await toggleChecklist(id)
      if (!finishesDay) toast.success(result.checked ? 'Task completed' : 'Task marked incomplete')
    } catch {
      toast.error('Could not save. Reconnect and try again.')
    }
  }

  const refresh = async () => { await groups.refetch(); await selected.refetch(); today.revalidate(); checklist.revalidate() }
  const act = async (fn, success) => {
    try { await fn(); await refresh(); toast.success(success); return true } catch (error) { toast.error(error?.response?.data?.error?.message || 'Could not save. Please try again.'); return false }
  }
  const saveEntry = (id, patch) => act(() => updateTimelineEntry(id, patch), 'Block updated')
  const saveLabel = (id, label) => act(() => updateChecklistItem(id, label), 'Habit updated')

  /** Open the block form. Passing null creates; passing an entry edits it. */
  const openBlockForm = (entry) => {
    setActiveEntry(null)
    setBlockForm({ entry })
  }

  const submitBlockForm = async (draft) => {
    if (!group) return false
    return blockForm?.entry
      ? saveEntry(blockForm.entry.id, draft)
      : act(() => createTimelineEntry(group.id, draft), 'Block added')
  }

  const deleteEntry = async (entry) => {
    const ok = await act(() => deleteTimelineEntry(entry.id), 'Block deleted')
    setConfirmDeleteEntry(null)
    setActiveEntry(null)
    return ok
  }

  const deleteRoutine = async () => {
    if (!group) return false
    const ok = await act(() => deleteDayGroup(group.id), 'Routine deleted')
    setConfirmDeleteRoutine(false)
    setRoutineSheetOpen(false)
    setSelectedId(null)
    return ok
  }
  const liveTimeline = today.data?.timeline ?? EMPTY
  const liveId = getLiveEntryId(liveTimeline, now)

  useEffect(() => { const timer = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(timer) }, [])
  const settings = useApiResource(fetchNotificationSettings, { cacheKey: 'notif-settings', userId })
  const supported = isNotificationSupported()
  const permission = getPermission()
  const notif = { enabled: settings.data?.enabled ?? false, leadMinutes: settings.data?.minutes_before ?? 5 }
  const persist = async (patch) => {
    const optimistic = { ...settings.data, ...patch }
    settings.setData(optimistic)
    try { settings.setData(await saveNotificationSettings({ enabled: optimistic.enabled, minutesBefore: optimistic.minutes_before })) } catch { toast.error('Could not save reminder settings.') }
  }
  const fired = useRef({ date, ids: new Set() })
  useEffect(() => {
    if (fired.current.date !== date) fired.current = { date, ids: new Set() }
    if (!supported || !notif.enabled || permission !== 'granted') return
    for (const entry of getDueEntries(liveTimeline, now, notif.leadMinutes)) {
      if (fired.current.ids.has(entry.id)) continue
      fireNotification(entry, minutesUntilStart(entry, now) ?? 0)
      fired.current.ids.add(entry.id)
    }
  }, [date, now, liveTimeline, notif.enabled, notif.leadMinutes, permission, supported])

  const [coords, setCoords] = useState(null)
  useEffect(() => { getBrowserCoords().then(setCoords) }, [])
  const prayer = useApiResource(() => fetchPrayerTimes(date, coords), { cacheKey: `prayer:${date}`, userId, deps: [date, coords?.latitude, coords?.longitude] })
  useEffect(() => { if (list.length && !hasCompletedTour(userId)) { const timer = setTimeout(() => setRunTour(true), 800); return () => clearTimeout(timer) } }, [list.length, userId])
  const dateLabel = useMemo(() => now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }), [date])
  const verified = Boolean(user?.is_email_verified)

  if (groups.loading && groups.data === null) return <DashboardSkeleton />
  if (groups.error && groups.data === null) {
    return (
      <div className={`min-h-viewport bg-cream ${PAGE_GUTTER} ${PAGE_VERTICAL}`}>
        <div className="mx-auto w-full max-w-3xl">
          <ErrorState error={groups.error} onRetry={groups.refetch} />
        </div>
      </div>
    )
  }

  // --- First-run: no routines yet ------------------------------------------
  if (list.length === 0 && !building) {
    return (
      <div className={`min-h-viewport bg-cream ${PAGE_GUTTER} ${PAGE_VERTICAL}`}>
        <div className="mx-auto w-full max-w-3xl">
          <DashboardHeader dayName="Your first routine" dayType="Start here" dateLabel={dateLabel} isViewingToday accentColor="#0F766E" userName={user?.name} onOpenProfile={() => navigate('/profile')} />
          {!verified && <div className={SECTION_GAP}><EmailVerificationBanner /></div>}
          <div className={`${SECTION_GAP} rounded-card bg-ink p-6 text-white sm:p-8`}>
            <p className="eyebrow-stamp text-white/55">A blank canvas</p>
            <h2 className={`${TIGHT_GAP} display-title text-4xl sm:text-5xl`}>Start with one simple block.</h2>
            <p className={`${TIGHT_GAP} max-w-xl font-sans text-sm leading-relaxed text-white/70`}>
              Name your routine and add what you want to do first. Today is already selected, and everything can be changed later.
            </p>
            <button
              data-tour="create-group"
              disabled={!verified}
              onClick={() => setBuilding(true)}
              className={`${TOUCH_TARGET_LG} ${BLOCK_GAP} flex items-center gap-2 rounded-xl bg-cream px-5 font-sans text-sm font-bold text-ink disabled:cursor-not-allowed disabled:opacity-45`}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              {verified ? 'Build my first routine' : 'Verify email to create a routine'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (list.length === 0 && building) {
    return (
      <div className={`min-h-viewport bg-cream ${PAGE_GUTTER} ${PAGE_VERTICAL}`}>
        <DayGroupBuilder onComplete={async (id) => { await groups.refetch(); setSelectedId(id); setBuilding(false); toast.success('Your first routine is ready') }} />
      </div>
    )
  }

  const color = group?.color ?? '#0F766E'
  const dayName = group?.weekdays?.includes(weekday) ? 'Today’s routine' : 'Routine preview'
  const transition = reduceMotion ? { duration: 0 } : { duration: DURATION.page, ease: EASE }
  const loadingGroup = selected.loading && selected.data === null

  return (
    <div className="min-h-viewport bg-cream text-ink">
      <main className={`mx-auto w-full max-w-5xl ${PAGE_GUTTER} ${PAGE_VERTICAL}`}>
        <DashboardHeader dayName={dayName} dayType={group?.name ?? 'Routine'} dateLabel={dateLabel} isViewingToday={viewingToday} accentColor={color} userName={user?.name} onOpenProfile={() => navigate('/profile')} />

        {!verified && <div className={BLOCK_GAP}><EmailVerificationBanner /></div>}

        <div className={BLOCK_GAP} data-tour="day-switcher">
          <DaySwitcher groups={list} selectedId={selectedId} onSelect={setSelectedId} todayGroupIds={todayIds} />
        </div>

        {/*
          Routine-management actions on their own always-visible row. Both open a
          sheet rather than toggling a page-wide mode: the previous "edit mode"
          hid every action behind a toggle users had to find first.
        */}
        {verified && (
          <div className={`${TIGHT_GAP} flex flex-wrap items-center gap-2`}>
            <button
              type="button"
              onClick={() => setRoutineSheetOpen(true)}
              data-tour="edit-toggle"
              className={`${TOUCH_TARGET} inline-flex items-center gap-2 rounded-full border-2 border-ink px-4 font-sans text-sm font-bold text-ink transition-colors hover:bg-ink hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-cream`}
              style={{ ['--tw-ring-color']: color }}
            >
              <Settings2 className="h-4 w-4" aria-hidden="true" />
              Edit routine
            </button>
            <button
              type="button"
              onClick={() => setBuilding((value) => !value)}
              className={`${TOUCH_TARGET} inline-flex items-center gap-2 rounded-full px-4 font-sans text-sm font-bold text-ink/65 ring-1 ring-black/15 transition-colors hover:bg-white focus:outline-none focus-visible:ring-2`}
              style={{ ['--tw-ring-color']: color }}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              {building ? 'Close' : 'New routine'}
            </button>
          </div>
        )}

        {building && (
          <div className={BLOCK_GAP}>
            <DayGroupBuilder compact onCancel={() => setBuilding(false)} onComplete={async (id) => { await groups.refetch(); setSelectedId(id); setBuilding(false) }} />
          </div>
        )}



        {/* Nothing scheduled for today — an invitation, not a warning. */}
        {!today.data?.assigned && (
          <div className={BLOCK_GAP}>
            <EmptyState
              icon={Sunrise}
              accent={color}
              title="Nothing scheduled for today"
              body="Today isn’t part of any routine yet. Preview one below, or add this weekday to a routine in edit mode."
              actionLabel={verified ? 'Create a routine for today' : undefined}
              onAction={verified ? () => setBuilding(true) : undefined}
              compact
            />
          </div>
        )}

        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={selectedId} initial={reduceMotion ? false : { opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={reduceMotion ? undefined : { opacity: 0, x: -8 }} transition={transition}>
            {viewingToday && (
              <div className={SECTION_GAP} data-tour="today-progress">
                {loadingGroup ? (
                  <NowCardSkeleton />
                ) : (
                  <TodayProgressCard
                    items={items}
                    checkedIds={checked}
                    accentColor={color}
                    onToggle={toggle}
                    celebrating={celebrating}
                    onCelebrationEnd={endCelebration}
                  />
                )}
              </div>
            )}

            <div className={SECTION_GAP} data-tour="now-card">
              {loadingGroup ? <NowCardSkeleton /> : (
                <NowCard schedule={viewingToday ? liveTimeline : timeline} liveId={viewingToday ? liveId : null} isViewingToday={viewingToday} dayName={dayName} dayType={group?.name} nowTs={now.getTime()} />
              )}
            </div>

            <div className={`${SECTION_GAP} grid grid-cols-1 items-start ${COLUMN_GAP} lg:grid-cols-[380px_minmax(0,1fr)]`}>
              <aside className={`space-y-6 lg:sticky lg:top-6`}>
                <div data-tour="checklist">
                  {loadingGroup ? (
                    <ChecklistSkeleton />
                  ) : (
                    <Checklist
                      items={items}
                      checkedIds={viewingToday ? checked : new Set()}
                      onToggle={toggle}
                      editable={viewingToday}
                      accentColor={color}
                      canManage={verified}
                      onSaveLabel={saveLabel}
                      onDeleteItem={(id) => act(() => deleteChecklistItem(id), 'Habit deleted')}
                      onAddItem={(label) => group && act(() => createChecklistItem(group.id, label), 'Habit added')}
                    />
                  )}
                </div>
                <div data-tour="reminders">
                  <NotificationControls
                    supported={supported}
                    permission={permission}
                    settings={notif}
                    accentColor={color}
                    onRequestPermission={async () => { const nextPermission = await requestPermission(); trackNotificationPermission(nextPermission); if (nextPermission === 'granted') persist({ enabled: true }) }}
                    onToggleEnabled={(value) => persist({ enabled: value })}
                    onLeadChange={(value) => persist({ minutes_before: Number(value) })}
                  />
                </div>
              </aside>

              <div>
                {loadingGroup ? (
                  <TimelineSkeleton rows={5} />
                ) : timeline.length === 0 ? (
                  <EmptyState
                    icon={CalendarPlus}
                    accent={color}
                    title="No blocks in this routine yet"
                    body="Add your first schedule block — a start time, an end time, and what you’ll be doing."
                    actionLabel={verified ? 'Add a block' : undefined}
                    onAction={verified ? () => openBlockForm(null) : undefined}
                  />
                ) : (
                  <>
                    <CategoryFilter
                      schedule={timeline}
                      value={categoryFilter}
                      onChange={setCategoryFilter}
                      className={BLOCK_GAP}
                    />
                    <div className={BLOCK_GAP}>
                      <Timeline
                        schedule={visibleTimeline}
                        liveId={viewingToday ? liveId : null}
                        onSelectEntry={setActiveEntry}
                        emptyMessage={`No ${categoryFilter} blocks in this routine.`}
                        prayerTimings={prayer.data?.timings}
                        prayerSource={prayer.data?.source}
                      />
                    </div>
                    {verified && (
                      <button
                        type="button"
                        onClick={() => openBlockForm(null)}
                        className={`${TOUCH_TARGET} ${BLOCK_GAP} ml-10 inline-flex items-center gap-2 rounded-xl px-4 font-sans text-sm font-bold text-ink/70 ring-1 ring-black/15 transition-colors hover:bg-white focus:outline-none focus-visible:ring-2 sm:ml-16`}
                        style={{ ['--tw-ring-color']: color }}
                      >
                        <Plus className="h-4 w-4" aria-hidden="true" />
                        Add a block
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        <footer className="mt-12 text-center font-sans text-xs text-ink/40">
          {list.length} routine group{list.length === 1 ? '' : 's'} · synced to your account
        </footer>
      </main>

      {/* --- Sheets and confirmations, rendered once outside the scroll flow --- */}
      <BlockDetailSheet
        entry={activeEntry}
        onClose={() => setActiveEntry(null)}
        onEdit={() => openBlockForm(activeEntry)}
        onDelete={() => { setConfirmDeleteEntry(activeEntry); setActiveEntry(null) }}
        canModify={verified}
        prayerTimings={prayer.data?.timings}
      />

      <BlockFormSheet
        open={Boolean(blockForm)}
        entry={blockForm?.entry ?? null}
        onClose={() => setBlockForm(null)}
        onSubmit={submitBlockForm}
      />

      {group && (
        <RoutineSettingsSheet
          open={routineSheetOpen}
          group={group}
          onClose={() => setRoutineSheetOpen(false)}
          onSave={(patch) => act(() => updateDayGroup(group.id, patch), 'Routine updated')}
          onRequestDelete={() => setConfirmDeleteRoutine(true)}
        />
      )}

      <ConfirmDialog
        open={Boolean(confirmDeleteEntry)}
        onClose={() => setConfirmDeleteEntry(null)}
        onConfirm={() => confirmDeleteEntry && deleteEntry(confirmDeleteEntry)}
        title="Delete this block?"
        description={confirmDeleteEntry ? `“${confirmDeleteEntry.description}” will be removed from this routine.` : undefined}
        confirmLabel="Delete block"
        cancelLabel="Keep it"
      />

      <ConfirmDialog
        open={confirmDeleteRoutine}
        onClose={() => setConfirmDeleteRoutine(false)}
        onConfirm={deleteRoutine}
        title="Delete this routine?"
        description={group ? `“${group.name}”, its ${timeline.length} block${timeline.length === 1 ? '' : 's'} and ${items.length} habit${items.length === 1 ? '' : 's'} will be permanently removed.` : undefined}
        confirmLabel="Delete routine"
        cancelLabel="Keep it"
      />

      <Assistant accent={color} timeline={liveTimeline} liveId={liveId} prayerTimings={prayer.data?.timings} completed={checked.size} total={items.length} isViewingToday={viewingToday} onReplayTour={() => setRunTour(true)} />
      {runTour && <Suspense fallback={null}><OnboardingTour run accent={color} onFinish={() => { setRunTour(false); markTourComplete(userId) }} /></Suspense>}
    </div>
  )
}
