/**
 * Design Tokens - TopSteel Design System
 * Point d'entrée unique pour tous les tokens
 */

// Exports individuels
export * from './colors'
export * from './typography'
export * from './spacing'
export * from './shadows'
export * from './radius'
export * from './animations'
export * from './status'
// export * from './palettes' // Removed - file doesn't exist in repo
export * from './layout'
export * from './status-css'

// Imports pour l'objet unifié
import { brandColor, semanticColors, steelPalette } from './colors'
import { animations, duration, easing, keyframeNames } from './animations'
import { radius, themeRadius } from './radius'
import { focusShadows, shadows, shadowVariables } from './shadows'
import { componentSizes, containerWidths, layoutDimensions, spacing } from './spacing'
import { statusByKey, statusTokens } from './status'
import { fontFamily, fontSize, fontWeight, letterSpacing } from './typography'
// import { palettes } from './palettes' // Removed - file doesn't exist in repo
import { layoutTokens, layoutCSSVariables } from './layout'
import { statusCSSVariables } from './status-css'

/**
 * Tous les tokens regroupés en un seul objet
 * Usage: import { tokens } from '@erp/ui/tokens'
 */
export const tokens = {
  // Couleurs
  colors: {
    semantic: semanticColors,
    steel: steelPalette,
    brand: brandColor,
    // palettes, // Removed - file doesn't exist in repo
  },

  // Typographie
  typography: {
    fontFamily,
    fontSize,
    fontWeight,
    letterSpacing,
  },

  // Espacements
  spacing: {
    scale: spacing,
    components: componentSizes,
    containers: containerWidths,
    layout: layoutDimensions, // @deprecated - use tokens.layout instead
  },

  // Layout
  layout: layoutTokens,

  // Ombres
  shadows: {
    box: shadows,
    focus: focusShadows,
    variables: shadowVariables,
  },

  // Radius
  radius: {
    fixed: radius,
    theme: themeRadius,
  },

  // Animations
  animations: {
    ...animations,
    keyframes: keyframeNames,
  },

  // Statuts métier
  status: statusTokens,
  statusByKey,
} as const

export type Tokens = typeof tokens

/**
 * Raccourcis pour accès direct aux tokens les plus utilisés
 */
export { semanticColors as colors } from './colors'
export { spacing } from './spacing'
export { shadows } from './shadows'
export { radius } from './radius'
export { fontFamily, fontSize, fontWeight } from './typography'
export { duration, easing } from './animations'
export { statusByKey, statusTokens } from './status'
// export { palettes } from './palettes' // Removed - file doesn't exist in repo
export { layoutTokens, layoutCSSVariables } from './layout'
export { statusCSSVariables } from './status-css'
