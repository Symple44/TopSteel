/**
 * 🎨 CONFIGURATION DES THÈMES UNIFIÉS - TOPSTEEL ERP
 * Configuration centralisée des thèmes light/dark/vibrant
 * Compatible avec CSS variables et providers multi-app
 */

// ===== TYPES DE THÈMES =====

export type ThemeName = 'light' | 'dark' | 'vibrant' | 'system'
export type ResolvedTheme = 'light' | 'dark' | 'vibrant'

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

export interface ThemeConfig {
  name: ThemeName
  displayName: string
  description: string
  colors: ThemeColorValues
  cssClass: string
}

// ===== CONFIGURATIONS DE THÈMES =====

/**
 * Thème Light - Clair et professionnel
 */
export const lightTheme: ThemeConfig = {
  name: 'light',
  displayName: 'Light',
  description: 'Thème clair classique pour usage professionnel',
  cssClass: 'light',
  colors: {
    // Couleurs de base
    background: '0 0% 100%',
    foreground: '222.2 84% 4.9%',

    // Surfaces
    card: '0 0% 100%',
    cardForeground: '222.2 84% 4.9%',
    popover: '0 0% 100%',
    popoverForeground: '222.2 84% 4.9%',

    // Couleurs primaires - Bleu professionnel
    primary: '217 91% 45%',
    primaryForeground: '220 13% 98%',

    // Couleurs secondaires - Gris clair
    secondary: '210 40% 96%',
    secondaryForeground: '222.2 84% 4.9%',

    // Couleurs muettes
    muted: '210 40% 96%',
    mutedForeground: '215.4 16.3% 46.9%',

    // Couleurs d'accent
    accent: '210 40% 96%',
    accentForeground: '222.2 84% 4.9%',

    // Couleurs destructives
    destructive: '0 84.2% 60.2%',
    destructiveForeground: '210 40% 98%',

    // Interactions
    border: '214.3 31.8% 91.4%',
    input: '214.3 31.8% 91.4%',
    ring: '222.2 84% 4.9%',

    // Extensions TopSteel
    success: '120 61% 50%',
    successForeground: '0 0% 100%',
    warning: '45 100% 51%',
    warningForeground: '0 0% 100%',
    info: '217 91% 60%',
    infoForeground: '0 0% 100%',
  },
}

/**
 * Thème Dark - Sombre et moderne
 */
export const darkTheme: ThemeConfig = {
  name: 'dark',
  displayName: 'Dark',
  description: 'Thème sombre moderne pour sessions prolongées',
  cssClass: 'dark',
  colors: {
    // Couleurs de base - Plus doux
    background: '220 13% 18%',
    foreground: '220 9% 98%',

    // Surfaces - Légèrement plus claires que l'arrière-plan
    card: '220 13% 21%',
    cardForeground: '220 9% 98%',
    popover: '220 13% 21%',
    popoverForeground: '220 9% 98%',

    // Couleurs primaires - Bleu moderne
    primary: '217 91% 60%',
    primaryForeground: '220 13% 98%',

    // Couleurs secondaires - Gris moderne
    secondary: '220 13% 26%',
    secondaryForeground: '220 9% 98%',

    // Couleurs muettes - Entre background et card
    muted: '220 13% 26%',
    mutedForeground: '220 9% 78%',

    // Couleurs d'accent - Pour les survols
    accent: '220 13% 26%',
    accentForeground: '220 9% 98%',

    // Couleurs destructives - Rouge moderne
    destructive: '0 72% 51%',
    destructiveForeground: '220 13% 98%',

    // Interactions - Subtiles
    border: '220 13% 28%',
    input: '220 13% 28%',
    ring: '217 91% 60%',

    // Extensions TopSteel
    success: '120 61% 50%',
    successForeground: '220 13% 98%',
    warning: '45 93% 58%',
    warningForeground: '220 13% 98%',
    info: '217 91% 60%',
    infoForeground: '220 13% 98%',
  },
}

/**
 * Thème Vibrant - Coloré et moderne (Glassmorphism inspired)
 */
export const vibrantTheme: ThemeConfig = {
  name: 'vibrant',
  displayName: 'Vibrant',
  description: 'Thème coloré moderne avec effets glassmorphism',
  cssClass: 'vibrant',
  colors: {
    // Couleurs de base - Arrière-plans avec gradients subtils
    background: '270 20% 96%',
    foreground: '270 15% 9%',

    // Surfaces - Cartes avec effet glassmorphism
    card: '270 20% 98%',
    cardForeground: '270 15% 9%',
    popover: '270 20% 98%',
    popoverForeground: '270 15% 9%',

    // Couleurs primaires - Violet/indigo tendance
    primary: '270 91% 38%',
    primaryForeground: '0 0% 100%',

    // Couleurs secondaires - Rose poudré moderne
    secondary: '320 20% 92%',
    secondaryForeground: '270 15% 9%',

    // Couleurs muettes - Lavande subtile
    muted: '270 15% 90%',
    mutedForeground: '270 10% 45%',

    // Couleurs d'accent - Cyan électrique
    accent: '185 100% 85%',
    accentForeground: '270 15% 9%',

    // Couleurs destructives - Rouge vibrant
    destructive: '348 91% 58%',
    destructiveForeground: '0 0% 100%',

    // Interactions - Couleurs vives
    border: '270 15% 85%',
    input: '270 15% 85%',
    ring: '270 91% 38%',

    // Extensions TopSteel - Palette énergique
    success: '142 71% 45%',
    successForeground: '0 0% 100%',
    warning: '38 100% 50%',
    warningForeground: '0 0% 100%',
    info: '200 91% 50%',
    infoForeground: '0 0% 100%',
  },
}

// ===== REGISTRY DES THÈMES =====

export const themeRegistry = {
  light: lightTheme,
  dark: darkTheme,
  vibrant: vibrantTheme,
} as const

export const availableThemes: ThemeConfig[] = [lightTheme, darkTheme, vibrantTheme]

// ===== UTILITAIRES =====

/**
 * Récupère une configuration de thème par nom
 */
export function getThemeConfig(themeName: ResolvedTheme): ThemeConfig {
  return themeRegistry[themeName]
}

/**
 * Génère les variables CSS pour un thème donné
 */
export function generateThemeCSSVariables(theme: ThemeConfig): Record<string, string> {
  const cssVars: Record<string, string> = {}

  Object.entries(theme.colors).forEach(([key, value]) => {
    // Convertir camelCase en kebab-case pour CSS
    const cssKey = key.replace(/[A-Z]/g, '-$&').toLowerCase()
    cssVars[`--${cssKey}`] = value
  })

  return cssVars
}

/**
 * Applique un thème au DOM
 */
export function applyThemeToDOM(theme: ThemeConfig): void {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  const cssVars = generateThemeCSSVariables(theme)

  // Supprimer les anciennes classes de thème
  root.classList.remove('light', 'dark', 'vibrant')

  // Ajouter la nouvelle classe
  root.classList.add(theme.cssClass)

  // Appliquer les variables CSS
  Object.entries(cssVars).forEach(([key, value]) => {
    root.style.setProperty(key, value)
  })

  // Dispatch event pour les listeners externes
  window.dispatchEvent(
    new CustomEvent('theme-changed', {
      detail: { theme: theme.name, config: theme },
    })
  )
}

/**
 * Détecte le thème système préféré
 */
export function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// ===== EXPORTS =====
// Types already exported above in their definitions
