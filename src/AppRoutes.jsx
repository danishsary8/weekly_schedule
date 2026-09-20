import { lazy, Suspense, useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { setUnauthorizedHandler } from './api/client.js'
import { useAuthStore } from './store/authStore.js'
import ProtectedRoute from './components/auth/ProtectedRoute.jsx'
import Toaster from './components/ui/Toaster.jsx'
import FullScreenLoader from './components/ui/FullScreenLoader.jsx'
import SplashScreen from './components/ui/SplashScreen.jsx'
import { setMonitoringUser } from './monitoring.js'
import { trackPageView } from './analytics.js'

/*
 * Pages are code-split per route.
 *
 * Every page used to be a static import, so a single chunk carried the landing
 * page, both auth screens, the password flows, the legal text, the dashboard, the
 * profile and the internal analytics report — 523 kB before gzip. A phone opening
 * /login parsed the whole application, including screens that account reaches
 * only after signing in. Splitting means a visit downloads the screen it asked
 * for.
 *
 * LegalPage exports two pages from one module, so each wrapper selects its own
 * named export.
 */
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'))
const RegisterPage = lazy(() => import('./pages/RegisterPage.jsx'))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage.jsx'))
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage.jsx'))
const GoogleCallbackPage = lazy(() => import('./pages/GoogleCallbackPage.jsx'))
const EmailVerifiedPage = lazy(() => import('./pages/EmailVerifiedPage.jsx'))
const PrivacyPage = lazy(() => import('./pages/LegalPage.jsx').then((module) => ({ default: module.PrivacyPage })))
const TermsPage = lazy(() => import('./pages/LegalPage.jsx').then((module) => ({ default: module.TermsPage })))
const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx'))
const LandingPage = lazy(() => import('./pages/LandingPage.jsx'))
const InternalAnalyticsPage = lazy(() => import('./pages/InternalAnalyticsPage.jsx'))
const ProfilePage = lazy(() => import('./pages/ProfilePage.jsx'))

/**
 * Shortest time the splash stays up.
 *
 * This was a fixed 3000ms timer, so every cold load — including a returning user
 * tapping a bookmark — waited three seconds before the app rendered anything,
 * whether or not it was ready sooner. The splash now covers real work (restoring
 * the session, fetching the route's chunk) and this floor only prevents a
 * single-frame flash on a fast connection.
 */
const MIN_SPLASH_MS = 600

/** Fade + slight scale between auth screens and the dashboard. */
function PageTransition({ children }) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 1.01 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

function RouteMetadata({ pathname }) {
  useEffect(() => {
    const landing = pathname === '/'
    document.title = landing ? 'Daycraft — Custom Daily Routine Planner' : pathname === '/dashboard' ? 'Your dashboard — Daycraft' : pathname === '/profile' ? 'Profile & settings — Daycraft' : 'Daycraft — Craft your day.'
    const description = document.querySelector('meta[name="description"]')
    if (description) description.content = landing
      ? 'Build custom weekly routines, track daily progress, and stay focused on what matters now with Daycraft, a calm routine planner for everyday life.'
      : 'Daycraft is a calm daily routine planner for building schedules, habits, and a more intentional day.'
    if (landing) {
      const absoluteImage = `${window.location.origin}/daycraft-og.png`
      document.querySelector('meta[property="og:image"]')?.setAttribute('content', absoluteImage)
      document.querySelector('meta[name="twitter:image"]')?.setAttribute('content', absoluteImage)
    }
  }, [pathname])
  return null
}

export default function AppRoutes() {
  const location = useLocation()
  const navigate = useNavigate()
  const bootstrap = useAuthStore((s) => s.bootstrap)
  const forceLogout = useAuthStore((s) => s.forceLogout)
  const status = useAuthStore((s) => s.status)
  const user = useAuthStore((s) => s.user)
  const [splashFloorPassed, setSplashFloorPassed] = useState(false)

  useEffect(() => {
    trackPageView(location.key, location.pathname)
  }, [location.key, location.pathname])

  // Restore session once on boot.
  useEffect(() => {
    bootstrap()
  }, [bootstrap])

  useEffect(() => {
    setMonitoringUser(user?.id)
  }, [user?.id])

  useEffect(() => {
    const timer = window.setTimeout(() => setSplashFloorPassed(true), MIN_SPLASH_MS)
    return () => window.clearTimeout(timer)
  }, [])

  // A 401 anywhere (expired/revoked token) drops to /login instead of leaving a
  // broken dashboard on screen.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      forceLogout()
      navigate('/login', { replace: true })
    })
    return () => setUnauthorizedHandler(null)
  }, [forceLogout, navigate])

  const isAuthed = status === 'authenticated'
  const authPending = status === 'idle' || status === 'loading'
  /*
   * One waiting surface instead of two. The splash previously ran on a timer and
   * was followed by a separate "Preparing Daycraft…" loader, so a slow session
   * restore showed two different waiting screens in a row.
   */
  const showSplash = !splashFloorPassed || authPending

  return (
    <>
      <RouteMetadata pathname={location.pathname} />
      <Toaster />
      <AnimatePresence mode="wait">
        {showSplash ? (
          <SplashScreen key="cold-load-splash" />
        ) : (
          <Suspense key="routes" fallback={<FullScreenLoader label="Opening Daycraft…" />}>
            <Routes location={location} key={location.pathname}>
          <Route
            path="/login"
            element={
              isAuthed ? (
                <Navigate to="/" replace />
              ) : (
                <PageTransition>
                  <LoginPage />
                </PageTransition>
              )
            }
          />
          <Route
            path="/register"
            element={
              isAuthed ? (
                <Navigate to="/" replace />
              ) : (
                <PageTransition>
                  <RegisterPage />
                </PageTransition>
              )
            }
          />
          <Route path="/password/forgot" element={<PageTransition><ForgotPasswordPage /></PageTransition>} />
          <Route path="/password/reset" element={<PageTransition><ResetPasswordPage /></PageTransition>} />
          <Route path="/auth/google/callback" element={<PageTransition><GoogleCallbackPage /></PageTransition>} />
          <Route path="/email-verified" element={<PageTransition><EmailVerifiedPage /></PageTransition>} />
          <Route path="/privacy" element={<PageTransition><PrivacyPage /></PageTransition>} />
          <Route path="/terms" element={<PageTransition><TermsPage /></PageTransition>} />
          <Route
            path="/"
            element={
              isAuthed ? <Navigate to="/dashboard" replace /> : (
                <PageTransition>
                  <LandingPage />
                </PageTransition>
              )
            }
          />
          <Route path="/dashboard" element={<ProtectedRoute><PageTransition><DashboardPage /></PageTransition></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><PageTransition><ProfilePage /></PageTransition></ProtectedRoute>} />
          <Route path="/internal/analytics" element={<ProtectedRoute><PageTransition><InternalAnalyticsPage /></PageTransition></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        )}
      </AnimatePresence>
    </>
  )
}
