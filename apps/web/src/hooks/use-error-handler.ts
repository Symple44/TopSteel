/**
 * Hook for component-level error handling
 * Provides toast notifications and error state management
 */

'use client'

import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { errorHandler, type UserErrorMessage } from '../lib/errors/error-handler'
import { logger } from '../lib/errors/logger'

export interface ErrorState {
  error: UserErrorMessage | null
  isError: boolean
  errorCount: number
}

export interface UseErrorHandlerReturn {
  errorState: ErrorState
  showError: (error: unknown, options?: ErrorHandlerOptions) => void
  clearError: () => void
  handleApiError: (error: unknown) => void
  retryWithErrorHandling: <T>(
    fn: () => Promise<T>,
    options?: RetryOptions
  ) => Promise<T | undefined>
}

export interface ErrorHandlerOptions {
  showToast?: boolean
  logError?: boolean
  reportToBackend?: boolean
  customMessage?: string
}

export interface RetryOptions {
  maxRetries?: number
  retryDelay?: number
  exponentialBackoff?: boolean
  onRetry?: (attempt: number) => void
}

/**
 * Hook for error handling in components
 */
export function useErrorHandler(): UseErrorHandlerReturn {
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isError: false,
    errorCount: 0,
  })

  /**
   * Show error with optional toast notification
   */
  const showError = useCallback(
    (error: unknown, options: ErrorHandlerOptions = {}) => {
      const { showToast: shouldShowToast = true, customMessage } = options

      // Handle error through centralized handler
      const userMessage = errorHandler.handle(error, {
        logError: options.logError ?? true,
        reportToBackend: options.reportToBackend ?? false,
      })

      // Update error state
      setErrorState((prev) => ({
        error: customMessage ? { ...userMessage, message: customMessage } : userMessage,
        isError: true,
        errorCount: prev.errorCount + 1,
      }))

      // Show toast notification
      if (shouldShowToast) {
        toast.error(userMessage.title, {
          description: customMessage || userMessage.message,
          action: userMessage.action
            ? {
                label: userMessage.action,
                onClick: () => {
                  if (userMessage.retryable) {
                    window.location.reload()
                  }
                },
              }
            : undefined,
        })
      }

      // Log error
      logger.error('Error handled in component', error instanceof Error ? error : undefined, {
        userMessage: userMessage.message,
        code: userMessage.code,
        componentName: 'useErrorHandler',
      })
    },
    []
  )

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      isError: false,
      errorCount: 0,
    })
  }, [])

  /**
   * Handle API errors specifically
   */
  const handleApiError = useCallback(
    (error: unknown) => {
      showError(error, {
        showToast: true,
        logError: true,
        reportToBackend: process.env.NODE_ENV === 'production',
      })
    },
    [showError]
  )

  /**
   * Retry function with error handling
   */
  const retryWithErrorHandling = useCallback(
    async <T,>(
      fn: () => Promise<T>,
      options: RetryOptions = {}
    ): Promise<T | undefined> => {
      const {
        maxRetries = 3,
        retryDelay = 1000,
        exponentialBackoff = true,
        onRetry,
      } = options

      let lastError: unknown
      let attempt = 0

      while (attempt < maxRetries) {
        try {
          const result = await fn()
          return result
        } catch (error) {
          lastError = error
          attempt++

          // Check if error is retryable
          if (!errorHandler.isRetryable(error)) {
            showError(error, { showToast: true })
            return undefined
          }

          // Don't retry if we've exhausted attempts
          if (attempt >= maxRetries) {
            break
          }

          // Calculate delay with optional exponential backoff
          const delay = exponentialBackoff ? retryDelay * 2 ** (attempt - 1) : retryDelay

          // Call onRetry callback
          if (onRetry) {
            onRetry(attempt)
          }

          // Log retry attempt
          logger.warn(`Retrying operation (attempt ${attempt}/${maxRetries})`, {
            delay,
            exponentialBackoff,
          })

          // Wait before retrying
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      }

      // All retries exhausted
      showError(lastError, {
        showToast: true,
        customMessage: `L'opération a échoué après ${maxRetries} tentatives.`,
      })

      return undefined
    },
    [showError]
  )

  return {
    errorState,
    showError,
    clearError,
    handleApiError,
    retryWithErrorHandling,
  }
}

/**
 * Hook for API error handling with automatic retry
 */
export function useApiErrorHandler() {
  const { handleApiError, retryWithErrorHandling } = useErrorHandler()

  const handleWithRetry = useCallback(
    async <T,>(fn: () => Promise<T>, maxRetries = 3): Promise<T | undefined> => {
      return retryWithErrorHandling(fn, {
        maxRetries,
        exponentialBackoff: true,
        onRetry: (attempt) => {
          toast.info(`Nouvelle tentative (${attempt}/${maxRetries})...`)
        },
      })
    },
    [retryWithErrorHandling]
  )

  return {
    handleApiError,
    handleWithRetry,
  }
}
