import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import TodayProgressCard from './TodayProgressCard.jsx'

describe('TodayProgressCard', () => {
  const items = [{ id: 1, label: 'Plan the day' }, { id: 2, label: 'Drink water' }]

  it('completes the next unchecked item in one tap', () => {
    const onToggle = vi.fn()
    render(<TodayProgressCard items={items} checkedIds={new Set([1])} onToggle={onToggle} />)

    fireEvent.click(screen.getByRole('button', { name: /complete drink water/i }))
    expect(onToggle).toHaveBeenCalledWith(2)
    expect(screen.getByText('50%')).toBeInTheDocument()
  })

  it('shows the completed state without another action', () => {
    render(<TodayProgressCard items={items} checkedIds={new Set([1, 2])} />)
    expect(screen.getByText('All done')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
