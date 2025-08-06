import { Injectable, Logger } from '@nestjs/common'
import * as winston from 'winston'

export interface LogContext {
  userId?: string
  requestId?: string
  sessionId?: string
  action?: string
  resource?: string
  metadata?: Record<string, unknown>
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
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
      ],
    })
  }

  logBusinessEvent(event: string, context: LogContext = {}) {
    this.winstonLogger.info('Business Event', {
      type: 'business_event',
      event,
      ...context,
    })
  }

  logSecurityEvent(event: string, context: SecurityLogContext) {
    this.winstonLogger.error('Security Event', {
      type: 'security_event',
      event,
      ...context,
    })
  }

  logError(error: Error, context: LogContext = {}) {
    this.winstonLogger.error('Application Error', {
      type: 'application_error',
      message: error.message,
      stack: error.stack,
      name: error.name,
      ...context,
    })
  }
}
