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
  level: LogLevel;
  prefix?: string;
  isDevelopment?: boolean;
}

class Logger {
  private level: LogLevel;
  private prefix: string;
  private isDevelopment: boolean;

  constructor(config: LoggerConfig) {
    this.level = config.level ?? LogLevel.INFO;
    this.prefix = config.prefix ?? '';
    this.isDevelopment = config.isDevelopment ?? process.env.NODE_ENV === 'development';
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.level;
  }

  private formatMessage(level: string, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString();
    const prefixStr = this.prefix ? `[${this.prefix}]` : '';
    return `[${timestamp}] ${prefixStr}[${level}] ${message}`;
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      if (this.isDevelopment) {
        console.error(this.formatMessage('ERROR', message), ...args);
      } else {
        // In production, you could send to Sentry or other monitoring service
        console.error(this.formatMessage('ERROR', message), ...args);
      }
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.WARN)) {
      if (this.isDevelopment) {
        console.warn(this.formatMessage('WARN', message), ...args);
      } else {
        // In production, could be logged differently
        console.warn(this.formatMessage('WARN', message), ...args);
      }
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      if (this.isDevelopment) {
        console.info(this.formatMessage('INFO', message), ...args);
      } else {
        // In production, could be logged to a file or service
        console.info(this.formatMessage('INFO', message), ...args);
      }
    }
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.DEBUG) && this.isDevelopment) {
      // Debug logs only in development
      console.debug(this.formatMessage('DEBUG', message), ...args);
    }
  }

  log(message: string, ...args: any[]): void {
    // Alias for info
    this.info(message, ...args);
  }
}

// Factory function to create logger instances
export function createLogger(prefix?: string): Logger {
  const level = process.env.LOG_LEVEL 
    ? parseInt(process.env.LOG_LEVEL) as LogLevel
    : process.env.NODE_ENV === 'production' ? LogLevel.WARN : LogLevel.DEBUG;

  return new Logger({
    level,
    prefix,
    isDevelopment: process.env.NODE_ENV !== 'production',
  });
}

// Default logger instance
export const logger = createLogger();

// Specialized loggers
export const apiLogger = createLogger('API');
export const dbLogger = createLogger('DB');
export const authLogger = createLogger('AUTH');
export const webLogger = createLogger('WEB');

export default logger;