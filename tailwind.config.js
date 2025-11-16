const { fontFamily, screens } = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      animation: { 'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite' },
      fontFamily: {
        sans: ['var(--font-inter)', ...fontFamily.sans],
        archivo: ['var(--font-archivo)'],
        mono: [
          'var(--font-ibm-plex-mono)',
          'IBM Plex Mono',
          'Fira Code',
          'Consolas',
          'Monaco',
          'monospace',
        ],
        libertinus: ['var(--font-libertinus-serif)'],
        caveat: ['var(--font-caveat)'],
      },
      colors: {
        theme: {
          1: 'oklch(var(--theme-1) / <alpha-value>)',
          2: 'oklch(var(--theme-2) / <alpha-value>)',
          3: 'oklch(var(--theme-3) / <alpha-value>)',
          4: 'oklch(var(--theme-4) / <alpha-value>)',
        },
        main: {
          background: 'oklch(var(--main-background) / <alpha-value>)',
          accent: 'oklch(var(--main-accent) / <alpha-value>)',
        },
        text: {
          primary: 'oklch(var(--text-primary) / <alpha-value>)',
          secondary: 'oklch(var(--text-secondary))',
          muted: 'oklch(var(--text-muted))',
          contrast: 'oklch(var(--text-contrast) / <alpha-value>)',
        },
        panel: {
          background: 'oklch(var(--panel-background) / <alpha-value>)',
          shadow: 'oklch(var(--panel-shadow) / <alpha-value>)',
          border: 'oklch(var(--panel-border))',
          overlay: 'oklch(var(--panel-overlay))',
        },
      },
      boxShadow: {
        card: '0px 0px 20px oklch(var(--panel-shadow) / .1)',
      },
      screens: {
        xxs: '360px',
        xs: '475px',
        ...screens,
        '2xl': '1336px',
        hoverable: { raw: '(hover: hover)' },
      },
    },
  },
  plugins: [require('tailwind-scrollbar'), require('tailwindcss-animate')],
};
