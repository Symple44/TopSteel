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

// Sentry type interfaces
interface SentryTransaction {
  setHttpStatus(status: number): void
  setData(key: string, value: unknown): void
  finish(): void
}

interface SentryScope {
  setSpan(span: SentryTransaction): void
  setContext(key: string, context: Record<string, unknown>): void
  setUser(user: Record<string, string>): void
  setTag(key: string, value: string): void
  setLevel(level: string): void
  setFingerprint(fingerprint: string[]): void
}

interface SentryHub {
  configureScope(callback: (scope: SentryScope) => void): void
}

interface SentryNode {
  startTransaction(options: {
    op: string
    name: string
    tags: Record<string, string>
  }): SentryTransaction
  getCurrentHub(): SentryHub
  addBreadcrumb(breadcrumb: {
    category: string
    message: string
    level: string
    data?: Record<string, unknown>
  }): void
  captureMessage(
    message: string,
    level: string,
    options?: {
      extra: Record<string, unknown>
    }
  ): string
  withScope(callback: (scope: SentryScope) => void): void
  captureException(error: Error): string
}

@Injectable()
export class SentryInterceptor implements NestInterceptor {
  private readonly logger = new Logger(SentryInterceptor.name)
  private sentry: SentryNode | null = null

  constructor() {
    this.loadSentry()
  }

  private async loadSentry(): Promise<void> {
    try {
      this.sentry = (await import('@sentry/node').catch(() => null)) as SentryNode | null
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
        'http.host': headers.host || 'unknown',
        'tenant.id': (headers['x-tenant-id'] as string) || 'unknown',
      },
    })

    // Set transaction on scope
    this.sentry.getCurrentHub().configureScope((scope: SentryScope) => {
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
      const req = request as Request & {
        user?: { id: string; email: string; username: string; tenantId: string }
      }
      if (req.user) {
        scope.setUser({
          id: req.user.id,
          email: req.user.email,
          username: req.user.username,
          tenant_id: req.user.tenantId,
        })
      }

      // Add tags
      scope.setTag('component', 'api')
      scope.setTag('feature', 'marketplace')
      if (headers['x-tenant-id']) {
        scope.setTag('tenant.id', String(headers['x-tenant-id']))
      }
      if (headers['x-request-id']) {
        scope.setTag('request.id', String(headers['x-request-id']))
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
        let errorData: Record<string, unknown> = {}

        if (error instanceof HttpException) {
          statusCode = error.getStatus()
          const response = error.getResponse()
          if (typeof response === 'object' && response !== null) {
            const responseObj = response as Record<string, unknown>
            errorMessage = (responseObj.message as string) || errorMessage
            errorData = responseObj
          } else {
            errorMessage = String(response)
          }
        }

        // Set transaction status
        transaction.setHttpStatus(statusCode)
        transaction.setData('response_time', duration)
        transaction.setData('error', errorMessage)

        // Capture to Sentry if it's a server error
        if (statusCode >= 500 && this.sentry) {
          this.sentry.withScope((scope: SentryScope) => {
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

            const eventId = this.sentry!.captureException(error)
            if (eventId) {
              this.logger.error(`Error captured to Sentry: ${eventId}`, error.stack)
            } else {
              this.logger.error('Error occurred but could not capture to Sentry', error.stack)
            }
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

  private sanitizeBody(body: unknown): unknown {
    if (!body || typeof body !== 'object') {
      return body
    }

    const sanitized = { ...(body as Record<string, unknown>) }
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

    const sanitizeObject = (obj: unknown): unknown => {
      if (!obj || typeof obj !== 'object') {
        return obj
      }

      const result: Record<string, unknown> = Array.isArray(obj)
        ? ([...(obj as unknown[])] as unknown as Record<string, unknown>)
        : { ...(obj as Record<string, unknown>) }

      Object.keys(result).forEach((key) => {
        if (sensitiveFields.includes(key.toLowerCase())) {
          result[key] = '[REDACTED]'
        } else if (typeof result[key] === 'object' && result[key] !== null) {
          result[key] = sanitizeObject(result[key])
        }
      })

      return result
    }

    return sanitizeObject(sanitized)
  }
}
