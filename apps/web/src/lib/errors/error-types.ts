/**
 * Custom error classes for different error types
 * Provides structured error handling across the application
 */

/**
 * Base error class with additional context
 */
export class AppError extends Error {
  public readonly code: string
  public readonly statusCode: number
  public readonly isOperational: boolean
  public readonly context?: Record<string, unknown>
  public readonly timestamp: string

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, unknown>
  ) {
    super(message)

    this.name = this.constructor.name
    this.code = code
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.context = context
    this.timestamp = new Date().toISOString()

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor)
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      isOperational: this.isOperational,
      context: this.context,
      timestamp: this.timestamp,
      stack: this.stack,
    }
  }
}

/**
 * Network-related errors (API failures, timeouts, connection issues)
 */
export class NetworkError extends AppError {
  public readonly url?: string
  public readonly method?: string

  constructor(
    message: string,
    context?: { url?: string; method?: string; [key: string]: unknown }
  ) {
    super(message, 'NETWORK_ERROR', 0, true, context)

    this.url = context?.url as string | undefined
    this.method = context?.method as string | undefined
  }

  static isNetworkError(error: unknown): error is NetworkError {
    return error instanceof NetworkError || (error as AppError)?.code === 'NETWORK_ERROR'
  }
}

/**
 * Validation errors (form validation, data validation)
 */
export class ValidationError extends AppError {
  public readonly fields?: Record<string, string[]>

  constructor(
    message: string,
    fields?: Record<string, string[]>,
    context?: Record<string, unknown>
  ) {
    super(message, 'VALIDATION_ERROR', 400, true, { ...context, fields })
    this.fields = fields
  }

  static isValidationError(error: unknown): error is ValidationError {
    return error instanceof ValidationError || (error as AppError)?.code === 'VALIDATION_ERROR'
  }

  getFieldErrors(field: string): string[] {
    return this.fields?.[field] || []
  }
}

/**
 * Authentication errors (login failures, session expiry)
 */
export class AuthError extends AppError {
  public readonly authType?: 'login' | 'session' | 'token' | 'mfa'

  constructor(
    message: string,
    authType?: 'login' | 'session' | 'token' | 'mfa',
    context?: Record<string, unknown>
  ) {
    super(message, 'AUTH_ERROR', 401, true, { ...context, authType })
    this.authType = authType
  }

  static isAuthError(error: unknown): error is AuthError {
    return error instanceof AuthError || (error as AppError)?.code === 'AUTH_ERROR'
  }
}

/**
 * Authorization errors (permission denied, role mismatch)
 */
export class AuthorizationError extends AppError {
  public readonly requiredPermission?: string
  public readonly requiredRole?: string

  constructor(
    message: string,
    context?: { requiredPermission?: string; requiredRole?: string; [key: string]: unknown }
  ) {
    super(message, 'AUTHORIZATION_ERROR', 403, true, context)
    this.requiredPermission = context?.requiredPermission as string | undefined
    this.requiredRole = context?.requiredRole as string | undefined
  }

  static isAuthorizationError(error: unknown): error is AuthorizationError {
    return error instanceof AuthorizationError || (error as AppError)?.code === 'AUTHORIZATION_ERROR'
  }
}

/**
 * Resource not found errors (404 errors)
 */
export class NotFoundError extends AppError {
  public readonly resourceType?: string
  public readonly resourceId?: string

  constructor(
    message: string,
    resourceType?: string,
    resourceId?: string,
    context?: Record<string, unknown>
  ) {
    super(message, 'NOT_FOUND_ERROR', 404, true, { ...context, resourceType, resourceId })
    this.resourceType = resourceType
    this.resourceId = resourceId
  }

  static isNotFoundError(error: unknown): error is NotFoundError {
    return error instanceof NotFoundError || (error as AppError)?.code === 'NOT_FOUND_ERROR'
  }
}

/**
 * Conflict errors (duplicate resources, race conditions)
 */
export class ConflictError extends AppError {
  public readonly conflictType?: string

  constructor(message: string, conflictType?: string, context?: Record<string, unknown>) {
    super(message, 'CONFLICT_ERROR', 409, true, { ...context, conflictType })
    this.conflictType = conflictType
  }

  static isConflictError(error: unknown): error is ConflictError {
    return error instanceof ConflictError || (error as AppError)?.code === 'CONFLICT_ERROR'
  }
}

/**
 * Rate limit errors (too many requests)
 */
export class RateLimitError extends AppError {
  public readonly retryAfter?: number

  constructor(message: string, retryAfter?: number, context?: Record<string, unknown>) {
    super(message, 'RATE_LIMIT_ERROR', 429, true, { ...context, retryAfter })
    this.retryAfter = retryAfter
  }

  static isRateLimitError(error: unknown): error is RateLimitError {
    return error instanceof RateLimitError || (error as AppError)?.code === 'RATE_LIMIT_ERROR'
  }
}

/**
 * Server errors (internal server errors, service unavailable)
 */
export class ServerError extends AppError {
  public readonly serviceUnavailable?: boolean

  constructor(
    message: string,
    statusCode: number = 500,
    serviceUnavailable: boolean = false,
    context?: Record<string, unknown>
  ) {
    super(message, 'SERVER_ERROR', statusCode, false, { ...context, serviceUnavailable })
    this.serviceUnavailable = serviceUnavailable
  }

  static isServerError(error: unknown): error is ServerError {
    return error instanceof ServerError || (error as AppError)?.code === 'SERVER_ERROR'
  }
}

/**
 * Unexpected errors (catch-all for unknown errors)
 */
export class UnexpectedError extends AppError {
  public readonly originalError?: Error

  constructor(message: string, originalError?: Error, context?: Record<string, unknown>) {
    super(message, 'UNEXPECTED_ERROR', 500, false, {
      ...context,
      originalMessage: originalError?.message,
      originalStack: originalError?.stack,
    })
    this.originalError = originalError
  }

  static isUnexpectedError(error: unknown): error is UnexpectedError {
    return error instanceof UnexpectedError || (error as AppError)?.code === 'UNEXPECTED_ERROR'
  }
}

/**
 * Type guard to check if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError || (error as AppError)?.code !== undefined
}

/**
 * Error type discriminator
 */
export type ErrorType =
  | NetworkError
  | ValidationError
  | AuthError
  | AuthorizationError
  | NotFoundError
  | ConflictError
  | RateLimitError
  | ServerError
  | UnexpectedError
