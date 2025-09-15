import * as Sentry from '@sentry/nextjs'

export function initSentry() {
  const dsn = process?.env?.NEXT_PUBLIC_SENTRY_DSN
  const environment = process?.env?.NEXT_PUBLIC_ENV || process?.env?.NODE_ENV || 'development'
  const enabled = process?.env?.NEXT_PUBLIC_SENTRY_ENABLED === 'true'

  if (!enabled) {
    return
  }

  if (!dsn) {
    return
  }

  Sentry?.init({
    dsn,
    environment,

    // Performance Monitoring
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,

    // Session Replay
    replaysSessionSampleRate: environment === 'production' ? 0.1 : 0,
    replaysOnErrorSampleRate: environment === 'production' ? 1.0 : 0,

    // Release Health (removed deprecated autoSessionTracking)

    integrations: [
      Sentry?.browserTracingIntegration({
        // Set sampling rate for performance monitoring
        // Note: tracingOrigins has been removed in newer Sentry versions
        // Origin tracking is now handled automatically
      }),
      Sentry?.replayIntegration({
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
          const message =
            'message' in error && typeof error?.message === 'string' ? error?.message : ''

          // Filter out expected errors
          if (
            message?.includes('Network request failed') ||
            message?.includes('Failed to fetch') ||
            message?.includes('Load failed') ||
            message?.includes('ResizeObserver loop limit exceeded') ||
            message?.includes('Non-Error promise rejection captured')
          ) {
            return null
          }
        }
      }

      // Remove sensitive data
      if (event.request) {
        if (event?.request?.cookies) {
          delete event?.request?.cookies
        }
        if (event?.request?.headers) {
          delete event?.request?.headers.authorization
          delete event?.request?.headers.cookie
        }
      }

      if (event.user) {
        delete event?.user?.email
        delete event?.user?.ip_address
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

export function captureException(error: Error, context?: Record<string, unknown>) {
  Sentry?.captureException(error, {
    extra: context,
  })
}

export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  Sentry?.captureMessage(message, level)
}

export function setUser(user: { id: string; username?: string; [key: string]: any } | null) {
  if (user) {
    // Remove sensitive data like email before sending to Sentry
    const { email, ...safeUser } = user as { email?: string; [key: string]: any }
    Sentry?.setUser(safeUser)
  } else {
    Sentry?.setUser(null)
  }
}

export function addBreadcrumb(breadcrumb: {
  message: string
  category?: string
  level?: Sentry.SeverityLevel
  data?: Record<string, unknown>
}) {
  Sentry?.addBreadcrumb(breadcrumb)
}

export function startSpan(name: string, op: string = 'navigation') {
  return Sentry?.startSpan({ name, op }, (span) => span)
}

export function setTag(key: string, value: string) {
  Sentry?.setTag(key, value)
}

export function setContext(key: string, context: Record<string, unknown>) {
  Sentry?.setContext(key, context)
}
