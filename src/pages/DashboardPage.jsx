import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore.js'
import { useApiResource } from '../hooks/useScheduleData.js'
import { useChecklistState } from '../hooks/useChecklistState.js'
import { createChecklistItem, createTimelineEntry, deleteChecklistItem, deleteDayGroup, deleteTimelineEntry, fetchChecklist, fetchDayGroups, fetchNotificationSettings, fetchPrayerTimes, fetchSchedule, fetchTodaySchedule, getBrowserCoords, saveChecklist, saveNotificationSettings, toDateString, updateChecklistItem, updateDayGroup, updateTimelineEntry } from '../api/services.js'
import { getLiveEntryId } from '../utils/time.js'
import { fireNotification, getDueEntries, getPermission, isNotificationSupported, minutesUntilStart, requestPermission } from '../utils/notifications.js'
import { trackNotificationPermission } from '../analytics.js'
import DashboardHeader from '../components/DashboardHeader.jsx'
import DaySwitcher from '../components/DaySwitcher.jsx'
import DayGroupBuilder from '../components/DayGroupBuilder.jsx'
import GroupManagePanel from '../components/GroupManagePanel.jsx'
import Checklist from '../components/Checklist.jsx'
import Timeline from '../components/Timeline.jsx'
import NowCard from '../components/NowCard.jsx'
import TodayProgressCard from '../components/TodayProgressCard.jsx'
import NotificationControls from '../components/NotificationControls.jsx'
import Assistant from '../components/assistant/Assistant.jsx'
import ErrorState from '../components/ui/ErrorState.jsx'
import EmailVerificationBanner from '../components/EmailVerificationBanner.jsx'
import { hasCompletedTour, markTourComplete } from '../components/onboarding/tourState.js'

const OnboardingTour = lazy(() => import('../components/onboarding/OnboardingTour.jsx'))
const EMPTY = []

export default function DashboardPage() {
  const reduceMotion = useReducedMotion()
  const user = useAuthStore((state) => state.user)
  const navigate = useNavigate()
  const userId = user?.id
  const [now, setNow] = useState(() => new Date())
  const [selectedId, setSelectedId] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [building, setBuilding] = useState(false)
  const [runTour, setRunTour] = useState(false)
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
  const checklist = useApiResource(() => fetchChecklist(date), { cacheKey: `checklist:${date}`, userId, deps: [date] })
  const { checkedIds: checked, toggle: toggleChecklist } = useChecklistState(checklist.data, date, saveChecklist)
  const toggle = async (id) => {
    try {
      const result = await toggleChecklist(id)
      toast.success(result.checked ? 'Task completed' : 'Task marked incomplete')
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

  if (groups.loading && groups.data === null) return <div className="min-h-screen bg-cream p-8 font-sans">Loading your routines…</div>
  if (groups.error && groups.data === null) return <div className="min-h-screen bg-cream p-6"><ErrorState error={groups.error} onRetry={groups.refetch} /></div>

  if (list.length === 0 && !building) {
    return <div className="min-h-screen bg-cream px-4 py-8"><div className="mx-auto max-w-3xl"><DashboardHeader dayName="Your first routine" dayType="Start here" dateLabel={dateLabel} isViewingToday accentColor="#0F766E" editMode={false} userName={user?.name} onOpenProfile={() => navigate('/profile')} />{!user?.is_email_verified && <div className="mt-6"><EmailVerificationBanner /></div>}<div className="mt-10 rounded-card bg-ink p-7 text-white sm:p-10"><p className="font-sans text-xs font-bold uppercase tracking-[.2em] text-white/55">A blank canvas</p><h2 className="mt-3 display-title text-4xl sm:text-5xl">Start with one simple block.</h2><p className="mt-3 max-w-xl font-sans text-sm leading-relaxed text-white/70">Name your routine and add what you want to do first. Today is already selected, and everything can be changed later.</p><button data-tour="create-group" disabled={!user?.is_email_verified} onClick={() => setBuilding(true)} className="mt-6 flex min-h-[48px] items-center gap-2 rounded-xl bg-cream px-5 font-sans text-sm font-bold text-ink disabled:cursor-not-allowed disabled:opacity-45"><Plus className="h-4 w-4" aria-hidden="true" />{user?.is_email_verified ? 'Build my first routine' : 'Verify email to create a routine'}</button></div></div></div>
  }

  if (list.length === 0 && building) return <div className="min-h-screen bg-cream px-4 py-8"><DayGroupBuilder onComplete={async (id) => { await groups.refetch(); setSelectedId(id); setBuilding(false); toast.success('Your first routine is ready') }} /></div>

  const color = group?.color ?? '#0F766E'
  const dayName = group?.weekdays?.includes(weekday) ? 'Today’s routine' : 'Routine preview'
  const transition = reduceMotion ? { duration: 0 } : { duration: 0.24, ease: [0.22, 1, 0.36, 1] }

  return (
    <div className="min-h-screen bg-cream text-ink">
      <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-6 sm:px-6 sm:pt-10">
        <DashboardHeader dayName={dayName} dayType={group?.name ?? 'Routine'} dateLabel={dateLabel} isViewingToday={viewingToday} accentColor={color} editMode={editMode} onToggleEdit={user?.is_email_verified ? () => setEditMode((value) => !value) : null} userName={user?.name} onOpenProfile={() => navigate('/profile')} />
        {!user?.is_email_verified && <div className="mt-5"><EmailVerificationBanner /></div>}
        <div className="mt-5" data-tour="day-switcher"><DaySwitcher groups={list} selectedId={selectedId} onSelect={setSelectedId} todayGroupIds={todayIds} /></div>
        <div className="mt-3 flex justify-end"><button disabled={!user?.is_email_verified} onClick={() => setBuilding((value) => !value)} className="inline-flex min-h-[44px] items-center gap-2 rounded-xl px-4 font-sans text-sm font-bold text-ink/65 ring-1 ring-black/15 hover:bg-white disabled:cursor-not-allowed disabled:opacity-45"><Plus className="h-4 w-4" aria-hidden="true" />{building ? 'Close builder' : 'New routine'}</button></div>
        {building && <div className="mt-5"><DayGroupBuilder compact onCancel={() => setBuilding(false)} onComplete={async (id) => { await groups.refetch(); setSelectedId(id); setBuilding(false) }} /></div>}
        {editMode && group && <GroupManagePanel group={group} onUpdate={(patch) => act(() => updateDayGroup(group.id, patch), 'Group updated')} onAddEntry={(entry) => act(() => createTimelineEntry(group.id, entry), 'Block added')} onAddItem={(label) => act(() => createChecklistItem(group.id, label), 'Habit added')} onDelete={async () => { if (!window.confirm(`Delete “${group.name}” and all its blocks and habits? This cannot be undone.`)) return; await act(() => deleteDayGroup(group.id), 'Group deleted'); setSelectedId(null); setEditMode(false) }} />}
        {!today.data?.assigned && <div className="mt-5 rounded-2xl bg-paper p-4 font-sans text-sm text-ink/65 ring-1 ring-black/10">No routine is assigned to today. Preview one below or use edit mode to include this weekday.</div>}

        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={selectedId} initial={reduceMotion ? false : { opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={reduceMotion ? undefined : { opacity: 0, x: -8 }} transition={transition}>
            {viewingToday && <div className="mt-6" data-tour="today-progress"><TodayProgressCard items={items} checkedIds={checked} accentColor={color} onToggle={toggle} /></div>}
            <div className="mt-6" data-tour="now-card"><NowCard schedule={viewingToday ? liveTimeline : timeline} liveId={viewingToday ? liveId : null} isViewingToday={viewingToday} dayName={dayName} dayType={group?.name} nowTs={now.getTime()} /></div>
            <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
              <aside className="space-y-6 lg:sticky lg:top-6">
                <div data-tour="checklist"><Checklist items={items} checkedIds={viewingToday ? checked : new Set()} onToggle={toggle} editable={viewingToday} accentColor={color} editMode={editMode} onSaveLabel={saveLabel} onDeleteItem={(id) => act(() => deleteChecklistItem(id), 'Habit deleted')} /></div>
                <div data-tour="reminders"><NotificationControls supported={supported} permission={permission} settings={notif} accentColor={color} onRequestPermission={async () => { const nextPermission = await requestPermission(); trackNotificationPermission(nextPermission); if (nextPermission === 'granted') persist({ enabled: true }) }} onToggleEnabled={(value) => persist({ enabled: value })} onLeadChange={(value) => persist({ minutes_before: Number(value) })} /></div>
              </aside>
              <Timeline schedule={timeline} liveId={viewingToday ? liveId : null} editMode={editMode} onSaveEntry={saveEntry} onDeleteEntry={(id) => act(() => deleteTimelineEntry(id), 'Block deleted')} prayerTimings={prayer.data?.timings} prayerSource={prayer.data?.source} />
            </div>
          </motion.div>
        </AnimatePresence>
        <footer className="mt-14 text-center font-sans text-xs text-ink/40">{list.length} routine group{list.length === 1 ? '' : 's'} · synced to your account</footer>
      </main>
      <Assistant accent={color} timeline={liveTimeline} liveId={liveId} prayerTimings={prayer.data?.timings} completed={checked.size} total={items.length} isViewingToday={viewingToday} onReplayTour={() => setRunTour(true)} />
      {runTour && <Suspense fallback={null}><OnboardingTour run accent={color} onFinish={() => { setRunTour(false); markTourComplete(userId) }} /></Suspense>}
    </div>
  )
}
