/**
 * Theme Types - TopSteel Design System
 * Types pour la configuration des thèmes
 */

/**
 * Noms des thèmes disponibles
 */
export type ThemeName = 'light' | 'dark' | 'system'

/**
 * Thème résolu (sans 'system')
 */
export type ResolvedTheme = 'light' | 'dark'

/**
 * Thèmes en réserve (non exposés à l'utilisateur)
 */
// Reserved for future themes

/**
 * Valeurs de couleurs pour un thème (format HSL sans hsl())
 */
export interface ThemeColorValues {
  // Couleurs de base
  background: string
  foreground: string

  // Surfaces
  card: string
  cardForeground: string
  popover: string
  popoverForeground: string

  // Couleurs primaires
  primary: string
  primaryForeground: string

  // Couleurs secondaires
  secondary: string
  secondaryForeground: string

  // Couleurs muettes
  muted: string
  mutedForeground: string

  // Couleurs d'accent
  accent: string
  accentForeground: string

  // Couleurs destructives
  destructive: string
  destructiveForeground: string

  // Interactions
  border: string
  input: string
  ring: string

  // Extensions TopSteel
  success: string
  successForeground: string
  warning: string
  warningForeground: string
  info: string
  infoForeground: string
}

/**
 * Configuration complète d'un thème
 */
export interface ThemeConfig {
  /** Identifiant du thème */
  name: ThemeName | ReservedTheme
  /** Nom affiché à l'utilisateur */
  displayName: string
  /** Description du thème */
  description: string
  /** Classe CSS à appliquer au document */
  cssClass: string
  /** Valeurs des couleurs (format HSL) */
  colors: ThemeColorValues
}

/**
 * Options pour le provider de thème
 */
export interface ThemeProviderOptions {
  /** Thème par défaut */
  defaultTheme?: ThemeName
  /** Clé de stockage localStorage */
  storageKey?: string
  /** Activer la transition entre les thèmes */
  enableTransition?: boolean
}

/**
 * Contexte du thème
 */
export interface ThemeContextValue {
  /** Thème actuel (peut être 'system') */
  theme: ThemeName
  /** Thème résolu (light ou dark) */
  resolvedTheme: ResolvedTheme
  /** Changer le thème */
  setTheme: (theme: ThemeName) => void
  /** Configuration du thème actuel */
  config: ThemeConfig
}
