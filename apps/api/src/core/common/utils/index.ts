/**
 * Export centralisé des utilitaires communs
 */

export * from './error.utils'

// Ré-export des fonctions les plus utilisées pour un accès direct
export {
  getErrorMessage,
  hasStack,
  isError,
  toError,
} from './error.utils'
