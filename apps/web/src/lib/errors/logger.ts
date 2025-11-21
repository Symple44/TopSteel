/**
 * Structured logging service with multiple log levels and context
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogContext {
  userId?: string
  sessionId?: string
  componentName?: string
  action?: string
  duration?: number
  [key: string]: unknown
}

export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: LogContext
  stack?: string
  performance?: {
    startTime: number
    endTime?: number
    duration?: number
  }
}

/**
 * Structured logger with performance tracking
 */
export class Logger {
  private static instance: Logger
  private logHistory: LogEntry[] = []
  private maxHistorySize = 100
  private performanceMarks = new Map<string, number>()

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  /**
   * Log a debug message (development only)
   */
  debug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV !== 'development') return
    this.log('debug', message, context)
  }

  /**
   * Log an info message (normal operations)
   */
  info(message: string, context?: LogContext): void {
    this.log('info', message, context)
  }

  /**
   * Log a warning message (recoverable issues)
   */
  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context)
  }

  /**
   * Log an error message (errors that need attention)
   */
  error(message: string, error?: Error, context?: LogContext): void {
    const logContext: LogContext = {
      ...context,
      errorName: error?.name,
      errorMessage: error?.message,
    }

    this.log('error', message, logContext, error?.stack)
  }

  /**
   * Start a performance measurement
   */
  startPerformance(label: string): void {
    this.performanceMarks.set(label, performance.now())
  }

  /**
   * End a performance measurement and log it
   */
  endPerformance(label: string, context?: LogContext): number | null {
    const startTime = this.performanceMarks.get(label)
    if (!startTime) {
      this.warn(`Performance mark not found: ${label}`)
      return null
    }

    const endTime = performance.now()
    const duration = endTime - startTime

    this.info(`Performance: ${label}`, {
      ...context,
      duration: Math.round(duration * 100) / 100,
    })

    this.performanceMarks.delete(label)
    return duration
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, context?: LogContext, stack?: string): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: this.sanitizeContext(context),
      stack,
    }

    // Add to history (limited size)
    this.logHistory.push(entry)
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory.shift()
    }

    // Console output with proper formatting
    this.outputToConsole(entry)

    // Send to backend in production
    if (process.env.NODE_ENV === 'production' && level === 'error') {
      this.sendToBackend(entry)
    }
  }

  /**
   * Sanitize context to remove sensitive data
   */
  private sanitizeContext(context?: LogContext): LogContext | undefined {
    if (!context) return undefined

    const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'credential']
    const sanitized = { ...context }

    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]'
      }
    }

    return sanitized
  }

  /**
   * Output log to console with proper formatting
   */
  private outputToConsole(entry: LogEntry): void {
    const { level, message, timestamp, context, stack } = entry

    const styles = {
      debug: 'color: #888; font-weight: normal',
      info: 'color: #0066cc; font-weight: normal',
      warn: 'color: #ff9900; font-weight: bold',
      error: 'color: #cc0000; font-weight: bold',
    }

    const emoji = {
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
    }

    if (typeof window !== 'undefined') {
      // Browser console with styles
      console.log(
        `%c${emoji[level]} [${level.toUpperCase()}] ${timestamp}`,
        styles[level],
        message,
        context || ''
      )

      if (stack && level === 'error') {
        console.error('Stack trace:', stack)
      }
    } else {
      // Server-side console (no styles)
      console.log(`${emoji[level]} [${level.toUpperCase()}] ${timestamp} - ${message}`, context || '')

      if (stack && level === 'error') {
        console.error('Stack trace:', stack)
      }
    }
  }

  /**
   * Send error logs to backend (production only)
   */
  private async sendToBackend(entry: LogEntry): Promise<void> {
    try {
      // Only send in browser environment
      if (typeof window === 'undefined') return

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

      await fetch(`${apiUrl}/api/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...entry,
          userAgent: window.navigator.userAgent,
          url: window.location.href,
        }),
      })
    } catch (error) {
      // Silent fail - don't log errors about logging
      console.error('Failed to send log to backend:', error)
    }
  }

  /**
   * Get recent log history
   */
  getHistory(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logHistory.filter((entry) => entry.level === level)
    }
    return [...this.logHistory]
  }

  /**
   * Clear log history
   */
  clearHistory(): void {
    this.logHistory = []
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logHistory, null, 2)
  }
}

// Singleton instance
export const logger = Logger.getInstance()

/**
 * Convenience functions for direct import
 */
export const log = {
  debug: (message: string, context?: LogContext) => logger.debug(message, context),
  info: (message: string, context?: LogContext) => logger.info(message, context),
  warn: (message: string, context?: LogContext) => logger.warn(message, context),
  error: (message: string, error?: Error, context?: LogContext) =>
    logger.error(message, error, context),
  startPerformance: (label: string) => logger.startPerformance(label),
  endPerformance: (label: string, context?: LogContext) => logger.endPerformance(label, context),
}
