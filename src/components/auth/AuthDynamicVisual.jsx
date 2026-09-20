import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion'
import { Check, Sparkles } from 'lucide-react'

/**
 * AuthDynamicVisual
 *
 * A luxury-feeling, dynamic layered visual representing Daycraft's core concept:
 * routine blocks in category colors (Career teal, Health sage, Language rose, Life warm gray, Rest dusty blue),
 * time markers, and progress ticks.
 *
 * Features:
 * - Desktop mouse parallax using spring-smoothed motion values (disabled when prefers-reduced-motion is on).
 * - Drifting routine chip and pulsing teal checkmark badge.
 * - Perfectly crisp SVG and CSS vectors matching Daycraft's warm cream/taupe palette.
 */
export default function AuthDynamicVisual({ className = '' }) {
  const reduceMotion = useReducedMotion()
  const containerRef = useRef(null)
  const [canHover, setCanHover] = useState(false)

  // Mouse position normalized relative to center of container (-100 to 100)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  // Smooth springs for fluid, luxurious parallax physics
  const springConfig = { stiffness: 120, damping: 18, mass: 0.8 }
  const smoothX = useSpring(mouseX, springConfig)
  const smoothY = useSpring(mouseY, springConfig)

  // Subtle parallax offsets per layer depth
  const backCardX = useTransform(smoothX, [-100, 100], [-8, 8])
  const backCardY = useTransform(smoothY, [-100, 100], [-6, 6])

  const mainCardX = useTransform(smoothX, [-100, 100], [5, -5])
  const mainCardY = useTransform(smoothY, [-100, 100], [4, -4])

  const floatingChipX = useTransform(smoothX, [-100, 100], [-14, 14])
  const floatingChipY = useTransform(smoothY, [-100, 100], [-10, 10])

  const badgeX = useTransform(smoothX, [-100, 100], [12, -12])
  const badgeY = useTransform(smoothY, [-100, 100], [10, -10])

  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      const media = window.matchMedia('(hover: hover) and (pointer: fine)')
      setCanHover(media.matches)
      const listener = (e) => setCanHover(e.matches)
      media.addEventListener?.('change', listener)
      return () => media.removeEventListener?.('change', listener)
    }
  }, [])

  const handleMouseMove = (e) => {
    if (reduceMotion || !canHover || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2
    mouseX.set((x / (rect.width / 2)) * 100)
    mouseY.set((y / (rect.height / 2)) * 100)
  }

  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }

  const enableParallax = !reduceMotion && canHover

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative mx-auto flex w-full max-w-[340px] select-none items-center justify-center p-2 py-4 sm:max-w-[360px] ${className}`}
      aria-hidden="true"
    >
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute -inset-6 rounded-full bg-career/12 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-4 -left-4 h-32 w-32 rounded-full bg-[#E11D48]/10 blur-2xl" />

      {/* LAYER 1: Angled background card giving depth */}
      <motion.div
        style={enableParallax ? { x: backCardX, y: backCardY } : undefined}
        className="absolute inset-x-4 top-2 h-64 rounded-3xl border border-black/10 bg-[#EDE4DB] shadow-sm transform -rotate-3"
      />

      {/* LAYER 2: Main schedule card */}
      <motion.div
        style={enableParallax ? { x: mainCardX, y: mainCardY } : undefined}
        className="relative z-10 w-full rounded-3xl border border-black/10 bg-white/90 p-4 sm:p-5 shadow-card backdrop-blur-md"
      >
        {/* Card Header: Weekday tabs & intent */}
        <div className="mb-3.5 flex items-center justify-between border-b border-black/5 pb-2.5">
          <div className="flex items-center gap-1.5">
            {['M', 'T', 'W', 'T', 'F'].map((day, i) => (
              <span
                key={day + i}
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                  i === 2 ? 'bg-ink text-white shadow-xs' : 'bg-cream text-ink/50'
                }`}
              >
                {day}
              </span>
            ))}
          </div>
          <span className="flex items-center gap-1 font-display text-xs font-semibold text-career">
            <Sparkles className="h-3 w-3" /> Focus Mode
          </span>
        </div>

        {/* Routine Category Blocks */}
        <div className="space-y-2">
          {/* Block 1: Health sage */}
          <div className="flex items-center justify-between rounded-xl border border-[#5E7964]/25 bg-[#5E7964]/10 px-3 py-1.5 transition-colors">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#5E7964]" />
              <div>
                <p className="font-sans text-xs font-bold text-ink">Morning Meditation</p>
                <p className="font-sans text-[10px] text-ink/60">07:30 AM • 20m</p>
              </div>
            </div>
            <span className="rounded-md bg-[#5E7964]/20 px-1.5 py-0.5 font-sans text-[10px] font-semibold text-[#3b5240]">
              Done ✓
            </span>
          </div>

          {/* Block 2: Career teal */}
          <div className="flex items-center justify-between rounded-xl border border-career/30 bg-career/12 px-3 py-1.5">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-career" />
              <div>
                <p className="font-sans text-xs font-bold text-career">Deep Focus & Work</p>
                <p className="font-sans text-[10px] text-career/75">09:00 AM • 90m</p>
              </div>
            </div>
            <span className="flex items-center gap-1 rounded-md bg-career px-2 py-0.5 font-sans text-[10px] font-bold text-white shadow-xs">
              Now
            </span>
          </div>

          {/* Block 3: Language rose */}
          <div className="flex items-center justify-between rounded-xl border border-[#E11D48]/20 bg-[#E11D48]/8 px-3 py-1.5">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#E11D48]" />
              <div>
                <p className="font-sans text-xs font-bold text-ink">Spanish Practice</p>
                <p className="font-sans text-[10px] text-ink/60">01:15 PM • 25m</p>
              </div>
            </div>
            <span className="font-sans text-[10px] text-ink/40">Next</span>
          </div>

          {/* Block 4: Rest dusty blue */}
          <div className="flex items-center justify-between rounded-xl border border-[#7C8B9C]/20 bg-[#7C8B9C]/8 px-3 py-1.5">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#7C8B9C]" />
              <div>
                <p className="font-sans text-xs font-bold text-ink/85">Evening Reading</p>
                <p className="font-sans text-[10px] text-ink/50">08:30 PM • 30m</p>
              </div>
            </div>
            <span className="font-sans text-[10px] text-ink/40">Tonight</span>
          </div>
        </div>
      </motion.div>

      {/* LAYER 3: Drifting floating routine chip */}
      <motion.div
        style={enableParallax ? { x: floatingChipX, y: floatingChipY } : undefined}
        animate={
          reduceMotion
            ? undefined
            : {
                y: [0, -6, 0],
              }
        }
        transition={{
          repeat: Infinity,
          duration: 3.8,
          ease: 'easeInOut',
        }}
        className="absolute -top-1 -right-2 z-20 hidden sm:flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 py-2 shadow-elevated"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-career text-white shadow-xs">
          <Check className="h-3.5 w-3.5 stroke-[2.5]" />
        </span>
        <div className="text-left">
          <p className="font-sans text-[11px] font-bold text-ink">3-day streak!</p>
          <p className="font-sans text-[9px] text-ink/55">Routines sticking</p>
        </div>
      </motion.div>

      {/* LAYER 4: Pulsing teal checkmark emblem */}
      <motion.div
        style={enableParallax ? { x: badgeX, y: badgeY } : undefined}
        animate={
          reduceMotion
            ? undefined
            : {
                scale: [1, 1.05, 1],
              }
        }
        transition={{
          repeat: Infinity,
          duration: 2.8,
          ease: 'easeInOut',
        }}
        className="absolute -bottom-2 -right-1 z-20 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-career to-[#094e49] text-white shadow-lg ring-4 ring-white"
      >
        <Check className="h-6 w-6 stroke-[3]" />
      </motion.div>
    </div>
  )
}
