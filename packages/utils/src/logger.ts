/**
 * Centralized logger utility for the entire application
 * Uses console in development and can be extended with Winston/Pino in production
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

export interface LoggerConfig {
  level: LogLevel
  prefix?: string
  isDevelopment?: boolean
}

class Logger {
  private level: LogLevel
  private prefix: string
  private isDevelopment: boolean

  constructor(config: LoggerConfig) {
    this.level = config.level ?? LogLevel.INFO
    this.prefix = config.prefix ?? ''
    this.isDevelopment = config.isDevelopment ?? process.env.NODE_ENV === 'development'
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.level
  }

  error(_message: string, ..._args: unknown[]): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      if (this.isDevelopment) {
      } else {
      }
    }
  }

  warn(_message: string, ..._args: unknown[]): void {
    if (this.shouldLog(LogLevel.WARN)) {
      if (this.isDevelopment) {
      } else {
      }
    }
  }

  info(_message: string, ..._args: unknown[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      if (this.isDevelopment) {
      } else {
      }
    }
  }

  debug(_message: string, ..._args: unknown[]): void {
    if (this.shouldLog(LogLevel.DEBUG) && this.isDevelopment) {
    }
  }

  log(message: string, ...args: unknown[]): void {
    // Alias for info
    this.info(message, ...args)
  }
}

// Factory function to create logger instances
export function createLogger(prefix?: string): Logger {
  const level = process.env.LOG_LEVEL
    ? (parseInt(process.env.LOG_LEVEL, 10) as LogLevel)
    : process.env.NODE_ENV === 'production'
      ? LogLevel.WARN
      : LogLevel.DEBUG

  return new Logger({
    level,
    prefix,
    isDevelopment: process.env.NODE_ENV !== 'production',
  })
}

// Default logger instance
export const logger = createLogger()

// Specialized loggers
export const apiLogger = createLogger('API')
export const dbLogger = createLogger('DB')
export const authLogger = createLogger('AUTH')
export const webLogger = createLogger('WEB')

export default logger
