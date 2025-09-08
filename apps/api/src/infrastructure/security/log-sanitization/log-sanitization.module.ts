/**
 * 🔒 MODULE DE SANITISATION DES LOGS
 *
 * Module NestJS qui fournit tous les services et intercepteurs
 * nécessaires à la sanitisation des logs en production.
 */
import { Global, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { LogSanitizerService } from './log-sanitizer.service'
import { SanitizedLoggingInterceptor } from './sanitized-logging.interceptor'

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      // Configuration des variables d'environnement pour la sanitisation
      envFilePath: ['.env.local', '.env'],
      expandVariables: true,
    }),
  ],
  providers: [
    LogSanitizerService,
    SanitizedLoggingInterceptor,
    {
      provide: 'LOG_SANITIZATION_CONFIG',
      useFactory: () => ({
        // Configuration par défaut
        enabled: process.env.LOG_SANITIZATION_ENABLED !== 'false',
        auditEnabled: process.env.LOG_SANITIZATION_AUDIT === 'true',
        maskIpAddresses: process.env.LOG_MASK_IP_ADDRESSES === 'true',
        logLevel:
          process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'warn' : 'debug'),
        environment: process.env.NODE_ENV || 'development',
        // Niveaux de sanitisation
        sanitizationLevel: process.env.LOG_SANITIZATION_LEVEL || 'standard', // minimal, standard, strict
        // Patterns personnalisés supplémentaires
        customPatterns: process.env.LOG_CUSTOM_PATTERNS
          ? JSON.parse(process.env.LOG_CUSTOM_PATTERNS)
          : [],
        // Configuration de l'audit
        auditRetention: parseInt(process.env.LOG_AUDIT_RETENTION_DAYS || '90', 10),
        maxLogFileSize: process.env.LOG_MAX_FILE_SIZE || '50MB',
        maxLogFiles: parseInt(process.env.LOG_MAX_FILES || '10', 10),
      }),
    },
  ],
  exports: [LogSanitizerService, SanitizedLoggingInterceptor, 'LOG_SANITIZATION_CONFIG'],
})
export class LogSanitizationModule {}
