import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import CategoryFilter, { ALL_CATEGORIES } from './CategoryFilter.jsx'
import { CATEGORY_KEYS } from '../../config/categories.js'

const block = (id, category) => ({ id, category, start: '09:00', end: '10:00', description: `Block ${id}` })

describe('CategoryFilter', () => {
  it('always offers All plus every selectable category, even for an empty routine', () => {
    render(<CategoryFilter schedule={[]} onChange={() => {}} />)

    // The row is a stable nav: it must not shrink or disappear when the routine
    // happens to use only one category.
    for (const label of ['All', ...CATEGORY_KEYS]) {
      expect(screen.getByRole('button', { name: new RegExp(`^${label},`) })).toBeInTheDocument()
    }
    expect(screen.getAllByRole('button')).toHaveLength(CATEGORY_KEYS.length + 1)
  })

  it('counts the blocks in each category, pluralising for screen readers', () => {
    render(<CategoryFilter schedule={[block(1, 'Career'), block(2, 'Career'), block(3, 'Rest')]} onChange={() => {}} />)

    expect(screen.getByRole('button', { name: 'Career, 2 blocks' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Rest, 1 block' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'All, 3 blocks' })).toBeInTheDocument()

    // An empty category stays tappable — it lands on the caller's empty message
    // rather than being a dead end — and says how empty it is.
    expect(screen.getByRole('button', { name: 'Health, 0 blocks' })).toBeInTheDocument()
  })

  it('treats a block with no category as Life so the counts always add up', () => {
    render(<CategoryFilter schedule={[block(1, null)]} onChange={() => {}} />)

    expect(screen.getByRole('button', { name: 'Life, 1 block' })).toBeInTheDocument()
  })

  it('appends a retired category still present on historical blocks', () => {
    render(<CategoryFilter schedule={[block(1, 'Faith'), block(2, 'Life')]} onChange={() => {}} />)

    const labels = screen.getAllByRole('button').map((button) => button.textContent)
    expect(labels).toEqual(['All2', 'Career0', 'Health0', 'Language0', 'Life1', 'Rest0', 'Faith1'])
  })

  it('marks the selected chip as pressed and reports changes', () => {
    const onChange = vi.fn()
    render(<CategoryFilter schedule={[block(1, 'Career')]} value="Career" onChange={onChange} />)

    expect(screen.getByRole('button', { name: 'Career, 1 block' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'All, 1 block' })).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(screen.getByRole('button', { name: 'All, 1 block' }))
    expect(onChange).toHaveBeenCalledWith(ALL_CATEGORIES)
  })
})
