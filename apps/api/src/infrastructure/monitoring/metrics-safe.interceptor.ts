// apps/api/src/common/interceptors/metrics-safe.interceptor.ts
import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  Logger,
  type NestInterceptor,
} from '@nestjs/common'
import { Request } from 'express'
import type { Response } from 'express'
import { Observable } from 'rxjs'
import { catchError, tap } from 'rxjs/operators'

@Injectable()
export class MetricsSafeInterceptor implements NestInterceptor {
  private readonly logger = new Logger(MetricsSafeInterceptor.name)

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>()
    const response = context.switchToHttp().getResponse<Response>()

    const startTime = Date.now()
    const route = this.getRoute(request)
    const method = request.method

    return next.handle().pipe(
      tap(() => {
        // Succès
        const duration = Date.now() - startTime
        this.logger.debug(`${method} ${route} - ${response.statusCode} - ${duration}ms`)
      }),
      catchError((error) => {
        // Erreur
        const duration = Date.now() - startTime
        const statusCode = error.status || 500
        this.logger.warn(
          `${method} ${route} - ${statusCode} - ${duration}ms - Error: ${error.message}`
        )

        throw error
      })
    )
  }

  private getRoute(request: Request): string {
    // Extraire la route sans paramètres dynamiques
    const baseRoute = request.route?.path || request.url

    // Normaliser les IDs dans les routes
    return baseRoute
      .replace(/\/\d+/g, '/:id')
      .replace(/\/[a-f0-9-]{36}/g, '/:uuid')
      .replace(/\/[a-f0-9]{24}/g, '/:objectId')
  }
}
