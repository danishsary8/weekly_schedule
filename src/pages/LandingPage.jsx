import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, BellRing, CalendarCheck, Check, CheckCircle2, Clock3, Layers3, LockKeyhole, MapPin, Megaphone, Palette, Sparkles, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import PublicFooter from '../components/PublicFooter.jsx'
import TextLoop from '../components/TextLoop.jsx'
import GradientText from '../components/GradientText.jsx'
import DepthText from '../components/DepthText.jsx'

const ease = [0.22, 1, 0.36, 1]

function Reveal({ children, className = '', delay = 0 }) {
  const reduced = useReducedMotion()
  return <motion.div className={className} initial={reduced ? { opacity: 1 } : { opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .18 }} transition={{ duration: reduced ? 0 : .58, delay: reduced ? 0 : delay, ease }}>{children}</motion.div>
}

const steps = [
  {
    Icon: Layers3,
    title: 'Build your routine',
    copy: 'Group the days that share a rhythm, then add the blocks and habits that matter.',
    accent: 'text-career',
    icon: 'bg-career text-white shadow-[0_10px_24px_-12px_rgba(15,118,110,.9)]',
    border: 'border-l-career/70',
  },
  {
    Icon: CheckCircle2,
    title: 'Check off as you go',
    copy: 'Keep today’s habits visible and watch your daily progress move forward.',
    accent: 'text-[#8A6B00]',
    icon: 'bg-notice text-ink shadow-[0_10px_24px_-12px_rgba(201,162,39,.9)]',
    border: 'border-l-notice/80',
  },
  {
    Icon: Clock3,
    title: 'Know what’s happening now',
    copy: 'A live highlight brings the current block forward, with the rest of your day in view.',
    accent: 'text-[#536477]',
    icon: 'bg-rest text-white shadow-[0_10px_24px_-12px_rgba(124,139,156,.9)]',
    border: 'border-l-rest/80',
  },
  {
    Icon: Palette,
    title: 'Make it yours',
    copy: 'Rename, recolor, add, edit, or remove things as your routine changes.',
    accent: 'text-language',
    icon: 'bg-language text-white shadow-[0_10px_24px_-12px_rgba(225,29,72,.8)]',
    border: 'border-l-language/70',
  },
]

const features = [
  {
    Icon: Layers3,
    title: 'Your days, grouped your way',
    copy: 'Create as many custom day groups as you need and assign them to any weekdays.',
    card: 'bg-white text-ink',
    icon: 'bg-career/10 text-career ring-career/20',
    body: 'text-ink/70',
    edge: 'border-t-career',
  },
  {
    Icon: Sparkles,
    title: 'A clear “happening now” view',
    copy: 'Live progress and the next block help you focus on the present without losing the bigger picture.',
    card: 'bg-[#FFF8E7] text-ink',
    icon: 'bg-[#E6F0D3] text-[#4D6B20] ring-[#9BB86A]/30',
    body: 'text-ink/70',
    edge: 'border-t-[#9BB86A]',
  },
  {
    Icon: BellRing,
    title: 'Optional browser reminders',
    copy: 'Choose whether Loomora should nudge you before a scheduled block and how much notice you want.',
    card: 'bg-[#E5F3F1] text-ink',
    icon: 'bg-white/80 text-[#0F766E] ring-[#0F766E]/25',
    body: 'text-ink/70',
    edge: 'border-t-[#49A99F]',
  },
  {
    Icon: MapPin,
    title: 'Optional location-aware times',
    copy: 'Bring location-aware time information into your day when it helps, or keep planning without it.',
    card: 'bg-[#F1EEEA] text-ink',
    icon: 'bg-white/80 text-[#625B55] ring-[#625B55]/20',
    body: 'text-ink/70',
    edge: 'border-t-[#A59A90]',
  },
  {
    Icon: LockKeyhole,
    title: 'Account essentials built in',
    copy: 'Email verification, password recovery, Google sign-in, and permanent account deletion are ready.',
    card: 'bg-ink text-white',
    icon: 'bg-white/10 text-white ring-white/15',
    body: 'text-white/75',
    edge: 'border-t-[#8CC8BE]',
  },
  {
    Icon: CalendarCheck,
    title: 'Calm on every screen',
    copy: 'A responsive, keyboard-friendly interface keeps routines comfortable on mobile, tablet, and desktop.',
    card: 'bg-[#EDF1F6] text-ink',
    icon: 'bg-white/80 text-[#536477] ring-[#536477]/20',
    body: 'text-ink/70',
    edge: 'border-t-[#8EA2B7]',
  },
]

function ProductMockup() {
  const habits = [['Plan the day', true, '#0F766E'], ['Move for 30 minutes', true, '#65A30D'], ['Read a chapter', false, '#E11D48']]
  return <div className="relative mx-auto w-full max-w-[620px]" aria-label="Preview of the Loomora routine dashboard">
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

function DemoAdMarquee() {
  const [isVisible, setIsVisible] = useState(true)
  const message = '🔥 Never  miss  a  goal!  Download  our  app  now  for  lightning-fast  SofaScore,  instant  match  alerts,  and  real-time  stats.  ⚽ Get  3  months  free  premium  access  inside!  🏆 Download  Now!  or  go  to  sofascore.com  🔥          ||                '

  if (!isVisible) return null

  return <aside aria-label="Sponsored message" className="fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(.35rem,env(safe-area-inset-bottom))] sm:px-6">
    <div className="relative mx-auto h-7 w-full overflow-hidden rounded-xl border border-white/20 bg-[#0B1F3A] shadow-[0_10px_24px_rgba(11,31,58,.28)] sm:h-9 sm:rounded-2xl">
      <TextLoop
        text={message}
        shape="line"
        speed={48}
        direction="reverse"
        separator="✦"
        curviness={90}
        fontSize={10.5}
        fontWeight={700}
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        letterSpacing={0.8}
        uppercase={true}
        color="#FFFFFF"
        ribbon
        ribbonColor="#2563EB"
        ribbonWidth={28}
        pauseOnHover
        className="absolute left-1/2 top-1/2 w-[980px] -translate-x-1/2 -translate-y-1/2 sm:w-[1200px]"
      />
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center bg-gradient-to-r from-[#0B1F3A] via-[#0B1F3A] to-transparent pl-2 pr-6 sm:pl-3">
        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-white/15 text-white"><Megaphone className="h-3 w-3" aria-hidden="true" /></span>
      </div>
      <div className="absolute inset-y-0 right-0 flex items-center bg-gradient-to-l from-[#0B1F3A] via-[#0B1F3A] to-transparent pl-7 pr-2 sm:pr-3">
        <button type="button" onClick={() => setIsVisible(false)} aria-label="Close sponsored message" className="pointer-events-auto inline-flex h-6 w-6 items-center justify-center rounded-md text-white/75 transition-colors hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80">
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  </aside>
}

export default function LandingPage() {
  return <div className="min-h-viewport overflow-x-hidden bg-cream text-ink">
    <header className="relative z-30 border-b border-black/[.06] bg-cream/90 backdrop-blur-md"><nav aria-label="Main navigation" className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-2 px-6 sm:min-h-nav sm:gap-4 sm:px-8 lg:px-12"><Link to="/" aria-label="Loomora home" className="display-title inline-flex min-h-touch items-center gap-2 whitespace-nowrap text-lg min-[360px]:text-xl sm:text-2xl"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink text-white sm:h-8 sm:w-8"><CalendarCheck className="h-4 w-4 sm:h-[18px] sm:w-[18px]" strokeWidth={2.2} aria-hidden="true" /></span>Loomora</Link><div className="flex items-center gap-1.5 sm:gap-3"><Link to="/login" aria-label="Log in" className="inline-flex items-center justify-center whitespace-nowrap rounded-xl font-sans font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-career transition-transform hover:-translate-y-0.5 active:translate-y-0"><GradientText colors={["#0F766E", "#E11D48", "#7C3AED"]} animationSpeed={5} showBorder={true} hoverBorderOnly={true} className="text-sm min-[360px]:text-base font-sans font-bold"><span className="font-bold">Log in</span></GradientText></Link><Link to="/register" className="button-brutal button-brutal-primary min-h-11 gap-2 whitespace-nowrap px-3 text-xs min-[360px]:text-sm sm:px-5">Get started <ArrowRight className="hidden h-4 w-4 min-[360px]:block" /></Link></div></nav></header>
    <main>
      <section className="relative border-b border-black/[.06] px-6 pb-16 pt-8 sm:px-8 sm:pb-20 sm:pt-12 lg:px-12 min-[1100px]:py-12 xl:py-16">
        <div className="pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" style={{ backgroundImage: 'linear-gradient(to bottom, transparent 31px, rgba(26,26,26,.035) 32px)', backgroundSize: '100% 32px' }} />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:gap-14 min-[1100px]:grid-cols-[.88fr_1.12fr] min-[1100px]:gap-10 xl:gap-16">
          <Reveal className="mx-auto w-full max-w-2xl text-center min-[1100px]:mx-0 min-[1100px]:max-w-none min-[1100px]:text-left">
            <p className="inline-flex items-center gap-3 font-sans text-label font-bold uppercase tracking-eyebrow text-career sm:text-xs sm:tracking-stamp"><span className="h-px w-8 bg-career" aria-hidden="true" />A calmer daily routine planner</p>
            <div className="relative mt-4 inline-block">
              <h1 className="display-title inline-block">
                <DepthText
                  text="Loomora"
                  layers={14}
                  depth={1.1}
                  faceColor="#0F766E"
                  depthColor="#4ADE80"
                  tilt={4.2}
                  pointerTracking
                  smoothing={0.12}
                  perspective={950}
                  autoOrbit
                  orbitSpeed={0.25}
                  fontSize="clamp(2.85rem, 9.5vw, 6.5rem)"
                  fontFamily="'Caveat', 'Comic Sans MS', cursive"
                  fontWeight={700}
                  letterSpacing="0.015em"
                  lineHeight="0.95"
                  shadow
                />
              </h1>
              <span className="pointer-events-none absolute -bottom-2 left-[8%] h-1 w-[84%] -rotate-1 rounded-full bg-notice/60" aria-hidden="true" />
            </div>
            <p className="mx-auto mt-8 max-w-xl font-display text-2xl font-semibold leading-tight min-[420px]:text-3xl sm:text-4xl min-[1100px]:mx-0">Craft your day, one routine at a time.</p>
            <p className="mx-auto mt-6 max-w-[36rem] font-sans text-sm leading-7 text-ink/65 min-[420px]:text-base sm:text-lg sm:leading-8 min-[1100px]:mx-0">Build custom weekly routines, follow what matters right now, and track your daily progress without turning planning into more noise.</p>
            <div className="mx-auto mt-8 flex max-w-md flex-col gap-4 sm:max-w-none sm:flex-row sm:justify-center min-[1100px]:mx-0 min-[1100px]:justify-start">
              <Link to="/register" className="button-brutal button-brutal-primary min-h-12 gap-2 px-6 text-sm">Get started free <ArrowRight className="h-4 w-4" /></Link>
              <a href="#how-it-works" onClick={event => { event.preventDefault(); document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth', block: 'center' }) }} className="button-brutal button-brutal-secondary min-h-12 px-6 text-sm">See how it works</a>
            </div>
            <p className="mt-4 font-sans text-xs text-ink/45">Start with a blank canvas. Build only the routine you need.</p>
          </Reveal>
          <div className="mx-auto w-full max-w-3xl xl:max-w-none"><ProductMockup /></div>
        </div>
      </section>

      <section id="how-it-works" aria-labelledby="how-title" className="scroll-mt-6 bg-[#FCFAF7] px-6 py-16 text-ink sm:px-8 sm:py-20 lg:px-12 xl:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.38fr_.62fr] lg:gap-16 xl:gap-24">
          <Reveal className="max-w-xl lg:pt-4">
            <p className="flex items-center gap-3 font-sans text-label font-bold uppercase tracking-stamp text-career"><span className="h-px w-8 bg-career" aria-hidden="true" />How it works</p>
            <h2 id="how-title" className="mt-5 display-title text-3xl text-ink min-[400px]:text-4xl sm:text-5xl xl:text-6xl">A routine that fits real life</h2>
            <p className="mt-5 max-w-md font-sans text-sm leading-7 text-ink/60 sm:text-base sm:leading-8">Set up your week once, then keep shaping it as your days change.</p>
            <div className="mt-10 w-full max-w-[420px] overflow-hidden rounded-3xl bg-white/70 p-2.5 shadow-[0_14px_30px_-24px_rgba(26,26,26,.5)] ring-1 ring-black/[.07]">
              <img src="/how-it-works-illustration.png" alt="A person checking off a daily routine on a clipboard beside a clock" className="aspect-[4/3] h-full w-full rounded-[20px] object-cover" loading="lazy" />
            </div>
          </Reveal>

          <ol className="border-y border-black/10">
            {steps.map(({ Icon, title, copy, accent, icon, border }, index) => (
              <li key={title} className={`border-b border-l-2 border-b-black/[.08] py-7 pl-5 last:border-b-0 sm:py-8 sm:pl-6 ${border}`}>
                <Reveal className="grid grid-cols-[3rem_1fr] gap-4 sm:grid-cols-[3.5rem_1fr] sm:gap-5" delay={index * .06}>
                  <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${icon}`}>
                    <Icon className="h-5 w-5" strokeWidth={2.2} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-baseline justify-between gap-4">
                      <p className={`font-sans text-label font-bold uppercase tracking-eyebrow ${accent}`}>Step {index + 1}</p>
                      <span className="font-display text-3xl font-bold leading-none text-ink/10" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                    </div>
                    <h3 className="mt-2 font-sans text-lg font-bold leading-6 text-ink">{title}</h3>
                    <p className="mt-2 font-sans text-sm leading-6 text-ink/60">{copy}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="features-title" className="relative overflow-hidden bg-[#F7F0E9] px-6 py-16 sm:px-8 sm:py-20 lg:px-12 xl:py-24">
        <div className="pointer-events-none absolute -right-24 top-16 h-72 w-72 rounded-full bg-career/[.06] blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-language/[.045] blur-3xl" aria-hidden="true" />
        <div className="mx-auto max-w-7xl">
          <Reveal className="max-w-4xl">
            <p className="inline-flex items-center gap-3 rounded-full bg-white/70 px-4 py-2 font-sans text-xs font-bold uppercase tracking-stamp text-career ring-1 ring-black/[.06]"><span className="h-1.5 w-1.5 rounded-full bg-career" aria-hidden="true" />Built for everyday use</p>
            <h2 id="features-title" className="mt-5 max-w-3xl display-title text-3xl leading-[1.08] min-[400px]:text-4xl sm:text-5xl">Everything your routine needs. Nothing it doesn’t.</h2>
          </Reveal>
          <div className="mt-10 grid gap-4 sm:mt-12 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
            {features.map(({ Icon, title, copy, card, icon, body, edge }, index) => (
              <Reveal key={title} className="h-full" delay={(index % 3) * .05}>
                <article className={`group relative flex h-full min-h-[250px] flex-col rounded-[24px] border border-black/[.08] border-t-4 p-6 shadow-[0_12px_32px_-24px_rgba(26,26,26,.55)] transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1.5 hover:shadow-[0_20px_42px_-24px_rgba(26,26,26,.55)] sm:rounded-[28px] sm:p-7 ${edge} ${card}`}>
                  <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ring-1 transition-transform duration-300 group-hover:scale-105 ${icon}`}>
                    <Icon className="h-6 w-6" strokeWidth={2.2} aria-hidden="true" />
                  </span>
                  <div className="mt-7">
                    <h3 className="font-sans text-lg font-bold leading-7 tracking-[-0.01em]">{title}</h3>
                    <p className={`mt-2.5 max-w-prose font-sans text-sm leading-6 ${body}`}>{copy}</p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-16 sm:px-8 sm:pb-20 lg:px-12 xl:pb-24"><Reveal className="mx-auto grid max-w-5xl items-center gap-8 overflow-hidden rounded-[24px] bg-career px-6 py-10 text-center text-white shadow-lift sm:rounded-[28px] sm:px-10 sm:py-12 md:grid-cols-[1fr_auto] md:text-left lg:px-12"><div><h2 className="display-title text-3xl min-[400px]:text-4xl sm:text-5xl">Your day is yours to shape.</h2><p className="mt-4 max-w-xl font-sans text-sm leading-7 text-white/80 sm:text-base">Start with one day group, add what matters, and build a rhythm you can actually return to.</p></div><Link to="/register" className="button-brutal button-brutal-secondary min-h-12 w-full gap-2 px-5 text-sm sm:w-auto sm:px-6">Build your first routine <ArrowRight className="h-4 w-4" /></Link></Reveal></section>
    </main>
    <PublicFooter expanded showContact />
    <DemoAdMarquee />
  </div>
}
