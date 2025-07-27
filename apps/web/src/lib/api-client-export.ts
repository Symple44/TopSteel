/**
 * Export centralisé du client API
 * 
 * Ce fichier exporte la version améliorée du client API
 * qui inclut la gestion de connexion et la détection du redémarrage serveur
 */

export { apiClientEnhanced as apiClient } from './api-client-enhanced'
export { APIError } from './api-client'
export type { APIErrorDetails, APIMetrics, RequestConfig } from './api-client'