import {
  type CallHandler,
  type ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  type NestInterceptor,
} from '@nestjs/common'
// Sentry integration - Le package @sentry/node doit être installé séparément si nécessaire
import type { Request } from 'express'
import { type Observable, throwError } from 'rxjs'
import { catchError, tap } from 'rxjs/operators'
import { getErrorMessage } from '../../../core/common/utils'

@Injectable()
export class SentryInterceptor implements NestInterceptor {
  private readonly logger = new Logger(SentryInterceptor.name)
  private sentry: any = null

  constructor() {
    this.loadSentry()
  }

  private async loadSentry(): Promise<void> {
    try {
      this.sentry = await import('@sentry/node' as unknown).catch(() => null)
    } catch (_error) {
      this.logger.debug('Sentry not available for interceptor')
    }
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>()
    const { method, url, body, headers, query, params } = request

    // Si Sentry n'est pas disponible, continuer sans tracking
    if (!this.sentry) {
      return next.handle()
    }

    // Start Sentry transaction
    const transaction = this.sentry.startTransaction({
      op: 'http.server',
      name: `${method} ${url}`,
      tags: {
        'http.method': method,
        'http.url': url,
        'http.host': headers.host,
        'tenant.id': headers['x-tenant-id'] as string,
      },
    })

    // Set transaction on scope
    this.sentry.getCurrentHub().configureScope((scope: unknown) => {
      scope.setSpan(transaction)

      // Add request context
      scope.setContext('request', {
        method,
        url,
        headers: this.sanitizeHeaders(headers),
        query,
        params,
        body: this.sanitizeBody(body),
      })

      // Set user if available
      if ((request as unknown).user) {
        const user = (request as unknown).user
        scope.setUser({
          id: user.id,
          email: user.email,
          username: user.username,
          tenant_id: user.tenantId,
        })
      }

      // Add tags
      scope.setTag('component', 'api')
      scope.setTag('feature', 'marketplace')
      if (headers['x-tenant-id']) {
        scope.setTag('tenant.id', headers['x-tenant-id'] as string)
      }
      if (headers['x-request-id']) {
        scope.setTag('request.id', headers['x-request-id'] as string)
      }
    })

    // Add breadcrumb
    if (this.sentry) {
      this.sentry.addBreadcrumb({
        category: 'http',
        message: `${method} ${url}`,
        level: 'info',
        data: {
          method,
          url,
          query,
          params,
        },
      })
    }

    const startTime = Date.now()

    return next.handle().pipe(
      tap(() => {
        // Successful response
        const duration = Date.now() - startTime
        transaction.setHttpStatus(200)
        transaction.setData('response_time', duration)

        // Log slow requests
        if (duration > 1000 && this.sentry) {
          this.sentry.captureMessage(`Slow request: ${method} ${url}`, 'warning', {
            extra: {
              duration,
              method,
              url,
              query,
              params,
            },
          })
        }

        transaction.finish()
      }),
      catchError((error: Error) => {
        const duration = Date.now() - startTime

        // Determine status code
        let statusCode = HttpStatus.INTERNAL_SERVER_ERROR
        let errorMessage = getErrorMessage(error) || 'Internal server error'
        let errorData: any = {}

        if (error instanceof HttpException) {
          statusCode = error.getStatus()
          const response = error.getResponse()
          if (typeof response === 'object') {
            errorMessage = (response as unknown).message || errorMessage
            errorData = response
          } else {
            errorMessage = response
          }
        }

        // Set transaction status
        transaction.setHttpStatus(statusCode)
        transaction.setData('response_time', duration)
        transaction.setData('error', errorMessage)

        // Capture to Sentry if it's a server error
        if (statusCode >= 500 && this.sentry) {
          this.sentry.withScope((scope: unknown) => {
            scope.setLevel('error')
            scope.setContext('error', {
              statusCode,
              message: errorMessage,
              data: errorData,
              duration,
            })
            scope.setTag('error.type', error.constructor.name)
            scope.setTag('error.status', statusCode.toString())

            // Add error fingerprint for grouping
            scope.setFingerprint([
              method,
              url.split('?')[0], // Remove query params
              error.constructor.name,
              statusCode.toString(),
            ])

            const eventId = this.sentry.captureException(error)
            this.logger.error(`Error captured to Sentry: ${eventId}`, error.stack)
          })
        } else if (statusCode >= 400 && this.sentry) {
          // Log client errors as breadcrumbs
          this.sentry.addBreadcrumb({
            category: 'http.error',
            message: `${statusCode}: ${errorMessage}`,
            level: 'warning',
            data: {
              statusCode,
              method,
              url,
              error: errorMessage,
            },
          })
        } else if (statusCode >= 500) {
          // Si Sentry n'est pas disponible, logger localement
          this.logger.error(`Server error: ${statusCode} - ${errorMessage}`, error.stack)
        }

        transaction.finish()
        return throwError(() => error)
      })
    )
  }

  private sanitizeHeaders(headers: Record<string, unknown>): Record<string, unknown> {
    const sanitized = { ...headers }
    const sensitiveHeaders = [
      'authorization',
      'cookie',
      'x-api-key',
      'x-auth-token',
      'x-csrf-token',
    ]

    sensitiveHeaders.forEach((header) => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]'
      }
    })

    return sanitized
  }

  private sanitizeBody(body: unknown): any {
    if (!body || typeof body !== 'object') {
      return body
    }

    const sanitized = { ...body }
    const sensitiveFields = [
      'password',
      'passwordConfirm',
      'currentPassword',
      'newPassword',
      'token',
      'refreshToken',
      'apiKey',
      'secret',
      'creditCard',
      'cardNumber',
      'cvv',
      'ssn',
    ]

    const sanitizeObject = (obj: unknown): any => {
      if (!obj || typeof obj !== 'object') {
        return obj
      }

      const result = Array.isArray(obj) ? [...obj] : { ...obj }

      Object.keys(result).forEach((key) => {
        if (sensitiveFields.includes(key.toLowerCase())) {
          result[key] = '[REDACTED]'
        } else if (typeof result[key] === 'object') {
          result[key] = sanitizeObject(result[key])
        }
      })

      return result
    }

    return sanitizeObject(sanitized)
  }
}
