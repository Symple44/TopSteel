/**
 * Centralized logger utility for the entire application
 * Minimal implementation to avoid build issues
 */

export type LogLevelValue = 0 | 1 | 2 | 3

export interface LoggerConfig {
  level: LogLevelValue
  prefix?: string
  isDevelopment?: boolean
}

class Logger {
  private level: LogLevelValue
  private prefix: string
  private isDevelopment: boolean

  constructor(config: LoggerConfig) {
    this.level = config.level ?? 2
    this.prefix = config.prefix ?? ''
    this.isDevelopment = config.isDevelopment ?? process.env.NODE_ENV === 'development'
  }

  private shouldLog(level: LogLevelValue): boolean {
    return level <= this.level
  }

  error(_message: string, ..._args: unknown[]): void {
    if (this.shouldLog(0)) {
      // No-op for now
    }
  }

  warn(_message: string, ..._args: unknown[]): void {
    if (this.shouldLog(1)) {
      // No-op for now
    }
  }

  info(_message: string, ..._args: unknown[]): void {
    if (this.shouldLog(2)) {
      // No-op for now
    }
  }

  debug(_message: string, ..._args: unknown[]): void {
    if (this.shouldLog(3) && this.isDevelopment) {
      // No-op for now
    }
  }

  log(message: string, ...args: unknown[]): void {
    this.info(message, ...args)
  }
}

export function createLogger(prefix?: string): Logger {
  const level = process.env.LOG_LEVEL
    ? (parseInt(process.env.LOG_LEVEL, 10) as LogLevelValue)
    : process.env.NODE_ENV === 'production'
      ? 1
      : 3

  return new Logger({
    level,
    prefix,
    isDevelopment: process.env.NODE_ENV !== 'production',
  })
}

export const logger = createLogger()
export const apiLogger = createLogger('API')
export const dbLogger = createLogger('DB')
export const authLogger = createLogger('AUTH')
export const webLogger = createLogger('WEB')

export default logger
