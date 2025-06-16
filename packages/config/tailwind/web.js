// packages/config/tailwind/web.js
const baseConfig = require('./base.js')

/** @type {import('tailwindcss').Config} */
module.exports = {
  ...baseConfig,
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    ...baseConfig.theme,
    extend: {
      ...baseConfig.theme.extend,
      // Extensions spécifiques web
      screens: {
        'xs': '475px',
        '3xl': '1600px'
      }
    }
  }
}