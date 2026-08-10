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
