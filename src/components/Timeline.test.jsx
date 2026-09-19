import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import Timeline from './Timeline.jsx'

const block = (id, overrides = {}) => ({
  id,
  start: '09:00',
  end: '10:30',
  description: `Block ${id}`,
  category: 'Career',
  ...overrides,
})

describe('Timeline', () => {
  it('counts the day in its section header', () => {
    render(<Timeline schedule={[block(1), block(2)]} />)

    expect(screen.getByText('2 blocks today')).toBeInTheDocument()
  })

  it('pluralises one block and says so when the day is empty', () => {
    const { rerender } = render(<Timeline schedule={[block(1)]} />)
    expect(screen.getByText('1 block today')).toBeInTheDocument()

    rerender(<Timeline schedule={[]} />)
    expect(screen.getByText('Nothing here yet')).toBeInTheDocument()
  })

  it('puts Add in the header, reachable without scrolling the whole day', () => {
    const onAdd = vi.fn()
    render(<Timeline schedule={[block(1), block(2), block(3)]} onAdd={onAdd} />)

    fireEvent.click(screen.getByRole('button', { name: 'Add' }))

    expect(onAdd).toHaveBeenCalled()
  })

  it('hides Add entirely when the caller supplies no handler', () => {
    // Unverified accounts cannot mutate, so there must be no dead control.
    render(<Timeline schedule={[block(1)]} />)

    expect(screen.queryByRole('button', { name: 'Add' })).not.toBeInTheDocument()
  })

  it('shows the caller’s empty message when a filter matches nothing', () => {
    render(<Timeline schedule={[]} emptyMessage="No Rest blocks in this routine." />)

    expect(screen.getByText('No Rest blocks in this routine.')).toBeInTheDocument()
  })

  it('leads each card with what the block is, then when it runs', () => {
    render(<Timeline schedule={[block(1, { description: 'Deep work on the API' })]} onSelectEntry={vi.fn()} />)

    const card = screen.getByRole('button', { name: /Deep work on the API/ })
    const text = card.textContent

    // Description before the clock: the time is the thing a user already knows.
    expect(text.indexOf('Deep work on the API')).toBeLessThan(text.indexOf('9:00'))
    expect(card).toHaveTextContent('1h 30m')
  })

  it('tints every card from its own category rather than its list position', () => {
    // The old version rotated black/white/taupe by index, so the same category
    // looked different on consecutive rows and the fill meant nothing.
    render(
      <Timeline
        schedule={[block(1), block(2), block(3), block(4, { category: 'Rest' })]}
        onSelectEntry={vi.fn()}
      />,
    )

    const fills = screen.getAllByRole('button', { name: /Block/ }).map((card) => card.style.backgroundColor)

    expect(new Set(fills.slice(0, 3)).size).toBe(1)
    expect(fills[3]).not.toBe(fills[0])
  })
})
