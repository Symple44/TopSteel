import { Injectable } from '@nestjs/common'
import * as Sentry from '@sentry/node'
import {
  addBreadcrumb,
  captureError,
  captureMessage,
  clearUser,
  setUser,
  startTransaction,
  withScope,
} from './sentry.config'

@Injectable()
export class SentryService {
  captureException(error: Error, context?: Record<string, unknown>): void {
    captureError(error, context)
  }

  captureMessage(
    message: string,
    level: Sentry.SeverityLevel = 'info',
    context?: Record<string, unknown>
  ): void {
    if (context) {
      withScope((scope) => {
        scope.setContext('extra', context)
        captureMessage(message, level)
      })
    } else {
      captureMessage(message, level)
    }
  }

  setUser(user: { id: string; username?: string; email?: string }): void {
    // Don't send email to Sentry for privacy
    const { email: _email, ...safeUser } = user
    setUser(safeUser)
  }

  clearUser(): void {
    clearUser()
  }

  addBreadcrumb(breadcrumb: {
    message: string
    category?: string
    level?: Sentry.SeverityLevel
    data?: Record<string, unknown>
    timestamp?: number
  }): void {
    addBreadcrumb({
      message: breadcrumb.message,
      category: breadcrumb.category || 'custom',
      level: breadcrumb.level || 'info',
      data: breadcrumb.data,
      timestamp: breadcrumb.timestamp || Date.now() / 1000,
    })
  }

  startTransaction(name: string, op: string = 'http.server'): unknown {
    return startTransaction(name, op)
  }

  finishTransaction(transaction: unknown): void {
    if (
      transaction &&
      typeof transaction === 'object' &&
      'finish' in transaction &&
      typeof (transaction as { finish?: () => void }).finish === 'function'
    ) {
      ;(transaction as { finish: () => void }).finish()
    }
  }

  withScope(callback: (scope: Sentry.Scope) => void): void {
    withScope(callback)
  }

  setTag(key: string, value: string): void {
    Sentry.setTag(key, value)
  }

  setContext(key: string, context: Record<string, unknown>): void {
    Sentry.setContext(key, context)
  }

  setLevel(level: Sentry.SeverityLevel): void {
    Sentry.withScope((scope) => {
      scope.setLevel(level)
    })
  }

  setFingerprint(fingerprint: string[]): void {
    Sentry.withScope((scope) => {
      scope.setFingerprint(fingerprint)
    })
  }
}
