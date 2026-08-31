import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import NowCard from './NowCard.jsx'

/** 2026-08-31 11:37 local — the situation in the reported mobile screenshot. */
const LATE_MORNING = new Date(2026, 7, 31, 11, 37).getTime()
const DURING_FIRST_BLOCK = new Date(2026, 7, 31, 5, 0).getTime()

const morningBlock = { id: 1, start: '04:40', end: '05:30', description: 'Get up, do housework', category: 'Life' }
const eveningBlock = { id: 2, start: '19:00', end: '20:00', description: 'Chinese class', category: 'Language' }

describe('NowCard', () => {
  describe('another day’s routine', () => {
    it('pluralises the block count correctly', () => {
      const { rerender } = render(
        <NowCard schedule={[morningBlock]} isViewingToday={false} dayName="Routine preview" dayType="Pray" />,
      )
      expect(screen.getByText(/1 block\./)).toBeInTheDocument()
      expect(screen.queryByText(/1 blocks/)).not.toBeInTheDocument()

      rerender(<NowCard schedule={[morningBlock, eveningBlock]} isViewingToday={false} dayName="Routine preview" dayType="Pray" />)
      expect(screen.getByText(/2 blocks\./)).toBeInTheDocument()
    })

    it('invites the user to switch to today', () => {
      render(<NowCard schedule={[morningBlock]} isViewingToday={false} dayName="Routine preview" dayType="Pray" />)
      expect(screen.getByText(/switch to today/i)).toBeInTheDocument()
    })
  })

  describe('today with nothing running', () => {
    it('never tells the user to switch to today', () => {
      render(<NowCard schedule={[morningBlock]} liveId={null} isViewingToday dayName="Today’s routine" dayType="Pray" nowTs={LATE_MORNING} />)
      expect(screen.queryByText(/switch to today/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/preview/i)).not.toBeInTheDocument()
    })

    it('surfaces the next block instead of a dead end', () => {
      render(<NowCard schedule={[morningBlock, eveningBlock]} liveId={null} isViewingToday dayName="Today’s routine" dayType="Pray" nowTs={LATE_MORNING} />)
      expect(screen.getByText('Up next')).toBeInTheDocument()
      expect(screen.getByText('Chinese class')).toBeInTheDocument()
      expect(screen.getByText(/nothing running right now/i)).toBeInTheDocument()
    })

    it('counts down only inside the near-term window, otherwise states the time', () => {
      // 19:00 is ~7h away from 11:37, so a countdown would be noise.
      const { rerender } = render(
        <NowCard schedule={[eveningBlock]} liveId={null} isViewingToday nowTs={LATE_MORNING} />,
      )
      expect(screen.getByText(/starts at 7:00 PM/i)).toBeInTheDocument()

      // At 17:30 the same block is 1h 30m away, which is worth counting down.
      rerender(<NowCard schedule={[eveningBlock]} liveId={null} isViewingToday nowTs={new Date(2026, 7, 31, 17, 30).getTime()} />)
      expect(screen.getByText(/starts in 1h 30m/i)).toBeInTheDocument()
    })

    it('wraps to the next day so an early block is still "next" at night', () => {
      render(<NowCard schedule={[morningBlock]} liveId={null} isViewingToday nowTs={new Date(2026, 7, 31, 23, 0).getTime()} />)
      expect(screen.getByText('Up next')).toBeInTheDocument()
      expect(screen.getByText(/get up, do housework/i)).toBeInTheDocument()
    })

    it('stays calm when the routine has no blocks at all', () => {
      render(<NowCard schedule={[]} liveId={null} isViewingToday nowTs={LATE_MORNING} />)
      expect(screen.getByText(/nothing scheduled yet/i)).toBeInTheDocument()
    })
  })

  describe('today with a live block', () => {
    it('shows live progress for the running block', () => {
      render(<NowCard schedule={[morningBlock, eveningBlock]} liveId={1} isViewingToday nowTs={DURING_FIRST_BLOCK} />)
      expect(screen.getByText('Happening now')).toBeInTheDocument()
      expect(screen.getByText('Get up, do housework')).toBeInTheDocument()
      // 04:40 -> 05:00 is 20 minutes into a 50 minute block.
      expect(screen.getByText('20m in')).toBeInTheDocument()
      expect(screen.getByText('30m left')).toBeInTheDocument()
    })

    it('shows the following block as next', () => {
      render(<NowCard schedule={[morningBlock, eveningBlock]} liveId={1} isViewingToday nowTs={DURING_FIRST_BLOCK} />)
      expect(screen.getByText('Next')).toBeInTheDocument()
      expect(screen.getByText('Chinese class')).toBeInTheDocument()
    })

    it('omits "next" for a single-block routine instead of pointing at itself', () => {
      render(<NowCard schedule={[morningBlock]} liveId={1} isViewingToday nowTs={DURING_FIRST_BLOCK} />)
      expect(screen.getByText('Happening now')).toBeInTheDocument()
      expect(screen.queryByText('Next')).not.toBeInTheDocument()
      // The live description must appear exactly once, not twice.
      expect(screen.getAllByText('Get up, do housework')).toHaveLength(1)
    })
  })
})
