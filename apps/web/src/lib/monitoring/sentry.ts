import * as Sentry from '@sentry/nextjs'
import { BrowserTracing } from '@sentry/tracing'

export function initSentry() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN
  const environment = process.env.NEXT_PUBLIC_ENV || process.env.NODE_ENV || 'development'
  const enabled = process.env.NEXT_PUBLIC_SENTRY_ENABLED === 'true'

  if (!enabled) {
    return
  }

  if (!dsn) {
    return
  }

  Sentry.init({
    dsn,
    environment,

    // Performance Monitoring
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,

    // Session Replay
    replaysSessionSampleRate: environment === 'production' ? 0.1 : 0,
    replaysOnErrorSampleRate: environment === 'production' ? 1.0 : 0,

    // Release Health
    autoSessionTracking: true,

    integrations: [
      new BrowserTracing({
        // Set sampling rate for performance monitoring
        tracingOrigins: ['localhost', process.env.NEXT_PUBLIC_APP_URL || '', /^\//],
        // Capture interactions
        routingInstrumentation: Sentry.nextRouterInstrumentation,
      }),
      new Sentry.Replay({
        // Mask all text content
        maskAllText: true,
        // Block all media elements
        blockAllMedia: true,
        // Mask all inputs
        maskAllInputs: true,
      }),
    ],

    // Filter out non-error events
    beforeSend(event, hint) {
      // Filter out known non-errors
      if (event.exception) {
        const error = hint.originalException

        // Filter out network errors that are expected
        if (error && typeof error === 'object') {
          const message = (error as any).message || ''

          // Filter out expected errors
          if (
            message.includes('Network request failed') ||
            message.includes('Failed to fetch') ||
            message.includes('Load failed') ||
            message.includes('ResizeObserver loop limit exceeded') ||
            message.includes('Non-Error promise rejection captured')
          ) {
            return null
          }
        }
      }

      // Remove sensitive data
      if (event.request) {
        if (event.request.cookies) {
          delete event.request.cookies
        }
        if (event.request.headers) {
          delete event.request.headers.authorization
          delete event.request.headers.cookie
        }
      }

      if (event.user) {
        delete event.user.email
        delete event.user.ip_address
      }

      return event
    },

    // Ignore certain errors
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      'LaunchDarkly',
      'NonErrorException',
      // Random network errors
      'Network request failed',
      'NetworkError',
      'Failed to fetch',
      // Safari specific
      'Non-Error promise rejection captured',
      // ResizeObserver benign error
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      // Hydration errors (often from extensions)
      'Hydration failed',
      'There was an error while hydrating',
    ],

    // Don't send default PII
    sendDefaultPii: false,
  })
}

export function captureException(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    extra: context,
  })
}

export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  Sentry.captureMessage(message, level)
}

export function setUser(user: { id: string; username?: string; [key: string]: any } | null) {
  if (user) {
    const { email, ...safeUser } = user as any
    Sentry.setUser(safeUser)
  } else {
    Sentry.setUser(null)
  }
}

export function addBreadcrumb(breadcrumb: {
  message: string
  category?: string
  level?: Sentry.SeverityLevel
  data?: Record<string, any>
}) {
  Sentry.addBreadcrumb(breadcrumb)
}

export function startTransaction(name: string, op: string = 'navigation') {
  return Sentry.startTransaction({ name, op })
}

export function setTag(key: string, value: string) {
  Sentry.setTag(key, value)
}

export function setContext(key: string, context: Record<string, any>) {
  Sentry.setContext(key, context)
}
