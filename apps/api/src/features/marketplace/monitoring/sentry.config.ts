// Configuration Sentry - Le package @sentry/node doit être installé séparément si nécessaire
// npm install @sentry/node @sentry/profiling-node

import { Injectable, Logger } from '@nestjs/common'
import type { ConfigService } from '@nestjs/config'

interface SentryModule {
  init: (options: Record<string, unknown>) => void
  captureException: (error: Error, context?: Record<string, unknown>) => string
  captureMessage: (message: string, context?: Record<string, unknown>) => string
  setUser: (user: Record<string, unknown> | null) => void
  addBreadcrumb: (breadcrumb: Record<string, unknown>) => void
  startTransaction: (options: Record<string, unknown>) => { finish: () => void }
  flush: (timeout: number) => Promise<boolean>
  close: (timeout: number) => Promise<boolean>
}

@Injectable()
export class SentryConfig {
  private readonly logger = new Logger(SentryConfig.name)
  private sentry: SentryModule | null = null

  constructor(private configService: ConfigService) {
    this.loadSentry()
  }

  private async loadSentry(): Promise<void> {
    try {
      // Essayer de charger Sentry dynamiquement
      this.sentry = await import('@sentry/node').catch(() => null)
      if (this.sentry) {
        this.logger.log('Sentry module loaded successfully')
      }
    } catch (_error) {
      this.logger.warn('Sentry module not installed - error tracking disabled')
    }
  }

  initialize(): void {
    const environment = this.configService.get('NODE_ENV') || 'development'
    const dsn = this.configService.get('SENTRY_DSN')

    if (!dsn) {
      this.logger.warn('Sentry DSN not configured - error tracking disabled')
      return
    }

    if (!this.sentry) {
      this.logger.warn(
        'Sentry module not available - install @sentry/node to enable error tracking'
      )
      return
    }

    this.sentry.init({
      dsn,
      environment,
      integrations: [
        // HTTP integration
        // Les intégrations seront ajoutées dynamiquement si disponibles
      ],

      // Performance Monitoring
      tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
      profilesSampleRate: environment === 'production' ? 0.1 : 1.0,

      // Release tracking
      release: process.env.npm_package_version || 'unknown',

      // Environment filtering
      beforeSend(event: unknown, hint: { originalException?: Error }) {
        // Filter out sensitive data
        const sentryEvent = event as {
          request?: {
            headers?: Record<string, unknown>
            query_string?: string
            data?: Record<string, unknown>
          }
        }
        if (sentryEvent.request) {
          // Remove authorization headers
          if (sentryEvent.request.headers) {
            delete sentryEvent.request.headers.authorization
            delete sentryEvent.request.headers.cookie
            delete sentryEvent.request.headers['x-api-key']
          }

          // Remove sensitive query params
          if (sentryEvent.request.query_string) {
            sentryEvent.request.query_string = sentryEvent.request.query_string
              .replace(/token=[^&]+/gi, 'token=[REDACTED]')
              .replace(/api_key=[^&]+/gi, 'api_key=[REDACTED]')
              .replace(/password=[^&]+/gi, 'password=[REDACTED]')
          }

          // Remove sensitive body data
          if (sentryEvent.request?.data) {
            const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'creditCard']
            sensitiveFields.forEach((field) => {
              if (sentryEvent.request?.data?.[field]) {
                sentryEvent.request.data[field] = '[REDACTED]'
              }
            })
          }
        }

        // Filter out non-error events in production
        if (environment === 'production') {
          const error = hint.originalException as Error & { statusCode?: number }
          // Skip non-critical errors
          if (error?.statusCode && error.statusCode < 500) {
            return null
          }
        }

        return event
      },

      // Ignore specific errors
      ignoreErrors: [
        // Browser errors
        'ResizeObserver loop limit exceeded',
        'Non-Error promise rejection captured',
        // Network errors
        'Network request failed',
        'NetworkError',
        'Failed to fetch',
        // User-caused errors
        'User cancelled',
        'user_cancelled',
        // Common non-critical errors
        'UnauthorizedException',
        'ValidationException',
      ],

      // Attach additional context
      initialScope: {
        tags: {
          service: 'marketplace-api',
          component: 'backend',
        },
        user: {
          segment: 'marketplace',
        },
      },

      // Auto session tracking
      autoSessionTracking: true,

      // Shutdown timeout
      shutdownTimeout: 2000,
    })

    this.logger.log(`Sentry initialized for ${environment} environment`)
  }

  // Set user context for error tracking
  setUserContext(userId: string, email?: string, tenantId?: string): void {
    if (!this.sentry) return

    this.sentry.setUser({
      id: userId,
      email,
      tenant_id: tenantId,
    })
  }

  // Clear user context on logout
  clearUserContext(): void {
    if (!this.sentry) return
    this.sentry.setUser(null)
  }

  // Add custom breadcrumb
  addBreadcrumb(
    message: string,
    category: string,
    level: 'info' | 'warning' | 'error' | 'debug' = 'info',
    data?: Record<string, unknown>
  ): void {
    if (!this.sentry) return

    this.sentry.addBreadcrumb({
      message,
      category,
      level,
      timestamp: Date.now() / 1000,
      data,
    })
  }

  // Capture exception with context
  captureException(
    error: Error,
    context?: {
      tags?: Record<string, string>
      extra?: Record<string, unknown>
      user?: { id?: string; email?: string }
      level?: 'info' | 'warning' | 'error' | 'debug'
    }
  ): string {
    if (!this.sentry) {
      this.logger.error('Error captured (Sentry disabled):', error)
      return 'sentry-disabled'
    }

    return this.sentry.captureException(error, {
      tags: context?.tags,
      extra: context?.extra,
      user: context?.user,
      level: context?.level || 'error',
    })
  }

  // Capture message
  captureMessage(message: string, level: 'info' | 'warning' | 'error' | 'debug' = 'info', context?: Record<string, unknown>): string {
    if (!this.sentry) {
      this.logger.log(`Message captured (Sentry disabled): ${message}`)
      return 'sentry-disabled'
    }

    return this.sentry.captureMessage(message, {
      level,
      extra: context,
    })
  }

  // Start transaction for performance monitoring
  startTransaction(name: string, op: string, description?: string): { finish: () => void } {
    if (!this.sentry) {
      return { finish: () => {} } // No-op transaction
    }

    return this.sentry.startTransaction({
      name,
      op,
      description,
    })
  }

  // Flush events before shutdown
  async flush(timeout?: number): Promise<boolean> {
    if (!this.sentry) return true
    return this.sentry.flush(timeout || 2000)
  }

  // Close Sentry client
  async close(timeout?: number): Promise<boolean> {
    if (!this.sentry) return true
    return this.sentry.close(timeout || 2000)
  }
}

export const sentryWebpackPlugin = {
  org: 'topsteel',
  project: 'marketplace-api',
  authToken: process.env.SENTRY_AUTH_TOKEN,
  release: {
    name: process.env.npm_package_version || 'unknown',
    uploadLegacySourcemaps: {
      paths: ['dist'],
      ignore: ['node_modules'],
    },
  },
  errorHandler: (_err: Error) => {},
}
