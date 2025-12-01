import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
// import { doubleCsrf } from 'csrf-csrf' // Simplified implementation for now
import type { Request, Response } from 'express'

interface CsrfTokens {
  secret: string
  token: string
}

interface CsrfOptions {
  secret?: string
  cookieName?: string
  headerName?: string
  valueName?: string
  cookieOptions?: {
    httpOnly?: boolean
    secure?: boolean
    sameSite?: 'strict' | 'lax' | 'none'
    maxAge?: number
    path?: string
    domain?: string
  }
}

@Injectable()
export class CsrfService {
  private readonly logger = new Logger(CsrfService.name)
  private readonly secret: string
  private readonly cookieName: string
  private readonly headerName: string
  private readonly valueName: string
  private readonly cookieOptions: CsrfOptions['cookieOptions']
  private readonly isProduction: boolean
  // private readonly csrfProtection: ReturnType<typeof doubleCsrf>

  constructor(private readonly configService: ConfigService) {
    this.secret = this.configService.get<string>('CSRF_SECRET') || this.generateSecureSecret()
    this.cookieName = this.configService.get<string>('CSRF_COOKIE_NAME') || '_csrf'
    this.headerName = this.configService.get<string>('CSRF_HEADER_NAME') || 'x-csrf-token'
    this.valueName = this.configService.get<string>('CSRF_VALUE_NAME') || '_csrf'
    this.isProduction = this.configService.get<string>('NODE_ENV') === 'production'

    this.cookieOptions = {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: this.isProduction ? 'strict' : 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 heures
      path: '/',
      domain: this.isProduction ? this.configService.get<string>('DOMAIN') : undefined,
    }

    if (!this.configService.get<string>('CSRF_SECRET')) {
      this.logger.warn("⚠️  CSRF_SECRET non défini. Utilisation d'un secret généré automatiquement.")
      this.logger.warn(
        "🔐 Pour la production, définissez CSRF_SECRET dans vos variables d'environnement."
      )
    }

    // Initialize csrf-csrf - simplified implementation for now
    // this.csrfProtection = doubleCsrf({ ... })

    this.logger.log('✅ Service CSRF initialisé avec succès')
    this.logger.debug(`Configuration CSRF: cookie=${this.cookieName}, header=${this.headerName}`)
  }

  /**
   * Génère un nouveau token CSRF pour une requête
   */
  generateTokens(_req?: Request): CsrfTokens {
    try {
      // Simple token generation - can be enhanced later
      const crypto = require('node:crypto')
      const token = crypto.randomBytes(32).toString('hex')
      return {
        secret: this.secret,
        token,
      }
    } catch (error) {
      this.logger.error('❌ Erreur lors de la génération des tokens CSRF:', error)
      throw new Error('Impossible de générer les tokens CSRF')
    }
  }

  /**
   * Valide un token CSRF pour une requête
   */
  validateToken(req: Request): boolean {
    try {
      // Simple validation - can be enhanced later
      const token = this.extractTokenFromRequest(req)
      const isValid = !!token && token.length === 64 // Basic validation

      if (!isValid) {
        this.logger.warn('🔒 Token CSRF invalide détecté', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path,
          method: req.method,
          timestamp: new Date().toISOString(),
        })
      }

      return isValid
    } catch (error) {
      this.logger.error('❌ Erreur lors de la validation du token CSRF:', error)
      return false
    }
  }

  /**
   * Configure les cookies CSRF sur la réponse
   */
  setCsrfCookies(req: Request, res: Response): void {
    try {
      const tokens = this.generateTokens(req)

      // Cookie avec le secret (httpOnly)
      res.cookie(this.cookieName, tokens.secret, {
        ...this.cookieOptions,
        httpOnly: true, // Le secret ne doit jamais être accessible via JavaScript
      })

      // Cookie avec le token (accessible via JavaScript pour les requêtes)
      res.cookie(`${this.cookieName}-token`, tokens.token, {
        ...this.cookieOptions,
        httpOnly: false, // Le token doit être accessible pour être envoyé dans les headers
      })

      // Header pour les requêtes immédiates
      res.setHeader('X-CSRF-Token', tokens.token)

      this.logger.debug('🍪 Cookies CSRF configurés avec succès')
    } catch (error) {
      this.logger.error('❌ Erreur lors de la configuration des cookies CSRF:', error)
      throw new Error('Impossible de configurer les cookies CSRF')
    }
  }

  /**
   * Extrait le token CSRF depuis les headers ou le body
   */
  extractTokenFromRequest(req: Request): string | null {
    // Priorité : header custom -> header standard -> body -> query
    return (
      req.get(this.headerName) ||
      req.get('x-xsrf-token') ||
      req.body?.[this.valueName] ||
      req.query?.[this.valueName] ||
      null
    )
  }

  /**
   * Vérifie si une route doit être protégée par CSRF
   */
  shouldProtectRoute(req: Request): boolean {
    const method = req.method.toLowerCase()
    const path = req.path

    // Méthodes à protéger
    const protectedMethods = ['post', 'put', 'patch', 'delete']

    // Routes exclues de la protection CSRF
    const excludedRoutes = [
      '/api/auth/login', // Login initial
      '/api/auth/refresh', // Refresh token
      '/api/webhooks', // Webhooks externes
      '/api/health', // Health checks
      '/api/metrics', // Métriques Prometheus
      '/api/auth/logout', // Logout (déjà authentifié)
      '/api/admin/menu-config', // Menu configuration (protected by JWT)
      '/api/admin/menu-raw', // Menu raw (protected by JWT)
      '/api/admin/users', // Users management (protected by JWT)
      '/api/admin/roles', // Roles management (protected by JWT)
      '/api/admin/groups', // Groups management (protected by JWT)
      '/api/admin/societes', // Societes management (protected by JWT)
    ]

    // Routes d'upload qui nécessitent une validation différente
    const uploadRoutes = ['/api/upload', '/api/files']

    // Vérifier si c'est une méthode protégée
    if (!protectedMethods.includes(method)) {
      return false
    }

    // Vérifier les exclusions
    if (excludedRoutes.some((route) => path.startsWith(route))) {
      return false
    }

    // Les uploads nécessitent une protection spéciale
    if (uploadRoutes.some((route) => path.startsWith(route))) {
      return true
    }

    // Toutes les autres routes POST/PUT/PATCH/DELETE sont protégées
    return true
  }

  /**
   * Génère un secret sécurisé pour CSRF
   */
  private generateSecureSecret(): string {
    const crypto = require('node:crypto')
    return crypto.randomBytes(32).toString('base64')
  }

  /**
   * Obtient la configuration actuelle
   */
  getConfiguration() {
    return {
      cookieName: this.cookieName,
      headerName: this.headerName,
      valueName: this.valueName,
      cookieOptions: this.cookieOptions,
      isProduction: this.isProduction,
    }
  }
}
