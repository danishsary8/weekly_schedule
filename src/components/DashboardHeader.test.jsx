import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import DashboardHeader from './DashboardHeader.jsx'

const base = {
  dateLabel: 'Saturday, September 19, 2026',
  dateShortLabel: 'Sat, Sep 19',
  isViewingToday: true,
  accentColor: '#0F766E',
  userName: 'Danish Khan',
  onOpenProfile: vi.fn(),
}

const heading = () => screen.getByRole('heading', { level: 1 })

describe('DashboardHeader', () => {
  it('makes the day’s workload the headline, not the product name', () => {
    render(<DashboardHeader {...base} blockCount={6} />)

    expect(heading()).toHaveTextContent('You have 6 blocks today.')
    // The wordmark stays, but as a quiet line rather than the h1.
    expect(screen.getByText('Daycraft').tagName).toBe('P')
  })

  it('pluralises a single block', () => {
    render(<DashboardHeader {...base} blockCount={1} />)

    expect(heading()).toHaveTextContent('You have 1 block today.')
  })

  it('does not promise anything about today when previewing another routine', () => {
    render(<DashboardHeader {...base} isViewingToday={false} blockCount={4} />)

    expect(heading()).toHaveTextContent('4 blocks in this routine.')
    expect(heading()).not.toHaveTextContent('today')
  })

  it('distinguishes an empty day from an empty routine', () => {
    const { rerender } = render(<DashboardHeader {...base} blockCount={0} />)
    expect(heading()).toHaveTextContent('Nothing planned today.')

    rerender(<DashboardHeader {...base} isViewingToday={false} blockCount={0} />)
    expect(heading()).toHaveTextContent('This routine is empty.')
  })

  it('stays neutral while the routine is still loading', () => {
    // blockCount is null until the fetch lands; claiming "0 blocks" would be a lie.
    render(<DashboardHeader {...base} blockCount={null} />)

    expect(heading()).toHaveTextContent('Your day, in order.')
  })

  it('accepts an explicit statement for screens where counts are not the point', () => {
    render(<DashboardHeader {...base} blockCount={0} statement="Let’s build your first routine." />)

    expect(heading()).toHaveTextContent('Let’s build your first routine.')
  })

  it('carries no routine control — that lives in the content flow', () => {
    render(<DashboardHeader {...base} blockCount={2} />)

    expect(screen.queryByRole('button', { name: /routine/i })).not.toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(1)
  })

  it('keeps the profile entry point', () => {
    const onOpenProfile = vi.fn()
    render(<DashboardHeader {...base} blockCount={2} onOpenProfile={onOpenProfile} />)

    screen.getByRole('button', { name: 'Open profile and settings' }).click()

    expect(onOpenProfile).toHaveBeenCalled()
  })

  it('offers both date lengths so the phone line never wraps to three', () => {
    render(<DashboardHeader {...base} blockCount={2} />)

    expect(screen.getByText('Sat, Sep 19')).toBeInTheDocument()
    expect(screen.getByText('Saturday, September 19, 2026')).toBeInTheDocument()
  })
})
