import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import LoginPage from './LoginPage.jsx'
import RegisterPage from './RegisterPage.jsx'
import { useAuthStore } from '../store/authStore.js'
import toast from 'react-hot-toast'

vi.mock('../store/authStore.js', () => ({
  useAuthStore: vi.fn(),
}))

vi.mock('../api/services.js', () => ({
  fetchGoogleRedirectUrl: vi.fn().mockResolvedValue({ url: 'https://accounts.google.com' }),
}))

vi.mock('react-hot-toast', () => ({
  default: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
  }),
}))

describe('LoginPage and Progressive Two-Panel Auth Flow with Panel Swap', () => {
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

  it('renders all required two-panel layout elements, script tagline, and copy verbatim on Sign In', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )

    // Left Panel: Logo, Headline, Subtext, Real Visual Container, Tagline, 3 Benefit Bullets, Footer
    expect(screen.getByText('Daycraft')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Plan your day, beautifully.' })).toBeInTheDocument()
    expect(screen.getByText('Sign in to pick up right where you left off.')).toBeInTheDocument()
    expect(screen.getByTestId('brand-visual-container')).toBeInTheDocument()
    expect(screen.getByText('Made for days that matter.')).toBeInTheDocument()
    expect(screen.getByText('Build routines that actually stick')).toBeInTheDocument()
    expect(screen.getByText('See your whole day, at a glance')).toBeInTheDocument()
    expect(screen.getByText('Free to start, no clutter')).toBeInTheDocument()

    // Right Panel: Form starts directly with Step Progress Bar
    expect(screen.getByLabelText('Step 1 of 2')).toBeInTheDocument()

    // Step 1: Email input, Toggle without 'instead', Continue button
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Use phone number' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument()

    // Social logins & Divider
    expect(screen.getByText(/^or$/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continue with facebook/i })).toBeInTheDocument()

    // Mode switch link & Disclaimer
    expect(screen.getByRole('link', { name: 'Create an account' })).toBeInTheDocument()
    expect(screen.getByText(/If Google creates a new account for you/i)).toBeInTheDocument()

    // Footer links
    expect(screen.getAllByText(new RegExp(`© ${new Date().getFullYear()} Daycraft`)).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByRole('link', { name: 'Privacy Policy' }).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByRole('link', { name: 'Terms of Service' }).length).toBeGreaterThanOrEqual(1)
  })

  it('swaps between Email and Phone number inputs using the toggle', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )

    // Initially Email input
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument()

    // Toggle to Phone number
    fireEvent.click(screen.getByRole('button', { name: 'Use phone number' }))
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/^email$/i)).not.toBeInTheDocument()

    // Toggle back to Email
    fireEvent.click(screen.getByRole('button', { name: 'Use email' }))
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument()
  })

  it('validates email format before progressing to Step 2 in Sign In', async () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )

    // Click continue with empty email
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    expect(screen.getByText('Please enter your email.')).toBeInTheDocument()

    // Enter invalid format
    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'notanemail' } })
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    expect(screen.getByText('Please enter a valid email address.')).toBeInTheDocument()

    // Enter valid email and continue to step 2
    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'user@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))

    // Await step 2 controls
    const passwordInput = await screen.findByLabelText(/^password$/i)
    expect(passwordInput).toBeInTheDocument()
    expect(screen.getByLabelText('Step 2 of 2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Forgot password?' })).toBeInTheDocument()
  })

  it('allows navigating back from Step 2 to Step 1 without losing entered email', async () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'remember@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))

    // Wait for step 2 button to appear
    const changeBtn = await screen.findByRole('button', { name: /change email/i })
    expect(changeBtn).toBeInTheDocument()

    // Click back / change email link
    fireEvent.click(changeBtn)

    // Await step 1 email input to reappear
    const emailInput = await screen.findByLabelText(/^email$/i)
    expect(screen.getByLabelText('Step 1 of 2')).toBeInTheDocument()
    expect(emailInput).toHaveValue('remember@example.com')
  })

  it('submits credentials through auth store on Sign In completion', async () => {
    mockLogin.mockResolvedValueOnce({ name: 'Danish Khan' })

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )

    // Step 1: Identifier
    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'test@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))

    // Step 2: Password
    const passwordInput = await screen.findByLabelText(/^password$/i)
    fireEvent.change(passwordInput, { target: { value: 'secret123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'secret123',
      })
    })
  })

  it('progresses through all 3 steps of Sign Up and preserves entered data backward and forward', async () => {
    mockRegister.mockResolvedValueOnce({ name: 'Sarah Connor' })

    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    )

    // Header & Step 1
    expect(screen.getByRole('heading', { level: 1, name: 'Start building your perfect day.' })).toBeInTheDocument()
    expect(screen.getByText('Create your account and make routines that stick.')).toBeInTheDocument()
    expect(screen.getByLabelText('Step 1 of 3')).toBeInTheDocument()

    // Step 1: Name validation
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    expect(screen.getByText('Please enter your name.')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/^name$/i), { target: { value: 'Sarah Connor' } })
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))

    // Step 2: Email validation
    const emailInput = await screen.findByLabelText(/^email$/i)
    expect(screen.getByLabelText('Step 2 of 3')).toBeInTheDocument()

    fireEvent.change(emailInput, { target: { value: 'sarah@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))

    // Step 3: Password & Confirm password & Checkbox
    const passwordInput = await screen.findByLabelText(/^password$/i)
    expect(screen.getByLabelText('Step 3 of 3')).toBeInTheDocument()
    expect(screen.getByLabelText(/^confirm password$/i)).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /agree to the terms/i })).toBeInTheDocument()

    // Navigate BACK to Step 2 -> verify email preserved
    fireEvent.click(screen.getByRole('button', { name: /back/i }))
    const emailStep2 = await screen.findByLabelText(/^email$/i)
    expect(emailStep2).toHaveValue('sarah@example.com')

    // Navigate BACK to Step 1 -> verify name preserved
    fireEvent.click(screen.getByRole('button', { name: /back to name/i }))
    const nameStep1 = await screen.findByLabelText(/^name$/i)
    expect(nameStep1).toHaveValue('Sarah Connor')

    // Advance forward again to Step 3
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    const emailStep2Again = await screen.findByLabelText(/^email$/i)
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))

    const passwordStep3Again = await screen.findByLabelText(/^password$/i)
    // Fill passwords and submit
    fireEvent.change(passwordStep3Again, { target: { value: 'Terminator84!' } })
    fireEvent.change(screen.getByLabelText(/^confirm password$/i), { target: { value: 'Terminator84!' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        name: 'Sarah Connor',
        email: 'sarah@example.com',
        password: 'Terminator84!',
        passwordConfirmation: 'Terminator84!',
      })
    })
  })

  it('validates matching passwords on client side in Sign Up Step 3', async () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    )

    // Step 1 -> Step 2 -> Step 3
    fireEvent.change(screen.getByLabelText(/^name$/i), { target: { value: 'Kyle Reese' } })
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))

    const emailInput = await screen.findByLabelText(/^email$/i)
    fireEvent.change(emailInput, { target: { value: 'kyle@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))

    const passwordInput = await screen.findByLabelText(/^password$/i)
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(screen.getByLabelText(/^confirm password$/i), { target: { value: 'different123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))

    expect(await screen.findByText('Passwords do not match.')).toBeInTheDocument()
    expect(mockRegister).not.toHaveBeenCalled()
  })

  it('triggers placeholder notification when clicking Facebook button', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )

    const facebookButton = screen.getByRole('button', { name: /continue with facebook/i })
    fireEvent.click(facebookButton)

    expect(toast).toHaveBeenCalledWith(
      expect.stringMatching(/facebook sign-in is coming soon/i),
      expect.any(Object),
    )
  })

  it('swaps panels between Sign In and Sign Up modes via bottom link', async () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { level: 1, name: 'Plan your day, beautifully.' })).toBeInTheDocument()

    // Click "Create an account"
    fireEvent.click(screen.getByRole('link', { name: 'Create an account' }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Start building your perfect day.' })).toBeInTheDocument()
      expect(screen.getByLabelText('Step 1 of 3')).toBeInTheDocument()
    })

    // Click "Sign in"
    fireEvent.click(screen.getByRole('link', { name: 'Sign in' }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Plan your day, beautifully.' })).toBeInTheDocument()
      expect(screen.getByLabelText('Step 1 of 2')).toBeInTheDocument()
    })
  })
})
