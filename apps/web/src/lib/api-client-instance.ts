/**
 * Instance du client API avec gestion de connexion
 *
 * Ce fichier exporte l'instance améliorée du client API
 * sans créer de dépendance circulaire
 */

import { apiClientEnhanced } from './api-client-enhanced'

// Export de l'instance améliorée
export const apiClient = apiClientEnhanced

// Re-export des types et classes nécessaires
export type { APIErrorDetails, APIMetrics, RequestConfig } from './api-client'
export { APIError } from './api-client'
