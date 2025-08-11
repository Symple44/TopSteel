// packages/utils/src/index.ts - Version corrigée
export { cn } from './lib/cn'
export { formatCurrency, formatDate, formatNumber } from './lib/formatters'
export { debounce, throttle } from './lib/functions'
export { validateCNPJ, validateEmail, validatePhone } from './lib/validators'

// Export des services de conversion
export { UnitConversionService, UnitType } from './conversion/unit-conversion.service'

// Export des types utilitaires
export type { DeepPartial, DeepRequired } from './types'

// Fonction de debug sécurisée
export function safeLog(..._args: unknown[]) {
  // biome-ignore lint/suspicious/noConsole: Debug function that safely checks for console availability
  if (typeof console !== 'undefined' && typeof console.log === 'function') {
    // console.log(...args) // Uncomment if needed for debugging
  }
}

// Fonction pour générer un ID unique (browser/server safe)
export function generateId(): string {
  // Tentative crypto.randomUUID (browser moderne)
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    try {
      return window.crypto.randomUUID().slice(0, 12)
    } catch {
      // Fallback si crypto.randomUUID échoue
    }
  }

  // Tentative Node.js crypto
  if (typeof globalThis !== 'undefined' && (globalThis as Record<string, unknown>).crypto) {
    try {
      return ((globalThis as Record<string, unknown>).crypto as { randomUUID: () => string })
        .randomUUID()
        .slice(0, 12)
    } catch {
      // Fallback si Node crypto échoue
    }
  }

  // Fallback universel
  return Math.random().toString(36).substring(2, 14)
}

// Utilitaires browser-safe
export function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

export function isServer(): boolean {
  return typeof window === 'undefined'
}

// Fonction pour obtenir une valeur de window de manière sûre
export function getWindowProperty<T = unknown>(key: string): T | undefined {
  if (
    isBrowser() &&
    window &&
    typeof (window as unknown as Record<string, unknown>)[key] !== 'undefined'
  ) {
    return (window as unknown as Record<string, unknown>)[key] as T
  }
  return undefined
}

// Fonction pour obtenir une valeur de globalThis de manière sûre
export function getGlobalProperty<T = unknown>(key: string): T | undefined {
  if (
    typeof globalThis !== 'undefined' &&
    typeof (globalThis as unknown as Record<string, unknown>)[key] !== 'undefined'
  ) {
    return (globalThis as unknown as Record<string, unknown>)[key] as T
  }
  return undefined
}

/**
 * Formate un pourcentage
 */
export function formatPercent(value: number, decimals = 2): string {
  return `${(value * 100).toFixed(decimals)}%`
}
