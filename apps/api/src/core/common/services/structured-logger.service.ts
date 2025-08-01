/**
 * 📝 LOGGER STRUCTURÉ BACKEND
 */
import { Injectable } from '@nestjs/common'
import * as winston from 'winston'

interface LogContext {
  userId?: string
  requestId?: string
  sessionId?: string
  action?: string
  metadata?: Record<string, any>
}

@Injectable()
export class StructuredLogger {
  private logger: winston.Logger

  constructor() {
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

  logBusinessEvent(event: string, context: LogContext = {}) {
    this.logger.info('Business Event', {
      type: 'business_event',
      event,
      ...context,
    })
  }

  logSecurityEvent(event: string, severity: 'low' | 'medium' | 'high', context: LogContext = {}) {
    this.logger.warn('Security Event', {
      type: 'security_event',
      event,
      severity,
      ...context,
    })
  }

  logPerformanceMetric(metric: string, value: number, unit: string, context: LogContext = {}) {
    this.logger.info('Performance Metric', {
      type: 'performance_metric',
      metric,
      value,
      unit,
      ...context,
    })
  }

  logError(error: Error, context: LogContext = {}) {
    this.logger.error('Application Error', {
      type: 'application_error',
      message: error.message,
      stack: error.stack,
      name: error.name,
      ...context,
    })
  }

  logUserAction(action: string, context: LogContext = {}) {
    this.logger.info('User Action', {
      type: 'user_action',
      action,
      ...context,
    })
  }

  logDatabaseQuery(query: string, duration: number, context: LogContext = {}) {
    this.logger.debug('Database Query', {
      type: 'database_query',
      query: query.substring(0, 200), // Limiter la taille
      duration,
      unit: 'ms',
      ...context,
    })
  }
}
