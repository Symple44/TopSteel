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
      // Extensions spécifiques à l'app web
      screens: {
        ...baseConfig.theme.extend.screens,
        'xs': '475px',
        '3xl': '1600px',
        '4xl': '1920px',
      },
      
      // Animations spécifiques web
      animation: {
        ...baseConfig.theme.extend.animation,
        'nav-enter': 'navEnter 0.15s ease-out',
        'nav-exit': 'navExit 0.15s ease-in',
        'modal-enter': 'modalEnter 0.2s ease-out',
        'modal-exit': 'modalExit 0.15s ease-in',
      },
      
      keyframes: {
        ...baseConfig.theme.extend.keyframes,
        navEnter: {
          '0%': { opacity: '0', transform: 'scale(0.95) translateY(-10px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        navExit: {
          '0%': { opacity: '1', transform: 'scale(1) translateY(0)' },
          '100%': { opacity: '0', transform: 'scale(0.95) translateY(-10px)' },
        },
        modalEnter: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        modalExit: {
          '0%': { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(0.95)' },
        },
      }
    },
  },
}
