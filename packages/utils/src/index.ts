/**
 * 🛠️ @erp/utils - MAIN EXPORT INDEX
 * Tree-shaking optimized utility exports for TopSteel ERP
 *
 * ORGANIZATION:
 * - Essential utilities for quick access
 * - Domain-organized exports for better tree-shaking
 * - Browser/Server safe functions
 *
 * For better tree-shaking, prefer importing from specific subpaths:
 * - @erp/utils/format
 * - @erp/utils/validation
 * - @erp/utils/helpers
 * - etc.
 */

// ===== COMPLETE CATEGORY EXPORTS =====
// Re-export all utilities by category for backward compatibility
export * from './calculation'
export * from './constants'
export * from './conversion'
export * from './format'
export * from './helpers'
// ===== ESSENTIAL UTILITIES (Most commonly used) =====
export { cn } from './lib/cn'
export { formatCurrency, formatDate, formatNumber } from './lib/formatters'
export { debounce, throttle } from './lib/functions'
// Note: specific lib exports to avoid conflicts
export * from './lib/index'
// ===== LOGGING =====
export {
  apiLogger,
  authLogger,
  createLogger,
  dbLogger,
  type LoggerConfig,
  type LogLevelValue,
  logger,
  webLogger,
} from './logger'
// ===== TYPES =====
export type { DeepPartial, DeepRequired } from './types'
export * from './validation'

// ===== UTILITY FUNCTIONS =====

/**
 * Safe logging function that checks for console availability
 */
export function safeLog(..._args: unknown[]) {
  // Empty function - console logging removed for security
}

/**
 * Generate a unique ID (browser/server safe)
 */
export function generateId(): string {
  // Try crypto.randomUUID (modern browser)
  if (window?.crypto?.randomUUID) {
    try {
      return window.crypto.randomUUID().slice(0, 12)
    } catch {
      // Fallback if crypto.randomUUID fails
    }
  }

  // Try Node.js crypto
  if (typeof globalThis !== 'undefined' && (globalThis as Record<string, unknown>).crypto) {
    try {
      return ((globalThis as Record<string, unknown>).crypto as { randomUUID: () => string })
        .randomUUID()
        .slice(0, 12)
    } catch {
      // Fallback if Node crypto fails
    }
  }

  // Universal fallback
  return Math.random().toString(36).substring(2, 14)
}

/**
 * Check if running in browser environment
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

/**
 * Check if running in server environment
 */
export function isServer(): boolean {
  return typeof window === 'undefined'
}

/**
 * Safely get a window property
 */
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

/**
 * Safely get a globalThis property
 */
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
 * Format a percentage value
 */
export function formatPercent(value: number, decimals = 2): string {
  return `${(value * 100).toFixed(decimals)}%`
}
