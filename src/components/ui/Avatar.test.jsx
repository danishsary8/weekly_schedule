import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Avatar, { initialFrom } from './Avatar.jsx'

describe('initialFrom', () => {
  it('uses the first character, uppercased', () => {
    expect(initialFrom('danish')).toBe('D')
    expect(initialFrom('Ayesha Khan')).toBe('A')
  })

  it('ignores leading whitespace', () => {
    expect(initialFrom('   omar')).toBe('O')
  })

  it('falls back for empty, blank and non-string input', () => {
    for (const value of ['', '   ', null, undefined, 42, {}]) {
      expect(initialFrom(value)).toBe('U')
    }
  })
})

describe('Avatar', () => {
  it('renders the initial and stays out of the accessibility tree', () => {
    // The surrounding control carries the label, so the decorative initial
    // must not be announced separately.
    const { container } = render(<Avatar name="Danish" />)
    expect(screen.getByText('D')).toBeInTheDocument()
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })

  it('applies the accent colour', () => {
    const { container } = render(<Avatar name="Danish" color="#E11D48" />)
    expect(container.firstChild).toHaveStyle({ backgroundColor: '#E11D48' })
  })

  it('falls back to a valid size for an unknown size token', () => {
    const { container } = render(<Avatar name="Danish" size="enormous" />)
    // md is the documented default.
    expect(container.firstChild.className).toContain('h-14')
  })
})
