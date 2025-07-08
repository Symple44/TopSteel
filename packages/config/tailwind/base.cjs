// packages/config/tailwind/base.cjs - Configuration Tailwind harmonisée (CommonJS)
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
        // ===== VARIABLES SYSTÈME HARMONISÉES =====
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

        // ===== EXTENSIONS SYSTÈME =====
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        info: {
          DEFAULT: 'hsl(var(--info))',
          foreground: 'hsl(var(--info-foreground))',
        },

        // ===== DESIGN SYSTEM ERP - COULEURS MÉTIER =====
        metallurgy: {
          50: 'hsl(var(--metallurgy-50))',
          100: 'hsl(var(--metallurgy-100))',
          200: 'hsl(var(--metallurgy-200))',
          300: 'hsl(var(--metallurgy-300))',
          400: 'hsl(var(--metallurgy-400))',
          500: 'hsl(var(--metallurgy-500))',
          600: 'hsl(var(--metallurgy-600))',
          700: 'hsl(var(--metallurgy-700))',
          800: 'hsl(var(--metallurgy-800))',
          900: 'hsl(var(--metallurgy-900))',
          950: 'hsl(var(--metallurgy-950))',
        },
        steel: {
          50: 'hsl(var(--steel-50))',
          100: 'hsl(var(--steel-100))',
          200: 'hsl(var(--steel-200))',
          300: 'hsl(var(--steel-300))',
          400: 'hsl(var(--steel-400))',
          500: 'hsl(var(--steel-500))',
          600: 'hsl(var(--steel-600))',
          700: 'hsl(var(--steel-700))',
          800: 'hsl(var(--steel-800))',
          900: 'hsl(var(--steel-900))',
          950: 'hsl(var(--steel-950))',
        },

        // ===== ÉTATS MÉTIER ERP =====
        status: {
          draft: {
            DEFAULT: 'hsl(var(--status-draft))',
            foreground: 'hsl(var(--status-draft-foreground))',
          },
          pending: {
            DEFAULT: 'hsl(var(--status-pending))',
            foreground: 'hsl(var(--status-pending-foreground))',
          },
          active: {
            DEFAULT: 'hsl(var(--status-active))',
            foreground: 'hsl(var(--status-active-foreground))',
          },
          completed: {
            DEFAULT: 'hsl(var(--status-completed))',
            foreground: 'hsl(var(--status-completed-foreground))',
          },
          cancelled: {
            DEFAULT: 'hsl(var(--status-cancelled))',
            foreground: 'hsl(var(--status-cancelled-foreground))',
          },
          paused: {
            DEFAULT: 'hsl(var(--status-paused))',
            foreground: 'hsl(var(--status-paused-foreground))',
          },
          archived: {
            DEFAULT: 'hsl(var(--status-archived))',
            foreground: 'hsl(var(--status-archived-foreground))',
          },
        },

        // ===== PRIORITÉS =====
        priority: {
          low: {
            DEFAULT: 'hsl(var(--priority-low))',
            foreground: 'hsl(var(--priority-low-foreground))',
          },
          medium: {
            DEFAULT: 'hsl(var(--priority-medium))',
            foreground: 'hsl(var(--priority-medium-foreground))',
          },
          high: {
            DEFAULT: 'hsl(var(--priority-high))',
            foreground: 'hsl(var(--priority-high-foreground))',
          },
          critical: {
            DEFAULT: 'hsl(var(--priority-critical))',
            foreground: 'hsl(var(--priority-critical-foreground))',
          },
        },

        // ===== GRAPHIQUES & ANALYTICS =====
        chart: {
          1: 'hsl(var(--chart-1))',
          2: 'hsl(var(--chart-2))',
          3: 'hsl(var(--chart-3))',
          4: 'hsl(var(--chart-4))',
          5: 'hsl(var(--chart-5))',
          background: 'hsl(var(--chart-background))',
          border: 'hsl(var(--chart-border))',
        },
      },

      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },

      fontFamily: {
        inter: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        poppins: ['var(--font-poppins)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },

      backgroundImage: {
        'gradient-metallurgy': 'var(--gradient-metallurgy)',
        'gradient-steel': 'var(--gradient-steel)',
        'gradient-primary': 'var(--gradient-primary)',
        'gradient-success': 'var(--gradient-success)',
        'gradient-warning': 'var(--gradient-warning)',
      },

      // Animations de base pour le design system
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-in': {
          from: {
            opacity: '0',
            transform: 'translateY(-10px)',
          },
          to: {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        'pulse-gentle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' },
        },
        'status-change': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)' },
        },
        'priority-pulse': {
          '0%, 100%': {
            boxShadow: '0 0 0 0 hsl(var(--priority-high) / 0.7)',
          },
          '70%': {
            boxShadow: '0 0 0 10px hsl(var(--priority-high) / 0)',
          },
        },
      },

      animation: {
        'fade-in': 'fade-in 0.5s ease-in-out',
        'slide-in': 'slide-in 0.2s ease-out',
        'pulse-gentle': 'pulse-gentle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'status-change': 'status-change 0.3s ease-in-out',
        'priority-pulse': 'priority-pulse 1.5s ease-in-out infinite',
      },

      // Espacement spécialisé pour les interfaces ERP
      spacing: {
        15: '3.75rem',
        18: '4.5rem',
        72: '18rem',
        84: '21rem',
        96: '24rem',
      },

      // Tailles spécialisées pour les dashboards
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },

      // Z-index pour les interfaces complexes
      zIndex: {
        60: '60',
        70: '70',
        80: '80',
        90: '90',
        100: '100',
      },

      // Box shadow pour les cartes et composants métier
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'card-hover': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'priority-critical': '0 0 0 2px hsl(var(--priority-critical) / 0.5)',
        'status-active': '0 0 0 2px hsl(var(--status-active) / 0.3)',
      },

      // Backdrop blur pour les modales et overlays
      backdropBlur: {
        xs: '2px',
      },

      // Propriétés de transition pour les interactions ERP
      transitionProperty: {
        height: 'height',
        spacing: 'margin, padding',
        colors: 'color, background-color, border-color, text-decoration-color, fill, stroke',
      },

      // Variables d'espacement pour les grilles de données
      gridTemplateColumns: {
        table: 'repeat(auto-fit, minmax(150px, 1fr))',
        dashboard: 'repeat(auto-fit, minmax(300px, 1fr))',
      },
    },
  },
  plugins: [],
}
