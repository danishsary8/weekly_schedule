import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { KeyRound } from 'lucide-react'
import SettingsRow from './SettingsRow.jsx'

const withRouter = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>)

describe('SettingsRow', () => {
  it('renders an internal link for `to` and supplies a navigation chevron', () => {
    withRouter(<SettingsRow icon={KeyRound} label="Change password" to="/password/forgot" />)

    const link = screen.getByRole('link', { name: /change password/i })
    expect(link).toHaveAttribute('href', '/password/forgot')
  })

  it('renders a safe external anchor for `href`', () => {
    withRouter(<SettingsRow label="Docs" href="https://example.com/docs" />)

    const link = screen.getByRole('link', { name: /docs/i })
    expect(link).toHaveAttribute('target', '_blank')
    // Prevents reverse-tabnabbing on the opened tab.
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
  })

  it('renders a button for `onClick` and reports taps', () => {
    const onClick = vi.fn()
    withRouter(<SettingsRow label="Sign out" onClick={onClick} />)

    fireEvent.click(screen.getByRole('button', { name: /sign out/i }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('is inert when given no destination or handler', () => {
    withRouter(<SettingsRow label="Read only" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.getByText('Read only')).toBeInTheDocument()
  })

  it('shows the description as a secondary line', () => {
    withRouter(<SettingsRow label="Change password" description="We’ll email you a secure link" to="/x" />)
    expect(screen.getByText(/we’ll email you a secure link/i)).toBeInTheDocument()
  })

  it('prefers a custom trailing slot over the chevron', () => {
    withRouter(<SettingsRow label="Language" to="/x" trailing="English" />)
    expect(screen.getByText('English')).toBeInTheDocument()
  })

  it('blocks interaction while loading and shows progress', () => {
    const onClick = vi.fn()
    withRouter(<SettingsRow label="Resend email" onClick={onClick} loading />)

    const button = screen.getByRole('button', { name: /resend email/i })
    expect(button).toBeDisabled()
    fireEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
    expect(screen.getByText('Working…')).toBeInTheDocument()
  })

  it('downgrades a disabled link to a non-navigable row', () => {
    withRouter(<SettingsRow label="Unavailable" to="/x" disabled />)
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})
