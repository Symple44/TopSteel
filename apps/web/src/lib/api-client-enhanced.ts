/**
 * API CLIENT ENHANCED - Avec gestion de connexion
 */

import { APIClient, APIError, type RequestConfig } from './api-client'

type ConnectionCallback = (isConnected: boolean) => void

export class APIClientEnhanced extends APIClient {
  private connectionCallbacks: Set<ConnectionCallback> = new Set()
  private lastConnectionState: boolean = true
  private tokenVersion: string | null = null

  constructor(baseURL: string) {
    super(baseURL)
    this.initializeTokenVersioning()
  }

  /**
   * Initialiser le versioning des tokens
   */
  private initializeTokenVersioning(): void {
    if (typeof window === 'undefined') return

    // Récupérer ou créer une version de token
    const storedVersion = localStorage.getItem('topsteel-token-version')
    if (storedVersion) {
      this.tokenVersion = storedVersion
    } else {
      this.tokenVersion = Date.now().toString()
      localStorage.setItem('topsteel-token-version', this.tokenVersion)
    }
  }

  /**
   * Vérifier si le token est valide (pas invalidé par un redémarrage serveur)
   */
  private isTokenValid(): boolean {
    if (typeof window === 'undefined') return true

    const currentVersion = localStorage.getItem('topsteel-token-version')
    return currentVersion === this.tokenVersion
  }

  /**
   * Invalider tous les tokens (après redémarrage serveur)
   */
  public invalidateAllTokens(): void {
    if (typeof window === 'undefined') return

    // Nouvelle version de token
    this.tokenVersion = Date.now().toString()
    localStorage.setItem('topsteel-token-version', this.tokenVersion)

    // Supprimer les tokens existants
    localStorage.removeItem('topsteel-tokens')

    // Supprimer les cookies d'authentification
    // biome-ignore lint: Cookie cleanup required for logout
    document.cookie = 'accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    // biome-ignore lint: Cookie cleanup required for logout
    document.cookie = 'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'

    // Rediriger vers la page de login
    window.location.href = '/login'
  }

  /**
   * S'abonner aux changements de connexion
   */
  public onConnectionChange(callback: ConnectionCallback): () => void {
    this.connectionCallbacks.add(callback)

    // Retourner une fonction de désabonnement
    return () => {
      this.connectionCallbacks.delete(callback)
    }
  }

  /**
   * Notifier les observateurs du changement de connexion
   */
  private notifyConnectionChange(isConnected: boolean): void {
    if (this.lastConnectionState !== isConnected) {
      this.lastConnectionState = isConnected
      this.connectionCallbacks.forEach((callback) => callback(isConnected))
    }
  }

  /**
   * Override de la méthode request pour ajouter la détection de connexion
   */
  async request<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    try {
      // Vérifier la validité du token avant chaque requête
      if (!this.isTokenValid() && config.requireAuth !== false) {
        this.invalidateAllTokens()
        throw new Error('Token invalidé - redémarrage serveur détecté')
      }

      const result = await super.request<T>(endpoint, config)

      // Si la requête réussit, on est connecté
      this.notifyConnectionChange(true)

      return result
    } catch (error) {
      // Analyser le type d'erreur
      if (error instanceof APIError) {
        // Erreur réseau = perte de connexion
        if (error.isNetworkError() || error.code === 'NETWORK_ERROR') {
          this.notifyConnectionChange(false)
        }

        // Erreur 401 avec token valide = serveur redémarré
        if (error.code === 'HTTP_401' && this.isTokenValid()) {
          // Le serveur a probablement redémarré et invalidé tous les tokens
          this.invalidateAllTokens()
        }
      } else if (error instanceof Error) {
        // Erreurs de type timeout ou réseau
        if (error.message.includes('timeout') || error.message.includes('fetch')) {
          this.notifyConnectionChange(false)
        }
      }

      throw error
    }
  }

  /**
   * Endpoint de health check
   */
  async checkHealth(): Promise<boolean> {
    try {
      const healthData = await this.get('/health', {
        cache: false,
        retry: false,
        timeout: 5000,
        requireAuth: false,
      })

      // Si on reçoit des données, même avec des erreurs internes (DB down),
      // cela signifie que le serveur répond = connexion OK
      return !!(healthData && typeof healthData === 'object')
    } catch (_error) {
      // Seulement les erreurs réseau (timeout, connexion fermée, etc.)
      return false
    }
  }

  /**
   * Vérifier la connexion et la validité du token
   */
  async checkConnection(): Promise<{ connected: boolean; authenticated: boolean }> {
    try {
      // D'abord vérifier la connexion sans auth
      const connected = await this.checkHealth()

      if (!connected) {
        return { connected: false, authenticated: false }
      }

      // Ensuite vérifier l'authentification
      try {
        await this.get('/auth/profile', {
          cache: false,
          retry: false,
          timeout: 5000,
        })
        return { connected: true, authenticated: true }
      } catch (error) {
        if (error instanceof APIError && error.code === 'HTTP_401') {
          return { connected: true, authenticated: false }
        }
        throw error
      }
    } catch {
      return { connected: false, authenticated: false }
    }
  }
}

// Instance globale améliorée
export const apiClientEnhanced = new APIClientEnhanced(process.env.NEXT_PUBLIC_API_URL || '/api')

// Export de l'instance par défaut pour compatibilité
export const apiClient = apiClientEnhanced
