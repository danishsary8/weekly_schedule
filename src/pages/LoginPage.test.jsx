import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import LoginPage from './LoginPage.jsx'
import { useAuthStore } from '../store/authStore.js'

vi.mock('../store/authStore.js', () => ({
  useAuthStore: vi.fn(),
}))

vi.mock('../api/services.js', () => ({
  fetchGoogleRedirectUrl: vi.fn().mockResolvedValue({ url: 'https://accounts.google.com' }),
}))

describe('LoginPage', () => {
  const mockLogin = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.mockImplementation((selector) =>
      selector({
        login: mockLogin,
        user: null,
      }),
    )
  })

  it('renders all required text copy verbatim', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )

    // Heading and Subtitle
    expect(screen.getByRole('heading', { level: 1, name: 'Welcome back' })).toBeInTheDocument()
    expect(screen.getByText('Welcome back. Your day is ready when you are.')).toBeInTheDocument()

    // Form inputs & labels (exact match)
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Forgot password?' })).toBeInTheDocument()

    // Submit button
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument()

    // OR divider & Google button
    expect(screen.getByText('or')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeInTheDocument()

    // Create account links (rendered in desktop and mobile blocks)
    const createAccountLinks = screen.getAllByRole('link', { name: 'Create an account' })
    expect(createAccountLinks.length).toBeGreaterThanOrEqual(1)

    // Footer links
    expect(screen.getAllByText(new RegExp(`© ${new Date().getFullYear()} Daycraft`)).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByRole('link', { name: 'Privacy Policy' }).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByRole('link', { name: 'Terms of Service' }).length).toBeGreaterThanOrEqual(1)

    // Google disclaimer
    expect(screen.getByText(/If Google creates a new account for you/i)).toBeInTheDocument()
  })

  it('submits credentials through the auth store', async () => {
    mockLogin.mockResolvedValueOnce({ name: 'Danish Khan' })

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'secret123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'secret123',
      })
    })
  })

  it('displays validation error alerts when login fails with field errors', async () => {
    const fieldError = vi.fn().mockImplementation((f) => (f === 'email' ? 'Invalid email format' : ''))
    mockLogin.mockRejectedValueOnce({
      status: 422,
      fieldError,
    })

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByText('Invalid email format')).toBeInTheDocument()
  })
})
