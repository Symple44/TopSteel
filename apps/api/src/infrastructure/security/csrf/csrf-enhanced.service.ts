import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as crypto from 'node:crypto'
import type { Request, Response } from 'express'

interface RequestWithSession {
  session?: {
    id?: string
  }
  cookies?: {
    sessionId?: string
  }
  ip?: string
  get: (header: string) => string | undefined
}

interface CsrfTokens {
  secret: string
  token: string
  hash: string
}

interface CsrfValidationResult {
  valid: boolean
  reason?: string
  attackVector?: string
}

/**
 * Service CSRF amélioré avec protection complète
 * Implémente le pattern "Double Submit Cookie" avec validation renforcée
 */
@Injectable()
export class CsrfEnhancedService {
  private readonly logger = new Logger(CsrfEnhancedService.name)
  private readonly masterSecret: string
  private readonly cookieName: string
  private readonly headerName: string
  private readonly isProduction: boolean
  private readonly tokenExpiry: number
  private readonly maxTokensPerSession: number
  private tokenStore: Map<string, { tokens: Set<string>; lastActivity: number }> = new Map()

  constructor(private readonly configService: ConfigService) {
    this.masterSecret = this.configService.get<string>('CSRF_SECRET') || this.generateMasterSecret()
    this.cookieName = this.configService.get<string>('CSRF_COOKIE_NAME') || '__Host-csrf'
    this.headerName = this.configService.get<string>('CSRF_HEADER_NAME') || 'x-csrf-token'
    this.isProduction = this.configService.get<string>('NODE_ENV') === 'production'
    this.tokenExpiry = 3600000 // 1 heure
    this.maxTokensPerSession = 10

    // Nettoyer les tokens expirés périodiquement
    setInterval(() => this.cleanupExpiredTokens(), 300000) // Toutes les 5 minutes

    this.logger.log('✅ Service CSRF Enhanced initialisé')
  }

  /**
   * Génère des tokens CSRF sécurisés avec liaison à la session
   */
  generateTokens(req: Request): CsrfTokens {
    const sessionId = this.getSessionId(req)
    const timestamp = Date.now()
    
    // Générer un secret unique pour cette requête
    const secret = this.generateSecret()
    
    // Créer un token avec HMAC pour garantir l'intégrité
    const tokenData = `${sessionId}:${timestamp}:${secret}`
    const token = this.createHmacToken(tokenData)
    
    // Créer un hash du token pour validation côté serveur
    const hash = this.hashToken(token)
    
    // Stocker le token pour validation ultérieure
    this.storeToken(sessionId, hash)
    
    this.logger.debug(`🔐 Tokens CSRF générés pour session: ${sessionId.substring(0, 8)}...`)
    
    return {
      secret,
      token,
      hash,
    }
  }

  /**
   * Valide un token CSRF avec vérifications multiples
   */
  validateToken(req: Request): CsrfValidationResult {
    try {
      // 1. Extraire le token de la requête
      const token = this.extractTokenFromRequest(req)
      if (!token) {
        return {
          valid: false,
          reason: 'Token CSRF manquant',
          attackVector: 'MISSING_TOKEN',
        }
      }

      // 2. Vérifier le format du token
      if (!this.isValidTokenFormat(token)) {
        return {
          valid: false,
          reason: 'Format de token invalide',
          attackVector: 'INVALID_FORMAT',
        }
      }

      // 3. Vérifier l'origine de la requête
      if (!this.validateOrigin(req)) {
        return {
          valid: false,
          reason: 'Origine non autorisée',
          attackVector: 'INVALID_ORIGIN',
        }
      }

      // 4. Vérifier le referer
      if (!this.validateReferer(req)) {
        return {
          valid: false,
          reason: 'Referer invalide',
          attackVector: 'INVALID_REFERER',
        }
      }

      // 5. Valider le token avec le secret
      const sessionId = this.getSessionId(req)
      const tokenHash = this.hashToken(token)
      
      if (!this.isTokenValid(sessionId, tokenHash)) {
        return {
          valid: false,
          reason: 'Token invalide ou expiré',
          attackVector: 'INVALID_TOKEN',
        }
      }

      // 6. Vérifier le double submit cookie
      if (!this.validateDoubleSubmit(req, token)) {
        return {
          valid: false,
          reason: 'Double submit cookie invalide',
          attackVector: 'DOUBLE_SUBMIT_FAILURE',
        }
      }

      // Token valide - le consommer pour éviter la réutilisation
      this.consumeToken(sessionId, tokenHash)
      
      return { valid: true }
      
    } catch (error) {
      this.logger.error('❌ Erreur lors de la validation CSRF:', error)
      return {
        valid: false,
        reason: 'Erreur de validation',
        attackVector: 'VALIDATION_ERROR',
      }
    }
  }

  /**
   * Configure les cookies CSRF avec protection maximale
   */
  setCsrfCookies(req: Request, res: Response): void {
    const tokens = this.generateTokens(req)
    
    // Cookie sécurisé avec le secret (HttpOnly, Secure, SameSite)
    const cookieOptions = {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: 'strict' as const,
      maxAge: this.tokenExpiry,
      path: '/',
      // Utiliser __Host- prefix pour sécurité maximale
      ...(this.isProduction && { domain: undefined }),
    }

    // Secret dans un cookie HttpOnly
    res.cookie(this.cookieName, tokens.secret, cookieOptions)
    
    // Token dans un cookie accessible (pour JavaScript)
    res.cookie(`${this.cookieName}-token`, tokens.token, {
      ...cookieOptions,
      httpOnly: false, // Accessible pour être lu par JavaScript
    })
    
    // Ajouter le token dans le header de réponse pour une utilisation immédiate
    res.setHeader('X-CSRF-Token', tokens.token)
    
    // Ajouter des headers de sécurité supplémentaires
    res.setHeader('X-Frame-Options', 'DENY')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    
    this.logger.debug('🍪 Cookies CSRF sécurisés configurés')
  }

  /**
   * Vérifie si une route nécessite une protection CSRF
   */
  shouldProtectRoute(req: Request): boolean {
    const method = req.method.toUpperCase()
    const path = req.path.toLowerCase()
    
    // Méthodes sûres qui ne nécessitent pas de protection
    const safeMethods = ['GET', 'HEAD', 'OPTIONS']
    if (safeMethods.includes(method)) {
      return false
    }
    
    // Routes publiques exclues
    const publicRoutes = [
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/forgot-password',
      '/api/webhooks/',
      '/api/health',
      '/api/metrics',
    ]
    
    if (publicRoutes.some(route => path.startsWith(route))) {
      return false
    }
    
    // Toutes les autres routes avec mutation nécessitent CSRF
    return true
  }

  /**
   * Extrait le token depuis la requête (header, body, query)
   */
  private extractTokenFromRequest(req: Request): string | null {
    // Ordre de priorité : Header > Body > Query
    return (
      req.get(this.headerName) ||
      req.get('x-xsrf-token') ||
      req.get('x-requested-with') ||
      req.body?._csrf ||
      req.query?._csrf as string ||
      null
    )
  }

  /**
   * Valide l'origine de la requête
   */
  private validateOrigin(req: Request): boolean {
    const origin = req.get('origin')
    const host = req.get('host')
    
    if (!origin && !this.isProduction) {
      // En développement, accepter les requêtes sans origine (Postman, etc.)
      return true
    }
    
    if (!origin) {
      return false
    }
    
    try {
      const originUrl = new URL(origin)
      const expectedHosts = [
        host,
        this.configService.get('FRONTEND_URL'),
        this.configService.get('ALLOWED_ORIGINS')?.split(','),
      ].flat().filter(Boolean)
      
      return expectedHosts.some(allowed => {
        if (!allowed) return false
        return originUrl.host === allowed || originUrl.host.endsWith(`.${allowed}`)
      })
    } catch {
      return false
    }
  }

  /**
   * Valide le referer de la requête
   */
  private validateReferer(req: Request): boolean {
    const referer = req.get('referer')
    
    if (!referer && !this.isProduction) {
      return true
    }
    
    if (!referer) {
      return false
    }
    
    try {
      const refererUrl = new URL(referer)
      const host = req.get('host')
      
      return refererUrl.host === host || this.validateOrigin(req)
    } catch {
      return false
    }
  }

  /**
   * Valide le double submit cookie
   */
  private validateDoubleSubmit(req: Request, token: string): boolean {
    const cookieToken = req.cookies?.[`${this.cookieName}-token`]
    return cookieToken === token
  }

  /**
   * Obtient ou génère un ID de session pour la requête
   */
  private getSessionId(req: Request): string {
    // Utiliser l'ID de session existant ou créer un hash basé sur les caractéristiques de la requête
    const reqWithSession = req as Request & RequestWithSession
    return (
      reqWithSession.session?.id ||
      reqWithSession.cookies?.sessionId ||
      this.hashToken(`${req.ip}:${req.get('user-agent')}:${this.masterSecret}`)
    )
  }

  /**
   * Génère un secret cryptographiquement sûr
   */
  private generateSecret(): string {
    return crypto.randomBytes(32).toString('base64url')
  }

  /**
   * Génère le secret maître pour l'application
   */
  private generateMasterSecret(): string {
    const secret = crypto.randomBytes(64).toString('base64')
    this.logger.warn('⚠️  CSRF_SECRET généré automatiquement. Définissez-le dans vos variables d\'environnement pour la production.')
    return secret
  }

  /**
   * Crée un token HMAC
   */
  private createHmacToken(data: string): string {
    return crypto
      .createHmac('sha256', this.masterSecret)
      .update(data)
      .digest('base64url')
  }

  /**
   * Hash un token pour le stockage
   */
  private hashToken(token: string): string {
    return crypto
      .createHash('sha256')
      .update(token)
      .digest('hex')
  }

  /**
   * Vérifie le format d'un token
   */
  private isValidTokenFormat(token: string): boolean {
    // Le token doit être une chaîne base64url d'au moins 32 caractères
    return /^[A-Za-z0-9_-]{32,}$/.test(token)
  }

  /**
   * Stocke un token pour validation ultérieure
   */
  private storeToken(sessionId: string, tokenHash: string): void {
    const session = this.tokenStore.get(sessionId) || {
      tokens: new Set<string>(),
      lastActivity: Date.now(),
    }
    
    // Limiter le nombre de tokens par session
    if (session.tokens.size >= this.maxTokensPerSession) {
      const tokensArray = Array.from(session.tokens)
      session.tokens.delete(tokensArray[0]) // Supprimer le plus ancien
    }
    
    session.tokens.add(tokenHash)
    session.lastActivity = Date.now()
    this.tokenStore.set(sessionId, session)
  }

  /**
   * Vérifie si un token est valide pour une session
   */
  private isTokenValid(sessionId: string, tokenHash: string): boolean {
    const session = this.tokenStore.get(sessionId)
    
    if (!session) {
      return false
    }
    
    // Vérifier l'expiration
    if (Date.now() - session.lastActivity > this.tokenExpiry) {
      this.tokenStore.delete(sessionId)
      return false
    }
    
    return session.tokens.has(tokenHash)
  }

  /**
   * Consomme un token (le rend invalide pour éviter la réutilisation)
   */
  private consumeToken(sessionId: string, tokenHash: string): void {
    const session = this.tokenStore.get(sessionId)
    if (session) {
      session.tokens.delete(tokenHash)
      session.lastActivity = Date.now()
    }
  }

  /**
   * Nettoie les tokens expirés
   */
  private cleanupExpiredTokens(): void {
    const now = Date.now()
    let cleaned = 0
    
    for (const [sessionId, session] of this.tokenStore.entries()) {
      if (now - session.lastActivity > this.tokenExpiry) {
        this.tokenStore.delete(sessionId)
        cleaned++
      }
    }
    
    if (cleaned > 0) {
      this.logger.debug(`🧹 Nettoyé ${cleaned} sessions CSRF expirées`)
    }
  }

  /**
   * Obtient les statistiques du service CSRF
   */
  getStats() {
    return {
      activeSessions: this.tokenStore.size,
      totalTokens: Array.from(this.tokenStore.values()).reduce(
        (total, session) => total + session.tokens.size,
        0
      ),
      configuration: {
        cookieName: this.cookieName,
        headerName: this.headerName,
        tokenExpiry: this.tokenExpiry,
        maxTokensPerSession: this.maxTokensPerSession,
        isProduction: this.isProduction,
      },
    }
  }
}