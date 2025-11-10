// apps/api/src/common/interceptors/logging.interceptor.ts
import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  Logger,
  type NestInterceptor,
} from '@nestjs/common'
import type { Observable } from 'rxjs'
import { catchError, tap } from 'rxjs/operators'

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
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name)

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

  private safeStringify(obj: unknown): string {
    try {
      // Utiliser JSON.stringify avec un replacer pour gérer les références circulaires
      const seen = new WeakSet()
      return JSON.stringify(obj, (key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) {
            return '[Circular]'
          }
          seen.add(value)
        }
        return value
      })
    } catch (error) {
      return '[Unable to stringify]'
    }
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest()
    const { method, url, headers, body: _body } = request
    const startTime = Date.now()
    const requestId = headers['x-request-id'] || `req_${Date.now()}`

    // Extraction robuste de l'userId
    const userId = this.extractUserId(request)

    const logData = {
      requestId,
      method,
      url,
      userAgent: headers['user-agent'],
      ip: request.ip,
      userId,
      timestamp: new Date().toISOString(),
    }

    return next.handle().pipe(
      tap((data) => {
        const responseTime = Date.now() - startTime
        this.logger.log({
          ...logData,
          responseTime,
          status: 'success',
          responseSize: this.safeStringify(data).length,
        })
      }),
      catchError((error) => {
        const responseTime = Date.now() - startTime
        this.logger.error({
          ...logData,
          responseTime,
          status: 'error',
          error: error.message,
          errorType: error.constructor.name,
        })
        throw error
      })
    )
  }
}
