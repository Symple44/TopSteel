// packages/config/tailwind/base.cjs - Configuration Tailwind 4 de base (CommonJS)
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [], // Sera surchargé par les apps
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        // Couleurs de base utilisant les variables CSS
        border: 'hsl(var(--color-border))',
        input: 'hsl(var(--color-input))',
        ring: 'hsl(var(--color-ring))',
        background: 'hsl(var(--color-background))',
        foreground: 'hsl(var(--color-foreground))',
        primary: {
          DEFAULT: 'hsl(var(--color-primary))',
          foreground: 'hsl(var(--color-primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--color-secondary))',
          foreground: 'hsl(var(--color-secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--color-destructive))',
          foreground: 'hsl(var(--color-destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--color-muted))',
          foreground: 'hsl(var(--color-muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--color-accent))',
          foreground: 'hsl(var(--color-accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--color-popover))',
          foreground: 'hsl(var(--color-popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--color-card))',
          foreground: 'hsl(var(--color-card-foreground))',
        },
        
        // Design system ERP - Couleurs métier
        metallurgy: {
          50: 'hsl(var(--color-metallurgy-50))',
          100: 'hsl(var(--color-metallurgy-100))',
          200: 'hsl(var(--color-metallurgy-200))',
          300: 'hsl(var(--color-metallurgy-300))',
          400: 'hsl(var(--color-metallurgy-400))',
          500: 'hsl(var(--color-metallurgy-500))',
          600: 'hsl(var(--color-metallurgy-600))',
          700: 'hsl(var(--color-metallurgy-700))',
          800: 'hsl(var(--color-metallurgy-800))',
          900: 'hsl(var(--color-metallurgy-900))',
          950: 'hsl(var(--color-metallurgy-950))',
        },
        steel: {
          50: 'hsl(var(--color-steel-50))',
          100: 'hsl(var(--color-steel-100))',
          200: 'hsl(var(--color-steel-200))',
          300: 'hsl(var(--color-steel-300))',
          400: 'hsl(var(--color-steel-400))',
          500: 'hsl(var(--color-steel-500))',
          600: 'hsl(var(--color-steel-600))',
          700: 'hsl(var(--color-steel-700))',
          800: 'hsl(var(--color-steel-800))',
          900: 'hsl(var(--color-steel-900))',
          950: 'hsl(var(--color-steel-950))',
        },
        
        // États métier ERP
        status: {
          draft: 'hsl(var(--color-status-draft))',
          pending: 'hsl(var(--color-status-pending))',
          active: 'hsl(var(--color-status-active))',
          completed: 'hsl(var(--color-status-completed))',
          cancelled: 'hsl(var(--color-status-cancelled))',
          paused: 'hsl(var(--color-status-paused))',
          archived: 'hsl(var(--color-status-archived))',
        },
        
        // Priorités
        priority: {
          low: 'hsl(var(--color-priority-low))',
          medium: 'hsl(var(--color-priority-medium))',
          high: 'hsl(var(--color-priority-high))',
          critical: 'hsl(var(--color-priority-critical))',
        }
      },
      
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
        display: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
      },
      
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
        '144': '36rem',
      },
      
      screens: {
        'xs': '475px',
        '3xl': '1600px',
        '4xl': '1920px',
      },
      
      // Animations ERP
      animation: {
        // Animations de base
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'fade-out': 'fadeOut 0.3s ease-in-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'slide-in-up': 'slideInUp 0.3s ease-out',
        'slide-in-down': 'slideInDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'scale-out': 'scaleOut 0.2s ease-in',
        
        // Animations d'accordéon
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
      
      keyframes: {
        // Keyframes de base
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInDown: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        scaleOut: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.9)', opacity: '0' },
        },
        
        // Keyframes d'accordéon
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      
      boxShadow: {
        'erp': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'erp-md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'erp-lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      }
    },
  },
  plugins: [] // Plugins v4 à revoir,
}
