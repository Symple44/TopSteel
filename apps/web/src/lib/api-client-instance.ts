/**
 * Instance du client API avec gestion de connexion et types complets
 *
 * Ce fichier exporte l'instance typée du client API
 * avec toutes les méthodes domaine-spécifiques
 */

import type { IAPIClientFinal } from './api-client-final'
import { apiClientFinal } from './api-client-final'

// Export de l'instance typée
export const apiClient: IAPIClientFinal = apiClientFinal

// Re-export des types et classes nécessaires
export type { APIErrorDetails, APIMetrics, RequestConfig } from './api-client'
export { APIError } from './api-client'
export type { IAPIClientFinal as APIClientInterface } from './api-client-final'
