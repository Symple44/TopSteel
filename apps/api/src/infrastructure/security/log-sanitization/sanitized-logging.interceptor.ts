/**
 * 🔒 INTERCEPTEUR DE SANITISATION DES LOGS
 *
 * Intercepteur NestJS qui sanitise automatiquement tous les logs
 * pour protéger les données sensibles en production.
 */
import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  Logger,
  type NestInterceptor,
} from '@nestjs/common'
import type { Observable } from 'rxjs'
import { catchError, tap } from 'rxjs/operators'
import type { LogSanitizerService } from './log-sanitizer.service'

interface AuthenticatedRequest {
  user?: {
    id?: string
    sub?: string
    userId?: string
  }
  headers: Record<string, string>
  cookies?: Record<string, string>
  method: string
  url: string
  ip: string
  body?: Record<string, unknown>
  query?: Record<string, unknown>
}

@Injectable()
export class SanitizedLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(SanitizedLoggingInterceptor.name)

  constructor(private readonly logSanitizer: LogSanitizerService) {}

  private extractUserId(request: AuthenticatedRequest): string | undefined {
    // Méthode 1: request.user.id (après JwtAuthGuard)
    if (request.user?.id) {
      return request.user.id
    }

    // Méthode 2: request.user.sub (payload JWT direct)
    if (request.user?.sub) {
      return request.user.sub
    }

    // Méthode 3: Decoder le token JWT manuellement si présent
    try {
      const authHeader = request.headers.authorization
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        // Décoder la partie payload (base64)
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
        return payload.sub || payload.id || payload.userId
      }
    } catch (_error) {
      // Ignore l'erreur de décodage JWT
    }

    // Méthode 4: Vérifier dans les cookies
    if (request.cookies?.accessToken) {
      try {
        const payload = JSON.parse(
          Buffer.from(request.cookies.accessToken.split('.')[1], 'base64').toString()
        )
        return payload.sub || payload.id || payload.userId
      } catch (_error) {
        // Ignore l'erreur de décodage cookie
      }
    }

    // Méthode 5: Headers personnalisés
    if (request.headers['x-user-id']) {
      return request.headers['x-user-id']
    }

    return undefined
  }

  /**
   * Sanitise les données de la requête avant de les logger
   */
  private sanitizeRequestData(request: AuthenticatedRequest): Partial<AuthenticatedRequest> {
    const sanitizedHeaders = this.logSanitizer.sanitizeLogObject(request.headers) as Record<string, string>
    const sanitizedBody = this.logSanitizer.sanitizeLogObject(request.body) as Record<string, unknown> | undefined
    const sanitizedQuery = this.logSanitizer.sanitizeLogObject(request.query) as Record<string, unknown> | undefined
    const sanitizedCookies = this.logSanitizer.sanitizeLogObject(request.cookies) as Record<string, string> | undefined

    return {
      method: request.method,
      url: this.logSanitizer.sanitizeLogMessage(request.url),
      ip: this.sanitizeIpAddress(request.ip),
      headers: sanitizedHeaders,
      body: sanitizedBody,
      query: sanitizedQuery,
      cookies: sanitizedCookies,
    }
  }

  /**
   * Masque partiellement l'adresse IP si nécessaire
   */
  private sanitizeIpAddress(ip: string): string {
    if (process.env.LOG_MASK_IP_ADDRESSES === 'true') {
      return this.logSanitizer.sanitizeLogMessage(ip)
    }
    return ip
  }

  /**
   * Crée un objet de log sanitisé
   */
  private createSanitizedLogData(request: AuthenticatedRequest, requestId: string) {
    const userId = this.extractUserId(request)
    const sanitizedRequest = this.sanitizeRequestData(request)

    return {
      requestId,
      userId,
      timestamp: new Date().toISOString(),
      ...sanitizedRequest,
      userAgent: request.headers['user-agent']
        ? this.logSanitizer.sanitizeLogMessage(request.headers['user-agent'])
        : undefined,
    }
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest()
    const { headers } = request
    const startTime = Date.now()
    const requestId = headers['x-request-id'] || `req_${Date.now()}`

    // Création des données de log sanitisées
    const logData = this.createSanitizedLogData(request, requestId)

    return next.handle().pipe(
      tap((data) => {
        const responseTime = Date.now() - startTime

        // Sanitisation de la réponse également
        const sanitizedResponseSize = data
          ? JSON.stringify(this.logSanitizer.sanitizeLogObject(data)).length
          : 0

        this.logger.log({
          ...logData,
          responseTime,
          status: 'success',
          responseSize: sanitizedResponseSize,
          type: 'http_request_success',
        })
      }),
      catchError((error) => {
        const responseTime = Date.now() - startTime

        // Sanitisation de l'erreur
        const sanitizedError = this.logSanitizer.sanitizeLogMessage(error.message)
        const sanitizedStack = error.stack
          ? this.logSanitizer.sanitizeLogMessage(error.stack)
          : undefined

        this.logger.error({
          ...logData,
          responseTime,
          status: 'error',
          error: sanitizedError,
          errorType: error.constructor.name,
          stack: sanitizedStack,
          type: 'http_request_error',
        })

        throw error
      })
    )
  }
}
