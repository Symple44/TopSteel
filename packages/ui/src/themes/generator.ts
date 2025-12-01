/**
 * CSS Generator - TopSteel Design System
 * Génère des fichiers CSS depuis les tokens TypeScript
 */

import { lightTheme, darkTheme } from './index'
import { layoutTokens, layoutCSSVariables } from '../tokens/layout'
import { statusCSSVariables } from '../tokens/status-css'

// Helper pour convertir camelCase en kebab-case
function toKebabCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
}

// Génère les variables CSS pour un thème
function generateThemeVariables(theme: typeof lightTheme): string {
  return Object.entries(theme.colors)
    .map(([key, value]) => `  --${toKebabCase(key)}: ${value};`)
    .join('\n')
}

// Génère le CSS complet
export function generateThemeCSS(): string {
  const lightVars = generateThemeVariables(lightTheme)
  const darkVars = generateThemeVariables(darkTheme)

  const layoutVars = Object.entries(layoutCSSVariables)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n')

  const statusVars = Object.entries(statusCSSVariables)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n')

  return `/* ============================================
 * GENERATED FILE - DO NOT EDIT MANUALLY
 * Generated from TypeScript tokens
 * Run: pnpm generate:css to regenerate
 * ============================================ */

:root {
  /* Light Theme Colors */
${lightVars}

  /* Layout Dimensions */
${layoutVars}

  /* Status Colors */
${statusVars}
}

.dark {
  /* Dark Theme Colors */
${darkVars}
}
`
}

// Génère un rapport de validation
export function validateTokens(): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Vérifier que light et dark ont les mêmes clés
  const lightKeys = Object.keys(lightTheme.colors).sort()
  const darkKeys = Object.keys(darkTheme.colors).sort()

  if (JSON.stringify(lightKeys) !== JSON.stringify(darkKeys)) {
    errors.push('Light and Dark themes have different color keys')
  }

  return { valid: errors.length === 0, errors }
}
