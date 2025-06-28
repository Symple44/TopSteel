// packages/config/tailwind/web.cjs - Configuration spécifique pour l'app web (CommonJS)
const baseConfig = require('./base.cjs')

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
      animation: {
        ...baseConfig.theme.extend.animation,
        // Animations supplémentaires pour l'app web
        'nav-enter': 'navEnter 0.15s ease-out',
        'nav-exit': 'navExit 0.15s ease-in',
        'modal-enter': 'modalEnter 0.2s ease-out',
        'modal-exit': 'modalExit 0.15s ease-in',
        'shimmer': 'shimmer 2s linear infinite',
      },
      
      keyframes: {
        ...baseConfig.theme.extend.keyframes,
        // Keyframes supplémentaires pour l'app web
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
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      
      // Breakpoints supplémentaires pour l'app web
      screens: {
        ...baseConfig.theme.extend.screens,
        '5xl': '2000px',
        'print': { 'raw': 'print' },
      },
      
      // Couleurs supplémentaires spécifiques à l'app web
      colors: {
        ...baseConfig.theme.extend.colors,
        // Couleurs de performance/dashboard
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        info: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
      
      // Espacement supplémentaire pour les dashboard
      spacing: {
        ...baseConfig.theme.extend.spacing,
        '15': '3.75rem',
        '72': '18rem',
        '84': '21rem',
        '96': '24rem',
      },
    },
  },
}