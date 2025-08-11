// Gestion sécurisée du stockage des données d'authentification
import type { AuthConfig, AuthTokens, Company, StoredSession, User } from './auth-types'

// Configuration par défaut
const DEFAULT_CONFIG: AuthConfig = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3002',
  tokenStorageKey: 'topsteel_auth_tokens',
  rememberMeStorageKey: 'topsteel_remember_me',
  broadcastChannelName: 'topsteel-auth',
}

export class AuthStorage {
  private config: AuthConfig

  constructor(config: Partial<AuthConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Sauvegarde une session complète
   */
  saveSession(
    user: User,
    tokens: AuthTokens,
    company: Company | null = null,
    rememberMe = false
  ): void {
    if (typeof window === 'undefined') return

    const sessionData: StoredSession = {
      user,
      tokens,
      company,
    }

    const storage = rememberMe ? localStorage : sessionStorage

    try {
      // Sauvegarder la session
      storage.setItem(this.config.tokenStorageKey, JSON.stringify(sessionData))

      // Sauvegarder également le token d'accès dans les cookies pour les routes API Next.js
      if (tokens.accessToken) {
        // biome-ignore lint: Token storage in secure cookie for API routes
        document.cookie = `accessToken=${tokens.accessToken}; path=/; secure; samesite=strict; max-age=${rememberMe ? 7 * 24 * 60 * 60 : 24 * 60 * 60}`
      }

      // Sauvegarder le flag remember me
      if (rememberMe) {
        localStorage.setItem(this.config.rememberMeStorageKey, 'true')
      } else {
        localStorage.removeItem(this.config.rememberMeStorageKey)
      }
    } catch (_error) {}
  }

  /**
   * Récupère la session stockée
   */
  getStoredSession(): StoredSession {
    if (typeof window === 'undefined') {
      return { user: null, tokens: null, company: null }
    }

    try {
      // Vérifier d'abord si remember me était activé
      const rememberMe = localStorage.getItem(this.config.rememberMeStorageKey) === 'true'
      const storage = rememberMe ? localStorage : sessionStorage

      const storedData = storage.getItem(this.config.tokenStorageKey)

      if (!storedData) {
        return { user: null, tokens: null, company: null }
      }

      const sessionData: StoredSession = JSON.parse(storedData)

      // Valider la structure des données
      if (!this.isValidSession(sessionData)) {
        this.clearSession()
        return { user: null, tokens: null, company: null }
      }

      return sessionData
    } catch (_error) {
      this.clearSession()
      return { user: null, tokens: null, company: null }
    }
  }

  /**
   * Efface la session stockée
   */
  clearSession(): void {
    if (typeof window === 'undefined') return

    try {
      // Effacer des deux types de stockage
      localStorage.removeItem(this.config.tokenStorageKey)
      sessionStorage.removeItem(this.config.tokenStorageKey)
      localStorage.removeItem(this.config.rememberMeStorageKey)

      // Effacer également le cookie
      // biome-ignore lint: Cookie cleanup required for secure logout
      document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    } catch (_error) {}
  }

  /**
   * Met à jour seulement les tokens
   */
  updateTokens(tokens: AuthTokens): void {
    if (typeof window === 'undefined') return

    const currentSession = this.getStoredSession()
    if (currentSession.user) {
      const rememberMe = localStorage.getItem(this.config.rememberMeStorageKey) === 'true'
      this.saveSession(currentSession.user, tokens, currentSession.company, rememberMe)
    }
  }

  /**
   * Met à jour seulement la société
   */
  updateCompany(company: Company): void {
    if (typeof window === 'undefined') return

    const currentSession = this.getStoredSession()
    if (currentSession.user && currentSession.tokens) {
      const rememberMe = localStorage.getItem(this.config.rememberMeStorageKey) === 'true'
      this.saveSession(currentSession.user, currentSession.tokens, company, rememberMe)
    }
  }

  /**
   * Valide la structure d'une session
   */
  private isValidSession(session: unknown): session is StoredSession {
    if (!session || typeof session !== 'object') return false

    // Valider l'utilisateur
    if (
      session.user &&
      (typeof session.user.id !== 'string' ||
        typeof session.user.email !== 'string' ||
        typeof session.user.firstName !== 'string' ||
        typeof session.user.lastName !== 'string')
    ) {
      return false
    }

    // Valider les tokens
    if (
      session.tokens &&
      (typeof session.tokens.accessToken !== 'string' ||
        typeof session.tokens.refreshToken !== 'string' ||
        typeof session.tokens.expiresAt !== 'number')
    ) {
      return false
    }

    // Valider la société
    if (
      session.company &&
      (typeof session.company.id !== 'string' ||
        typeof session.company.name !== 'string' ||
        typeof session.company.code !== 'string')
    ) {
      return false
    }

    return true
  }

  /**
   * Vérifie si les tokens sont expirés
   */
  areTokensExpired(tokens: AuthTokens): boolean {
    if (!tokens.expiresAt) {
      return true
    }

    // Ajouter une marge de 5 minutes
    const now = Date.now()
    const buffer = 5 * 60 * 1000 // 5 minutes en millisecondes
    const isExpired = now >= tokens.expiresAt - buffer

    return isExpired
  }

  /**
   * Obtenir la configuration
   */
  getConfig(): AuthConfig {
    return { ...this.config }
  }
}

// Instance singleton
export const authStorage = new AuthStorage()
