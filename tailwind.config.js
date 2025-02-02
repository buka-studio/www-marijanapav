const { fontFamily } = require('tailwindcss/defaultTheme');
const globalTokens = require('./tokens/style/global.json');
const themeTokens = require('./tokens/style/theme-light.json');
const { filterTokensByType } = require('./tokens/util');
const defaultTheme = require('tailwindcss/defaultTheme');

const globalColors = filterTokensByType('color', globalTokens);
const themeColors = filterTokensByType('color', themeTokens);

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      animation:{"ping-slow": "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite"},
      fontFamily: {
        sans: ['var(--font-inter)', ...fontFamily.sans],
        archivo: ['var(--font-archivo)'],
      },
      colors: {
        ...globalColors,
        ...themeColors,
      },
      boxShadow: {
        card: '0px 0px 20px var(--panel-dropshadow-color)',
      },
      screens: {
        xxs: '360px',
        xs: '475px',
        ...defaultTheme.screens,
        '2xl': '1336px',
        hoverable: { raw: '(hover: hover)' },
      },
    },
  },
  plugins: [require('tailwind-scrollbar'), require('tailwindcss-animate')],
};
