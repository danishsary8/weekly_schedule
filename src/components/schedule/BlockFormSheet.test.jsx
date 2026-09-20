import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import BlockFormSheet from './BlockFormSheet.jsx'

function choose(columnName, optionName) {
  fireEvent.click(within(screen.getByRole('listbox', { name: columnName })).getByRole('option', { name: optionName }))
}

describe('BlockFormSheet alarm-style time picker', () => {
  it('submits alarm-wheel choices in the same 24-hour API format', async () => {
    const onSubmit = vi.fn().mockResolvedValue(true)
    const onClose = vi.fn()
    render(<BlockFormSheet open onSubmit={onSubmit} onClose={onClose} />)

    fireEvent.change(screen.getByLabelText('What will you do?'), { target: { value: 'Evening study' } })

    fireEvent.click(screen.getByRole('button', { name: 'Set start time, currently 9:00 AM' }))
    choose('Start hour', '07')
    choose('Start minute', '45')
    choose('Start period', 'PM')
    fireEvent.click(screen.getByRole('button', { name: 'Done' }))

    fireEvent.click(screen.getByRole('button', { name: 'Set end time, currently 10:00 AM' }))
    choose('End hour', '09')
    choose('End minute', '15')
    choose('End period', 'PM')

    fireEvent.click(screen.getByRole('button', { name: 'Add block' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({
      start: '19:45',
      end: '21:15',
      description: 'Evening study',
      category: 'Life',
    }))
    expect(onClose).toHaveBeenCalled()
  })

  it('seeds edit mode from the existing block without opening a wheel', () => {
    render(
      <BlockFormSheet
        open
        entry={{ id: 7, start: '23:30', end: '06:15', description: 'Sleep', category: 'Rest' }}
        onSubmit={() => {}}
        onClose={() => {}}
      />,
    )

    expect(screen.getByRole('button', { name: 'Set start time, currently 11:30 PM' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Set end time, currently 6:15 AM' })).toBeInTheDocument()
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})
