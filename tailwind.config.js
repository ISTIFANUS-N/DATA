/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        // Deep money-green: trust + the wallet balance color. Not a
        // generic "success green" — closer to a bank note.
        fanu: {
          50: 'rgb(var(--c-fanu-50) / <alpha-value>)',
          100: 'rgb(var(--c-fanu-100) / <alpha-value>)',
          400: '#3F9450',
          500: '#1F7A34',
          600: '#166029',
          700: '#124D21',
          900: '#0B2F14'
        },
        // Recharge-card orange: the "action" color, echoing the
        // scratch-panel orange on physical airtime cards.
        spark: {
          50: '#FFF4EC',
          400: '#F5883D',
          500: '#E8701F',
          600: '#C25A15'
        },
        ink: 'rgb(var(--c-ink) / <alpha-value>)',
        paper: 'rgb(var(--c-paper) / <alpha-value>)'
      },
      fontFamily: {
        display: ['"Sora"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      },
      borderRadius: {
        card: '18px'
      }
    }
  },
  plugins: []
};
