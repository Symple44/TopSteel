/**
 * 🔒 FORMATTER PINO SANITISÉ POUR PRODUCTION
 *
 * Configuration Pino avec sanitisation automatique des logs
 * pour performances optimales en production.
 *
 * Note: Pino is not installed, this is a stub implementation
 */
import { LogSanitizerService } from './log-sanitizer.service'

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
    // biome-ignore lint/suspicious/noConsole: Console is intentionally used for logging fallback
    info: console.log,
    // biome-ignore lint/suspicious/noConsole: Console is intentionally used for logging fallback
    warn: console.warn,
    // biome-ignore lint/suspicious/noConsole: Console is intentionally used for logging fallback
    error: console.error,
    // biome-ignore lint/suspicious/noConsole: Console is intentionally used for logging fallback
    debug: console.debug,
  }
}
