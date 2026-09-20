import { useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, KeyRound, LogOut, MailCheck, ScrollText, ShieldCheck, Sparkles, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import AccountDeletionDialog from '../components/AccountDeletionDialog.jsx'
import ProfileIdentityCard from '../components/settings/ProfileIdentityCard.jsx'
import SettingsGroup from '../components/settings/SettingsGroup.jsx'
import SettingsRow from '../components/settings/SettingsRow.jsx'
import { clearUserCache } from '../api/offlineCache.js'
import { resendVerificationEmail } from '../api/services.js'
import { resetTour } from '../components/onboarding/tourState.js'
import { useAuthStore } from '../store/authStore.js'
import {
  BLOCK_GAP,
  DURATION,
  EASE,
  PAGE_GUTTER,
  PAGE_VERTICAL,
  SECTION_GAP,
  TOUCH_TARGET,
} from '../config/layout.js'

/** "Member since March 2026", or null when the date is missing/unparseable. */
function formatMemberSince(value) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return `Since ${date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}`
}

export default function ProfilePage() {
  const reduceMotion = useReducedMotion()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const forceLogout = useAuthStore((state) => state.forceLogout)

  const [confirmLogout, setConfirmLogout] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [resending, setResending] = useState(false)
  const deleteTriggerRef = useRef(null)

  const isVerified = Boolean(user?.is_email_verified)
  /*
   * Google-created accounts store a null password, so they confirm deletion by
   * typing DELETE instead. Defaults to requiring a password when the flag is
   * absent — the safer assumption, since a wrong guess only shows an error.
   */
  const hasPassword = user?.has_password !== false

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

  const resendVerification = async () => {
    setResending(true)
    try {
      const data = await resendVerificationEmail()
      toast.success(data.message)
    } catch (error) {
      toast.error(error.message || 'Could not resend the verification email.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className={`min-h-viewport bg-cream text-ink ${PAGE_GUTTER} ${PAGE_VERTICAL}`}>
      <main className="mx-auto w-full max-w-2xl">
        {/*
          Compact title bar. The previous 48px display heading belonged to a
          landing page, not a settings screen — a circular back affordance plus a
          plain title is the established pattern and leaves the content room.
        */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            aria-label="Back to today"
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-paper text-ink shadow-card ring-1 ring-black/10 transition-colors hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-career focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <h1 className="font-sans text-2xl font-bold tracking-tight">Profile</h1>
        </div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DURATION.base, ease: EASE }}
        >
          <ProfileIdentityCard
            className={BLOCK_GAP}
            name={user?.name}
            email={user?.email}
            memberSince={formatMemberSince(user?.created_at)}
            isVerified={isVerified}
          />

          <SettingsGroup label="Account" className={SECTION_GAP}>
            {/*
              Password changes reuse the existing recovery flow, which mails a
              signed single-use link — deliberately not a new endpoint.
            */}
            <SettingsRow
              icon={KeyRound}
              label="Change password"
              description="We’ll email you a secure link"
              to="/password/forgot"
            />
            {!isVerified && (
              <SettingsRow
                icon={MailCheck}
                label="Resend verification email"
                description="Required before you can edit routines"
                onClick={resendVerification}
                loading={resending}
              />
            )}
          </SettingsGroup>

          <SettingsGroup label="Guide" className={SECTION_GAP}>
            <SettingsRow
              icon={Sparkles}
              label="Show tour again"
              description="Take a guided walkthrough of Daycraft"
              onClick={() => {
                resetTour(user?.id)
                navigate('/dashboard', { state: { runTour: true } })
              }}
            />
          </SettingsGroup>

          <SettingsGroup label="About" className={SECTION_GAP}>
            <SettingsRow icon={ShieldCheck} label="Privacy Policy" to="/privacy" />
            <SettingsRow icon={ScrollText} label="Terms of Service" to="/terms" />
          </SettingsGroup>

          <SettingsGroup label="Session" className={SECTION_GAP}>
            <SettingsRow
              icon={LogOut}
              label="Sign out"
              description="Your routines stay synced to this account"
              onClick={() => setConfirmLogout(true)}
            />
          </SettingsGroup>

          {confirmLogout && (
            <div
              role="group"
              aria-label="Confirm sign out"
              className={`${BLOCK_GAP} rounded-card bg-paper p-4 shadow-card ring-1 ring-black/10`}
            >
              <p className="font-sans text-body-sm leading-relaxed text-ink/70">
                Ready to leave? Everything you created is already saved to your account.
              </p>
              <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={signingOut}
                  onClick={() => setConfirmLogout(false)}
                  className={`${TOUCH_TARGET} rounded-xl px-4 font-sans text-sm font-semibold ring-1 ring-black/15 disabled:opacity-50`}
                >
                  Stay signed in
                </button>
                <button
                  type="button"
                  disabled={signingOut}
                  onClick={signOut}
                  className={`${TOUCH_TARGET} inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-4 font-sans text-sm font-bold text-white disabled:cursor-wait disabled:opacity-60`}
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  {signingOut ? 'Signing out…' : 'Confirm sign out'}
                </button>
              </div>
            </div>
          )}

          {/*
            Danger zone stays last and visually separated, and its confirmation
            opens in a focused dialog rather than expanding inline — an
            irreversible action should not be reachable by a stray tap while
            scrolling past it.
          */}
          <SettingsGroup
            label="Danger zone"
            tone="danger"
            className={SECTION_GAP}
            description="Permanent and cannot be undone."
          >
            <SettingsRow
              ref={deleteTriggerRef}
              icon={Trash2}
              label="Delete account"
              description="Removes your routines, history and settings"
              tone="danger"
              onClick={() => setConfirmDelete(true)}
            />
          </SettingsGroup>

          <AccountDeletionDialog
            open={confirmDelete}
            onClose={() => setConfirmDelete(false)}
            onDeleted={accountDeleted}
            hasPassword={hasPassword}
            returnFocusRef={deleteTriggerRef}
          />
        </motion.div>
      </main>
    </div>
  )
}
