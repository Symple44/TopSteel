// apps/web/src/lib/error-handler.ts
import { AxiosError } from 'axios'

export interface ApiError {
  message: string
  statusCode: number
  errors?: Array<{
    property: string
    value: any
    constraints: Record<string, string>
  }>
}

export interface FormattedError {
  title: string
  message: string
  field?: string
}

export class ErrorHandler {
  /**
   * Formate une erreur API pour l'affichage utilisateur
   */
  static formatError(error: unknown): FormattedError {
    if (error instanceof AxiosError) {
      const apiError = error.response?.data as ApiError
      
      // Erreur de validation (400) avec détails
      if (error.response?.status === 400 && apiError?.errors?.length) {
        return this.formatValidationError(apiError.errors[0])
      }
      
      // Erreur spécifique avec message du backend
      if (apiError?.message) {
        return this.formatSpecificError(error.response?.status || 500, apiError.message)
      }
      
      // Erreur HTTP générique
      return this.formatHttpError(error.response?.status || 500)
    }
    
    // Erreur inconnue
    return {
      title: 'Erreur inattendue',
      message: 'Une erreur inattendue s\'est produite. Veuillez réessayer.'
    }
  }

  /**
   * Formate une erreur de validation
   */
  private static formatValidationError(validationError: {
    property: string
    value: any
    constraints: Record<string, string>
  }): FormattedError {
    const { property, constraints } = validationError
    
    // Prendre le premier message de contrainte
    const constraintMessage = Object.values(constraints)[0]
    
    return {
      title: 'Données invalides',
      message: constraintMessage,
      field: property
    }
  }

  /**
   * Formate une erreur spécifique du backend
   */
  private static formatSpecificError(status: number, message: string): FormattedError {
    const titles: Record<number, string> = {
      400: 'Données invalides',
      401: 'Non autorisé',
      403: 'Accès refusé',
      404: 'Non trouvé',
      409: 'Conflit',
      422: 'Données incorrectes',
      500: 'Erreur serveur'
    }

    return {
      title: titles[status] || 'Erreur',
      message
    }
  }

  /**
   * Formate une erreur HTTP générique
   */
  private static formatHttpError(status: number): FormattedError {
    const errors: Record<number, FormattedError> = {
      400: {
        title: 'Requête invalide',
        message: 'Les données envoyées sont incorrectes.'
      },
      401: {
        title: 'Non autorisé',
        message: 'Vous devez vous connecter pour accéder à cette ressource.'
      },
      403: {
        title: 'Accès refusé',
        message: 'Vous n\'avez pas les permissions nécessaires.'
      },
      404: {
        title: 'Non trouvé',
        message: 'La ressource demandée n\'existe pas.'
      },
      409: {
        title: 'Conflit',
        message: 'Cette ressource existe déjà.'
      },
      422: {
        title: 'Données incorrectes',
        message: 'Les données fournies ne sont pas valides.'
      },
      429: {
        title: 'Trop de requêtes',
        message: 'Vous avez effectué trop de tentatives. Réessayez plus tard.'
      },
      500: {
        title: 'Erreur serveur',
        message: 'Une erreur est survenue sur le serveur. Réessayez plus tard.'
      },
      502: {
        title: 'Service indisponible',
        message: 'Le service est temporairement indisponible.'
      },
      503: {
        title: 'Service indisponible',
        message: 'Le service est en maintenance.'
      }
    }

    return errors[status] || {
      title: 'Erreur',
      message: 'Une erreur est survenue.'
    }
  }

  /**
   * Extrait tous les messages d'erreur de validation
   */
  static getAllValidationErrors(error: unknown): string[] {
    if (error instanceof AxiosError) {
      const apiError = error.response?.data as ApiError
      
      if (error.response?.status === 400 && apiError?.errors?.length) {
        return apiError.errors.flatMap(err => Object.values(err.constraints))
      }
    }
    
    return []
  }
}