/**
 * 🔒 FORMATTER PINO SANITISÉ POUR PRODUCTION
 *
 * Configuration Pino avec sanitisation automatique des logs
 * pour performances optimales en production.
 *
 * Note: Pino is not installed, this is a stub implementation
 */
import type { LogSanitizerService } from './log-sanitizer.service'

/**
 * Crée une configuration Pino avec sanitisation (stub)
 */
export function createSanitizedPinoConfig(
  _logSanitizer: LogSanitizerService
): Record<string, unknown> {
  return {
    level: 'info',
    transport: {
      target: 'pino-pretty',
    },
  }
}

/**
 * Crée un logger Pino sanitisé (stub)
 */
export function createSanitizedPinoLogger(
  _logSanitizer: LogSanitizerService
): Record<string, unknown> {
  return {
    info: console.log,
    warn: console.warn,
    error: console.error,
    debug: console.debug,
  }
}
