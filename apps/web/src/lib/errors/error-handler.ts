/**
 * Centralized error handler with classification, user messages, and recovery strategies
 */

import type { TFunction } from 'i18next'
import { logger } from './logger'
import {
  AppError,
  AuthError,
  AuthorizationError,
  ConflictError,
  NetworkError,
  NotFoundError,
  RateLimitError,
  ServerError,
  UnexpectedError,
  ValidationError,
  isAppError,
} from './error-types'

/**
 * User-friendly error message structure
 */
export interface UserErrorMessage {
  title: string
  message: string
  action?: string
  code: string
  recoverable: boolean
  retryable: boolean
}

/**
 * Error handling options
 */
export interface ErrorHandlingOptions {
  showToast?: boolean
  logError?: boolean
  reportToBackend?: boolean
  translate?: TFunction
}

/**
 * Centralized error handler class
 */
export class ErrorHandler {
  private static instance: ErrorHandler

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler()
    }
    return ErrorHandler.instance
  }

  /**
   * Handle any error and return user-friendly message
   */
  handle(error: unknown, options: ErrorHandlingOptions = {}): UserErrorMessage {
    const { logError: shouldLog = true, reportToBackend = false, translate } = options

    // Log error
    if (shouldLog) {
      this.logError(error)
    }

    // Report to backend in production
    if (reportToBackend && process.env.NODE_ENV === 'production') {
      this.reportError(error)
    }

    // Classify and format error
    return this.formatError(error, translate)
  }

  /**
   * Classify error type
   */
  private classifyError(error: unknown): AppError {
    // Already an AppError
    if (isAppError(error)) {
      return error as AppError
    }

    // Standard Error object
    if (error instanceof Error) {
      // Network errors
      if (
        error.message.includes('fetch') ||
        error.message.includes('network') ||
        error.message.includes('timeout') ||
        error.name === 'NetworkError'
      ) {
        return new NetworkError(error.message, { originalError: error.message })
      }

      // Validation errors
      if (error.message.includes('validation') || error.message.includes('invalid')) {
        return new ValidationError(error.message)
      }

      // Auth errors
      if (
        error.message.includes('unauthorized') ||
        error.message.includes('unauthenticated') ||
        error.message.includes('login')
      ) {
        return new AuthError(error.message)
      }

      // Authorization errors
      if (error.message.includes('forbidden') || error.message.includes('permission')) {
        return new AuthorizationError(error.message)
      }

      // Not found errors
      if (error.message.includes('not found') || error.message.includes('404')) {
        return new NotFoundError(error.message)
      }

      // Rate limit errors
      if (error.message.includes('rate limit') || error.message.includes('too many')) {
        return new RateLimitError(error.message)
      }

      // Server errors
      if (
        error.message.includes('server error') ||
        error.message.includes('500') ||
        error.message.includes('503')
      ) {
        return new ServerError(error.message)
      }

      // Default to unexpected error
      return new UnexpectedError(error.message, error)
    }

    // HTTP Response object
    if (error && typeof error === 'object' && 'status' in error) {
      const status = (error as { status: number }).status
      const message = (error as { message?: string }).message || 'An error occurred'

      return this.classifyByStatusCode(status, message)
    }

    // Unknown error type
    return new UnexpectedError('An unexpected error occurred', undefined, { originalError: error })
  }

  /**
   * Classify error by HTTP status code
   */
  private classifyByStatusCode(statusCode: number, message: string): AppError {
    if (statusCode === 400) {
      return new ValidationError(message)
    }
    if (statusCode === 401) {
      return new AuthError(message)
    }
    if (statusCode === 403) {
      return new AuthorizationError(message)
    }
    if (statusCode === 404) {
      return new NotFoundError(message)
    }
    if (statusCode === 409) {
      return new ConflictError(message)
    }
    if (statusCode === 429) {
      return new RateLimitError(message)
    }
    if (statusCode >= 500) {
      return new ServerError(message, statusCode)
    }

    return new UnexpectedError(message)
  }

  /**
   * Format error for user display
   */
  private formatError(error: unknown, translate?: TFunction): UserErrorMessage {
    const appError = this.classifyError(error)
    const t = translate || ((key: string) => key)

    // Network errors
    if (NetworkError.isNetworkError(appError)) {
      return {
        title: t('errors.network.title'),
        message: t('errors.network.message'),
        action: t('errors.network.action'),
        code: appError.code,
        recoverable: true,
        retryable: true,
      }
    }

    // Validation errors
    if (ValidationError.isValidationError(appError)) {
      const validationError = appError as ValidationError
      const fields = validationError.fields

      return {
        title: t('errors.validation.title'),
        message: fields
          ? Object.entries(fields)
              .map(([field, errors]) => `${field}: ${errors.join(', ')}`)
              .join('; ')
          : appError.message,
        action: t('errors.validation.action'),
        code: appError.code,
        recoverable: true,
        retryable: false,
      }
    }

    // Auth errors
    if (AuthError.isAuthError(appError)) {
      return {
        title: t('errors.auth.title'),
        message: t('errors.auth.message'),
        action: t('errors.auth.action'),
        code: appError.code,
        recoverable: true,
        retryable: false,
      }
    }

    // Authorization errors
    if (AuthorizationError.isAuthorizationError(appError)) {
      return {
        title: t('errors.authorization.title'),
        message: t('errors.authorization.message'),
        action: t('errors.authorization.action'),
        code: appError.code,
        recoverable: false,
        retryable: false,
      }
    }

    // Not found errors
    if (NotFoundError.isNotFoundError(appError)) {
      return {
        title: t('errors.notFound.title'),
        message: t('errors.notFound.message'),
        action: t('errors.notFound.action'),
        code: appError.code,
        recoverable: false,
        retryable: false,
      }
    }

    // Conflict errors
    if (ConflictError.isConflictError(appError)) {
      return {
        title: t('errors.conflict.title'),
        message: t('errors.conflict.message'),
        action: t('errors.conflict.action'),
        code: appError.code,
        recoverable: true,
        retryable: false,
      }
    }

    // Rate limit errors
    if (RateLimitError.isRateLimitError(appError)) {
      const rateLimitError = appError as RateLimitError
      return {
        title: t('errors.rateLimit.title'),
        message: t('errors.rateLimit.message', {
          retryAfter: rateLimitError.retryAfter || 60,
        }),
        action: t('errors.rateLimit.action'),
        code: appError.code,
        recoverable: true,
        retryable: true,
      }
    }

    // Server errors
    if (ServerError.isServerError(appError)) {
      return {
        title: t('errors.server.title'),
        message: t('errors.server.message'),
        action: t('errors.server.action'),
        code: appError.code,
        recoverable: true,
        retryable: true,
      }
    }

    // Unexpected errors
    return {
      title: t('errors.unexpected.title'),
      message: t('errors.unexpected.message'),
      action: t('errors.unexpected.action'),
      code: appError.code,
      recoverable: false,
      retryable: false,
    }
  }

  /**
   * Log error with context
   */
  private logError(error: unknown): void {
    const appError = this.classifyError(error)

    logger.error(appError.message, error instanceof Error ? error : undefined, {
      code: appError.code,
      statusCode: appError.statusCode,
      context: appError.context,
    })
  }

  /**
   * Report error to backend
   */
  private async reportError(error: unknown): Promise<void> {
    try {
      const appError = this.classifyError(error)

      // Only report operational errors
      if (!appError.isOperational) return

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

      await fetch(`${apiUrl}/api/errors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appError.toJSON()),
      })
    } catch (reportError) {
      // Silent fail
      logger.warn('Failed to report error to backend', { error: reportError })
    }
  }

  /**
   * Determine if error is retryable
   */
  isRetryable(error: unknown): boolean {
    const appError = this.classifyError(error)

    return (
      NetworkError.isNetworkError(appError) ||
      RateLimitError.isRateLimitError(appError) ||
      ServerError.isServerError(appError)
    )
  }

  /**
   * Get recovery suggestion for error
   */
  getRecoverySuggestion(error: unknown): string | null {
    const appError = this.classifyError(error)

    if (NetworkError.isNetworkError(appError)) {
      return 'Check your internet connection and try again.'
    }

    if (AuthError.isAuthError(appError)) {
      return 'Please log in again to continue.'
    }

    if (ValidationError.isValidationError(appError)) {
      return 'Please correct the highlighted fields and try again.'
    }

    if (RateLimitError.isRateLimitError(appError)) {
      const rateLimitError = appError as RateLimitError
      return `Please wait ${rateLimitError.retryAfter || 60} seconds before trying again.`
    }

    if (ServerError.isServerError(appError)) {
      return 'The server is experiencing issues. Please try again later.'
    }

    return null
  }
}

// Singleton instance
export const errorHandler = ErrorHandler.getInstance()
