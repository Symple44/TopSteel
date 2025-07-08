/**
 * 🛠️ UTILITAIRES UI PACKAGE - TOPSTEEL ERP
 * Utilitaires dédiés au package UI avec optimisations
 *
 * Fonctionnalités:
 * - Combinaison de classes Tailwind optimisée
 * - Helpers pour les variantes de composants
 * - Utilities de performance pour les classes
 * - Validation et sanitization
 * - Cache des classes calculées
 */

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// =============================================
// CACHE DES CLASSES
// =============================================

const classCache = new Map<string, string>()
const maxCacheSize = 1000

function getCachedClass(key: string): string | undefined {
  return classCache.get(key)
}

function setCachedClass(key: string, value: string): void {
  if (classCache.size >= maxCacheSize) {
    const firstKey = classCache.keys().next().value

    if (firstKey) {
      classCache.delete(firstKey)
    }
  }
  classCache.set(key, value)
}

// =============================================
// UTILITAIRE CN PRINCIPAL
// =============================================

/**
 * Combine les classes CSS avec Tailwind merge et cache
 * Optimisé pour les performances avec mise en cache
 */
export function cn(...inputs: ClassValue[]): string {
  try {
    // Créer une clé de cache à partir des inputs
    const cacheKey = JSON.stringify(inputs)

    // Vérifier le cache
    const cached = getCachedClass(cacheKey)

    if (cached) {
      return cached
    }

    // Calculer et mettre en cache
    const result = twMerge(clsx(inputs))

    setCachedClass(cacheKey, result)

    return result
  } catch (error) {
    console.warn('[UI Package] Erreur lors de la combinaison des classes:', error)

    // Fallback sans cache ni merge
    return clsx(inputs)
  }
}

// =============================================
// HELPERS POUR VARIANTES
// =============================================

export type VariantProps<T> = {
  [K in keyof T]?: T[K] extends (...args: any[]) => any ? Parameters<T[K]>[0] : T[K]
}

/**
 * Crée un helper pour les variantes de composants
 */
export function createVariants<T extends Record<string, any>>(config: T) {
  return (props: VariantProps<T>) => {
    const classes: string[] = []

    Object.entries(props).forEach(([key, value]) => {
      if (value != null && key in config) {
        const variantConfig = config[key]

        if (typeof variantConfig === 'function') {
          classes.push(variantConfig(value))
        } else if (typeof variantConfig === 'object' && value in variantConfig) {
          classes.push(variantConfig[value])
        }
      }
    })

    return cn(...classes)
  }
}

/**
 * Combine les classes de base avec les variantes
 */
export function combineVariants(
  baseClasses: string,
  variantClasses: string,
  conditionalClasses?: Record<string, boolean>
): string {
  const classes = [baseClasses, variantClasses]

  if (conditionalClasses) {
    Object.entries(conditionalClasses).forEach(([className, condition]) => {
      if (condition) {
        classes.push(className)
      }
    })
  }

  return cn(...classes)
}

// =============================================
// UTILITIES DE VALIDATION
// =============================================

/**
 * Valide qu'une valeur est une classe CSS valide
 */
export function isValidClassName(className: unknown): className is string {
  return typeof className === 'string' && className.trim().length > 0
}

/**
 * Nettoie et valide une liste de classes
 */
export function sanitizeClasses(...classes: unknown[]): string[] {
  return classes
    .filter(isValidClassName)
    .map((className) => className.trim())
    .filter((className) => className.length > 0)
}

/**
 * Combine de manière sécurisée des classes avec validation
 */
export function safeClassNames(...classes: unknown[]): string {
  const validClasses = sanitizeClasses(...classes)

  return validClasses.join(' ')
}

// =============================================
// HELPERS POUR LES COMPOSANTS UI
// =============================================

/**
 * Utilitaire pour les focus rings accessibles
 */
export function focusRing(variant: 'default' | 'destructive' | 'none' = 'default'): string {
  const rings = {
    default:
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    destructive:
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2',
    none: 'focus-visible:outline-none',
  }

  return rings[variant]
}

/**
 * Classes pour les états disabled
 */
export function disabledState(): string {
  return 'disabled:pointer-events-none disabled:opacity-50'
}

/**
 * Classes pour les transitions standard
 */
export function standardTransition(): string {
  return 'transition-colors duration-200'
}

/**
 * Classes pour les hover effects
 */
export function hoverEffect(variant: 'subtle' | 'prominent' | 'none' = 'subtle'): string {
  const effects = {
    subtle: 'hover:opacity-80',
    prominent: 'hover:opacity-90 hover:scale-105',
    none: '',
  }

  return effects[variant]
}

// =============================================
// HELPERS POUR LES TAILLES
// =============================================

export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

/**
 * Générateur de classes de taille pour les boutons
 */
export function buttonSizes(size: Size): string {
  const sizes = {
    xs: 'h-7 px-2 text-xs',
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-11 px-8 text-base',
    xl: 'h-12 px-10 text-lg',
  }

  return sizes[size] || sizes.md
}

/**
 * Générateur de classes de taille pour les inputs
 */
export function inputSizes(size: Size): string {
  const sizes = {
    xs: 'h-7 px-2 text-xs',
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-3 text-sm',
    lg: 'h-11 px-4 text-base',
    xl: 'h-12 px-4 text-lg',
  }

  return sizes[size] || sizes.md
}

/**
 * Générateur de classes de padding
 */
export function paddingSizes(size: Size): string {
  const sizes = {
    xs: 'p-1',
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8',
  }

  return sizes[size] || sizes.md
}

// =============================================
// HELPERS POUR L'ACCESSIBILITÉ
// =============================================

/**
 * Ajoute les attributs d'accessibilité appropriés
 */
export function accessibilityProps(props: {
  label?: string
  description?: string
  required?: boolean
  invalid?: boolean
}) {
  const result: Record<string, any> = {}

  if (props.label) {
    result['aria-label'] = props.label
  }

  if (props.description) {
    result['aria-describedby'] = `${props.label || 'element'}-description`
  }

  if (props.required) {
    result['aria-required'] = true
  }

  if (props.invalid) {
    result['aria-invalid'] = true
  }

  return result
}

/**
 * Classes pour les états de validation
 */
export function validationClasses(state: 'valid' | 'invalid' | 'neutral' = 'neutral'): string {
  const states = {
    valid: 'border-green-500 text-green-900 focus:border-green-500 focus:ring-green-500',
    invalid: 'border-red-500 text-red-900 focus:border-red-500 focus:ring-red-500',
    neutral: 'border-input',
  }

  return states[state]
}

// =============================================
// UTILS POUR LE RESPONSIVE
// =============================================

/**
 * Classes responsive pour les conteneurs
 */
export function responsiveContainer(): string {
  return 'w-full mx-auto px-4 sm:px-6 lg:px-8'
}

/**
 * Classes responsive pour les grilles
 */
export function responsiveGrid(columns: {
  sm?: number
  md?: number
  lg?: number
  xl?: number
}): string {
  const classes = ['grid']

  if (columns.sm) classes.push(`sm:grid-cols-${columns.sm}`)
  if (columns.md) classes.push(`md:grid-cols-${columns.md}`)
  if (columns.lg) classes.push(`lg:grid-cols-${columns.lg}`)
  if (columns.xl) classes.push(`xl:grid-cols-${columns.xl}`)

  return cn(...classes)
}

// =============================================
// EXPORT DES CONSTANTES UTILES
// =============================================

export const UI_CONSTANTS = {
  BORDER_RADIUS: {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
  },

  SHADOWS: {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
  },

  SPACING: {
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  },
} as const

// =============================================
// NETTOYAGE DU CACHE
// =============================================

/**
 * Nettoie le cache des classes (utile pour les tests)
 */
export function clearClassCache(): void {
  classCache.clear()
}

/**
 * Retourne les statistiques du cache
 */
export function getCacheStats(): {
  size: number
  maxSize: number
  hitRate: number
} {
  return {
    size: classCache.size,
    maxSize: maxCacheSize,
    hitRate: 0, // À implémenter si nécessaire
  }
}
