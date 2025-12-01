/**
 * Typography Tokens - TopSteel Design System
 * Polices, tailles et poids typographiques
 */

export const fontFamily = {
  sans: ['var(--font-inter)', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
  display: ['var(--font-poppins)', 'Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
  mono: ['ui-monospace', 'SFMono-Regular', 'Consolas', 'monospace'],
} as const

export const fontSize = {
  xs: ['0.75rem', { lineHeight: '1rem' }] as const,      // 12px
  sm: ['0.875rem', { lineHeight: '1.25rem' }] as const,  // 14px
  base: ['1rem', { lineHeight: '1.5rem' }] as const,     // 16px
  lg: ['1.125rem', { lineHeight: '1.75rem' }] as const,  // 18px
  xl: ['1.25rem', { lineHeight: '1.75rem' }] as const,   // 20px
  '2xl': ['1.5rem', { lineHeight: '2rem' }] as const,    // 24px
  '3xl': ['1.875rem', { lineHeight: '2.25rem' }] as const, // 30px
  '4xl': ['2.25rem', { lineHeight: '2.5rem' }] as const,   // 36px
} as const

export const fontWeight = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const

export const letterSpacing = {
  tighter: '-0.05em',
  tight: '-0.025em',
  normal: '0em',
  wide: '0.025em',
  wider: '0.05em',
} as const

export const typography = {
  fontFamily,
  fontSize,
  fontWeight,
  letterSpacing,
} as const

export type Typography = typeof typography
export type FontFamily = typeof fontFamily
export type FontSize = typeof fontSize
export type FontWeight = typeof fontWeight
