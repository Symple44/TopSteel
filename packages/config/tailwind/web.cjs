// packages/config/tailwind/web.cjs - Configuration spécifique pour l'app web harmonisée (CommonJS)
const baseConfig = require('./base.cjs')

/** @type {import('tailwindcss').Config} */
module.exports = {
  ...baseConfig,
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}', '../../packages/ui/src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    ...baseConfig.theme,
    extend: {
      ...baseConfig.theme.extend,

      // ===== EXTENSIONS SPÉCIFIQUES APP WEB =====

      // Animations supplémentaires pour l'interface web
      animation: {
        ...baseConfig.theme.extend.animation,
        // Animations de navigation
        'nav-enter': 'navEnter 0.15s ease-out',
        'nav-exit': 'navExit 0.15s ease-in',
        'modal-enter': 'modalEnter 0.2s ease-out',
        'modal-exit': 'modalExit 0.15s ease-in',
        shimmer: 'shimmer 2s linear infinite',
        // Animations de données
        'data-load': 'dataLoad 0.4s ease-out',
        'chart-draw': 'chartDraw 0.8s ease-out',
        'table-row-highlight': 'tableRowHighlight 0.3s ease-in-out',
      },

      keyframes: {
        ...baseConfig.theme.extend.keyframes,
        // Keyframes navigation
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
        // Keyframes données
        dataLoad: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        chartDraw: {
          '0%': { strokeDashoffset: '1000' },
          '100%': { strokeDashoffset: '0' },
        },
        tableRowHighlight: {
          '0%': { backgroundColor: 'hsl(var(--accent))' },
          '100%': { backgroundColor: 'transparent' },
        },
      },

      // Breakpoints supplémentaires pour les dashboards web
      screens: {
        ...baseConfig.theme.extend.screens,
        '3xl': '1600px',
        '4xl': '1920px',
        '5xl': '2560px',
        print: { raw: 'print' },
        // Breakpoints orientés ERP
        'dashboard-sm': '1024px',
        'dashboard-md': '1280px',
        'dashboard-lg': '1600px',
      },

      // Couleurs supplémentaires spécifiques à l'interface web
      colors: {
        ...baseConfig.theme.extend.colors,

        // Couleurs de performance/dashboard spécifiques web
        performance: {
          excellent: 'hsl(142 76% 36%)',
          good: 'hsl(160 84% 39%)',
          average: 'hsl(35 91% 65%)',
          poor: 'hsl(25 95% 63%)',
          critical: 'hsl(0 84% 60%)',
        },

        // Couleurs de notification pour l'interface web
        notification: {
          info: 'hsl(199 89% 49%)',
          success: 'hsl(142 76% 36%)',
          warning: 'hsl(35 91% 65%)',
          error: 'hsl(0 84% 60%)',
        },

        // Couleurs spécialisées pour les graphiques web
        graph: {
          revenue: 'hsl(142 76% 36%)',
          expense: 'hsl(0 84% 60%)',
          profit: 'hsl(199 89% 49%)',
          production: 'hsl(25 95% 63%)',
          quality: 'hsl(160 84% 39%)',
        },
      },

      // Espacement supplémentaire pour les layouts web complexes
      spacing: {
        ...baseConfig.theme.extend.spacing,
        100: '25rem',
        104: '26rem',
        108: '27rem',
        112: '28rem',
        116: '29rem',
        120: '30rem',
        // Espacements spécialisés interface
        sidebar: '16rem',
        'sidebar-collapsed': '4rem',
        header: '4rem',
        toolbar: '3rem',
      },

      // Grilles spécialisées pour les dashboards
      gridTemplateColumns: {
        ...baseConfig.theme.extend.gridTemplateColumns,
        // Grilles dashboard
        'dashboard-2': 'repeat(2, minmax(0, 1fr))',
        'dashboard-3': 'repeat(3, minmax(0, 1fr))',
        'dashboard-4': 'repeat(4, minmax(0, 1fr))',
        'dashboard-auto': 'repeat(auto-fit, minmax(300px, 1fr))',
        // Grilles de données
        'data-table': 'auto 1fr auto',
        'form-2col': '1fr 2fr',
        'form-3col': '1fr 1fr 1fr',
      },

      // Box shadows spécialisées pour l'interface web
      boxShadow: {
        ...baseConfig.theme.extend.boxShadow,
        navbar: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        sidebar: '1px 0 3px 0 rgb(0 0 0 / 0.1)',
        modal: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        'card-interactive': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        dropdown: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      },

      // Typography spécialisée pour les interfaces ERP
      fontSize: {
        ...baseConfig.theme.extend.fontSize,
        '2xs': ['0.625rem', { lineHeight: '0.75rem' }],
        'dashboard-title': ['1.875rem', { lineHeight: '2.25rem', fontWeight: '700' }],
        'card-title': ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }],
        metric: ['2.25rem', { lineHeight: '2.5rem', fontWeight: '800' }],
      },

      // Z-index pour les composants web complexes
      zIndex: {
        ...baseConfig.theme.extend.zIndex,
        dropdown: '1000',
        modal: '1050',
        tooltip: '1070',
        notification: '1080',
      },

      // Propriétés de transition pour les interactions web
      transitionProperty: {
        ...baseConfig.theme.extend.transitionProperty,
        width: 'width',
        margin: 'margin',
        padding: 'padding',
        transform: 'transform',
      },

      // Durées de transition optimisées pour l'interface
      transitionDuration: {
        150: '150ms',
        250: '250ms',
        350: '350ms',
        400: '400ms',
        600: '600ms',
        800: '800ms',
      },

      // Fonctions de timing pour les animations web
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'ease-out-back': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'ease-in-back': 'cubic-bezier(0.36, 0, 0.66, -0.56)',
      },

      // Backdrop blur pour les overlays web
      backdropBlur: {
        ...baseConfig.theme.extend.backdropBlur,
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },

      // Brightness pour les interactions hover
      brightness: {
        105: '1.05',
        110: '1.1',
        115: '1.15',
      },

      // Saturate pour les effets visuels
      saturate: {
        105: '1.05',
        110: '1.1',
        115: '1.15',
      },
    },
  },
}
