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
    fireEvent.change(screen.getByLabelText(/group name/i), { target: { value: 'Work days' } })
    fireEvent.change(screen.getByLabelText(/block description/i), { target: { value: 'Deep work' } })
    fireEvent.change(screen.getByLabelText(/checklist items/i), { target: { value: 'Plan day\nReview notes' } })
    fireEvent.click(screen.getByRole('button', { name: /create routine/i }))
    await waitFor(() => expect(onComplete).toHaveBeenCalledWith(21))
    expect(createDayGroup).toHaveBeenCalledWith(expect.objectContaining({ name: 'Work days' }))
    expect(createTimelineEntry).toHaveBeenCalledWith(21, expect.objectContaining({ description: 'Deep work' }))
    expect(createChecklistItem).toHaveBeenCalledTimes(2)
  })
  it('prevents partial writes when required input is missing', () => {
    render(<DayGroupBuilder />)
    fireEvent.click(screen.getByRole('button', { name: /create routine/i }))
    expect(screen.getByRole('alert')).toHaveTextContent(/name your group/i)
    expect(createDayGroup).not.toHaveBeenCalled()
  })
})
