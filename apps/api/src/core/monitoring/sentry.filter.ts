import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import type { Request, Response } from 'express'
import type { SentryService } from './sentry.service'

@Catch()
export class SentryExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(SentryExceptionFilter.name)

  constructor(private readonly sentryService: SentryService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let message = 'Internal server error'
    let error = exception

    if (exception instanceof HttpException) {
      status = exception.getStatus()
      const exceptionResponse = exception.getResponse()
      message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as { message?: string }).message || exception.message
      error = exception
    } else if (exception instanceof Error) {
      message = exception.message
      error = exception
    }

    // Log error locally
    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${message}`,
      exception instanceof Error ? exception.stack : undefined
    )

    // Only send to Sentry if it's a server error (5xx) or specific 4xx errors
    const shouldSendToSentry =
      status >= 500 ||
      status === HttpStatus.TOO_MANY_REQUESTS ||
      status === HttpStatus.REQUEST_TIMEOUT

    if (shouldSendToSentry && error instanceof Error) {
      // Add additional context
      this.sentryService.withScope((scope) => {
        scope.setTag('type', 'exception')
        scope.setTag('http.status_code', status.toString())
        scope.setLevel('error')

        // Add request context
        scope.setContext('request', {
          method: request.method,
          url: request.url,
          headers: this.sanitizeHeaders(request.headers),
          query: request.query,
          body: this.sanitizeBody(request.body),
          ip: request.ip,
          userAgent: request.headers['user-agent'],
        })

        // Add user context if available
        const requestWithUser = request as Request & {
          user?: { id?: string; userId?: string; username?: string; email?: string }
        }
        if (requestWithUser.user) {
          const user = requestWithUser.user
          scope.setUser({
            id: user.id || user.userId || 'unknown',
            username: user.username || user.email || undefined,
          })
        }

        // Add fingerprint for better grouping
        scope.setFingerprint([
          request.method,
          request.route?.path || request.url.split('?')[0],
          status.toString(),
        ])

        // Capture the exception
        this.sentryService.captureException(error, {
          statusCode: status,
          path: request.url,
          method: request.method,
          timestamp: new Date().toISOString(),
        })
      })
    }

    // Send response to client
    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      // Only include stack trace in development
      ...(process.env.NODE_ENV === 'development' && {
        stack: exception instanceof Error ? exception.stack : undefined,
      }),
    })
  }

  private sanitizeHeaders(headers: Record<string, unknown>): Record<string, unknown> {
    const sanitized = { ...headers }
    // Remove sensitive headers
    delete sanitized.authorization
    delete sanitized.cookie
    delete sanitized['x-api-key']
    delete sanitized['x-auth-token']
    return sanitized
  }

  private sanitizeBody(body: Record<string, unknown>): Record<string, unknown> {
    if (!body) return body

    const sanitized = { ...body }
    // Remove sensitive fields
    delete sanitized.password
    delete sanitized.passwordConfirm
    delete sanitized.token
    delete sanitized.apiKey
    delete sanitized.creditCard
    delete sanitized.cvv

    return sanitized
  }
}
