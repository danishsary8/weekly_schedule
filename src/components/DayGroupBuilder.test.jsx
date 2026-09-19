import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import DayGroupBuilder from './DayGroupBuilder.jsx'
import { createChecklistItem, createDayGroup, createTimelineEntry } from '../api/services.js'

vi.mock('../api/services.js', () => ({ createDayGroup: vi.fn(), createTimelineEntry: vi.fn(), createChecklistItem: vi.fn() }))

describe('day-group creation', () => {
  beforeEach(() => {
    createDayGroup.mockResolvedValue({ id: 21 })
    createTimelineEntry.mockResolvedValue({ id: 31 })
    createChecklistItem.mockResolvedValue({ id: 41 })
  })
  it('creates a group, first block, and optional habits', async () => {
    const onComplete = vi.fn()
    render(<DayGroupBuilder onComplete={onComplete} />)
    fireEvent.change(screen.getByLabelText(/routine name/i), { target: { value: 'Work days' } })
    fireEvent.change(screen.getByLabelText(/block description/i), { target: { value: 'Deep work' } })
    fireEvent.change(screen.getByLabelText(/checklist items/i), { target: { value: 'Plan day\nReview notes' } })
    fireEvent.click(screen.getByRole('button', { name: /create my routine/i }))
    await waitFor(() => expect(onComplete).toHaveBeenCalledWith(21))
    expect(createDayGroup).toHaveBeenCalledWith(expect.objectContaining({ name: 'Work days' }))
    expect(createTimelineEntry).toHaveBeenCalledWith(21, expect.objectContaining({ description: 'Deep work' }))
    expect(createChecklistItem).toHaveBeenCalledTimes(2)
  })
  it('sends a hand-picked accent colour as the six digits the API accepts', async () => {
    render(<DayGroupBuilder onComplete={vi.fn()} />)
    fireEvent.change(screen.getByLabelText(/routine name/i), { target: { value: 'Work days' } })
    fireEvent.change(screen.getByLabelText(/block description/i), { target: { value: 'Deep work' } })

    fireEvent.click(screen.getByRole('radio', { name: 'Choose a custom colour' }))
    fireEvent.change(screen.getByLabelText('Hex code'), { target: { value: '#abc' } })
    fireEvent.click(screen.getByRole('button', { name: /create my routine/i }))

    // Shorthand must arrive expanded: the API validates ^#[0-9A-Fa-f]{6}$.
    await waitFor(() => expect(createDayGroup).toHaveBeenCalledWith(expect.objectContaining({ color: '#AABBCC' })))
  })

  it('keeps submission disabled while required input is missing', () => {
    render(<DayGroupBuilder />)
    expect(screen.getByRole('button', { name: /create my routine/i })).toBeDisabled()
    expect(createDayGroup).not.toHaveBeenCalled()
  })
})
