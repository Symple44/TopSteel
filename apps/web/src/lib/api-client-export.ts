/**
 * Export centralisé du client API
 *
 * Ce fichier exporte la version améliorée du client API
 * qui inclut la gestion de connexion et la détection du redémarrage serveur
 */

export type { APIErrorDetails, APIMetrics, RequestConfig } from './api-client'
export { APIError } from './api-client'
export { apiClientEnhanced as apiClient } from './api-client-enhanced'
