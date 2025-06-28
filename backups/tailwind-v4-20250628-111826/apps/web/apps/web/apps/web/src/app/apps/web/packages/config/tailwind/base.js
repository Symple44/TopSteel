// packages/config/tailwind/base.js - Design System ERP TopSteel
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [], // Sera surchargé par les apps
  darkMode: ['class'],
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
        // Système de couleurs shadcn/ui compatible
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        
        // Design system ERP - Couleurs métier
        metallurgy: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        steel: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#030712',
        },
        
        // États métier ERP
        status: {
          draft: '#6b7280',
          pending: '#f59e0b',
          active: '#3b82f6',
          completed: '#10b981',
          cancelled: '#ef4444',
          paused: '#8b5cf6',
          archived: '#6b7280'
        },
        
        // Priorités
        priority: {
          low: '#10b981',
          medium: '#f59e0b', 
          high: '#ef4444',
          critical: '#dc2626'
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
      
      // ============================================
      // ANIMATIONS INTÉGRÉES (remplace tailwindcss-animate)
      // ============================================
      animation: {
        // Animations de base
        'spin': 'spin 1s linear infinite',
        'ping': 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce': 'bounce 1s infinite',
        
        // Animations personnalisées ERP
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'fade-out': 'fadeOut 0.3s ease-in-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'slide-in-up': 'slideInUp 0.3s ease-out',
        'slide-in-down': 'slideInDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'scale-out': 'scaleOut 0.2s ease-in',
        
        // Animations d'accordéon (shadcn/ui compatibles)
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        
        // Animations de collapsible
        'collapsible-down': 'collapsible-down 0.2s ease-out',
        'collapsible-up': 'collapsible-up 0.2s ease-out',
        
        // Animations spéciales ERP
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'heartbeat': 'heartbeat 1.5s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite',
        'progress': 'progress 1s ease-in-out',
      },
      
      keyframes: {
        // Keyframes de base
        spin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        ping: {
          '75%, 100%': { 
            transform: 'scale(2)', 
            opacity: '0' 
          },
        },
        pulse: {
          '50%': { opacity: '0.5' },
        },
        bounce: {
          '0%, 100%': {
            transform: 'translateY(-25%)',
            animationTimingFunction: 'cubic-bezier(0.8,0,1,1)',
          },
          '50%': {
            transform: 'none',
            animationTimingFunction: 'cubic-bezier(0,0,0.2,1)',
          },
        },
        
        // Keyframes personnalisées
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
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        scaleOut: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.95)', opacity: '0' },
        },
        
        // Keyframes d'accordéon (shadcn/ui)
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        
        // Keyframes de collapsible
        'collapsible-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-collapsible-content-height)' },
        },
        'collapsible-up': {
          from: { height: 'var(--radix-collapsible-content-height)' },
          to: { height: '0' },
        },
        
        // Keyframes spéciales
        heartbeat: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        progress: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      
      gridTemplateColumns: {
        'auto-fit-xs': 'repeat(auto-fit, minmax(150px, 1fr))',
        'auto-fit-sm': 'repeat(auto-fit, minmax(200px, 1fr))',
        'auto-fit': 'repeat(auto-fit, minmax(250px, 1fr))',
        'auto-fit-lg': 'repeat(auto-fit, minmax(300px, 1fr))',
        'auto-fill-xs': 'repeat(auto-fill, minmax(150px, 1fr))',
        'auto-fill-sm': 'repeat(auto-fill, minmax(200px, 1fr))',
        'auto-fill': 'repeat(auto-fill, minmax(250px, 1fr))',
        'auto-fill-lg': 'repeat(auto-fill, minmax(300px, 1fr))',
      },
      
      boxShadow: {
        'erp': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'erp-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'erp-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'erp-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [
    // Plugin intégré pour les composants ERP
    function({ addComponents, addUtilities, theme }) {
      // Composants de base
      addComponents({
        '.btn-erp': {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: theme('borderRadius.md'),
          fontSize: theme('fontSize.sm'),
          fontWeight: theme('fontWeight.medium'),
          transition: 'all 0.2s',
          '&:focus-visible': {
            outline: '2px solid',
            outlineColor: theme('colors.ring'),
            outlineOffset: '2px',
          },
          '&:disabled': {
            pointerEvents: 'none',
            opacity: '0.5',
          },
        },
        
        '.btn-metallurgy': {
          background: `linear-gradient(135deg, ${theme('colors.metallurgy.600')}, ${theme('colors.steel.600')})`,
          color: theme('colors.white'),
          '&:hover': {
            background: `linear-gradient(135deg, ${theme('colors.metallurgy.700')}, ${theme('colors.steel.700')})`,
            transform: 'translateY(-1px)',
            boxShadow: theme('boxShadow.erp-md'),
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        
        '.card-erp': {
          backgroundColor: theme('colors.card.DEFAULT'),
          borderRadius: theme('borderRadius.lg'),
          border: `1px solid ${theme('colors.border')}`,
          boxShadow: theme('boxShadow.erp'),
          transition: 'all 0.2s',
        },
        
        '.card-hover': {
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: theme('boxShadow.erp-lg'),
          },
        },
      });
      
      // Utilitaires personnalisés
      addUtilities({
        '.scrollbar-thin': {
          scrollbarWidth: 'thin',
          scrollbarColor: `${theme('colors.muted.foreground')} transparent`,
          '&::-webkit-scrollbar': {
            width: '6px',
            height: '6px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: theme('colors.muted.foreground'),
            borderRadius: theme('borderRadius.full'),
            opacity: '0.3',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            opacity: '0.5',
          },
        },
        
        '.text-balance': {
          textWrap: 'balance',
        },
        
        '.shimmer-bg': {
          background: `linear-gradient(90deg, transparent, ${theme('colors.muted.DEFAULT')}, transparent)`,
          backgroundSize: '200% 100%',
        },
      });
    }
  ],
}
