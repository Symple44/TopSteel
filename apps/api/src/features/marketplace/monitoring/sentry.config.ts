// Configuration Sentry - Le package @sentry/node doit être installé séparément si nécessaire
// npm install @sentry/node @sentry/profiling-node

import { Injectable, Logger } from '@nestjs/common'
import type { ConfigService } from '@nestjs/config'

@Injectable()
export class SentryConfig {
  private readonly logger = new Logger(SentryConfig.name)
  private sentry: any = null

  constructor(private configService: ConfigService) {
    this.loadSentry()
  }

  private async loadSentry(): Promise<void> {
    try {
      // Essayer de charger Sentry dynamiquement
      // @ts-ignore - Module optionnel
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
      beforeSend(event, hint) {
        // Filter out sensitive data
        if (event.request) {
          // Remove authorization headers
          if (event.request.headers) {
            delete event.request.headers.authorization
            delete event.request.headers.cookie
            delete event.request.headers['x-api-key']
          }

          // Remove sensitive query params
          if (event.request.query_string) {
            event.request.query_string = event.request.query_string
              .replace(/token=[^&]+/gi, 'token=[REDACTED]')
              .replace(/api_key=[^&]+/gi, 'api_key=[REDACTED]')
              .replace(/password=[^&]+/gi, 'password=[REDACTED]')
          }

          // Remove sensitive body data
          if (event.request.data) {
            const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'creditCard']
            sensitiveFields.forEach((field) => {
              if (event.request.data[field]) {
                event.request.data[field] = '[REDACTED]'
              }
            })
          }
        }

        // Filter out non-error events in production
        if (environment === 'production') {
          const error = hint.originalException
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
    level: any = 'info',
    data?: Record<string, any>
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
      extra?: Record<string, any>
      user?: { id?: string; email?: string }
      level?: any
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
  captureMessage(message: string, level: any = 'info', context?: Record<string, any>): string {
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
  startTransaction(name: string, op: string, description?: string): any {
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
