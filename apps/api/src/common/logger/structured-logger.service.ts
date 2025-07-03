/**
 * 📝 LOGGER STRUCTURÉ BACKEND - TopSteel ERP
 */
import { Injectable, Logger } from '@nestjs/common'
import * as winston from 'winston'

interface LogContext {
  userId?: string
  requestId?: string
  sessionId?: string
  action?: string
  resource?: string
  metadata?: Record<string, any>
}

interface SecurityLogContext extends LogContext {
  ipAddress?: string
  userAgent?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
}

@Injectable()
export class StructuredLogger extends Logger {
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
    
    this.winstonLogger[logLevel]('Security Event', {
      type: 'security_event',
      event,
      severity: context.severity,
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

  logSuspiciousActivity(activity: string, context: SecurityLogContext) {
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
      query: query.substring(0, 500), // Limiter la taille
      duration,
      unit: 'ms',
      ...context
    })
  }

  logCacheEvent(event: 'hit' | 'miss' | 'set' | 'delete', key: string, context: LogContext = {}) {
    this.winstonLogger.debug('Cache Event', {
      type: 'cache_event',
      event,
      key: key.substring(0, 100), // Limiter la taille des clés
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
    // Seuils spécifiques à TopSteel
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
      // Masquer les données sensibles
      return value
        .replace(/password/gi, '***')
        .replace(/token/gi, '***')
        .replace(/secret/gi, '***')
        .substring(0, 100) // Limiter la taille
    }
    return value
  }

  // === MÉTRIQUES D'AUDIT ===
  
  generateDailyReport(): Promise<{
    errorCount: number
    securityEvents: number
    performanceIssues: number
    topErrors: string[]
  }> {
    // TODO: Implémenter l'agrégation des logs
    // Ceci nécessiterait une base de données ou un service de logs externe
    return Promise.resolve({
      errorCount: 0,
      securityEvents: 0,
      performanceIssues: 0,
      topErrors: []
    })
  }
}

export { StructuredLogger, LogContext, SecurityLogContext }
