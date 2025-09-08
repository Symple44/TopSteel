/**
 * Utilitaires pour la gestion des erreurs TypeScript
 */

/**
 * Convertit une erreur unknown en Error avec un message sécurisé
 */
export function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error
  }

  if (typeof error === 'string') {
    return new Error(error)
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return new Error(String(error.message))
  }

  return new Error('Une erreur inconnue est survenue')
}

/**
 * Extrait le message d'erreur de manière sécurisée
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  if (error && typeof error === 'object') {
    if ('message' in error && typeof error.message === 'string') {
      return error.message
    }

    if ('msg' in error && typeof error.msg === 'string') {
      return error.msg
    }
  }

  return 'Une erreur inconnue est survenue'
}

/**
 * Type guard pour vérifier si une erreur est une Error
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error
}

/**
 * Type guard pour vérifier si une erreur a un stack trace
 */
export function hasStack(error: unknown): error is Error & { stack: string } {
  return error instanceof Error && typeof error.stack === 'string'
}
