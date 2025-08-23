import * as Sentry from '@sentry/node'
import { nodeProfilingIntegration } from '@sentry/profiling-node'
import { CaptureConsole } from '@sentry/integrations'

export interface SentryConfig {
  dsn: string
  environment: string
  enabled: boolean
  sampleRate: number
  tracesSampleRate: number
  profilesSampleRate: number
  debug?: boolean
  attachStacktrace?: boolean
  integrations?: any[]
}

export function initSentry(config: SentryConfig): void {
  if (!config.enabled) {
    console.log('Sentry monitoring is disabled')
    return
  }

  if (!config.dsn) {
    console.warn('Sentry DSN not provided, monitoring disabled')
    return
  }

  try {
    Sentry.init({
      dsn: config.dsn,
      environment: config.environment,
      sampleRate: config.sampleRate || 1.0,
      tracesSampleRate: config.tracesSampleRate || 0.1,
      profilesSampleRate: config.profilesSampleRate || 0.1,
      debug: config.debug || false,
      attachStacktrace: config.attachStacktrace !== false,
      integrations: [
        // Capture console errors
        new CaptureConsole({
          levels: ['error', 'warn']
        }),
        // Add profiling
        nodeProfilingIntegration(),
        // Add any custom integrations
        ...(config.integrations || [])
      ],
      beforeSend(event, hint) {
        // Filter out sensitive data
        if (event.request) {
          // Remove auth headers
          if (event.request.headers) {
            delete event.request.headers['authorization']
            delete event.request.headers['cookie']
            delete event.request.headers['x-api-key']
          }
          
          // Remove sensitive query params
          if (event.request.query_string) {
            const params = new URLSearchParams(event.request.query_string)
            params.delete('token')
            params.delete('apiKey')
            params.delete('password')
            event.request.query_string = params.toString()
          }
        }
        
        // Remove sensitive user data
        if (event.user) {
          delete event.user.email
          delete event.user.ip_address
        }
        
        // Filter out non-error events in production
        if (config.environment === 'production') {
          const error = hint.originalException
          if (error && typeof error === 'object' && 'statusCode' in error) {
            const statusCode = (error as any).statusCode
            // Don't send 4xx errors to Sentry in production
            if (statusCode >= 400 && statusCode < 500) {
              return null
            }
          }
        }
        
        return event
      },
      beforeSendTransaction(transaction) {
        // Filter out health check transactions
        const transactionName = transaction.transaction
        if (transactionName?.includes('/health')) {
          return null
        }
        return transaction
      }
    })

    console.log('Sentry monitoring initialized successfully')
  } catch (error) {
    console.error('Failed to initialize Sentry:', error)
  }
}

export function captureError(error: Error, context?: Record<string, any>): void {
  Sentry.captureException(error, {
    extra: context
  })
}

export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info'): void {
  Sentry.captureMessage(message, level)
}

export function setUser(user: { id: string; username?: string; [key: string]: any }): void {
  Sentry.setUser({
    id: user.id,
    username: user.username,
    // Don't send sensitive data
  })
}

export function clearUser(): void {
  Sentry.setUser(null)
}

export function addBreadcrumb(breadcrumb: Sentry.Breadcrumb): void {
  Sentry.addBreadcrumb(breadcrumb)
}

export function withScope(callback: (scope: Sentry.Scope) => void): void {
  Sentry.withScope(callback)
}

export function startTransaction(name: string, op: string): any {
  return Sentry.startSpan({
    name,
    op
  }, () => {})
}