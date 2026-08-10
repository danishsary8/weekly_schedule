import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore.js'
import { clearUserCache } from '../api/offlineCache.js'
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
import NotificationControls from '../components/NotificationControls.jsx'
import Assistant from '../components/assistant/Assistant.jsx'
import ErrorState from '../components/ui/ErrorState.jsx'
import EmailVerificationBanner from '../components/EmailVerificationBanner.jsx'
import AccountDeletionPanel from '../components/AccountDeletionPanel.jsx'
import { hasCompletedTour, markTourComplete } from '../components/onboarding/tourState.js'
const OnboardingTour=lazy(()=>import('../components/onboarding/OnboardingTour.jsx'))
const EMPTY=[]

export default function DashboardPage(){
  const user=useAuthStore(s=>s.user), logout=useAuthStore(s=>s.logout), forceLogout=useAuthStore(s=>s.forceLogout), navigate=useNavigate(), userId=user?.id
  const [now,setNow]=useState(()=>new Date()), [selectedId,setSelectedId]=useState(null), [editMode,setEditMode]=useState(false), [building,setBuilding]=useState(false), [runTour,setRunTour]=useState(false)
  const date=toDateString(now), weekday=now.getDay()
  const groups=useApiResource(fetchDayGroups,{cacheKey:'day-groups',userId})
  const today=useApiResource(()=>fetchTodaySchedule(now),{cacheKey:`today:${date}`,userId,deps:[date]})
  const list=groups.data??EMPTY, todayIds=(today.data?.groups??EMPTY).map(g=>g.id)
  useEffect(()=>{if(!selectedId&&list.length)setSelectedId(todayIds[0]??list[0].id);if(selectedId&&!list.some(g=>g.id===selectedId))setSelectedId(list[0]?.id??null)},[list,selectedId,todayIds.join(',')])
  const selected=useApiResource(()=>fetchSchedule(selectedId),{cacheKey:selectedId?`group:${selectedId}`:null,userId,deps:[selectedId],enabled:!!selectedId})
  const group=selected.data, timeline=group?.timeline??EMPTY, items=group?.checklist??EMPTY, viewingToday=todayIds.includes(selectedId)
  const checklist=useApiResource(()=>fetchChecklist(date),{cacheKey:`checklist:${date}`,userId,deps:[date]})
  const {checkedIds:checked,toggle:toggleChecklist}=useChecklistState(checklist.data,date,saveChecklist)
  const toggle=async id=>{try{const result=await toggleChecklist(id);toast.success(result.checked?'Task completed':'Task marked incomplete')}catch{toast.error('Could not save. Reconnect and try again.')}}
  const refresh=async()=>{await groups.refetch();await selected.refetch();today.revalidate();checklist.revalidate()}
  const act=async(fn,success)=>{try{await fn();await refresh();toast.success(success);return true}catch(e){toast.error(e?.response?.data?.error?.message||'Could not save. Please try again.');return false}}
  const saveEntry=(id,patch)=>act(()=>updateTimelineEntry(id,patch),'Block updated')
  const saveLabel=(id,label)=>act(()=>updateChecklistItem(id,label),'Habit updated')
  const liveTimeline=today.data?.timeline??EMPTY, liveId=getLiveEntryId(liveTimeline,now)
  useEffect(()=>{const timer=setInterval(()=>setNow(new Date()),30000);return()=>clearInterval(timer)},[])
  const settings=useApiResource(fetchNotificationSettings,{cacheKey:'notif-settings',userId}); const supported=isNotificationSupported(), permission=getPermission(); const notif={enabled:settings.data?.enabled??false,leadMinutes:settings.data?.minutes_before??5}
  const persist=async patch=>{const optimistic={...settings.data,...patch};settings.setData(optimistic);try{settings.setData(await saveNotificationSettings({enabled:optimistic.enabled,minutesBefore:optimistic.minutes_before}))}catch{toast.error('Could not save reminder settings.')}}
  const fired=useRef({date,ids:new Set()})
  useEffect(()=>{if(fired.current.date!==date)fired.current={date,ids:new Set()};if(!supported||!notif.enabled||permission!=='granted')return;for(const entry of getDueEntries(liveTimeline,now,notif.leadMinutes)){if(fired.current.ids.has(entry.id))continue;fireNotification(entry,minutesUntilStart(entry,now)??0);fired.current.ids.add(entry.id)}},[date,now,liveTimeline,notif.enabled,notif.leadMinutes,permission,supported])
  const [coords,setCoords]=useState(null);useEffect(()=>{getBrowserCoords().then(setCoords)},[]);const prayer=useApiResource(()=>fetchPrayerTimes(date,coords),{cacheKey:`prayer:${date}`,userId,deps:[date,coords?.latitude,coords?.longitude]})
  useEffect(()=>{if(list.length&&!hasCompletedTour(userId)){const t=setTimeout(()=>setRunTour(true),800);return()=>clearTimeout(t)}},[list.length,userId])
  const dateLabel=useMemo(()=>now.toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric',year:'numeric'}),[date])
  const logoutNow=async()=>{clearUserCache(userId);await logout();navigate('/login',{replace:true})}
  const accountDeleted=async()=>{clearUserCache(userId);forceLogout();toast.success('Your account and data were deleted');navigate('/register',{replace:true})}
  if(groups.loading&&groups.data===null)return <div className="min-h-screen bg-cream p-8 font-sans">Loading your routines…</div>
  if(groups.error&&groups.data===null)return <div className="min-h-screen bg-cream p-6"><ErrorState error={groups.error} onRetry={groups.refetch}/></div>
  if(list.length===0&&!building)return <div className="min-h-screen bg-cream px-4 py-8"><div className="mx-auto max-w-3xl"><DashboardHeader dayName="Your first routine" dayType="Start here" dateLabel={dateLabel} isViewingToday accentColor="#0F766E" editMode={false} userName={user?.name} onLogout={logoutNow}/>{!user?.is_email_verified&&<div className="mt-6"><EmailVerificationBanner/></div>}<div className="mt-10 rounded-card bg-ink p-7 text-white sm:p-10"><p className="font-sans text-xs font-bold uppercase tracking-[.2em] text-white/55">A blank canvas</p><h2 className="mt-3 display-title text-4xl sm:text-5xl">You haven’t built a routine yet.</h2><p className="mt-3 max-w-xl font-sans text-sm leading-relaxed text-white/70">Let’s create your first day group. Choose when it repeats, add your first schedule block, and make it yours.</p><button data-tour="create-group" disabled={!user?.is_email_verified} onClick={()=>setBuilding(true)} className="mt-6 flex min-h-[48px] items-center gap-2 rounded-xl bg-cream px-5 font-sans text-sm font-bold text-ink disabled:cursor-not-allowed disabled:opacity-45"><Plus className="h-4 w-4"/>{user?.is_email_verified?'Create your first day group':'Verify email to create a routine'}</button></div><AccountDeletionPanel onDeleted={accountDeleted}/></div></div>
  if(list.length===0&&building)return <div className="min-h-screen bg-cream px-4 py-8"><DayGroupBuilder onComplete={async id=>{await groups.refetch();setSelectedId(id);setBuilding(false);toast.success('Your first routine is ready')}}/></div>
  const color=group?.color??'#0F766E', dayName=group?.weekdays?.includes(weekday)?'Today’s routine':'Routine preview'
  return <div className="min-h-screen bg-cream text-ink"><main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-6 sm:px-6 sm:pt-10"><DashboardHeader dayName={dayName} dayType={group?.name??'Routine'} dateLabel={dateLabel} isViewingToday={viewingToday} accentColor={color} editMode={editMode} onToggleEdit={user?.is_email_verified?()=>setEditMode(v=>!v):null} userName={user?.name} onLogout={logoutNow}/>{!user?.is_email_verified&&<div className="mt-5"><EmailVerificationBanner/></div>}<div className="mt-5" data-tour="day-switcher"><DaySwitcher groups={list} selectedId={selectedId} onSelect={setSelectedId} todayGroupIds={todayIds}/></div><div className="mt-4 flex justify-end"><button disabled={!user?.is_email_verified} onClick={()=>setBuilding(v=>!v)} className="min-h-[44px] rounded-xl bg-ink px-4 font-sans text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-45">{building?'Close builder':'+ New day group'}</button></div>{building&&<div className="mt-5"><DayGroupBuilder compact onCancel={()=>setBuilding(false)} onComplete={async id=>{await groups.refetch();setSelectedId(id);setBuilding(false)}}/></div>}
    {editMode&&group&&<GroupManagePanel group={group} onUpdate={p=>act(()=>updateDayGroup(group.id,p),'Group updated')} onAddEntry={e=>act(()=>createTimelineEntry(group.id,e),'Block added')} onAddItem={l=>act(()=>createChecklistItem(group.id,l),'Habit added')} onDelete={async()=>{if(!window.confirm(`Delete “${group.name}” and all its blocks and habits? This cannot be undone.`))return;await act(()=>deleteDayGroup(group.id),'Group deleted');setSelectedId(null);setEditMode(false)}}/>}
    {!today.data?.assigned&&<div className="mt-5 rounded-2xl bg-paper p-4 font-sans text-sm text-ink/65 ring-1 ring-black/10">No day group is assigned to today. You can still preview a group below or edit one to assign this weekday.</div>}
    <div className="mt-6" data-tour="now-card"><NowCard schedule={viewingToday?liveTimeline:timeline} liveId={viewingToday?liveId:null} isViewingToday={viewingToday} dayName={dayName} dayType={group?.name} nowTs={now.getTime()}/></div><div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-[380px_minmax(0,1fr)]"><aside className="space-y-6 lg:sticky lg:top-6"><div data-tour="checklist"><Checklist items={items} checkedIds={viewingToday?checked:new Set()} onToggle={toggle} editable={viewingToday} accentColor={color} editMode={editMode} onSaveLabel={saveLabel} onDeleteItem={id=>act(()=>deleteChecklistItem(id),'Habit deleted')}/></div><div data-tour="reminders"><NotificationControls supported={supported} permission={permission} settings={notif} accentColor={color} onRequestPermission={async()=>{const p=await requestPermission();trackNotificationPermission(p);if(p==='granted')persist({enabled:true})}} onToggleEnabled={v=>persist({enabled:v})} onLeadChange={v=>persist({minutes_before:Number(v)})}/></div></aside><Timeline schedule={timeline} liveId={viewingToday?liveId:null} editMode={editMode} onSaveEntry={saveEntry} onDeleteEntry={id=>act(()=>deleteTimelineEntry(id),'Block deleted')} prayerTimings={prayer.data?.timings} prayerSource={prayer.data?.source}/></div><AccountDeletionPanel onDeleted={accountDeleted}/><footer className="mt-14 text-center font-sans text-xs text-ink/40">{list.length} routine group{list.length===1?'':'s'} · synced to your account</footer></main><Assistant accent={color} timeline={liveTimeline} liveId={liveId} prayerTimings={prayer.data?.timings} completed={checked.size} total={items.length} isViewingToday={viewingToday} onReplayTour={()=>setRunTour(true)}/>{runTour&&<Suspense fallback={null}><OnboardingTour run accent={color} onFinish={()=>{setRunTour(false);markTourComplete(userId)}}/></Suspense>}</div>
}
