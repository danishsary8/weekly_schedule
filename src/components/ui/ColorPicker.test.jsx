import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ColorPicker from './ColorPicker.jsx'
import { CATEGORY_COLORS } from '../../config/categories.js'

const hexField = () => screen.getByLabelText('Hex code')

describe('ColorPicker', () => {
  it('offers every preset plus a custom option', () => {
    render(<ColorPicker value={CATEGORY_COLORS[0]} onChange={() => {}} />)

    for (const preset of CATEGORY_COLORS) {
      expect(screen.getByRole('radio', { name: `Use colour ${preset}` })).toBeInTheDocument()
    }
    expect(screen.getByRole('radio', { name: 'Choose a custom colour' })).toBeInTheDocument()
  })

  it('reports the preset the user picks and leaves the custom panel closed', () => {
    const onChange = vi.fn()
    render(<ColorPicker value={CATEGORY_COLORS[0]} onChange={onChange} />)

    fireEvent.click(screen.getByRole('radio', { name: `Use colour ${CATEGORY_COLORS[2]}` }))

    expect(onChange).toHaveBeenCalledWith(CATEGORY_COLORS[2])
    expect(screen.queryByLabelText('Hex code')).not.toBeInTheDocument()
  })

  it('opens in custom mode when the stored colour is not a preset', () => {
    // A routine saved with a hand-picked colour must not appear unselected.
    render(<ColorPicker value="#7c3aed" onChange={() => {}} />)

    expect(screen.getByRole('radio', { name: 'Choose a custom colour' })).toBeChecked()
    expect(hexField()).toHaveValue('#7C3AED')
  })

  it('carries the current preset into the field when custom is chosen', () => {
    const onChange = vi.fn()
    render(<ColorPicker value={CATEGORY_COLORS[1]} onChange={onChange} />)

    fireEvent.click(screen.getByRole('radio', { name: 'Choose a custom colour' }))

    expect(hexField()).toHaveValue(CATEGORY_COLORS[1])
    expect(onChange).toHaveBeenLastCalledWith(CATEGORY_COLORS[1])
  })

  it('emits a normalised six-digit colour from shorthand input', () => {
    const onChange = vi.fn()
    render(<ColorPicker value="#7C3AED" onChange={onChange} />)

    fireEvent.change(hexField(), { target: { value: '#abc' } })

    // The API rejects #abc, so the component must widen it before reporting.
    expect(onChange).toHaveBeenLastCalledWith('#AABBCC')
  })

  it('stays quiet while a hex is still being typed', () => {
    const onChange = vi.fn()
    render(<ColorPicker value="#7C3AED" onChange={onChange} />)
    onChange.mockClear()

    fireEvent.change(hexField(), { target: { value: '#7C3A' } })

    expect(onChange).not.toHaveBeenCalled()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('explains an unusable value on blur without reporting it', () => {
    const onChange = vi.fn()
    render(<ColorPicker value="#7C3AED" onChange={onChange} />)
    onChange.mockClear()

    fireEvent.change(hexField(), { target: { value: 'teal-ish' } })
    fireEvent.blur(hexField())

    expect(screen.getByRole('alert')).toHaveTextContent('Enter a colour like #7C3AED.')
    expect(hexField()).toHaveAttribute('aria-invalid', 'true')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('tidies a valid but scruffy value on blur', () => {
    render(<ColorPicker value="#7C3AED" onChange={() => {}} />)

    fireEvent.change(hexField(), { target: { value: 'abc' } })
    fireEvent.blur(hexField())

    expect(hexField()).toHaveValue('#AABBCC')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('reports colours chosen from the native wheel', () => {
    const onChange = vi.fn()
    render(<ColorPicker value="#7C3AED" onChange={onChange} />)

    fireEvent.change(screen.getByLabelText('Open the colour wheel'), { target: { value: '#123456' } })

    expect(onChange).toHaveBeenLastCalledWith('#123456')
  })

  it('keeps the radio groups independent when two pickers share a page', () => {
    render(
      <>
        <ColorPicker value={CATEGORY_COLORS[0]} onChange={() => {}} name="first" legend="First" />
        <ColorPicker value={CATEGORY_COLORS[1]} onChange={() => {}} name="second" legend="Second" />
      </>,
    )

    const checked = screen.getAllByRole('radio').filter((radio) => radio.checked)
    expect(checked).toHaveLength(2)
  })
})
