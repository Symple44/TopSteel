import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common'
import type { Span } from '@sentry/types'
import type { Observable } from 'rxjs'
import { catchError, tap } from 'rxjs/operators'
import { SentryService } from './sentry.service'

@Injectable()
export class SentryInterceptor implements NestInterceptor {
  constructor(private readonly sentryService: SentryService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest()
    const _response = context.switchToHttp().getResponse()

    // Start a transaction for this request
    const transaction = this.sentryService.startTransaction(
      `${request.method} ${request.route?.path || request.url}`,
      'http.server'
    ) as Span | null

    // Add request metadata
    if (transaction) {
      // Add user context if available
      if (request.user) {
        this.sentryService.setUser({
          id: request.user.id,
          username: request.user.username,
        })
      }
    }

    // Add breadcrumb for this request
    this.sentryService.addBreadcrumb({
      message: `${request.method} ${request.url}`,
      category: 'http',
      level: 'info',
      data: {
        method: request.method,
        url: request.url,
        ip: request.ip,
        userAgent: request.headers['user-agent'],
      },
    })

    const startTime = Date.now()

    return next.handle().pipe(
      tap(() => {
        const responseTime = Date.now() - startTime

        // Add response metadata
        if (transaction) {
          // Add performance breadcrumb for slow requests
          if (responseTime > 1000) {
            this.sentryService.addBreadcrumb({
              message: `Slow request: ${request.method} ${request.url}`,
              category: 'performance',
              level: 'warning',
              data: {
                responseTime,
                method: request.method,
                url: request.url,
              },
            })
          }

          // Finish the transaction
          this.sentryService.finishTransaction(transaction)
        }
      }),
      catchError((error) => {
        // The error will be caught by the exception filter
        // Just finish the transaction here
        if (transaction) {
          this.sentryService.finishTransaction(transaction)
        }
        throw error
      })
    )
  }
}
