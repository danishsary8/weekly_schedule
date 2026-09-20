import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import LoginPage from './LoginPage.jsx'
import RegisterPage from './RegisterPage.jsx'
import { useAuthStore } from '../store/authStore.js'

vi.mock('../store/authStore.js', () => ({
  useAuthStore: vi.fn(),
}))

vi.mock('../api/services.js', () => ({
  fetchGoogleRedirectUrl: vi.fn().mockResolvedValue({ url: 'https://accounts.google.com' }),
}))

describe('LoginPage and Unified Auth Experience', () => {
  const mockLogin = vi.fn()
  const mockRegister = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.mockImplementation((selector) =>
      selector({
        login: mockLogin,
        register: mockRegister,
        user: null,
      }),
    )
  })

  it('renders all required Sign In text copy verbatim', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )

    // Heading and Subtitle
    expect(screen.getByRole('heading', { level: 1, name: 'Plan your day, beautifully.' })).toBeInTheDocument()
    expect(screen.getByText('Sign in to pick up right where you left off.')).toBeInTheDocument()

    // Form inputs & labels (exact match)
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Forgot password?' })).toBeInTheDocument()

    // Submit button
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument()

    // OR divider & Google button
    expect(screen.getByText(/^or$/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeInTheDocument()

    // Create account links
    const createAccountLinks = screen.getAllByRole('link', { name: 'Create an account' })
    expect(createAccountLinks.length).toBeGreaterThanOrEqual(1)

    // Footer links
    expect(screen.getAllByText(new RegExp(`© ${new Date().getFullYear()} Daycraft`)).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByRole('link', { name: 'Privacy Policy' }).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByRole('link', { name: 'Terms of Service' }).length).toBeGreaterThanOrEqual(1)

    // Google disclaimer
    expect(screen.getByText(/If Google creates a new account for you/i)).toBeInTheDocument()
  })

  it('submits credentials through the auth store on login', async () => {
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

  it('toggles smoothly to Sign Up mode and renders required copy', async () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )

    // Click "Create an account" toggle link
    const toggleLink = screen.getAllByRole('link', { name: 'Create an account' })[0]
    fireEvent.click(toggleLink)

    // Verify Sign Up headline & subtext
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Start building your perfect day.' })).toBeInTheDocument()
      expect(screen.getByText('Create your account and make routines that stick.')).toBeInTheDocument()
    })

    // Verify Sign Up fields
    expect(screen.getByLabelText(/^name$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^confirm password$/i)).toBeInTheDocument()

    // Verify Sign Up submit button & terms text
    expect(screen.getByRole('button', { name: 'Create account' })).toBeInTheDocument()
    expect(screen.getByText(/By signing up, you agree to our/i)).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Sign in' }).length).toBeGreaterThanOrEqual(1)
  })

  it('submits registration data through the auth store', async () => {
    mockRegister.mockResolvedValueOnce({ name: 'Amina Noor' })

    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    )

    // In RegisterPage, initial mode is signup
    expect(screen.getByRole('heading', { level: 1, name: 'Start building your perfect day.' })).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/^name$/i), { target: { value: 'Amina Noor' } })
    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'amina@example.com' } })
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'securePass123' } })
    fireEvent.change(screen.getByLabelText(/^confirm password$/i), { target: { value: 'securePass123' } })

    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        name: 'Amina Noor',
        email: 'amina@example.com',
        password: 'securePass123',
        passwordConfirmation: 'securePass123',
      })
    })
  })

  it('validates matching passwords on client side before submitting', async () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'securePass123' } })
    fireEvent.change(screen.getByLabelText(/^confirm password$/i), { target: { value: 'differentPass' } })

    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))

    expect(await screen.findByText('Passwords do not match.')).toBeInTheDocument()
    expect(mockRegister).not.toHaveBeenCalled()
  })

  it('switches between modes using the mobile segmented tab pills', async () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )

    const createAccountTab = screen.getByRole('tab', { name: 'Create account' })
    const signInTab = screen.getByRole('tab', { name: 'Sign in' })

    expect(signInTab).toHaveAttribute('aria-selected', 'true')
    expect(createAccountTab).toHaveAttribute('aria-selected', 'false')

    // Click Create account tab
    fireEvent.click(createAccountTab)

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Start building your perfect day.' })).toBeInTheDocument()
      expect(createAccountTab).toHaveAttribute('aria-selected', 'true')
      expect(signInTab).toHaveAttribute('aria-selected', 'false')
    })

    // Click Sign in tab
    fireEvent.click(signInTab)

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Plan your day, beautifully.' })).toBeInTheDocument()
      expect(signInTab).toHaveAttribute('aria-selected', 'true')
    })
  })

  it('announces mode changes to screen readers via aria-live status', async () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('status')).toHaveTextContent('Showing sign in form')

    const toggleLink = screen.getAllByRole('link', { name: 'Create an account' })[0]
    fireEvent.click(toggleLink)

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('Showing create account form')
    })
  })

  it('switches back to sign in when clicking Sign in link in sign up mode', async () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { level: 1, name: 'Start building your perfect day.' })).toBeInTheDocument()

    const signInLink = screen.getAllByRole('link', { name: 'Sign in' })[0]
    fireEvent.click(signInLink)

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Plan your day, beautifully.' })).toBeInTheDocument()
    })
  })
})
