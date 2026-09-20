import { useState } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import TimeRangePicker, { timeParts, toTimeValue } from './TimeRangePicker.jsx'

function Harness({ initialStart = '09:00', initialEnd = '10:00' }) {
  const [start, setStart] = useState(initialStart)
  const [end, setEnd] = useState(initialEnd)
  return <TimeRangePicker start={start} end={end} onStartChange={setStart} onEndChange={setEnd} />
}

describe('alarm time conversion', () => {
  it('maps midnight and noon without swapping the period', () => {
    expect(timeParts('00:05')).toEqual({ hour: 12, minute: 5, period: 'AM' })
    expect(timeParts('12:45')).toEqual({ hour: 12, minute: 45, period: 'PM' })
  })

  it('maps the alarm wheel back to the API 24-hour format', () => {
    expect(toTimeValue({ hour: 12, minute: 5, period: 'AM' })).toBe('00:05')
    expect(toTimeValue({ hour: 12, minute: 45, period: 'PM' })).toBe('12:45')
    expect(toTimeValue({ hour: 9, minute: 7, period: 'PM' })).toBe('21:07')
  })
})

describe('TimeRangePicker', () => {
  it('opens the start wheel with the current alarm time selected', () => {
    render(<Harness />)

    fireEvent.click(screen.getByRole('button', { name: 'Set start time, currently 9:00 AM' }))

    expect(screen.getByRole('region', { name: 'Set start time' })).toBeInTheDocument()
    expect(within(screen.getByRole('listbox', { name: 'Start hour' })).getByRole('option', { name: '09' })).toHaveAttribute('aria-selected', 'true')
    expect(within(screen.getByRole('listbox', { name: 'Start minute' })).getByRole('option', { name: '00' })).toHaveAttribute('aria-selected', 'true')
    expect(within(screen.getByRole('listbox', { name: 'Start period' })).getByRole('option', { name: 'AM' })).toHaveAttribute('aria-selected', 'true')
  })

  it('changes hour, minute, and period while preserving the API value', () => {
    render(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: 'Set start time, currently 9:00 AM' }))

    fireEvent.click(within(screen.getByRole('listbox', { name: 'Start hour' })).getByRole('option', { name: '10' }))
    fireEvent.click(within(screen.getByRole('listbox', { name: 'Start minute' })).getByRole('option', { name: '30' }))
    fireEvent.click(within(screen.getByRole('listbox', { name: 'Start period' })).getByRole('option', { name: 'PM' }))

    expect(screen.getByRole('button', { name: 'Set start time, currently 10:30 PM' })).toBeInTheDocument()
  })

  it('keeps only one wheel open when switching from start to end', () => {
    render(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: /Set start time/ }))
    fireEvent.click(screen.getByRole('button', { name: /Set end time/ }))

    expect(screen.queryByRole('region', { name: 'Set start time' })).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Set end time' })).toBeInTheDocument()
  })

  it('closes from Done and returns to the two compact controls', () => {
    render(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: /Set end time/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Done' }))

    expect(screen.queryByRole('region', { name: /Set end time/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Set end time, currently 10:00 AM' })).toHaveAttribute('aria-expanded', 'false')
  })

  it('supports arrow-key adjustment without creating sixty tab stops', () => {
    render(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: /Set start time/ }))
    const minutes = screen.getByRole('listbox', { name: 'Start minute' })

    fireEvent.keyDown(minutes, { key: 'ArrowDown' })

    expect(screen.getByRole('button', { name: 'Set start time, currently 9:01 AM' })).toBeInTheDocument()
    expect(within(minutes).getAllByRole('option').every((option) => option.tabIndex === -1)).toBe(true)
  })

  it('shows validation next to the correct compact control', () => {
    render(<TimeRangePicker start="" end="10:00" onStartChange={() => {}} onEndChange={() => {}} startError="Choose a start time." />)

    expect(screen.getByRole('alert')).toHaveTextContent('Choose a start time.')
    expect(screen.getByRole('button', { name: /Set start time/ })).toHaveAttribute('aria-invalid', 'true')
  })
})
