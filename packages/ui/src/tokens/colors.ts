/**
 * Color Tokens - TopSteel Design System
 * Palette de couleurs sémantiques et brand
 */

/**
 * Couleurs sémantiques (CSS variables)
 * Compatible avec Tailwind CSS et Radix UI
 */
export const semanticColors = {
  // Base
  background: 'hsl(var(--background))',
  foreground: 'hsl(var(--foreground))',

  // Surfaces
  card: 'hsl(var(--card))',
  cardForeground: 'hsl(var(--card-foreground))',
  popover: 'hsl(var(--popover))',
  popoverForeground: 'hsl(var(--popover-foreground))',

  // Primary - Bleu acier TopSteel
  primary: 'hsl(var(--primary))',
  primaryForeground: 'hsl(var(--primary-foreground))',

  // Secondary
  secondary: 'hsl(var(--secondary))',
  secondaryForeground: 'hsl(var(--secondary-foreground))',

  // Muted
  muted: 'hsl(var(--muted))',
  mutedForeground: 'hsl(var(--muted-foreground))',

  // Accent
  accent: 'hsl(var(--accent))',
  accentForeground: 'hsl(var(--accent-foreground))',

  // Destructive
  destructive: 'hsl(var(--destructive))',
  destructiveForeground: 'hsl(var(--destructive-foreground))',

  // Interactions
  border: 'hsl(var(--border))',
  input: 'hsl(var(--input))',
  ring: 'hsl(var(--ring))',

  // Status
  success: 'hsl(var(--success))',
  successForeground: 'hsl(var(--success-foreground))',
  warning: 'hsl(var(--warning))',
  warningForeground: 'hsl(var(--warning-foreground))',
  info: 'hsl(var(--info))',
  infoForeground: 'hsl(var(--info-foreground))',
} as const

/**
 * Palette Steel - Couleurs spécifiques métallurgie
 * Utilisée pour les éléments brand et métier
 */
export const steelPalette = {
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
} as const

/**
 * Couleur brand principale - Bleu acier
 * HSL: 217° 91% 45% (light) / 217° 91% 60% (dark)
 */
export const brandColor = {
  hue: 217,
  saturation: 91,
  lightness: {
    light: 45,
    dark: 60,
  },
  // Valeurs CSS prêtes à l'emploi
  light: 'hsl(217 91% 45%)',
  dark: 'hsl(217 91% 60%)',
} as const

export type SemanticColors = typeof semanticColors
export type SteelPalette = typeof steelPalette
export type BrandColor = typeof brandColor
