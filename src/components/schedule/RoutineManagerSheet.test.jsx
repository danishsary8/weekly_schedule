import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import RoutineManagerSheet from './RoutineManagerSheet.jsx'

const GROUPS = [
  { id: 1, name: 'Weekdays', color: '#0F766E', weekdays: [1, 2, 3, 4, 5] },
  { id: 2, name: 'Pray time', color: '#7C8B9C', weekdays: [0, 6] },
]

/** The row that switches to a routine, as opposed to its settings button. */
const row = (name) => screen.getByRole('button', { name: new RegExp(`^Show ${name}`) })

const setup = (props = {}) => {
  const handlers = {
    onSelect: vi.fn(),
    onEditRoutine: vi.fn(),
    onCreateRoutine: vi.fn(),
    onClose: vi.fn(),
  }
  render(<RoutineManagerSheet open groups={GROUPS} selectedId={1} todayGroupIds={[1]} {...handlers} {...props} />)
  return handlers
}

describe('RoutineManagerSheet', () => {
  it('renders nothing until opened', () => {
    render(<RoutineManagerSheet open={false} groups={GROUPS} selectedId={1} />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('lists every routine with the days it runs on', () => {
    setup()

    expect(row('Weekdays')).toHaveTextContent('Mon · Tue · Wed · Thu · Fri')
    expect(row('Pray time')).toHaveTextContent('Sun · Sat')
  })

  it('marks the routine on screen and the one assigned to today', () => {
    setup()

    expect(row('Weekdays')).toHaveAttribute('aria-current', 'true')
    expect(row('Weekdays')).toHaveAccessibleName('Show Weekdays, Mon · Tue · Wed · Thu · Fri, today, currently showing')

    expect(row('Pray time')).not.toHaveAttribute('aria-current')
    expect(row('Pray time')).toHaveAccessibleName('Show Pray time, Sun · Sat')
  })

  it('reports the routine the user taps', () => {
    const { onSelect } = setup()

    fireEvent.click(row('Pray time'))

    expect(onSelect).toHaveBeenCalledWith(2)
  })

  it('passes the whole routine to the settings handler, including one not on screen', () => {
    const { onEditRoutine } = setup()

    fireEvent.click(screen.getByRole('button', { name: 'Settings for Pray time' }))

    // The settings sheet is fed from this list, not from the loaded routine, so
    // a routine the user has not switched to is still editable.
    expect(onEditRoutine).toHaveBeenCalledWith(GROUPS[1])
  })

  it('offers routine creation', () => {
    const { onCreateRoutine } = setup()

    fireEvent.click(screen.getByRole('button', { name: /New routine/ }))

    expect(onCreateRoutine).toHaveBeenCalled()
  })

  it('withholds every mutating control from an unverified account', () => {
    setup({ canManage: false })

    expect(screen.queryByRole('button', { name: /New routine/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Settings for/ })).not.toBeInTheDocument()
    expect(screen.getByText('Verify your email to add or change routines.')).toBeInTheDocument()

    // Switching is a read, so it stays available.
    expect(row('Pray time')).toBeInTheDocument()
  })

  it('explains an empty list rather than showing a bare panel', () => {
    setup({ groups: [] })

    expect(screen.getByText('You don’t have any routines yet.')).toBeInTheDocument()
  })
})
