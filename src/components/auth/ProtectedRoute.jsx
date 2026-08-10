import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore.js'
import FullScreenLoader from '../ui/FullScreenLoader.jsx'

/**
 * Gate for authenticated areas. Critically, it waits for the session bootstrap
 * (`status: 'idle' | 'loading'`) before deciding, so a hard refresh with a valid
 * token doesn't flash the login screen.
 */
export default function ProtectedRoute({ children }) {
  const status = useAuthStore((s) => s.status)
  const location = useLocation()

  if (status === 'idle' || status === 'loading') {
    return <FullScreenLoader label="Restoring your session…" />
  }

  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return children
}
