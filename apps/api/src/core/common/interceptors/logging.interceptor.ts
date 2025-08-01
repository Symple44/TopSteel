// apps/api/src/common/interceptors/logging.interceptor.ts
import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  Logger,
  type NestInterceptor,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { catchError, tap } from 'rxjs/operators'

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name)

  private extractUserId(request: any): string | undefined {
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

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest()
    const { method, url, headers, body } = request
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
          responseSize: JSON.stringify(data).length,
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
