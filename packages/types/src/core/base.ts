/**
 * 🏗️ TYPES FONDAMENTAUX - TopSteel ERP
 * Types de base et interfaces principales
 */

/**
 * Types utilitaires de base
 */
export type ID = string
export type Timestamp = Date
export type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONValue[]
  | { [key: string]: JSONValue }

/**
 * Interface de base pour toutes les entités
 */
export interface BaseEntity {
  id: string
  createdAt: Date
  updatedAt: Date
  createdBy?: string
  updatedBy?: string
}

/**
 * Types pour les entités avec timestamps
 */
export type WithTimestamps<T> = T & {
  createdAt: Date
  updatedAt: Date
}

/**
 * Type avec ID obligatoire
 */
export type WithId<T> = T & { id: string }

/**
 * Type sans ID
 */
export type WithoutId<T> = Omit<T, 'id'>

/**
 * Type pour les entités "soft delete"
 */
export type WithSoftDelete<T> = T & {
  deletedAt?: Date | null
  isDeleted?: boolean
}

/**
 * Type pour les entités avec métadonnées
 */
export type WithMetadata<T> = T & {
  metadata?: Record<string, any>
}

/**
 * Types pour les états asynchrones
 */
export type AsyncState<T> = {
  data: T | null
  loading: boolean
  error: Error | null
}