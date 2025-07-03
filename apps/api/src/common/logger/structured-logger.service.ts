/**
 * 📝 LOGGER STRUCTURÉ BACKEND - TopSteel ERP (VERSION CORRIGÉE)
 */
import { Injectable, Logger } from '@nestjs/common'
import * as winston from 'winston'

export interface LogContext {
  userId?: string
  requestId?: string
  sessionId?: string
  action?: string
  resource?: string
  metadata?: Record<string, any>
}

export interface SecurityLogContext extends LogContext {
  ipAddress?: string
  userAgent?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  activity?: string
}

@Injectable()
export class TopSteelLogger extends Logger {
  private winstonLogger: winston.Logger

  constructor() {
    super('TopSteel')
    
    this.winstonLogger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return JSON.stringify({
            '@timestamp': timestamp,
            level,
            message,
            service: 'topsteel-api',
            environment: process.env.NODE_ENV || 'development',
            version: process.env.APP_VERSION || '1.0.0',
            ...meta
          })
        })
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        }),
        new winston.transports.File({ 
          filename: 'logs/error.log', 
          level: 'error',
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        }),
        new winston.transports.File({ 
          filename: 'logs/combined.log',
          maxsize: 5242880, // 5MB
          maxFiles: 10,
        })
      ]
    })
  }

  // === LOGGING BUSINESS ===
  
  logBusinessEvent(event: string, context: LogContext = {}) {
    this.winstonLogger.info('Business Event', {
      type: 'business_event',
      event,
      ...context
    })
  }

  logUserAction(action: string, context: LogContext = {}) {
    this.winstonLogger.info('User Action', {
      type: 'user_action',
      action,
      ...context
    })
  }

  logDatabaseOperation(operation: string, table: string, duration: number, context: LogContext = {}) {
    this.winstonLogger.info('Database Operation', {
      type: 'database_operation',
      operation,
      table,
      duration,
      unit: 'ms',
      ...context
    })
  }

  // === LOGGING SÉCURITÉ ===
  
  logSecurityEvent(event: string, context: SecurityLogContext) {
    const logLevel = this.getSecurityLogLevel(context.severity)
    const logMethod = this.winstonLogger[logLevel as keyof winston.Logger] as winston.LeveledLogMethod
    
    logMethod('Security Event', {
      type: 'security_event',
      event,
      ...context
    })
  }

  logAuthenticationAttempt(success: boolean, context: Partial<SecurityLogContext> = {}) {
    this.logSecurityEvent(
      success ? 'authentication_success' : 'authentication_failure',
      {
        severity: success ? 'low' : 'medium',
        ...context
      }
    )
  }

  logAuthorizationFailure(resource: string, action: string, context: LogContext = {}) {
    this.logSecurityEvent('authorization_failure', {
      severity: 'medium',
      resource,
      action,
      ...context
    })
  }

  logSuspiciousActivity(activity: string, context: Omit<SecurityLogContext, 'activity' | 'severity'>) {
    this.logSecurityEvent('suspicious_activity', {
      severity: 'high',
      activity,
      ...context
    })
  }

  // === LOGGING PERFORMANCE ===
  
  logPerformanceMetric(metric: string, value: number, unit: string, context: LogContext = {}) {
    this.winstonLogger.info('Performance Metric', {
      type: 'performance_metric',
      metric,
      value,
      unit,
      threshold: this.getPerformanceThreshold(metric, value),
      ...context
    })
  }

  logSlowQuery(query: string, duration: number, context: LogContext = {}) {
    this.winstonLogger.warn('Slow Query', {
      type: 'slow_query',
      query: query.substring(0, 500),
      duration,
      unit: 'ms',
      ...context
    })
  }

  logCacheEvent(event: 'hit' | 'miss' | 'set' | 'delete', key: string, context: LogContext = {}) {
    this.winstonLogger.debug('Cache Event', {
      type: 'cache_event',
      event,
      key: key.substring(0, 100),
      ...context
    })
  }

  // === LOGGING ERREURS ===
  
  logError(error: Error, context: LogContext = {}) {
    this.winstonLogger.error('Application Error', {
      type: 'application_error',
      message: error.message,
      stack: error.stack,
      name: error.name,
      ...context
    })
  }

  logValidationError(field: string, value: any, constraint: string, context: LogContext = {}) {
    this.winstonLogger.warn('Validation Error', {
      type: 'validation_error',
      field,
      value: this.sanitizeValue(value),
      constraint,
      ...context
    })
  }

  logApiError(endpoint: string, method: string, statusCode: number, error: string, context: LogContext = {}) {
    this.winstonLogger.error('API Error', {
      type: 'api_error',
      endpoint,
      method,
      statusCode,
      error,
      ...context
    })
  }

  // === MÉTHODES UTILITAIRES ===
  
  private getSecurityLogLevel(severity: string): string {
    switch (severity) {
      case 'critical': return 'error'
      case 'high': return 'error'
      case 'medium': return 'warn'
      case 'low': return 'info'
      default: return 'info'
    }
  }

  private getPerformanceThreshold(metric: string, value: number): 'good' | 'acceptable' | 'poor' {
    const thresholds: Record<string, { good: number; acceptable: number }> = {
      'api_response_time': { good: 200, acceptable: 500 },
      'database_query_time': { good: 100, acceptable: 300 },
      'render_time': { good: 16, acceptable: 50 },
      'bundle_size': { good: 250000, acceptable: 500000 }
    }

    const threshold = thresholds[metric]
    if (!threshold) return 'good'

    if (value <= threshold.good) return 'good'
    if (value <= threshold.acceptable) return 'acceptable'
    return 'poor'
  }

  private sanitizeValue(value: any): any {
    if (typeof value === 'string') {
      return value
        .replace(/password/gi, '***')
        .replace(/token/gi, '***')
        .replace(/secret/gi, '***')
        .substring(0, 100)
    }
    return value
  }

  generateDailyReport(): Promise<{
    errorCount: number
    securityEvents: number
    performanceIssues: number
    topErrors: string[]
  }> {
    return Promise.resolve({
      errorCount: 0,
      securityEvents: 0,
      performanceIssues: 0,
      topErrors: []
    })
  }
}

export type { LogContext, SecurityLogContext }
