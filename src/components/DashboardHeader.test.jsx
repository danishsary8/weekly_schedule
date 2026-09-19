import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import DashboardHeader from './DashboardHeader.jsx'

const base = {
  dayName: 'Today’s routine',
  dayType: 'Weekdays',
  dateLabel: 'Friday, September 18, 2026',
  isViewingToday: true,
  accentColor: '#0F766E',
  userName: 'Danish Khan',
}

describe('DashboardHeader', () => {
  it('names the current routine on the switcher and says what the button does', () => {
    render(<DashboardHeader {...base} onOpenRoutines={vi.fn()} onOpenProfile={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Switch or manage routines. Showing Weekdays' })).toBeInTheDocument()
  })

  it('opens the routine sheet when tapped', () => {
    const onOpenRoutines = vi.fn()
    render(<DashboardHeader {...base} onOpenRoutines={onOpenRoutines} onOpenProfile={vi.fn()} />)

    screen.getByRole('button', { name: /Switch or manage routines/ }).click()

    expect(onOpenRoutines).toHaveBeenCalled()
  })

  it('omits the switcher when no handler is supplied, so first-run has no dead control', () => {
    render(<DashboardHeader {...base} onOpenProfile={vi.fn()} />)

    expect(screen.queryByRole('button', { name: /Switch or manage routines/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open profile and settings' })).toBeInTheDocument()
  })

  it('states the routine name exactly once, so it is not read twice', () => {
    render(<DashboardHeader {...base} onOpenRoutines={vi.fn()} onOpenProfile={vi.fn()} />)

    // The visible name is aria-hidden inside the button, and the stamped copy
    // that used to sit below the title is gone.
    expect(screen.queryAllByText('Weekdays')).toHaveLength(1)
    expect(screen.getByText('Weekdays')).toHaveAttribute('aria-hidden', 'true')
  })

  it('keeps the profile entry point', () => {
    const onOpenProfile = vi.fn()
    render(<DashboardHeader {...base} onOpenRoutines={vi.fn()} onOpenProfile={onOpenProfile} />)

    screen.getByRole('button', { name: 'Open profile and settings' }).click()

    expect(onOpenProfile).toHaveBeenCalled()
  })
})
