import { Global, Logger, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { ScheduleModule } from '@nestjs/schedule'
import { JwtRotationService } from './jwt-rotation.service'
import { SecretValidatorService } from './secret-validator.service'
import { SecretVaultService } from './secret-vault.service'
import { SecurityManagerService } from './security-manager.service'

/**
 * Security Module - Provides comprehensive secret management and security services
 *
 * Features:
 * - Secret validation and strength checking
 * - Local secret vault for development
 * - JWT rotation with grace periods
 * - Comprehensive security monitoring
 * - Production security enforcement
 * - Auto-remediation capabilities
 */
@Global()
@Module({
  imports: [
    ConfigModule,
    JwtModule.register({}), // Will be configured by jwt.config.ts
    ScheduleModule.forRoot(), // Required for JWT rotation cron jobs
  ],
  providers: [
    SecretValidatorService,
    {
      provide: SecretVaultService,
      useClass: SecretVaultService,
      // Only provide vault service in non-production environments
      ...(process.env.NODE_ENV === 'production' ? { useValue: null } : {}),
    },
    {
      provide: JwtRotationService,
      useClass: JwtRotationService,
      // Only provide rotation service if enabled
      ...(process.env.JWT_ROTATION_ENABLED !== 'true' ? { useValue: null } : {}),
    },
    SecurityManagerService,
  ],
  exports: [SecretValidatorService, SecretVaultService, JwtRotationService, SecurityManagerService],
})
export class SecurityModule {
  constructor(_securityManager: SecurityManagerService) {
    // Log security module initialization
    const logger = new Logger('SecurityModule')
    logger.log('TopSteel Security Module loaded', {
      environment: process.env.NODE_ENV,
      vaultEnabled:
        process.env.SECRET_VAULT_ENABLED !== 'false' && process.env.NODE_ENV !== 'production',
      rotationEnabled: process.env.JWT_ROTATION_ENABLED === 'true',
      productionEnforcement: process.env.NODE_ENV === 'production',
    })
  }
}
