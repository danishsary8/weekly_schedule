import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import toast from 'react-hot-toast'
import { CalendarPlus, Plus, Sunrise } from 'lucide-react'
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
import { describeApiError } from '../utils/apiError.js'
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
import DayGroupBuilder from '../components/DayGroupBuilder.jsx'
import Checklist from '../components/Checklist.jsx'
import Timeline from '../components/Timeline.jsx'
import CategoryFilter, { ALL_CATEGORIES } from '../components/schedule/CategoryFilter.jsx'
import RoutineContextBar from '../components/schedule/RoutineContextBar.jsx'
import BlockDetailSheet from '../components/schedule/BlockDetailSheet.jsx'
import BlockFormSheet from '../components/schedule/BlockFormSheet.jsx'
import RoutineSettingsSheet from '../components/schedule/RoutineSettingsSheet.jsx'
import RoutineManagerSheet from '../components/schedule/RoutineManagerSheet.jsx'
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
  // Routine chrome: a list sheet for switching, and a settings sheet targeting
  // one routine. Both hold a routine *summary* from the groups list rather than
  // the fully-loaded routine, so a routine the user has not switched to is still
  // editable. Only one is ever open — see RoutineManagerSheet for why.
  const [routinesOpen, setRoutinesOpen] = useState(false)
  const [editingRoutine, setEditingRoutine] = useState(null)
  const [confirmDeleteEntry, setConfirmDeleteEntry] = useState(null)
  const [confirmDeleteRoutine, setConfirmDeleteRoutine] = useState(null)
  const routinesButtonRef = useRef(null)
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
    } catch (error) {
      toast.error(describeApiError(error, 'Could not save that tick. Please try again.'))
    }
  }

  const refresh = async () => { await groups.refetch(); await selected.refetch(); today.revalidate(); checklist.revalidate() }
  const act = async (fn, success) => {
    try { await fn(); await refresh(); toast.success(success); return true } catch (error) { toast.error(describeApiError(error, 'Could not save. Please try again.')); return false }
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

  const saveRoutine = (patch) => {
    const id = editingRoutine?.id
    return id ? act(() => updateDayGroup(id, patch), 'Routine updated') : false
  }

  /**
   * Delete any routine, not only the one on screen.
   *
   * `selectedId` is deliberately left alone: the effect above already re-points
   * it when the selected routine disappears from the refreshed list, so clearing
   * it here would just cause a second render with nothing selected.
   */
  const deleteRoutine = async (routine) => {
    if (!routine) return false
    const ok = await act(() => deleteDayGroup(routine.id), 'Routine deleted')
    setConfirmDeleteRoutine(null)
    setEditingRoutine(null)
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
  /** Phone-width date. The long form wraps onto three lines at 390px. */
  const dateShortLabel = useMemo(() => now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }), [date])
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
          <DashboardHeader statement="Let’s build your first routine." dateLabel={dateLabel} dateShortLabel={dateShortLabel} isViewingToday accentColor="#0F766E" userName={user?.name} onOpenProfile={() => navigate('/profile')} />
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

  /*
   * Exact counts are only known for the routine that is actually loaded. Any
   * other routine is being deleted from the list, where its contents were never
   * fetched — so the warning stays truthful instead of quoting the wrong totals.
   */
  const deleteRoutineWarning = !confirmDeleteRoutine
    ? undefined
    : confirmDeleteRoutine.id === group?.id
      ? `“${confirmDeleteRoutine.name}”, its ${timeline.length} block${timeline.length === 1 ? '' : 's'} and ${items.length} habit${items.length === 1 ? '' : 's'} will be permanently removed.`
      : `“${confirmDeleteRoutine.name}” and everything in it will be permanently removed.`
  const transition = reduceMotion ? { duration: 0 } : { duration: DURATION.page, ease: EASE }
  const loadingGroup = selected.loading && selected.data === null

  return (
    <div className="min-h-viewport bg-cream text-ink">
      <main className={`mx-auto w-full max-w-5xl ${PAGE_GUTTER} ${PAGE_VERTICAL}`}>
        <DashboardHeader
          dateLabel={dateLabel}
          dateShortLabel={dateShortLabel}
          isViewingToday={viewingToday}
          blockCount={loadingGroup ? null : timeline.length}
          accentColor={color}
          userName={user?.name}
          onOpenProfile={() => navigate('/profile')}
        />

        {/*
          Reading order on a phone: what day is it → which routine am I looking
          at → filter it → the plan. The routine row comes before the category
          chips because it is context, and the chips only make sense once you know
          what they are filtering.
        */}
        <RoutineContextBar
          routine={group ?? list.find((item) => item.id === selectedId) ?? null}
          blockCount={timeline.length}
          onOpen={() => setRoutinesOpen(true)}
          buttonRef={routinesButtonRef}
          className={BLOCK_GAP}
        />

        {!verified && <div className={BLOCK_GAP}><EmailVerificationBanner /></div>}

        {/*
          The category nav owns the row directly under the header — the most
          valuable strip on a phone — because filtering the day's plan is a daily
          act, while switching or editing routines is not. Those moved into the
          header's routine sheet.

          A skeleton stands in while a routine loads so the page below does not
          jump by 44px on every switch.
        */}
        {loadingGroup ? (
          <div className={`${BLOCK_GAP} flex gap-2`} aria-hidden="true">
            {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-11 w-24 rounded-full" />)}
          </div>
        ) : timeline.length > 0 && (
          <CategoryFilter schedule={timeline} value={categoryFilter} onChange={setCategoryFilter} className={BLOCK_GAP} />
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
              body="Today isn’t part of any routine yet. Open your routines from the top of the screen to add this weekday to one, or start a new routine."
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
              {/*
                Source order is desktop order (sidebar left, plan right). On a
                phone the columns stack, and the plan has to come first: the day's
                schedule is the reason the page exists, and burying it under the
                checklist and the reminder settings meant scrolling past two cards
                of secondary material to reach it. `order` flips the stack without
                moving the sidebar on desktop.
              */}
              <aside className={`order-2 space-y-6 lg:order-1 lg:sticky lg:top-6`}>
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

              <div className="order-1 lg:order-2">
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
                    <div>
                      <Timeline
                        schedule={visibleTimeline}
                        liveId={viewingToday ? liveId : null}
                        onSelectEntry={setActiveEntry}
                        emptyMessage={`No ${categoryFilter} blocks in this routine.`}
                        prayerTimings={prayer.data?.timings}
                        prayerSource={prayer.data?.source}
                        /* Add lives in the section header now, so it is reachable
                           without scrolling past a full day of blocks. */
                        onAdd={verified ? () => openBlockForm(null) : undefined}
                      />
                    </div>
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

      <RoutineManagerSheet
        open={routinesOpen}
        groups={list}
        selectedId={selectedId}
        todayGroupIds={todayIds}
        canManage={verified}
        onClose={() => setRoutinesOpen(false)}
        onSelect={(id) => { setSelectedId(id); setRoutinesOpen(false) }}
        /* Close before opening: two Modals at once would both lock scroll and
           both trap focus. */
        onEditRoutine={(routine) => { setRoutinesOpen(false); setEditingRoutine(routine) }}
        onCreateRoutine={() => { setRoutinesOpen(false); setBuilding(true) }}
        returnFocusRef={routinesButtonRef}
      />

      <RoutineSettingsSheet
        open={Boolean(editingRoutine)}
        group={editingRoutine}
        onClose={() => setEditingRoutine(null)}
        onSave={saveRoutine}
        /* Hand off rather than stack: the confirm dialog is itself a Modal, and
           two would each lock body scroll and trap focus. "Keep it" hands back. */
        onRequestDelete={() => { setConfirmDeleteRoutine(editingRoutine); setEditingRoutine(null) }}
        returnFocusRef={routinesButtonRef}
      />

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
        open={Boolean(confirmDeleteRoutine)}
        onClose={() => { setEditingRoutine(confirmDeleteRoutine); setConfirmDeleteRoutine(null) }}
        onConfirm={() => deleteRoutine(confirmDeleteRoutine)}
        title="Delete this routine?"
        description={deleteRoutineWarning}
        confirmLabel="Delete routine"
        cancelLabel="Keep it"
      />

      <Assistant accent={color} timeline={liveTimeline} liveId={liveId} prayerTimings={prayer.data?.timings} completed={checked.size} total={items.length} isViewingToday={viewingToday} onReplayTour={() => setRunTour(true)} />
      {runTour && <Suspense fallback={null}><OnboardingTour run accent={color} onFinish={() => { setRunTour(false); markTourComplete(userId) }} /></Suspense>}
    </div>
  )
}
