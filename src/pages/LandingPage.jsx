import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, BellRing, CalendarCheck, Check, CheckCircle2, Clock3, Layers3, LockKeyhole, MapPin, Palette, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import PublicFooter from '../components/PublicFooter.jsx'

const ease = [0.22, 1, 0.36, 1]

function Reveal({ children, className = '', delay = 0 }) {
  const reduced = useReducedMotion()
  return <motion.div className={className} initial={reduced ? { opacity: 1 } : { opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .18 }} transition={{ duration: reduced ? 0 : .58, delay: reduced ? 0 : delay, ease }}>{children}</motion.div>
}

const steps = [
  [Layers3, 'Build your routine', 'Group the days that share a rhythm, then add the blocks and habits that matter.'],
  [CheckCircle2, 'Check off as you go', 'Keep today’s habits visible and watch your daily progress move forward.'],
  [Clock3, 'Know what’s happening now', 'A live highlight brings the current block forward, with the rest of your day in view.'],
  [Palette, 'Make it yours', 'Rename, recolor, add, edit, or remove things as your routine changes.'],
]

const features = [
  [Layers3, 'bg-ink text-white', 'text-career', 'Your days, grouped your way', 'Create as many custom day groups as you need and assign them to any weekdays.'],
  [Sparkles, 'bg-paper text-ink ring-1 ring-black/10', 'text-notice', 'A clear “happening now” view', 'Live progress and the next block help you focus on the present without losing the bigger picture.'],
  [BellRing, 'bg-taupe text-ink', 'text-ink', 'Optional browser reminders', 'Choose whether Daycraft should nudge you before a scheduled block and how much notice you want.'],
  [MapPin, 'bg-paper text-ink ring-1 ring-black/10', 'text-notice', 'Optional location-aware times', 'Bring location-aware time information into your day when it helps, or keep planning without it.'],
  [LockKeyhole, 'bg-ink text-white', 'text-health', 'Account essentials built in', 'Email verification, password recovery, Google sign-in, and permanent account deletion are ready.'],
  [CalendarCheck, 'bg-taupe text-ink', 'text-career', 'Calm on every screen', 'A responsive, keyboard-friendly interface keeps routines comfortable on mobile, tablet, and desktop.'],
]

function ProductMockup() {
  const habits = [['Plan the day', true, '#0F766E'], ['Move for 30 minutes', true, '#65A30D'], ['Read a chapter', false, '#E11D48']]
  return <div className="relative mx-auto w-full max-w-[620px]" aria-label="Preview of the Daycraft routine dashboard">
    <div className="absolute -inset-8 -z-10 rounded-full bg-career/15 blur-3xl" aria-hidden="true" />
    <div className="overflow-hidden rounded-[28px] bg-paper p-3 shadow-[0_28px_70px_-30px_rgba(26,26,26,.45)] ring-1 ring-black/10 sm:p-5">
      <div className="flex items-center justify-between border-b border-black/[.07] px-1 pb-3"><div><p className="font-display text-2xl font-bold leading-none sm:text-3xl">Today</p><p className="mt-1 font-sans text-label font-semibold uppercase tracking-eyebrow text-ink/45">My weekday rhythm</p></div><span className="rounded-full bg-career/10 px-3 py-1 font-sans text-label font-bold uppercase text-career">On track</span></div>
      <div className="mt-4 grid gap-3 sm:grid-cols-[.82fr_1.18fr]">
        <div className="rounded-card bg-cream p-4 ring-1 ring-black/[.06]">
          <div className="flex items-center justify-between gap-3"><p className="font-display text-2xl font-bold">Daily checklist</p><span className="font-sans text-label font-bold text-career">2 of 3</span></div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/10"><div className="h-full w-2/3 rounded-full bg-career" /></div>
          <ul className="mt-3 space-y-2">{habits.map(([label, done, color]) => <li key={label} className={`flex min-h-10 items-center gap-2 rounded-xl bg-white px-3 font-sans text-label font-semibold ring-1 ring-black/[.05] ${done ? 'text-ink/45' : 'text-ink'}`}><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2" style={{ borderColor: color, backgroundColor: done ? color : 'transparent' }}>{done && <Check className="h-3 w-3 text-white" strokeWidth={3} />}</span><span className={done ? 'line-through' : ''}>{label}</span></li>)}</ul>
        </div>
        <div className="space-y-2.5">
          <div className="relative overflow-hidden rounded-card bg-ink p-4 text-white shadow-[0_0_0_2px_rgba(15,118,110,.75),0_16px_30px_-18px_rgba(15,118,110,.9)]"><span className="absolute inset-y-0 left-0 w-1.5 bg-career" /><div className="flex items-center justify-between gap-2"><span className="font-sans text-label font-bold uppercase tracking-eyebrow text-white/65">9:00 AM – 11:00 AM</span><span className="flex items-center gap-1 rounded-full bg-career px-2 py-0.5 font-sans text-label font-bold uppercase"><span className="h-1.5 w-1.5 rounded-full bg-white" /> Now</span></div><p className="mt-2 font-sans text-sm font-bold sm:text-base">Focused project work</p><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/15"><div className="h-full w-[58%] rounded-full bg-career" /></div></div>
          <div className="relative overflow-hidden rounded-[18px] bg-white p-3.5 ring-1 ring-black/[.08]"><span className="absolute inset-y-0 left-0 w-1 bg-life" /><span className="font-sans text-label font-bold uppercase tracking-eyebrow text-ink/45">11:00 AM – 12:00 PM · Next</span><p className="mt-1 font-sans text-xs font-bold">Lunch and reset</p></div>
          <div className="relative overflow-hidden rounded-[18px] bg-taupe p-3.5"><span className="absolute inset-y-0 left-0 w-1 bg-rest" /><span className="font-sans text-label font-bold uppercase tracking-eyebrow text-ink/55">1:00 PM – 2:00 PM</span><p className="mt-1 font-sans text-xs font-bold">Learn something useful</p></div>
        </div>
      </div>
    </div>
  </div>
}

export default function LandingPage() {
  return <div className="min-h-viewport overflow-hidden bg-cream text-ink">
    <header className="relative z-30 border-b border-black/[.06] bg-cream/90 backdrop-blur-md"><nav aria-label="Main navigation" className="mx-auto flex min-h-nav max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8"><Link to="/" aria-label="Daycraft home" className="display-title text-3xl sm:text-4xl">Daycraft</Link><div className="flex items-center gap-2 sm:gap-3"><Link to="/login" className="inline-flex min-h-11 items-center rounded-xl px-3 font-sans text-sm font-semibold text-ink/70 transition-colors hover:bg-black/5 hover:text-ink sm:px-4">Log in</Link><Link to="/register" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-ink px-4 font-sans text-sm font-bold text-white shadow-card transition-transform hover:-translate-y-0.5 sm:px-5">Get started <ArrowRight className="h-4 w-4" /></Link></div></nav></header>
    <main>
      <section className="relative px-4 pb-20 pt-16 sm:px-6 sm:pb-24 sm:pt-20 lg:px-8 lg:pb-28 lg:pt-24"><div className="pointer-events-none absolute inset-0" aria-hidden="true"><div className="absolute -left-40 top-0 h-[32rem] w-[32rem] rounded-full bg-career/[.08] blur-3xl" /><div className="absolute -right-40 top-20 h-[28rem] w-[28rem] rounded-full bg-notice/10 blur-3xl" /></div><div className="relative mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[.88fr_1.12fr] lg:gap-16"><Reveal><p className="font-sans text-xs font-bold uppercase tracking-stamp text-career">A calmer daily routine planner</p><h1 className="mt-5 display-title text-6xl sm:text-7xl lg:text-[6.5rem]">Daycraft</h1><p className="mt-4 max-w-xl font-display text-3xl font-semibold leading-tight sm:text-4xl">Craft your day, one routine at a time.</p><p className="mt-5 max-w-xl font-sans text-base leading-7 text-ink/65 sm:text-lg sm:leading-8">Build custom weekly routines, follow what matters right now, and track your daily progress without turning planning into more noise.</p><div className="mt-8 flex flex-col gap-3 sm:flex-row"><Link to="/register" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-ink px-6 font-sans text-sm font-bold text-white shadow-lift transition-transform hover:-translate-y-0.5">Get started free <ArrowRight className="h-4 w-4" /></Link><a href="#how-it-works" className="inline-flex min-h-12 items-center justify-center rounded-2xl px-6 font-sans text-sm font-bold ring-1 ring-black/20 transition-colors hover:bg-white/60">See how it works</a></div><p className="mt-4 font-sans text-xs text-ink/45">Start with a blank canvas. Build only the routine you need.</p></Reveal><Reveal delay={.12}><ProductMockup /></Reveal></div></section>

      <section id="how-it-works" aria-labelledby="how-title" className="scroll-mt-6 bg-ink px-4 py-20 text-white sm:px-6 sm:py-24 lg:px-8"><div className="mx-auto max-w-7xl"><Reveal className="max-w-2xl"><p className="font-sans text-xs font-bold uppercase tracking-stamp text-career">How it works</p><h2 id="how-title" className="mt-3 display-title text-4xl sm:text-5xl">A routine that fits real life</h2><p className="mt-4 font-sans text-sm leading-7 text-white/60 sm:text-base">Set up your week once, then keep shaping it as your days change.</p></Reveal><ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{steps.map(([Icon, title, copy], index) => <Reveal key={title} delay={index * .06}><li className="h-full rounded-card bg-white/[.07] p-5 ring-1 ring-white/10"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-ink"><Icon className="h-5 w-5" /></span><p className="mt-5 font-sans text-label font-bold uppercase tracking-eyebrow text-career">Step {index + 1}</p><h3 className="mt-2 font-sans text-base font-bold">{title}</h3><p className="mt-2 font-sans text-sm leading-6 text-white/60">{copy}</p></li></Reveal>)}</ol></div></section>

      <section aria-labelledby="features-title" className="px-4 py-20 sm:px-6 sm:py-24 lg:px-8"><div className="mx-auto max-w-7xl"><Reveal className="mx-auto max-w-2xl text-center"><p className="font-sans text-xs font-bold uppercase tracking-stamp text-career">Built for everyday use</p><h2 id="features-title" className="mt-3 display-title text-4xl sm:text-5xl">Everything your routine needs. Nothing it doesn’t.</h2></Reveal><div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{features.map(([Icon, tone, accent, title, copy], index) => <Reveal key={title} delay={(index % 3) * .05}><article className={`h-full rounded-card p-6 shadow-card ${tone}`}><Icon className={`h-6 w-6 ${accent}`} /><h3 className="mt-6 font-sans text-lg font-bold">{title}</h3><p className={`mt-2 font-sans text-sm leading-6 ${tone.includes('text-white') ? 'text-white/65' : 'text-ink/65'}`}>{copy}</p></article></Reveal>)}</div></div></section>

      <section className="px-4 pb-20 sm:px-6 sm:pb-24 lg:px-8"><Reveal className="mx-auto max-w-5xl overflow-hidden rounded-[28px] bg-career px-6 py-12 text-center text-white shadow-lift sm:px-12 sm:py-16"><h2 className="display-title text-4xl sm:text-5xl">Your day is yours to shape.</h2><p className="mx-auto mt-4 max-w-xl font-sans text-sm leading-7 text-white/80 sm:text-base">Start with one day group, add what matters, and build a rhythm you can actually return to.</p><Link to="/register" className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-6 font-sans text-sm font-bold text-ink shadow-card transition-transform hover:-translate-y-0.5">Build your first routine <ArrowRight className="h-4 w-4" /></Link></Reveal></section>
    </main>
    <div className="border-t border-black/[.07] px-4 pb-6 sm:px-6"><PublicFooter showContact /></div>
  </div>
}
