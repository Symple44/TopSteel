/**
 * 📦 TOPSTEEL ERP UI PACKAGE - MAIN EXPORT
 * Point d'entrée principal pour le package UI
 *
 * Organisation:
 * - Components: Composants UI réutilisables
 * - Utils: Utilitaires et helpers
 * - Types: Types TypeScript partagés
 * - Constants: Constantes et configurations
 */

// =============================================
// COMPONENTS EXPORT
// =============================================

export {
  Badge,
  badgeVariants,
  CountBadge,
  PriorityBadge,
  StatusBadge,
} from './components/badge'
// Core Components
export {
  ActionButton,
  Button,
  buttonVariants,
  FormButton,
  IconButton,
} from './components/button'

export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  cardVariants,
  ProjectCard,
  StatsCard,
} from './components/card'

export {
  RangeSlider,
  Slider,
  SteppedSlider,
} from './components/slider'

// =============================================
// UTILS EXPORT
// =============================================

export {
  accessibilityProps,
  buttonSizes,
  clearClassCache,
  cn,
  combineVariants,
  createVariants,
  disabledState,
  focusRing,
  getCacheStats,
  hoverEffect,
  inputSizes,
  isValidClassName,
  paddingSizes,
  responsiveContainer,
  responsiveGrid,
  safeClassNames,
  sanitizeClasses,
  standardTransition,
  UI_CONSTANTS,
  validationClasses,
} from './lib/utils'

// =============================================
// RE-EXPORTS FROM DEPENDENCIES
// =============================================

// Class Variance Authority
export { cva } from 'class-variance-authority'

// Clsx
export { clsx } from 'clsx'

// Tailwind Merge
export { twMerge } from 'tailwind-merge'

// =============================================
// TYPES EXPORT
// =============================================

import type { VariantProps as CVAVariantProps } from 'class-variance-authority'
import type { ClassValue } from 'clsx'
import type { BadgeProps } from './components/badge'
import type { ButtonProps } from './components/button'
import type {
  CardContentProps,
  CardFooterProps,
  CardHeaderProps,
  CardProps,
} from './components/card'
import type { SliderProps } from './components/slider'
import type { Size, VariantProps } from './lib/utils'

export type {
  // Component Props Types
  BadgeProps,
  ButtonProps,
  CardContentProps,
  CardFooterProps,
  CardHeaderProps,
  CardProps,
  ClassValue,
  // Re-exported Types
  CVAVariantProps,
  Size,
  SliderProps,
  // Utility Types
  VariantProps,
}

// =============================================
// PACKAGE METADATA
// =============================================

export const UI_PACKAGE_INFO = {
  name: '@erp/ui',
  version: '2.1.0',
  description: 'UI components library for ERP TopSteel - Enterprise-grade design system',
  author: 'TopSteel Engineering Team',
  license: 'UNLICENSED',
} as const

// =============================================
// CONSTANTS EXPORT
// =============================================

export const UI_THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const

export const UI_SIZES = {
  XS: 'xs',
  SM: 'sm',
  MD: 'md',
  LG: 'lg',
  XL: 'xl',
} as const

export const UI_VARIANTS = {
  DEFAULT: 'default',
  SECONDARY: 'secondary',
  DESTRUCTIVE: 'destructive',
  OUTLINE: 'outline',
  GHOST: 'ghost',
  LINK: 'link',
} as const

export const ERP_ENTITY_TYPES = {
  PROJECT: 'project',
  CLIENT: 'client',
  QUOTE: 'quote',
  INVOICE: 'invoice',
  PRODUCTION: 'production',
  STOCK: 'stock',
} as const

export const STATUS_TYPES = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  ERROR: 'error',
} as const

export const PRIORITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const

// =============================================
// ACCESSIBILITY CONSTANTS
// =============================================

export const ARIA_ROLES = {
  BUTTON: 'button',
  TAB: 'tab',
  TABPANEL: 'tabpanel',
  DIALOG: 'dialog',
  ALERT: 'alert',
  STATUS: 'status',
  PROGRESSBAR: 'progressbar',
} as const

export const KEYBOARD_KEYS = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  TAB: 'Tab',
  HOME: 'Home',
  END: 'End',
} as const

// =============================================
// VALIDATION HELPERS
// =============================================

/**
 * Valide qu'une taille est valide
 */
export function isValidSize(size: unknown): size is Size {
  return typeof size === 'string' && Object.values(UI_SIZES).includes(size as any)
}

/**
 * Valide qu'une variante est valide
 */
export function isValidVariant(variant: unknown): variant is keyof typeof UI_VARIANTS {
  return typeof variant === 'string' && Object.values(UI_VARIANTS).includes(variant as any)
}

/**
 * Valide qu'un type d'entité ERP est valide
 */
export function isValidEntityType(
  entityType: unknown
): entityType is keyof typeof ERP_ENTITY_TYPES {
  return (
    typeof entityType === 'string' && Object.values(ERP_ENTITY_TYPES).includes(entityType as any)
  )
}

// =============================================
// CONFIGURATION HELPERS
// =============================================

/**
 * Configuration par défaut pour les composants
 */
export const DEFAULT_CONFIG = {
  size: UI_SIZES.MD,
  variant: UI_VARIANTS.DEFAULT,
  theme: UI_THEMES.SYSTEM,
  animation: true,
  accessibility: true,
} as const

/**
 * Crée une configuration de composant avec des valeurs par défaut
 */
export function createComponentConfig<T extends Record<string, any>>(
  config: Partial<T>
): T & typeof DEFAULT_CONFIG {
  return {
    ...DEFAULT_CONFIG,
    ...config,
  } as T & typeof DEFAULT_CONFIG
}

// =============================================
// DEBUGGING ET DÉVELOPPEMENT
// =============================================

/**
 * Fonction de debug pour les composants UI
 */
export function debugComponent(
  componentName: string,
  props: Record<string, any>,
  enabled: boolean = process.env.NODE_ENV === 'development'
): void {
  if (enabled) {
    console.group(`🎨 UI Component: ${componentName}`)
    console.log('Props:', props)
    console.log('Package Info:', UI_PACKAGE_INFO)
    console.groupEnd()
  }
}

/**
 * Hook de développement pour logger les renders
 */
export function useDebugRender(
  componentName: string,
  props: Record<string, any>,
  enabled: boolean = process.env.NODE_ENV === 'development'
): void {
  if (enabled && typeof window !== 'undefined') {
    console.log(`🔄 ${componentName} rendered with:`, props)
  }
}

// =============================================
// VERSION ET COMPATIBILITÉ
// =============================================

/**
 * Vérifie la compatibilité de version
 */
export function checkCompatibility(requiredVersion: string): boolean {
  // Implémentation simple de vérification de version
  const currentVersion = UI_PACKAGE_INFO.version
  const currentParts = currentVersion.split('.')
  const requiredParts = requiredVersion.split('.')

  if (currentParts.length === 0 || requiredParts.length === 0) {
    return false
  }

  const currentMajor = parseInt(currentParts[0] || '0', 10)
  const requiredMajor = parseInt(requiredParts[0] || '0', 10)

  if (isNaN(currentMajor) || isNaN(requiredMajor)) {
    return false
  }

  return currentMajor >= requiredMajor
}

/**
 * Informations sur les features disponibles
 */
export const FEATURES = {
  DARK_MODE: true,
  ANIMATIONS: true,
  ACCESSIBILITY: true,
  RESPONSIVE: true,
  CUSTOM_THEMES: true,
  FORM_VALIDATION: true,
  INTERNATIONALIZATION: false, // À implémenter
  RTL_SUPPORT: false, // À implémenter
} as const

// =============================================
// EXPORT DEFAULT
// =============================================

export default {
  UI_PACKAGE_INFO,
  DEFAULT_CONFIG,
  FEATURES,
  checkCompatibility,
  debugComponent,
  useDebugRender,
}
