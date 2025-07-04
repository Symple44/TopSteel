// packages/types/src/generated.ts - Types auto-générés
// ⚠️ FICHIER GÉNÉRÉ AUTOMATIQUEMENT - NE PAS MODIFIER

export interface BaseEntity {
  id: string
  createdAt: Date
  updatedAt: Date
}

// Types stricts pour éviter any
export type ID = string
export type Timestamp = Date
export type Money = number
export type Percentage = number

// Utilitaires types
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>
export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

// Validation runtime
export function isValidID(value: unknown): value is ID {
  return typeof value === 'string' && value.length > 0
}

export function isValidMoney(value: unknown): value is Money {
  return typeof value === 'number' && value >= 0 && Number.isFinite(value)
}

export function isValidPercentage(value: unknown): value is Percentage {
  return typeof value === 'number' && value >= 0 && value <= 100
}
