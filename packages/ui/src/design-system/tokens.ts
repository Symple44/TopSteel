/**
 * 🎨 DESIGN TOKENS UNIFIÉS - TOPSTEEL ERP
 * Tokens de design centralisés pour cohérence multi-app
 * Source de vérité unique pour couleurs, espacements, typographie
 */

// ===== TOKENS DE COULEUR =====

/**
 * Palette de couleurs sémantiques
 * Compatible avec Tailwind CSS variables et Radix UI
 */
export const colorTokens = {
  // Couleurs de base (light/dark adaptive)
  background: 'hsl(var(--background))',
  foreground: 'hsl(var(--foreground))',
  
  // Couleurs de carte et surfaces
  card: 'hsl(var(--card))',
  cardForeground: 'hsl(var(--card-foreground))',
  popover: 'hsl(var(--popover))',
  popoverForeground: 'hsl(var(--popover-foreground))',
  
  // Couleurs primaires
  primary: 'hsl(var(--primary))',
  primaryForeground: 'hsl(var(--primary-foreground))',
  
  // Couleurs secondaires
  secondary: 'hsl(var(--secondary))',
  secondaryForeground: 'hsl(var(--secondary-foreground))',
  
  // Couleurs muettes
  muted: 'hsl(var(--muted))',
  mutedForeground: 'hsl(var(--muted-foreground))',
  
  // Couleurs d'accent
  accent: 'hsl(var(--accent))',
  accentForeground: 'hsl(var(--accent-foreground))',
  
  // Couleurs destructives
  destructive: 'hsl(var(--destructive))',
  destructiveForeground: 'hsl(var(--destructive-foreground))',
  
  // Couleurs d'interaction
  border: 'hsl(var(--border))',
  input: 'hsl(var(--input))',
  ring: 'hsl(var(--ring))',
  
  // Extensions TopSteel ERP
  success: 'hsl(var(--success))',
  successForeground: 'hsl(var(--success-foreground))',
  warning: 'hsl(var(--warning))',
  warningForeground: 'hsl(var(--warning-foreground))',
  info: 'hsl(var(--info))',
  infoForeground: 'hsl(var(--info-foreground))',
} as const

/**
 * Palette TopSteel - Couleurs spécifiques métallurgie
 */
export const steelColorTokens = {
  steel: {
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
  }
} as const

// ===== TOKENS D'ESPACEMENT =====

export const spacingTokens = {
  none: '0',
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
  '3xl': '4rem',   // 64px
  '4xl': '6rem',   // 96px
} as const

// ===== TOKENS DE TAILLE =====

export const sizeTokens = {
  // Hauteurs communes
  height: {
    xs: '1.5rem',    // 24px - h-6
    sm: '2rem',      // 32px - h-8  
    md: '2.25rem',   // 36px - h-9
    lg: '2.5rem',    // 40px - h-10
    xl: '3rem',      // 48px - h-12
  },
  
  // Largeurs communes
  width: {
    xs: '4rem',      // 64px
    sm: '8rem',      // 128px
    md: '12rem',     // 192px
    lg: '16rem',     // 256px
    xl: '20rem',     // 320px
  }
} as const

// ===== TOKENS DE RAYON =====

export const radiusTokens = {
  none: '0',
  sm: 'calc(var(--radius) - 4px)',
  md: 'calc(var(--radius) - 2px)', 
  lg: 'var(--radius)',
  xl: 'calc(var(--radius) + 4px)',
  full: '9999px',
} as const

// ===== TOKENS D'OMBRE =====

export const shadowTokens = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
} as const

// ===== TOKENS DE TYPOGRAPHIE =====

export const typographyTokens = {
  fontFamily: {
    sans: ['var(--font-inter)', 'Inter', 'ui-sans-serif', 'system-ui'],
    display: ['var(--font-poppins)', 'Poppins', 'ui-sans-serif', 'system-ui'],
    mono: ['ui-monospace', 'SFMono-Regular', 'Consolas', 'monospace'],
  },
  
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
  },
  
  fontWeight: {
    normal: '400',
    medium: '500', 
    semibold: '600',
    bold: '700',
  }
} as const

// ===== TOKENS D'ANIMATION =====

export const animationTokens = {
  duration: {
    fast: '150ms',
    normal: '300ms', 
    slow: '500ms',
  },
  
  easing: {
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)', 
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  }
} as const

// ===== EXPORT UNIFIÉ =====

export const designTokens = {
  colors: colorTokens,
  steelColors: steelColorTokens,
  spacing: spacingTokens,
  sizes: sizeTokens,
  radius: radiusTokens,
  shadows: shadowTokens,
  typography: typographyTokens,
  animation: animationTokens,
} as const

export type DesignTokens = typeof designTokens
export type ColorTokens = typeof colorTokens
export type SteelColorTokens = typeof steelColorTokens