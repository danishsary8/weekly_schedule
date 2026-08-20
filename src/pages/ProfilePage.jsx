import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { CalendarDays, CheckCircle2, ChevronLeft, LogOut, Mail, ShieldCheck, UserRound } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Card from '../components/Card.jsx'
import AccountDeletionPanel from '../components/AccountDeletionPanel.jsx'
import { clearUserCache } from '../api/offlineCache.js'
import { useAuthStore } from '../store/authStore.js'

function formatMemberSince(value) {
  if (!value) return 'Member date unavailable'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Member date unavailable'
  return `Member since ${date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}`
}

export default function ProfilePage() {
  const reduceMotion = useReducedMotion()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const forceLogout = useAuthStore((state) => state.forceLogout)
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const initial = user?.name?.trim()?.charAt(0)?.toUpperCase() || 'U'

  const signOut = async () => {
    setSigningOut(true)
    clearUserCache(user?.id)
    await logout()
    navigate('/login', { replace: true })
  }

  const accountDeleted = async () => {
    clearUserCache(user?.id)
    forceLogout()
    toast.success('Your account and data were deleted')
    navigate('/register', { replace: true })
  }

  return (
    <div className="min-h-screen bg-cream px-4 py-6 text-ink sm:px-6 sm:py-10">
      <main className="mx-auto w-full max-w-3xl">
        <Link to="/dashboard" className="inline-flex min-h-[44px] items-center gap-2 rounded-xl px-2 font-sans text-sm font-bold text-ink/65 hover:bg-black/5 hover:text-ink"><ChevronLeft className="h-4 w-4" aria-hidden="true" />Back to today</Link>

        <motion.header className="mt-4" initial={reduceMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
          <p className="font-sans text-xs font-bold uppercase tracking-[.18em] text-career">Profile & settings</p>
          <h1 className="mt-2 display-title text-5xl sm:text-6xl">Your Daycraft space</h1>
          <p className="mt-2 max-w-xl font-sans text-sm leading-relaxed text-ink/60">Your account details and controls, kept separate from the rhythm of your day.</p>
        </motion.header>

        <Card tone="black" accentColor="#0F766E" className="mt-7 p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-[24px] bg-white font-sans text-3xl font-black text-ink shadow-card" aria-label={`${user?.name || 'User'} avatar`}>{initial}</div>
            <div className="min-w-0 flex-1">
              <h2 className="break-words font-sans text-2xl font-bold text-white">{user?.name || 'Daycraft member'}</h2>
              <div className="mt-2 flex min-w-0 items-start gap-2 font-sans text-sm text-white/65"><Mail className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" /><span className="break-all">{user?.email}</span></div>
              <div className="mt-2 flex items-center gap-2 font-sans text-sm text-white/65"><CalendarDays className="h-4 w-4 flex-shrink-0" aria-hidden="true" /><span>{formatMemberSince(user?.created_at)}</span></div>
            </div>
            <span className="inline-flex min-h-[36px] items-center gap-1.5 self-start rounded-full bg-white/10 px-3 font-sans text-xs font-bold text-white/80"><ShieldCheck className="h-4 w-4" aria-hidden="true" />{user?.is_email_verified ? 'Verified' : 'Verification pending'}</span>
          </div>
        </Card>

        <Card tone="white" accentColor="#7C8B9C" className="mt-5 p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div><h2 className="font-sans text-base font-bold">Session</h2><p className="mt-1 font-sans text-sm leading-relaxed text-ink/55">Sign out safely. Your routines stay synced to this account.</p></div>
            {!confirmLogout && <button type="button" onClick={() => setConfirmLogout(true)} className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-ink px-5 font-sans text-sm font-bold text-white"><LogOut className="h-4 w-4" aria-hidden="true" />Sign out</button>}
          </div>
          {confirmLogout && <div role="group" aria-label="Confirm sign out" className="mt-4 rounded-2xl bg-cream/65 p-4 ring-1 ring-black/[.07]"><div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-career" aria-hidden="true" /><p className="font-sans text-sm leading-relaxed text-ink/65">Ready to leave? Everything you created is already saved to your account.</p></div><div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" disabled={signingOut} onClick={() => setConfirmLogout(false)} className="min-h-[44px] rounded-xl px-4 font-sans text-sm font-semibold ring-1 ring-black/15">Stay signed in</button><button type="button" disabled={signingOut} onClick={signOut} className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-ink px-4 font-sans text-sm font-bold text-white disabled:cursor-wait disabled:opacity-60"><LogOut className="h-4 w-4" aria-hidden="true" />{signingOut ? 'Signing out…' : 'Confirm sign out'}</button></div></div>}
        </Card>

        <AccountDeletionPanel onDeleted={accountDeleted} />
        <footer className="mt-10 flex items-center justify-center gap-2 font-sans text-xs text-ink/40"><UserRound className="h-4 w-4" aria-hidden="true" />Daycraft account settings</footer>
      </main>
    </div>
  )
}
