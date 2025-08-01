/**
 * 🎨 DESIGN SYSTEM UNIFIÉ - TOPSTEEL ERP
 * Point d'entrée principal du système de design
 * Combine tokens, thèmes et variants en une API cohérente
 */

// ===== EXPORTS PRINCIPAUX =====

// Tokens de design
export * from './tokens'
export * from './themes'  
export * from './variants'

// Types principaux
export type {
  DesignTokens,
  ColorTokens,
  SteelColorTokens,
} from './tokens'

export type {
  ThemeName,
  ResolvedTheme,
  ThemeConfig,
  ThemeColorValues,
} from './themes'

export type {
  ComponentVariants,
  ComponentSize,
  ComponentVariant,
} from './variants'

// ===== API SIMPLIFIÉE =====

import { designTokens } from './tokens'
import { themeRegistry, getThemeConfig, applyThemeToDOM } from './themes'
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

// Re-export des variants existants pour compatibilité
export {
  buttonVariants,
  badgeVariants, 
  alertVariants,
  scrollAreaVariants,
  inputVariants,
  switchVariants,
  cardVariants,
  tableVariants,
  dialogContentVariants,
  sidebarVariants,
} from '../lib/design-system'

export type {
  ButtonVariants,
  BadgeVariants,
  AlertVariants, 
  ScrollAreaVariants,
  InputVariants,
  SwitchVariants,
  CardVariants,
  TableVariants,
  DialogContentVariants,
  SidebarVariants,
} from '../lib/design-system'