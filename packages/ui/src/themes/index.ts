/**
 * Themes - TopSteel Design System
 * Point d'entrée pour les thèmes
 */

// Types
export type {
  ThemeName,
  ResolvedTheme,
  ReservedTheme,
  ThemeColorValues,
  ThemeConfig,
  ThemeProviderOptions,
  ThemeContextValue,
} from './types'

// Thèmes
export { lightTheme } from './light'
export { darkTheme } from './dark'

// Imports pour les utilitaires
import { lightTheme } from './light'
import { darkTheme } from './dark'
import type { ThemeConfig, ThemeName, ResolvedTheme } from './types'

/**
 * Registre des thèmes disponibles pour l'utilisateur
 */
export const themeRegistry = {
  light: lightTheme,
  dark: darkTheme,
} as const

/**
 * Registre complet incluant les thèmes en réserve
 */
export const fullThemeRegistry = {
  light: lightTheme,
  dark: darkTheme,
} as const

/**
 * Liste des thèmes disponibles pour l'utilisateur
 */
export const availableThemes: ThemeConfig[] = [lightTheme, darkTheme]

/**
 * Noms des thèmes disponibles
 */
export const themeNames: ThemeName[] = ['light', 'dark', 'system']

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
    const cssKey = key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)
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
  root.classList.remove('light', 'dark')

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
export function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light'

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * Résout un nom de thème en thème réel
 */
export function resolveTheme(theme: ThemeName): ResolvedTheme {
  if (theme === 'system') {
    return getSystemTheme()
  }
  return theme
}
