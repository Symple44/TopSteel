/**
 * 🎨 DESIGN SYSTEM UNIFIÉ - TOPSTEEL ERP
 * Point d'entrée principal du système de design
 * Combine tokens, thèmes et variants en une API cohérente
 */

// ===== EXPORTS PRINCIPAUX =====

export type {
  ResolvedTheme,
  ThemeColorValues,
  ThemeConfig,
  ThemeName,
} from './themes'
export * from './themes'
// Types principaux
export type {
  ColorTokens,
  DesignTokens,
  SteelColorTokens,
} from './tokens'
// Tokens de design
export * from './tokens'
export type {
  ComponentSize,
  ComponentVariant,
  ComponentVariants,
} from './variants'
export * from './variants'

// ===== API SIMPLIFIÉE =====

import { applyThemeToDOM, getThemeConfig, themeRegistry } from './themes'
import { designTokens } from './tokens'
import { unifiedVariants } from './variants'

/**
 * API unifiée du design system
 */
export const designSystem = {
  // Tokens de design
  tokens: designTokens,

  // Configuration des thèmes
  themes: themeRegistry,
  getTheme: getThemeConfig,
  applyTheme: applyThemeToDOM,

  // Variants des composants
  variants: unifiedVariants,

  // Métadonnées
  version: '1.0.0',
  name: 'TopSteel Design System',
} as const

export type DesignSystem = typeof designSystem

// ===== UTILITAIRES DE CONVENIENCE =====

/**
 * Raccourci pour accéder aux tokens de couleur
 */
export const colors = designTokens.colors

/**
 * Raccourci pour accéder aux tokens d'espacement
 */
export const spacing = designTokens.spacing

/**
 * Raccourci pour accéder aux tokens de taille
 */
export const sizes = designTokens.sizes

/**
 * Liste des noms de thèmes disponibles
 */
export const themeNames = Object.keys(themeRegistry) as Array<keyof typeof themeRegistry>

// ===== COMPATIBILITÉ BACKWARD =====
// Note: ButtonVariants and CardVariants are now exported by their respective components

export type {
  AlertVariants,
  BadgeVariants,
  ButtonVariants,
  CardVariants,
  DialogContentVariants,
  InputVariants,
  ScrollAreaVariants,
  SidebarVariants,
  SwitchVariants,
  TableVariants,
} from '../lib/design-system'
// Re-export des variants existants pour compatibilité
export {
  alertVariants,
  badgeVariants,
  buttonVariants,
  cardVariants,
  dialogContentVariants,
  inputVariants,
  scrollAreaVariants,
  sidebarVariants,
  switchVariants,
  tableVariants,
} from '../lib/design-system'
