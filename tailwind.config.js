const { fontFamily } = require("tailwindcss/defaultTheme");
const globalTokens = require("./tokens/style/global.json");
const themeTokens = require("./tokens/style/theme-light.json");
const { filterTokensByType } = require("./tokens/util");

const globalColors = filterTokensByType("color", globalTokens);
const themeColors = filterTokensByType("color", themeTokens);
console.log(globalColors, themeColors);
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", ...fontFamily.sans],
        archivo: ["var(--font-archivo)"],
      },
      colors: {
        ...globalColors,
        ...themeColors,
      },
      boxShadow: {
        card: "0px 4px 36px var(--panel-dropshadow-color)",
      },
      screens: {
        "2xl": "1336px",
      },
    },
  },
  plugins: [require("tailwind-scrollbar")],
};
