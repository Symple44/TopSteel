/**
 * TypeORM Type Helpers
 *
 * This file provides type helpers to resolve TypeScript compatibility issues
 * with TypeORM's internal types, particularly for repository update operations.
 */

import type { DeepPartial } from 'typeorm'
import type { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity'

/**
 * Type helper for TypeORM update operations
 * Converts a Partial<T> to TypeORM's expected QueryDeepPartialEntity<T>
 */
export type TypeORMUpdateData<T> = QueryDeepPartialEntity<T>

/**
 * Type helper for TypeORM partial entities
 */
export type TypeORMPartial<T> = DeepPartial<T>

/**
 * Convert a partial entity to TypeORM update format
 * This is a type-safe wrapper for repository.update() operations
 */
export function toTypeORMUpdate<T>(data: Partial<T>): TypeORMUpdateData<T> {
  return data as TypeORMUpdateData<T>
}

/**
 * Type guard to check if data is valid for TypeORM update
 */
export function isValidUpdateData<T>(data: unknown): data is TypeORMUpdateData<T> {
  return typeof data === 'object' && data !== null
}

/**
 * Safe update wrapper that handles type conversion
 */
export function prepareUpdateData<T>(data: Partial<T> | unknown): TypeORMUpdateData<T> {
  if (isValidUpdateData<T>(data)) {
    return data
  }
  return {} as TypeORMUpdateData<T>
}
