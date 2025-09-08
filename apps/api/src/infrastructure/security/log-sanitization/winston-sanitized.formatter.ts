/**
 * 🔒 FORMATTER WINSTON SANITISÉ POUR PRODUCTION
 *
 * Formatter personnalisé pour Winston qui sanitise automatiquement
 * tous les logs avant écriture pour protéger les données sensibles.
 */
import * as winston from 'winston'
import type { LogSanitizerService } from './log-sanitizer.service'

/**
 * Crée un formatter Winston qui sanitise les logs en production
 */
export function createSanitizedFormatter(
  logSanitizer: LogSanitizerService
): winston.Logform.Format {
  return winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
      // Sanitisation du message principal
      const sanitizedMessage = logSanitizer.sanitizeLogMessage(String(message))

      // Sanitisation de la stack trace si présente
      const sanitizedStack = stack ? logSanitizer.sanitizeLogMessage(String(stack)) : undefined

      // Sanitisation des métadonnées
      const sanitizedMeta = logSanitizer.sanitizeLogObject(meta)

      // Construction du log final
      const logEntry = {
        '@timestamp': timestamp,
        level,
        message: sanitizedMessage,
        service: 'topsteel-api',
        environment: process.env.NODE_ENV || 'development',
        sanitized: process.env.NODE_ENV === 'production',
        ...(sanitizedStack && { stack: sanitizedStack }),
        ...sanitizedMeta,
      }

      return JSON.stringify(logEntry)
    })
  )
}

/**
 * Configuration Winston complète avec sanitisation
 */
export function createSanitizedWinstonConfig(
  logSanitizer: LogSanitizerService
): winston.LoggerOptions {
  const isProduction = process.env.NODE_ENV === 'production'
  const logLevel = process.env.LOG_LEVEL || (isProduction ? 'warn' : 'debug')

  const transports: winston.transport[] = []

  // Console transport (toujours présent)
  transports.push(
    new winston.transports.Console({
      level: logLevel,
      format: createSanitizedFormatter(logSanitizer),
    })
  )

  // File transports (seulement en production)
  if (isProduction) {
    // Logs d'erreur
    transports.push(
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: createSanitizedFormatter(logSanitizer),
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
        tailable: true,
      })
    )

    // Logs combinés
    transports.push(
      new winston.transports.File({
        filename: 'logs/combined.log',
        level: logLevel,
        format: createSanitizedFormatter(logSanitizer),
        maxsize: 50 * 1024 * 1024, // 50MB
        maxFiles: 10,
        tailable: true,
      })
    )

    // Logs de sécurité (audit)
    transports.push(
      new winston.transports.File({
        filename: 'logs/security-audit.log',
        level: 'warn',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
          winston.format.printf(({ timestamp, level, message, type, ...meta }) => {
            // Ne sanitiser que les logs non-audit
            if (type !== 'security_audit' && type !== 'log_sanitization_audit') {
              const sanitizedMessage = logSanitizer.sanitizeLogMessage(String(message))
              const sanitizedMeta = logSanitizer.sanitizeLogObject(meta)

              return JSON.stringify({
                '@timestamp': timestamp,
                level,
                message: sanitizedMessage,
                type,
                service: 'topsteel-api',
                environment: process.env.NODE_ENV,
                sanitized: true,
                ...sanitizedMeta,
              })
            }

            // Logs d'audit - pas de sanitisation
            return JSON.stringify({
              '@timestamp': timestamp,
              level,
              message,
              type,
              service: 'topsteel-api',
              environment: process.env.NODE_ENV,
              sanitized: false,
              ...meta,
            })
          })
        ),
        maxsize: 20 * 1024 * 1024, // 20MB
        maxFiles: 20, // Garder plus d'historique pour l'audit
        tailable: true,
      })
    )
  }

  return {
    level: logLevel,
    transports,
    // Gestion des rejections et exceptions non capturées
    exceptionHandlers: [
      new winston.transports.File({
        filename: 'logs/exceptions.log',
        format: createSanitizedFormatter(logSanitizer),
      }),
    ],
    rejectionHandlers: [
      new winston.transports.File({
        filename: 'logs/rejections.log',
        format: createSanitizedFormatter(logSanitizer),
      }),
    ],
    exitOnError: false,
  }
}
