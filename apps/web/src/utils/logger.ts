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
  silent: 4
}

const currentLogLevel = LOG_LEVELS[logLevel as LogLevel] || LOG_LEVELS.warn

class Logger {
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= currentLogLevel
  }

  debug(...args: any[]) {
    if (this.shouldLog('debug')) {
      console.debug('[DEBUG]', ...args)
    }
  }

  info(...args: any[]) {
    if (this.shouldLog('info')) {
      console.info('[INFO]', ...args)
    }
  }

  warn(...args: any[]) {
    if (this.shouldLog('warn')) {
      console.warn('[WARN]', ...args)
    }
  }

  error(...args: any[]) {
    if (this.shouldLog('error')) {
      console.error('[ERROR]', ...args)
    }
  }

  // Helpers spécialisés
  auth(...args: any[]) {
    if (this.shouldLog('debug')) {
      console.debug('[AUTH]', ...args)
    }
  }

  api(...args: any[]) {
    if (this.shouldLog('debug')) {
      console.debug('[API]', ...args)
    }
  }
}

export const logger = new Logger()
export default logger