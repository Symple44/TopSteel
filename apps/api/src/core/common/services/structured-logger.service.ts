/**
 * 📝 LOGGER STRUCTURÉ BACKEND AVEC SANITISATION
 */
import { Inject, Injectable, Optional } from '@nestjs/common'
import * as winston from 'winston'
import { LogSanitizerService } from '../../../infrastructure/security/log-sanitization/log-sanitizer.service'
import { createSanitizedWinstonConfig } from '../../../infrastructure/security/log-sanitization/winston-sanitized.formatter'

interface LogContext {
  userId?: string
  requestId?: string
  sessionId?: string
  action?: string
  metadata?: Record<string, unknown>
}

@Injectable()
export class StructuredLogger {
  private logger: winston.Logger

  constructor(
    @Optional() @Inject(LogSanitizerService) private readonly logSanitizer?: LogSanitizerService
  ) {
    // Utiliser la configuration sanitisée si le service est disponible
    if (this.logSanitizer) {
      this.logger = winston.createLogger(createSanitizedWinstonConfig(this.logSanitizer))
    } else {
      // Configuration par défaut sans sanitisation (fallback)
      this.logger = winston.createLogger({
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
              sanitized: false,
              ...meta,
            })
          })
        ),
        transports: [
          new winston.transports.Console(),
          new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
          new winston.transports.File({ filename: 'logs/combined.log' }),
        ],
      })
    }
  }

  private sanitizeLogData<T extends LogContext | Record<string, unknown>>(
    data: T
  ): T {
    return this.logSanitizer ? this.logSanitizer.sanitizeLogObject(data) : data
  }

  private sanitizeMessage(message: string): string {
    return this.logSanitizer ? this.logSanitizer.sanitizeLogMessage(message) : message
  }

  logBusinessEvent(event: string, context: LogContext = {}) {
    this.logger.info(this.sanitizeMessage('Business Event'), {
      type: 'business_event',
      event: this.sanitizeMessage(event),
      ...this.sanitizeLogData(context),
    })
  }

  logSecurityEvent(event: string, severity: 'low' | 'medium' | 'high', context: LogContext = {}) {
    // Les événements de sécurité ne sont pas sanitisés pour préserver l'audit
    if (context.metadata?.type === 'security_audit') {
      this.logger.warn('Security Event', {
        type: 'security_event',
        event,
        severity,
        ...context,
      })
    } else {
      this.logger.warn(this.sanitizeMessage('Security Event'), {
        type: 'security_event',
        event: this.sanitizeMessage(event),
        severity,
        ...this.sanitizeLogData(context),
      })
    }
  }

  logPerformanceMetric(metric: string, value: number, unit: string, context: LogContext = {}) {
    this.logger.info(this.sanitizeMessage('Performance Metric'), {
      type: 'performance_metric',
      metric: this.sanitizeMessage(metric),
      value,
      unit,
      ...this.sanitizeLogData(context),
    })
  }

  logError(error: Error, context: LogContext = {}) {
    this.logger.error(this.sanitizeMessage('Application Error'), {
      type: 'application_error',
      message: this.sanitizeMessage(error.message),
      stack: error.stack ? this.sanitizeMessage(error.stack) : undefined,
      name: error.name,
      ...this.sanitizeLogData(context),
    })
  }

  logUserAction(action: string, context: LogContext = {}) {
    this.logger.info(this.sanitizeMessage('User Action'), {
      type: 'user_action',
      action: this.sanitizeMessage(action),
      ...this.sanitizeLogData(context),
    })
  }

  logDatabaseQuery(query: string, duration: number, context: LogContext = {}) {
    this.logger.debug(this.sanitizeMessage('Database Query'), {
      type: 'database_query',
      query: this.sanitizeMessage(query.substring(0, 200)), // Limiter la taille ET sanitiser
      duration,
      unit: 'ms',
      ...this.sanitizeLogData(context),
    })
  }

  /**
   * Log un événement d'audit de sécurité (non sanitisé)
   * ⚠️ Utiliser uniquement pour les logs d'audit système
   */
  logSecurityAudit(event: string, context: LogContext = {}) {
    this.logger.warn('Security Audit', {
      type: 'security_audit',
      event,
      timestamp: new Date().toISOString(),
      ...context,
    })
  }
}
