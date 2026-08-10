import { create } from 'zustand'
import api, { clearToken, getToken, setToken, unwrap, unwrapMeta } from '../api/client.js'

const USER_KEY = 'auth-user'

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY))
  } catch {
    return null
  }
}

function storeUser(user) {
  try {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
    else localStorage.removeItem(USER_KEY)
  } catch {
    // Storage can be unavailable; the in-memory session still works.
  }
}

function clearSession() {
  clearToken()
  storeUser(null)
}

// ---------------------------------------------------------------------------
// State library decision: zustand over React Context.
//
// Auth/session state is read by many components at different depths (header,
// protected routes, assistant, onboarding, every data hook). With Context, any
// change to the user object re-renders the whole subtree, and we'd end up
// stacking multiple providers. zustand gives selector-based subscriptions (only
// components reading a changed slice re-render), works outside React (handy for
// the axios 401 handler), and adds ~1kB. Context would be "sufficient" but
// noticeably noisier here.
// ---------------------------------------------------------------------------
export const useAuthStore = create((set, get) => ({
  user: null,
  token: getToken(),
  // 'idle' until we've tried to restore a session; guards the protected route
  // from redirecting before the /auth/me check resolves on a hard refresh.
  status: 'idle', // idle | loading | authenticated | unauthenticated
  error: null,

  isAuthenticated: () => Boolean(get().token && get().user),

  /** Restore session on app boot using a persisted token. */
  async bootstrap() {
    if (get().status === 'loading' || get().status === 'authenticated') return

    const token = getToken()

    if (!token) {
      set({ status: 'unauthenticated', user: null, token: null })
      return
    }

    set({ status: 'loading' })

    try {
      const response = await api.get('/auth/me')
      const user = unwrap(response)
      storeUser(user)
      set({ user, token, status: 'authenticated', error: null })
    } catch (error) {
      if (error.status === 401) {
        clearSession()
        set({ user: null, token: null, status: 'unauthenticated' })
        return
      }

      const cachedUser = getStoredUser()
      if (cachedUser) {
        set({ user: cachedUser, token, status: 'authenticated', error })
      } else {
        set({ user: null, token, status: 'unauthenticated', error })
      }
    }
  },

  async login({ email, password }) {
    set({ error: null })
    const response = await api.post('/auth/login', { email, password, device_name: 'web' })
    const token = unwrapMeta(response).token
    setToken(token)
    const user = unwrap(response)
    storeUser(user)
    set({ user, token, status: 'authenticated' })
    return user
  },

  async register({ name, email, password, passwordConfirmation }) {
    set({ error: null })
    const response = await api.post('/auth/register', {
      name,
      email,
      password,
      password_confirmation: passwordConfirmation,
      terms_accepted: true,
      device_name: 'web',
    })
    const token = unwrapMeta(response).token
    setToken(token)
    const user = unwrap(response)
    storeUser(user)
    set({ user, token, status: 'authenticated' })
    return user
  },

  async completeGoogleLogin(code) {
    const response = await api.post('/auth/google/exchange', { code })
    const token = unwrapMeta(response).token
    setToken(token)
    const user = unwrap(response)
    storeUser(user)
    set({ user, token, status: 'authenticated', error: null })
    return user
  },

  async refreshUser() {
    const response = await api.get('/auth/me')
    const user = unwrap(response)
    storeUser(user)
    set({ user })
    return user
  },

  async logout() {
    try {
      await api.post('/auth/logout')
    } catch {
      // Even if the network call fails, clear locally — the user asked to leave.
    }
    clearSession()
    set({ user: null, token: null, status: 'unauthenticated' })
  },

  /** Called by the axios 401 interceptor. */
  forceLogout() {
    clearSession()
    set({ user: null, token: null, status: 'unauthenticated' })
  },
}))
