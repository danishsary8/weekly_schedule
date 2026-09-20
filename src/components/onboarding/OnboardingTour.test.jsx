import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import OnboardingTour, { TOUR_STEPS } from './OnboardingTour.jsx'
import { hasCompletedTour, markTourComplete, resetTour, tourFlagKey } from './tourState.js'

describe('tourState', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('generates the expected scoped key', () => {
    expect(tourFlagKey(42)).toBe('tour-done-42')
  })

  it('marks tour complete and verifies with hasCompletedTour', () => {
    expect(hasCompletedTour(42)).toBe(false)
    markTourComplete(42)
    expect(hasCompletedTour(42)).toBe(true)
  })

  it('resets the tour flag when resetTour is called', () => {
    markTourComplete(42)
    expect(hasCompletedTour(42)).toBe(true)
    resetTour(42)
    expect(hasCompletedTour(42)).toBe(false)
  })

  it('returns true if userId is falsy to prevent unauthenticated infinite loops', () => {
    expect(hasCompletedTour(null)).toBe(true)
    expect(hasCompletedTour(undefined)).toBe(true)
  })
})

describe('OnboardingTour', () => {
  beforeEach(() => {
    // Mock scrollIntoView for jsdom
    Element.prototype.scrollIntoView = vi.fn()
  })

  it('renders nothing when run is false', () => {
    const { container } = render(<OnboardingTour run={false} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the first step when run is true', () => {
    render(<OnboardingTour run />)

    expect(screen.getByRole('dialog', { name: 'Product tour' })).toBeInTheDocument()
    expect(screen.getByText('Step 1 of 5')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Your Routines')
    expect(screen.getByText(TOUR_STEPS[0].content)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Skip tour' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument()
  })

  it('steps forward with Next and backward with Back', () => {
    render(<OnboardingTour run />)

    // Step 1 -> Step 2
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByText('Step 2 of 5')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Category Filter')

    // Step 2 -> Back to Step 1
    fireEvent.click(screen.getByRole('button', { name: /back/i }))
    expect(screen.getByText('Step 1 of 5')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Your Routines')
  })

  it('reaches the final step with Got it and triggers onFinish(true)', () => {
    const onFinish = vi.fn()
    render(<OnboardingTour run onFinish={onFinish} />)

    // Step through to step 5
    for (let i = 0; i < 4; i++) {
      fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    }

    expect(screen.getByText('Step 5 of 5')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Profile & Settings')
    const finishBtn = screen.getByRole('button', { name: 'Got it' })
    expect(finishBtn).toBeInTheDocument()

    fireEvent.click(finishBtn)
    expect(onFinish).toHaveBeenCalledWith(true)
  })

  it('calls onFinish(false) when Skip tour is clicked', () => {
    const onFinish = vi.fn()
    render(<OnboardingTour run onFinish={onFinish} />)

    fireEvent.click(screen.getByRole('button', { name: 'Skip tour' }))
    expect(onFinish).toHaveBeenCalledWith(false)
  })

  it('calls onFinish(false) when Escape is pressed', () => {
    const onFinish = vi.fn()
    render(<OnboardingTour run onFinish={onFinish} />)

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onFinish).toHaveBeenCalledWith(false)
  })

  it('navigates with arrow keys', () => {
    render(<OnboardingTour run />)

    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByText('Step 2 of 5')).toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(screen.getByText('Step 1 of 5')).toBeInTheDocument()
  })

  it('includes all required tour targets', () => {
    const targetIds = TOUR_STEPS.map((s) => s.id)
    expect(targetIds).toContain('routines')
    expect(targetIds).toContain('category-filter')
    expect(targetIds).toContain('routine-block')
    expect(targetIds).toContain('mark-complete')
    expect(targetIds).toContain('profile')
  })

  it('clamps tooltip position and width within mobile 375px viewport', () => {
    window.innerWidth = 375
    window.innerHeight = 667

    // Mock target element positioned near the far right edge of mobile screen
    const targetEl = document.createElement('div')
    targetEl.setAttribute('data-tour', 'routines')
    targetEl.getBoundingClientRect = () => ({
      top: 20,
      bottom: 60,
      left: 320,
      right: 360,
      width: 40,
      height: 40,
    })
    document.body.appendChild(targetEl)

    render(<OnboardingTour run />)

    const dialog = screen.getByRole('dialog', { name: 'Product tour' })
    const card = dialog.querySelector('.rounded-2xl')
    expect(card).toBeInTheDocument()

    // Width should be clamped to at most 340 and max (375 - 32) = 343 -> 340px
    const cardWidth = parseInt(card.style.width, 10)
    expect(cardWidth).toBeLessThanOrEqual(375 - 32)

    document.body.removeChild(targetEl)
  })
})

