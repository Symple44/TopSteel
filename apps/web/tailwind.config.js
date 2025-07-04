/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // ===== VARIABLES SYSTÈME HARMONISÉES =====
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        // ===== EXTENSIONS SYSTÈME =====
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },

        // ===== THÈME MÉTALLURGIE TOPSTEEL =====
        metallurgy: {
          50: "hsl(var(--metallurgy-50))",
          100: "hsl(var(--metallurgy-100))",
          200: "hsl(var(--metallurgy-200))",
          300: "hsl(var(--metallurgy-300))",
          400: "hsl(var(--metallurgy-400))",
          500: "hsl(var(--metallurgy-500))",
          600: "hsl(var(--metallurgy-600))",
          700: "hsl(var(--metallurgy-700))",
          800: "hsl(var(--metallurgy-800))",
          900: "hsl(var(--metallurgy-900))",
          950: "hsl(var(--metallurgy-950))",
        },

        // ===== THÈME ACIER SPÉCIALISÉ =====
        steel: {
          50: "hsl(var(--steel-50))",
          100: "hsl(var(--steel-100))",
          200: "hsl(var(--steel-200))",
          300: "hsl(var(--steel-300))",
          400: "hsl(var(--steel-400))",
          500: "hsl(var(--steel-500))",
          600: "hsl(var(--steel-600))",
          700: "hsl(var(--steel-700))",
          800: "hsl(var(--steel-800))",
          900: "hsl(var(--steel-900))",
          950: "hsl(var(--steel-950))",
        },

        // ===== STATUTS MÉTIER ERP =====
        status: {
          draft: {
            DEFAULT: "hsl(var(--status-draft))",
            foreground: "hsl(var(--status-draft-foreground))",
          },
          pending: {
            DEFAULT: "hsl(var(--status-pending))",
            foreground: "hsl(var(--status-pending-foreground))",
          },
          active: {
            DEFAULT: "hsl(var(--status-active))",
            foreground: "hsl(var(--status-active-foreground))",
          },
          completed: {
            DEFAULT: "hsl(var(--status-completed))",
            foreground: "hsl(var(--status-completed-foreground))",
          },
          cancelled: {
            DEFAULT: "hsl(var(--status-cancelled))",
            foreground: "hsl(var(--status-cancelled-foreground))",
          },
          paused: {
            DEFAULT: "hsl(var(--status-paused))",
            foreground: "hsl(var(--status-paused-foreground))",
          },
          archived: {
            DEFAULT: "hsl(var(--status-archived))",
            foreground: "hsl(var(--status-archived-foreground))",
          },
        },

        // ===== PRIORITÉS MÉTIER =====
        priority: {
          low: {
            DEFAULT: "hsl(var(--priority-low))",
            foreground: "hsl(var(--priority-low-foreground))",
          },
          medium: {
            DEFAULT: "hsl(var(--priority-medium))",
            foreground: "hsl(var(--priority-medium-foreground))",
          },
          high: {
            DEFAULT: "hsl(var(--priority-high))",
            foreground: "hsl(var(--priority-high-foreground))",
          },
          critical: {
            DEFAULT: "hsl(var(--priority-critical))",
            foreground: "hsl(var(--priority-critical-foreground))",
          },
        },

        // ===== GRAPHIQUES & ANALYTICS =====
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
          background: "hsl(var(--chart-background))",
          border: "hsl(var(--chart-border))",
        },
      },

      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },

      fontFamily: {
        inter: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        poppins: ["var(--font-poppins)", "ui-sans-serif", "system-ui", "sans-serif"],
      },

      backgroundImage: {
        'gradient-metallurgy': 'var(--gradient-metallurgy)',
        'gradient-steel': 'var(--gradient-steel)',
        'gradient-primary': 'var(--gradient-primary)',
        'gradient-success': 'var(--gradient-success)',
        'gradient-warning': 'var(--gradient-warning)',
      },

      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "slide-in": {
          from: { 
            opacity: "0", 
            transform: "translateY(-10px)" 
          },
          to: { 
            opacity: "1", 
            transform: "translateY(0)" 
          },
        },
        "pulse-gentle": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.85" },
        },
        "status-change": {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.05)" },
          "100%": { transform: "scale(1)" },
        },
        "priority-pulse": {
          "0%, 100%": { 
            boxShadow: "0 0 0 0 hsl(var(--priority-high) / 0.7)" 
          },
          "70%": { 
            boxShadow: "0 0 0 10px hsl(var(--priority-high) / 0)" 
          },
        },
      },

      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-in-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "slide-in": "slide-in 0.2s ease-out",
        "pulse-gentle": "pulse-gentle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "status-change": "status-change 0.3s ease-in-out",
        "priority-pulse": "priority-pulse 1.5s ease-in-out infinite",
      },

      // Extensions spécifiques à l'app web
      screens: {
        '3xl': '1600px',
        '4xl': '1920px',
        '5xl': '2560px',
      },

      spacing: {
        '15': '3.75rem',
        '72': '18rem',
        '84': '21rem',
        '96': '24rem',
      },

      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.75rem' }],
      },

      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },

      backdropBlur: {
        xs: '2px',
      },

      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
      },
    },
  },
  plugins: [],
}