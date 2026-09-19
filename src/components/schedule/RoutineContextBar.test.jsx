import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import RoutineContextBar from './RoutineContextBar.jsx'

const ROUTINE = { id: 1, name: 'Weekday mornings', color: '#0F766E', weekdays: [1, 2, 3, 4, 5] }

describe('RoutineContextBar', () => {
  it('states the routine, its days and its size in one reachable row', () => {
    render(<RoutineContextBar routine={ROUTINE} blockCount={6} onOpen={vi.fn()} />)

    const control = screen.getByRole('button')
    expect(control).toHaveAccessibleName('Change routine. Showing Weekday mornings, Mon · Tue · Wed · Thu · Fri, 6 blocks')
    expect(control).toHaveTextContent('Weekday mornings')
    expect(control).toHaveTextContent('Mon · Tue · Wed · Thu · Fri · 6 blocks')
  })

  it('says "Change" in words rather than relying on a chevron alone', () => {
    render(<RoutineContextBar routine={ROUTINE} blockCount={1} onOpen={vi.fn()} />)

    expect(screen.getByRole('button')).toHaveTextContent('Change')
  })

  it('pluralises a single block', () => {
    render(<RoutineContextBar routine={ROUTINE} blockCount={1} onOpen={vi.fn()} />)

    expect(screen.getByRole('button')).toHaveTextContent('1 block')
    expect(screen.getByRole('button')).not.toHaveTextContent('1 blocks')
  })

  it('leaves "today" to the header so long names keep their width', () => {
    render(<RoutineContextBar routine={ROUTINE} blockCount={2} onOpen={vi.fn()} />)

    // The header states Today/Preview for this same routine one line above.
    expect(screen.getByRole('button')).not.toHaveTextContent('Today')
  })

  it('opens the routine list when tapped anywhere on the row', () => {
    const onOpen = vi.fn()
    render(<RoutineContextBar routine={ROUTINE} blockCount={2} onOpen={onOpen} />)

    fireEvent.click(screen.getByRole('button'))

    expect(onOpen).toHaveBeenCalled()
  })

  it('survives a routine that has not loaded yet', () => {
    render(<RoutineContextBar routine={null} onOpen={vi.fn()} />)

    expect(screen.getByRole('button')).toHaveAccessibleName('Change routine. Showing Routine, No weekdays yet, 0 blocks')
  })
})
