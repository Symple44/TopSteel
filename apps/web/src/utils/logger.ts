/**
 * Système de logs centralisé avec contrôle de niveau
 */

const isProduction = process.env.NODE_ENV === 'production'
const logLevel = process.env.NEXT_PUBLIC_LOG_LEVEL || (isProduction ? 'error' : 'warn')

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent'

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
}

const currentLogLevel = LOG_LEVELS[logLevel as LogLevel] || LOG_LEVELS.warn

class Logger {
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= currentLogLevel
  }

  debug(..._args: unknown[]) {
    if (this.shouldLog('debug')) {
    }
  }

  info(..._args: unknown[]) {
    if (this.shouldLog('info')) {
    }
  }

  warn(..._args: unknown[]) {
    if (this.shouldLog('warn')) {
    }
  }

  error(..._args: unknown[]) {
    if (this.shouldLog('error')) {
    }
  }

  // Helpers spécialisés
  auth(..._args: unknown[]) {
    if (this.shouldLog('debug')) {
    }
  }

  api(..._args: unknown[]) {
    if (this.shouldLog('debug')) {
    }
  }
}

export const logger = new Logger()
export default logger
