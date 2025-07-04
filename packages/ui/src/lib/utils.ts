// ===== UTILITAIRES DE STYLES HARMONISÉS - ERP TOPSTEEL =====
// packages/ui/src/lib/utils.ts
// Remplacement de l'utilitaire cn() existant avec version robuste

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// ===== UTILITAIRE CN AMÉLIORÉ =====
/**
 * Combine les classes Tailwind de manière optimisée
 * Résout les conflits et améliore la performance
 * Remplace l'ancienne version pour plus de robustesse
 */
export function cn(...inputs: ClassValue[]): string {
  try {
    return twMerge(clsx(inputs))
  } catch (error) {
    console.warn('[cn] Erreur lors de la combinaison des classes:', error)
    return clsx(inputs) // Fallback sans merge
  }
}

// ===== HELPERS POUR LES STYLES =====

/**
 * Combine les classes CSS de manière sécurisée
 */
export const combineClassNames = (...classes: (string | undefined | null | false)[]): string => {
  return classes
    .filter(cls => typeof cls === 'string' && cls.trim().length > 0)
    .join(' ')
    .trim()
}

/**
 * Applique des classes conditionnelles
 */
export const conditionalClasses = (
  baseClasses: string,
  conditions: Record<string, boolean>
): string => {
  const conditionalClasses = Object.entries(conditions)
    .filter(([, condition]) => Boolean(condition))
    .map(([className]) => className)

  return combineClassNames(baseClasses, ...conditionalClasses)
}

// ===== FORMATTERS =====

/**
 * Formate les montants financiers avec gestion robuste
 */
export const formatCurrency = (
  amount: number | string | null | undefined,
  currency = 'EUR',
  locale = 'fr-FR'
): string => {
  try {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
    if (typeof numAmount !== 'number' || isNaN(numAmount)) {
      return '0,00 €'
    }
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(numAmount)
  } catch {
    return `${amount || 0} €`
  }
}

/**
 * Formate les dates avec gestion d'erreur
 */
export const formatDate = (
  date: Date | string | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  },
  locale = 'fr-FR'
): string => {
  try {
    if (!date) return '-'
    
    const dateObj = typeof date === 'string' ? new Date(date) : date
    if (isNaN(dateObj.getTime())) return '-'
    
    return new Intl.DateTimeFormat(locale, options).format(dateObj)
  } catch {
    return '-'
  }
}

/**
 * Formate les pourcentages
 */
export const formatPercent = (
  value: number | string | null | undefined,
  decimals = 1
): string => {
  try {
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    if (typeof numValue !== 'number' || isNaN(numValue)) {
      return '0%'
    }
    
    return `${numValue.toFixed(decimals)}%`
  } catch {
    return '0%'
  }
}

// ===== VALIDATEURS RAPIDES =====

/**
 * Vérifie si une chaîne est vide ou undefined/null
 */
export const isEmpty = (value: string | null | undefined): boolean => {
  return !value || value.trim().length === 0
}

/**
 * Vérifie si une valeur est un nombre valide
 */
export const isValidNumber = (value: unknown): value is number => {
  return typeof value === 'number' && !isNaN(value) && isFinite(value)
}

/**
 * Tronque un texte avec ellipse
 */
export const truncate = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}...`
}

// ===== HELPERS POUR LES COULEURS =====

/**
 * Convertit une valeur HSL en classe Tailwind
 */
export const hslToTailwind = (h: number, s: number, l: number): string => {
  return `hsl(${h} ${s}% ${l}%)`
}

/**
 * Génère une couleur basée sur un hash string (pour avatars, etc.)
 */
export const generateColorFromString = (str: string): string => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  const hue = Math.abs(hash) % 360
  return hslToTailwind(hue, 70, 45)
}

// ===== UTILS PERFORMANCE =====

/**
 * Debounce function pour les inputs de recherche
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Throttle function pour les événements scroll
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// ===== EXPORTS LEGACY (COMPATIBILITÉ) =====
// Maintient la compatibilité avec l'ancien code

export { cn as default }
