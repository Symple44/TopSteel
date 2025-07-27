// apps/api/src/common/interceptors/metrics.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { tap, catchError } from 'rxjs/operators'
import { InjectMetric } from '@willsoto/nestjs-prometheus'
import { Counter, Histogram } from 'prom-client'
import { Request, Response } from 'express'

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(
    @InjectMetric('topsteel_http_requests_total')
    private readonly httpRequestsCounter: Counter<string>,
    
    @InjectMetric('topsteel_http_request_duration_seconds')
    private readonly httpRequestDuration: Histogram<string>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>()
    const response = context.switchToHttp().getResponse<Response>()
    
    const startTime = Date.now()
    const route = this.getRoute(request)
    const method = request.method

    // Démarrer le timer pour la durée
    const endTimer = this.httpRequestDuration.startTimer({
      method,
      route,
    })

    return next.handle().pipe(
      tap(() => {
        // Succès
        const duration = (Date.now() - startTime) / 1000
        endTimer()
        
        this.httpRequestsCounter.inc({
          method,
          route,
          status_code: response.statusCode.toString(),
        })
      }),
      catchError((error) => {
        // Erreur
        const duration = (Date.now() - startTime) / 1000
        endTimer()
        
        const statusCode = error.status || 500
        this.httpRequestsCounter.inc({
          method,
          route,
          status_code: statusCode.toString(),
        })
        
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