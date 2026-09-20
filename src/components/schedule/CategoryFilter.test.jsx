import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import CategoryFilter, { ALL_CATEGORIES } from './CategoryFilter.jsx'

const block = (id, category) => ({ id, category, start: '09:00', end: '10:00', description: `Block ${id}` })

const chipNames = () => screen.getAllByRole('button').map((button) => button.getAttribute('aria-label'))

describe('CategoryFilter', () => {
  it('offers All plus only the categories actually in the routine', () => {
    render(<CategoryFilter schedule={[block(1, 'Career'), block(2, 'Career'), block(3, 'Rest')]} onChange={() => {}} />)

    // Unused categories are dead ends: tapping them can only produce an empty
    // list, and on a phone they push the useful chips off-screen.
    expect(chipNames()).toEqual(['All, 3 blocks', 'Career, 2 blocks', 'Rest, 1 block'])
    expect(screen.queryByRole('button', { name: /^Health/ })).not.toBeInTheDocument()
  })

  it('keeps the configured display order rather than first-seen order', () => {
    render(<CategoryFilter schedule={[block(1, 'Rest'), block(2, 'Career'), block(3, 'Health')]} onChange={() => {}} />)

    expect(chipNames()).toEqual(['All, 3 blocks', 'Career, 1 block', 'Health, 1 block', 'Rest, 1 block'])
  })

  it('hides itself when there is nothing to narrow', () => {
    // One category filtered by that same category is not a choice.
    const { container, rerender } = render(<CategoryFilter schedule={[block(1, 'Career')]} onChange={() => {}} />)
    expect(container).toBeEmptyDOMElement()

    rerender(<CategoryFilter schedule={[]} onChange={() => {}} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('stays visible while a filter is applied so it can be undone', () => {
    /*
     * Switching routines can leave a selection that matches nothing here. Hiding
     * the row would strand the user on an empty plan with no visible control.
     */
    render(<CategoryFilter schedule={[block(1, 'Career')]} value="Health" onChange={() => {}} />)

    expect(screen.getByRole('button', { name: 'All, 1 block' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Health, 0 blocks' })).toBeInTheDocument()
  })

  it('treats a block with no category as Life so the counts always add up', () => {
    render(<CategoryFilter schedule={[block(1, null), block(2, 'Career')]} onChange={() => {}} />)

    expect(screen.getByRole('button', { name: 'Life, 1 block' })).toBeInTheDocument()
  })

  it('keeps a retired category reachable for historical blocks', () => {
    render(<CategoryFilter schedule={[block(1, 'Faith'), block(2, 'Life')]} onChange={() => {}} />)

    expect(chipNames()).toEqual(['All, 2 blocks', 'Life, 1 block', 'Faith, 1 block'])
  })

  it('marks the selected chip as pressed and reports changes', () => {
    const onChange = vi.fn()
    render(<CategoryFilter schedule={[block(1, 'Career'), block(2, 'Rest')]} value="Career" onChange={onChange} />)

    expect(screen.getByRole('button', { name: 'Career, 1 block' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'All, 2 blocks' })).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(screen.getByRole('button', { name: 'All, 2 blocks' }))
    expect(onChange).toHaveBeenCalledWith(ALL_CATEGORIES)
  })
})
