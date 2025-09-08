/**
 * Null Safety Utilities
 * Helpers for safely handling potentially null/undefined values
 */

/**
 * Safely access nested properties with optional chaining fallback
 */
export function safe<T>(fn: () => T): T | null {
  try {
    const result = fn()
    return result ?? null
  } catch {
    return null
  }
}

/**
 * Assert that a value is not null/undefined
 */
export function assertDefined<T>(
  value: T | null | undefined,
  message = 'Value is null or undefined'
): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message)
  }
}

/**
 * Get value with fallback
 */
export function withFallback<T>(value: T | null | undefined, fallback: T): T {
  return value ?? fallback
}

/**
 * Map over a potentially null value
 */
export function mapNullable<T, R>(value: T | null | undefined, fn: (value: T) => R): R | null {
  if (value === null || value === undefined) {
    return null
  }
  return fn(value)
}

/**
 * Chain operations on nullable values
 */
export class Maybe<T> {
  constructor(private value: T | null | undefined) {}

  static of<T>(value: T | null | undefined): Maybe<T> {
    return new Maybe(value)
  }

  map<R>(fn: (value: T) => R): Maybe<R> {
    if (this.value === null || this.value === undefined) {
      return new Maybe<R>(null)
    }
    return new Maybe(fn(this.value))
  }

  flatMap<R>(fn: (value: T) => Maybe<R>): Maybe<R> {
    if (this.value === null || this.value === undefined) {
      return new Maybe<R>(null)
    }
    return fn(this.value)
  }

  filter(predicate: (value: T) => boolean): Maybe<T> {
    if (this.value === null || this.value === undefined) {
      return this
    }
    return predicate(this.value) ? this : new Maybe<T>(null)
  }

  getOrElse(defaultValue: T): T {
    return this.value ?? defaultValue
  }

  getOrThrow(error?: Error | string): T {
    if (this.value === null || this.value === undefined) {
      throw typeof error === 'string'
        ? new Error(error)
        : error || new Error('Value is null or undefined')
    }
    return this.value
  }

  isPresent(): boolean {
    return this.value !== null && this.value !== undefined
  }

  ifPresent(fn: (value: T) => void): void {
    if (this.value !== null && this.value !== undefined) {
      fn(this.value)
    }
  }
}

/**
 * Safe array access
 */
export function safeArrayAccess<T>(
  array: T[] | null | undefined,
  index: number,
  fallback?: T
): T | undefined {
  if (!array || index < 0 || index >= array.length) {
    return fallback
  }
  return array[index] ?? fallback
}

/**
 * Safe object property access
 */
export function safeProp<T, K extends keyof T>(
  obj: T | null | undefined,
  key: K,
  fallback?: T[K]
): T[K] | undefined {
  if (!obj) return fallback
  return obj[key] ?? fallback
}

/**
 * Pipe nullable value through functions
 */
export function pipe<T>(value: T | null | undefined): {
  through: <R>(...fns: Array<(value: unknown) => any>) => R | null
} {
  return {
    through: <R>(...fns: Array<(value: unknown) => any>): R | null => {
      if (value === null || value === undefined) return null
      return fns?.reduce((acc, fn) => {
        if (acc === null || acc === undefined) return null
        return fn(acc)
      }, value as unknown) as R
    },
  }
}

/**
 * Ensure array is defined
 */
export function ensureArray<T>(value: T[] | null | undefined): T[] {
  return value ?? []
}

/**
 * Ensure string is defined
 */
export function ensureString(value: string | null | undefined): string {
  return value ?? ''
}

/**
 * Ensure number is defined
 */
export function ensureNumber(value: number | null | undefined, fallback = 0): number {
  return value ?? fallback
}

/**
 * Ensure boolean is defined
 */
export function ensureBoolean(value: boolean | null | undefined, fallback = false): boolean {
  return value ?? fallback
}
