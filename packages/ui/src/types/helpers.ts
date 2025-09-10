/**
 * @fileoverview Type helpers utilities for robust and evolutive type management
 * These utilities provide a foundation for type-safe operations across the UI package
 */

// ============================================================================
// PARTIAL TYPES HELPERS
// ============================================================================

/**
 * Deep partial type that makes all properties and nested properties optional
 * Useful for update operations where only changed fields are sent
 */
export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>
    }
  : T

/**
 * Partial with required fields
 * Useful for forms where some fields are mandatory
 */
export type PartialWithRequired<T, K extends keyof T> = Partial<T> & Pick<T, K>

/**
 * Makes specified keys optional while keeping others required
 */
export type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/**
 * Makes specified keys required while keeping others optional
 */
export type RequiredKeys<T, K extends keyof T> = Partial<T> & Required<Pick<T, K>>

// ============================================================================
// DISCRIMINATED UNION HELPERS
// ============================================================================

/**
 * Base type for discriminated unions with a type field
 */
export interface DiscriminatedType<T extends string> {
  type: T
}

/**
 * Creates a discriminated union from a record of types
 */
export type DiscriminatedUnion<T extends Record<string, unknown>> = {
  [K in keyof T]: { type: K } & T[K]
}[keyof T]

// ============================================================================
// FORM UPDATE HELPERS
// ============================================================================

/**
 * Type for form field updates with validation
 */
export interface FieldUpdate<T> {
  value: T
  isDirty?: boolean
  errors?: string[]
  touched?: boolean
}

/**
 * Type for complete form state
 */
export type FormState<T> = {
  [K in keyof T]: FieldUpdate<T[K]>
}

/**
 * Type for form updates (partial form state)
 */
export type FormUpdate<T> = DeepPartial<FormState<T>>

// ============================================================================
// VARIANT MAPPING HELPERS
// ============================================================================

/**
 * Badge variant types aligned with the design system
 */
export const BADGE_VARIANTS = ['default', 'secondary', 'destructive', 'outline'] as const
export type BadgeVariant = (typeof BADGE_VARIANTS)[number]

/**
 * Status to variant mapping type
 */
export type StatusVariantMap<T extends string = string> = Record<T, BadgeVariant>

/**
 * Creates a type-safe variant mapper
 */
export function createVariantMapper<T extends string>(
  map: StatusVariantMap<T>,
  defaultVariant: BadgeVariant = 'default'
): (status: T) => BadgeVariant {
  return (status: T) => map[status] || defaultVariant
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if a value is defined (not null or undefined)
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

/**
 * Type guard to check if a value is a non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

/**
 * Type guard to check if a value is a valid number
 */
export function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value) && Number.isFinite(value)
}

/**
 * Type guard to check if an object has a specific property
 */
export function hasProperty<T extends object, K extends PropertyKey>(
  obj: T,
  key: K
): obj is T & Record<K, unknown> {
  return key in obj
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validation result type
 */
export interface ValidationResult<T = unknown> {
  isValid: boolean
  value?: T
  errors?: string[]
  warnings?: string[]
}

/**
 * Validator function type
 */
export type Validator<T> = (value: unknown) => ValidationResult<T>

/**
 * Compose multiple validators
 */
export function composeValidators<T>(...validators: Validator<T>[]): Validator<T> {
  return (value: unknown) => {
    const errors: string[] = []
    const warnings: string[] = []
    let lastValidValue: T | undefined

    for (const validator of validators) {
      const result = validator(value)
      if (result.errors) errors.push(...result.errors)
      if (result.warnings) warnings.push(...result.warnings)
      if (result.isValid && result.value !== undefined) {
        lastValidValue = result.value
      }
      if (!result.isValid && errors.length === 0) {
        errors.push('Validation failed')
      }
    }

    return {
      isValid: errors.length === 0,
      value: lastValidValue,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    }
  }
}

// ============================================================================
// ARRAY/COLLECTION HELPERS
// ============================================================================

/**
 * Type for array or single value
 */
export type ArrayOrSingle<T> = T | T[]

/**
 * Ensures a value is an array
 */
export function ensureArray<T>(value: ArrayOrSingle<T>): T[] {
  return Array.isArray(value) ? value : [value]
}

/**
 * Type for paginated response
 */
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasNext: boolean
  hasPrevious: boolean
}

// ============================================================================
// ERROR HANDLING HELPERS
// ============================================================================

/**
 * Result type for operations that can fail
 */
export type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E }

/**
 * Creates a success result
 */
export function success<T>(data: T): Result<T, never> {
  return { success: true, data }
}

/**
 * Creates an error result
 */
export function failure<E = Error>(error: E): Result<never, E> {
  return { success: false, error }
}

/**
 * Type-safe error handler
 */
export function handleResult<T, E = Error>(
  result: Result<T, E>,
  handlers: {
    onSuccess: (data: T) => void
    onError: (error: E) => void
  }
): void {
  if (result.success) {
    handlers.onSuccess(result.data)
  } else {
    handlers.onError(result.error)
  }
}

// ============================================================================
// STATE MANAGEMENT HELPERS
// ============================================================================

/**
 * Loading state type
 */
export interface LoadingState<T> {
  isLoading: boolean
  data?: T
  error?: Error
  lastFetch?: Date
}

/**
 * Create initial loading state
 */
export function createLoadingState<T>(initialData?: T): LoadingState<T> {
  return {
    isLoading: false,
    data: initialData,
    error: undefined,
    lastFetch: undefined,
  }
}

// ============================================================================
// TYPE TRANSFORMATION HELPERS
// ============================================================================

/**
 * Omit multiple properties from a type
 */
export type OmitMultiple<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>

/**
 * Make all properties mutable (remove readonly)
 */
export type Mutable<T> = {
  -readonly [P in keyof T]: T[P]
}

/**
 * Extract the type of array elements
 */
export type ArrayElement<ArrayType extends readonly unknown[]> =
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never

/**
 * Nullable type helper
 */
export type Nullable<T> = T | null

/**
 * Maybe type helper (nullable or undefined)
 */
export type Maybe<T> = T | null | undefined

// ============================================================================
// EXPORT TYPE UTILS
// ============================================================================

export const TypeHelpers = {
  isDefined,
  isNonEmptyString,
  isValidNumber,
  hasProperty,
  ensureArray,
  success,
  failure,
  handleResult,
  createLoadingState,
  createVariantMapper,
  composeValidators,
} as const
