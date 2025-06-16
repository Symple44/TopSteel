// packages/utils/src/index.ts
// Formatage
export * from './format/currency'
export * from './format/date'
export * from './format/number'

// Calculs
export * from './calculation/pricing'
export * from './calculation/materials'

// Validation
export * from './validation/schemas'

// Constantes
export * from './constants/metallurgy'

// Helpers
export * from './helpers/array'
export * from './helpers/string'

// Fonction générale cn (className)
import clsx, { ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Fonctions de debug
export function debug(label: string, data: any): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEBUG] ${label}:`, data)
  }
}

export function logError(error: Error, context?: string): void {
  console.error(`[ERROR] ${context || 'Unknown'}:`, error)
}

// Type utilities
export type NonNullable<T> = T extends null | undefined ? never : T
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>