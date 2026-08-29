/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Cozy planner palette (supersedes the old indigo theme)
        cream: '#F5EDE6',
        ink: '#1A1A1A', // black card shell
        paper: '#FFFFFF', // white card shell
        taupe: '#8A8378', // taupe/gray card shell
        // Category accents (single source of truth also in config/categories.js)
        faith: '#C9A227',
        career: '#0F766E',
        health: '#65A30D',
        language: '#E11D48',
        life: '#8A8378',
        rest: '#7C8B9C',
      },
      fontFamily: {
        display: ['Caveat', 'Comic Sans MS', 'cursive'],
        sans: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
      },
      /*
       * Named steps that were previously written as arbitrary values. Tailwind's
       * default 4px scale covers normal spacing; these cover the few app-specific
       * constants so they can never drift between files.
       */
      spacing: {
        // WCAG 2.5.5 touch-target floor and the primary-action height.
        touch: '44px',
        'touch-lg': '48px',
        // Horizontal offset of the timeline rail. Shared by Timeline, TimelineItem
        // and the loading Skeleton — these MUST match or the rail misaligns.
        rail: '18px',
        'rail-sm': '22px',
      },
      /*
       * Two tracking tokens replace seven ad-hoc values (including the duplicate
       * `.18em` / `0.18em` spellings that rendered identically).
       */
      letterSpacing: {
        eyebrow: '0.18em', // small uppercase section labels
        stamp: '0.2em', // the widest "stamp" treatment
      },
      fontSize: {
        // Mobile-safe micro type. `label` replaces text-[9px]/[10px]/[11px];
        // `body-sm` replaces text-[13px]/[15px] so body copy never dips below
        // the ~14px comfortable-reading floor on phones.
        label: ['0.6875rem', { lineHeight: '1rem' }], // 11px, uppercase labels only
        'body-sm': ['0.875rem', { lineHeight: '1.375rem' }], // 14px
        // 15px — the established list/label reading size. Named rather than
        // rewritten so the existing visual rhythm is preserved exactly.
        body: ['0.9375rem', { lineHeight: '1.5rem' }],
        // Display sizes for the script headings.
        'display-sm': ['1.75rem', { lineHeight: '1.05' }], // 28px
        'display-md': ['2.5rem', { lineHeight: '1' }], // 40px
      },
      borderRadius: {
        card: '20px',
      },
      boxShadow: {
        card: '0 6px 18px -8px rgba(26, 26, 26, 0.25)',
        lift: '0 14px 30px -10px rgba(26, 26, 26, 0.35)',
      },
    },
  },
  plugins: [],
}
