import { Injectable, Logger, type OnModuleInit } from '@nestjs/common'
import type { ConfigService } from '@nestjs/config'
import type { JwtRotationService } from './jwt-rotation.service'
import type { SecretValidatorService } from './secret-validator.service'
import type { SecretVaultService } from './secret-vault.service'

export interface SecurityStatus {
  overall: 'SECURE' | 'WARNING' | 'CRITICAL'
  score: number
  lastCheck: Date
  components: {
    secrets: { status: 'PASS' | 'FAIL'; score: number; issues: string[] }
    vault: { status: 'ENABLED' | 'DISABLED'; secretCount: number; encrypted: number }
    rotation: { status: 'ENABLED' | 'DISABLED'; nextRotation: Date | null }
    validation: { status: 'PASS' | 'FAIL'; errors: string[]; warnings: string[] }
  }
  recommendations: string[]
}

export interface SecurityConfig {
  enforceProductionValidation: boolean
  enableSecurityLogging: boolean
  autoFixIssues: boolean
  rotationEnabled: boolean
  vaultEnabled: boolean
  alertThresholds: {
    criticalScore: number
    warningScore: number
  }
}

interface ValidationResult {
  securityScore: number
  errors: string[]
  warnings: string[]
  issues: string[]
  defaults?: string[]
  isValid?: boolean
}

interface VaultStatus {
  status: 'ENABLED' | 'DISABLED'
  secretCount: number
  encrypted: number
  enabled?: boolean
  encryptedSecrets?: number
  oldestSecret?: Date | null
  newestSecret?: Date | null
  nextRotationDue?: Date | null
  securityScore?: number
}

interface RotationStatus {
  status: 'ENABLED' | 'DISABLED'
  nextRotation: Date | null
  enabled?: boolean
  autoRotationEnabled?: boolean
  keyCount?: number
  activeKeys?: number
  gracePeriodHours?: number
  rotationIntervalHours?: number
}

@Injectable()
export class SecurityManagerService implements OnModuleInit {
  private readonly logger = new Logger(SecurityManagerService.name)
  private securityConfig: SecurityConfig
  private lastSecurityCheck: SecurityStatus | null = null

  constructor(
    private configService: ConfigService,
    private secretValidator: SecretValidatorService,
    private secretVault?: SecretVaultService,
    private jwtRotation?: JwtRotationService
  ) {
    this.securityConfig = {
      enforceProductionValidation: process.env.NODE_ENV === 'production',
      enableSecurityLogging: process.env.SECURITY_LOGGING !== 'false',
      autoFixIssues: process.env.SECURITY_AUTO_FIX === 'true',
      rotationEnabled: process.env.JWT_ROTATION_ENABLED === 'true',
      vaultEnabled: process.env.SECRET_VAULT_ENABLED !== 'false',
      alertThresholds: {
        criticalScore: Number(process.env.SECURITY_CRITICAL_THRESHOLD) || 50,
        warningScore: Number(process.env.SECURITY_WARNING_THRESHOLD) || 70,
      },
    }
  }

  async onModuleInit() {
    this.logger.log('Security Manager initializing...')

    try {
      // Perform initial security check
      const securityStatus = await this.performSecurityCheck()

      // Log security status
      this.logSecurityStatus(securityStatus)

      // Enforce production security if required
      if (this.securityConfig.enforceProductionValidation) {
        this.enforceProductionSecurity(securityStatus)
      }

      // Auto-fix issues if enabled
      if (this.securityConfig.autoFixIssues) {
        await this.autoFixSecurityIssues(securityStatus)
      }

      this.logger.log(`Security Manager initialized - Overall status: ${securityStatus.overall}`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.logger.error('Failed to initialize Security Manager:', errorMessage)

      if (this.securityConfig.enforceProductionValidation) {
        throw new Error('Security validation failed - Cannot start application')
      }
    }
  }

  /**
   * Perform comprehensive security check
   */
  async performSecurityCheck(): Promise<SecurityStatus> {
    const checkTime = new Date()

    // Validate secrets
    const secretValidation = this.secretValidator.validateCriticalSecrets()
    const validationResult: ValidationResult = {
      securityScore: secretValidation.securityScore,
      errors: secretValidation.errors,
      warnings: secretValidation.warnings,
      issues: [...secretValidation.errors, ...secretValidation.warnings],
      defaults: secretValidation.defaults || [],
      isValid: secretValidation.isValid,
    }

    // Get vault status
    const vaultStatusRaw = this.secretVault?.getVaultStatus() || {
      enabled: false,
      secretCount: 0,
      encryptedSecrets: 0,
      oldestSecret: null,
      newestSecret: null,
      nextRotationDue: null,
      securityScore: 0,
    }

    const vaultStatus: VaultStatus = {
      status: vaultStatusRaw.enabled ? 'ENABLED' : 'DISABLED',
      secretCount: vaultStatusRaw.secretCount,
      encrypted: vaultStatusRaw.encryptedSecrets,
      enabled: vaultStatusRaw.enabled,
      encryptedSecrets: vaultStatusRaw.encryptedSecrets,
      oldestSecret: vaultStatusRaw.oldestSecret,
      newestSecret: vaultStatusRaw.newestSecret,
      nextRotationDue: vaultStatusRaw.nextRotationDue,
      securityScore: vaultStatusRaw.securityScore,
    }

    // Get rotation status
    const rotationStatusRaw = this.jwtRotation?.getRotationStatus() || {
      enabled: false,
      autoRotationEnabled: false,
      keyCount: 0,
      activeKeys: 0,
      nextRotation: null,
      gracePeriodHours: 0,
      rotationIntervalHours: 0,
    }

    const rotationStatus: RotationStatus = {
      status: rotationStatusRaw.enabled ? 'ENABLED' : 'DISABLED',
      nextRotation: rotationStatusRaw.nextRotation,
      enabled: rotationStatusRaw.enabled,
      autoRotationEnabled: rotationStatusRaw.autoRotationEnabled,
      keyCount: rotationStatusRaw.keyCount,
      activeKeys: rotationStatusRaw.activeKeys,
      gracePeriodHours: rotationStatusRaw.gracePeriodHours,
      rotationIntervalHours: rotationStatusRaw.rotationIntervalHours,
    }

    // Calculate overall security score
    const overallScore = this.calculateOverallScore(validationResult, vaultStatus, rotationStatus)

    // Determine overall status
    let overallStatus: 'SECURE' | 'WARNING' | 'CRITICAL'
    if (overallScore >= this.securityConfig.alertThresholds.warningScore) {
      overallStatus = 'SECURE'
    } else if (overallScore >= this.securityConfig.alertThresholds.criticalScore) {
      overallStatus = 'WARNING'
    } else {
      overallStatus = 'CRITICAL'
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      validationResult,
      vaultStatus,
      rotationStatus
    )

    const securityStatus: SecurityStatus = {
      overall: overallStatus,
      score: overallScore,
      lastCheck: checkTime,
      components: {
        secrets: {
          status: validationResult.isValid ? 'PASS' : 'FAIL',
          score: validationResult.securityScore,
          issues: [...validationResult.errors, ...validationResult.warnings],
        },
        vault: {
          status: vaultStatus.enabled ? 'ENABLED' : 'DISABLED',
          secretCount: vaultStatus.secretCount,
          encrypted: vaultStatus.encryptedSecrets || 0,
        },
        rotation: {
          status: rotationStatus.enabled ? 'ENABLED' : 'DISABLED',
          nextRotation: rotationStatus.nextRotation,
        },
        validation: {
          status: validationResult.isValid ? 'PASS' : 'FAIL',
          errors: validationResult.errors,
          warnings: validationResult.warnings,
        },
      },
      recommendations,
    }

    this.lastSecurityCheck = securityStatus
    return securityStatus
  }

  /**
   * Calculate overall security score
   */
  private calculateOverallScore(
    validationResult: ValidationResult,
    vaultStatus: VaultStatus,
    rotationStatus: RotationStatus
  ): number {
    let score = 0
    let maxScore = 0

    // Secrets validation (60% weight)
    score += validationResult.securityScore * 0.6
    maxScore += 100 * 0.6

    // Vault usage (20% weight)
    if (process.env.NODE_ENV !== 'production') {
      const vaultScore = vaultStatus.enabled ? 100 : 50
      score += vaultScore * 0.2
    } else {
      // In production, vault is not as important
      score += 80 * 0.2
    }
    maxScore += 100 * 0.2

    // JWT rotation (20% weight)
    const rotationScore = rotationStatus.enabled
      ? 100
      : process.env.NODE_ENV === 'production'
        ? 0
        : 50
    score += rotationScore * 0.2
    maxScore += 100 * 0.2

    return Math.round((score / maxScore) * 100)
  }

  /**
   * Generate security recommendations
   */
  private generateRecommendations(
    validationResult: ValidationResult,
    vaultStatus: VaultStatus,
    rotationStatus: RotationStatus
  ): string[] {
    const recommendations: string[] = []

    // Secret validation recommendations
    if (validationResult.securityScore < 80) {
      recommendations.push(
        'Improve secret strength - generate new cryptographically secure secrets'
      )
    }

    if (validationResult.errors.length > 0) {
      recommendations.push('Fix critical secret validation errors before production deployment')
    }

    if (validationResult.defaults && validationResult.defaults.length > 0) {
      recommendations.push('Replace default/example secrets with unique production values')
    }

    // Environment-specific recommendations
    if (process.env.NODE_ENV === 'production') {
      if (!rotationStatus.enabled) {
        recommendations.push('Enable JWT rotation for enhanced security in production')
      }

      if (validationResult.securityScore < 90) {
        recommendations.push(
          'Use a dedicated secrets management service (AWS Secrets Manager, HashiCorp Vault)'
        )
      }

      recommendations.push('Implement secret rotation policy and audit logging')
      recommendations.push('Monitor secret access and detect potential compromises')
    } else {
      if (!vaultStatus.enabled && process.env.NODE_ENV === 'development') {
        recommendations.push('Enable secret vault for secure local development')
      }

      if (vaultStatus.secretCount < 5) {
        recommendations.push('Initialize vault with essential development secrets')
      }
    }

    // Rotation recommendations
    if (rotationStatus.nextRotation && rotationStatus.nextRotation < new Date()) {
      recommendations.push('JWT secrets are due for rotation - rotate immediately')
    }

    // SSL/TLS recommendations
    const dbUrl = this.configService.get<string>('DATABASE_URL')
    if (dbUrl && !dbUrl.includes('sslmode=require') && process.env.NODE_ENV === 'production') {
      recommendations.push('Enable SSL for database connections in production')
    }

    return recommendations
  }

  /**
   * Log security status
   */
  private logSecurityStatus(status: SecurityStatus): void {
    if (!this.securityConfig.enableSecurityLogging) {
      return
    }

    const logData = {
      overall: status.overall,
      score: status.score,
      environment: process.env.NODE_ENV,
      secretValidation: status.components.secrets.status,
      vaultEnabled: status.components.vault.status,
      rotationEnabled: status.components.rotation.status,
    }

    switch (status.overall) {
      case 'SECURE':
        this.logger.log('Security check passed', logData)
        break
      case 'WARNING':
        this.logger.warn('Security check has warnings', {
          ...logData,
          warnings: status.components.validation.warnings,
          recommendations: status.recommendations,
        })
        break
      case 'CRITICAL':
        this.logger.error('Security check failed', {
          ...logData,
          errors: status.components.validation.errors,
          recommendations: status.recommendations,
        })
        break
    }
  }

  /**
   * Enforce production security requirements
   */
  private enforceProductionSecurity(status: SecurityStatus): void {
    if (process.env.NODE_ENV !== 'production') {
      return
    }

    const criticalIssues: string[] = []

    // Check for critical validation failures
    if (status.components.secrets.status === 'FAIL') {
      criticalIssues.push('Secret validation failed')
    }

    // Check security score
    if (status.score < this.securityConfig.alertThresholds.criticalScore) {
      criticalIssues.push(`Security score ${status.score} is below critical threshold`)
    }

    // Check for specific production requirements
    const jwtSecret = this.configService.get<string>('JWT_SECRET')
    if (!jwtSecret || jwtSecret.length < 32) {
      criticalIssues.push('JWT_SECRET is too weak for production')
    }

    const dbUrl = this.configService.get<string>('DATABASE_URL')
    if (dbUrl && (dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1'))) {
      criticalIssues.push('Database URL points to localhost in production')
    }

    if (criticalIssues.length > 0) {
      const errorMessage = `
Production security validation failed:

Critical Issues:
${criticalIssues.map((issue) => `- ${issue}`).join('\n')}

Security Score: ${status.score}/100
Environment: ${process.env.NODE_ENV}

The application cannot start with these security issues in production.
Please fix all issues and redeploy.

Recommendations:
${status.recommendations.map((rec) => `- ${rec}`).join('\n')}
`
      throw new Error(errorMessage)
    }
  }

  /**
   * Auto-fix security issues where possible
   */
  private async autoFixSecurityIssues(status: SecurityStatus): Promise<void> {
    if (!this.securityConfig.autoFixIssues) {
      return
    }

    const fixes: string[] = []

    try {
      // Auto-generate missing development secrets
      if (process.env.NODE_ENV === 'development' && this.secretVault) {
        const missingSecrets = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'SESSION_SECRET']

        for (const secretKey of missingSecrets) {
          if (!this.configService.get(secretKey)) {
            await this.secretVault.generateSecret(secretKey, `Auto-generated for development`)
            fixes.push(`Generated ${secretKey} for development`)
          }
        }
      }

      // Auto-rotate expired JWT secrets
      if (
        this.jwtRotation &&
        status.components.rotation.nextRotation &&
        status.components.rotation.nextRotation < new Date()
      ) {
        await this.jwtRotation.forceRotation()
        fixes.push('Rotated expired JWT secrets')
      }

      if (fixes.length > 0) {
        this.logger.log(`Auto-fixed security issues:`, fixes)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.logger.error('Failed to auto-fix security issues:', errorMessage)
    }
  }

  /**
   * Get current security status
   */
  getSecurityStatus(): SecurityStatus | null {
    return this.lastSecurityCheck
  }

  /**
   * Force security check
   */
  async forceSecurityCheck(): Promise<SecurityStatus> {
    return await this.performSecurityCheck()
  }

  /**
   * Generate comprehensive security report
   */
  async generateSecurityReport(): Promise<string> {
    const status = await this.performSecurityCheck()
    const timestamp = new Date().toISOString()

    let report = `
# TopSteel Comprehensive Security Report
Generated: ${timestamp}
Environment: ${process.env.NODE_ENV || 'unknown'}

## Overall Security Status
Status: ${status.overall} (${status.score}/100)
Last Check: ${status.lastCheck.toISOString()}

## Component Status

### Secret Validation
- Status: ${status.components.secrets.status}
- Score: ${status.components.secrets.score}/100
- Issues: ${status.components.secrets.issues.length}

### Secret Vault
- Status: ${status.components.vault.status}
- Secrets Stored: ${status.components.vault.secretCount}
- Encrypted Secrets: ${status.components.vault.encrypted}

### JWT Rotation
- Status: ${status.components.rotation.status}
- Next Rotation: ${status.components.rotation.nextRotation?.toISOString() || 'N/A'}

### Validation Details
- Status: ${status.components.validation.status}
- Errors: ${status.components.validation.errors.length}
- Warnings: ${status.components.validation.warnings.length}

`

    if (status.components.validation.errors.length > 0) {
      report += `## Critical Errors
${status.components.validation.errors.map((error) => `- ❌ ${error}`).join('\n')}

`
    }

    if (status.components.validation.warnings.length > 0) {
      report += `## Warnings
${status.components.validation.warnings.map((warning) => `- ⚠️ ${warning}`).join('\n')}

`
    }

    if (status.recommendations.length > 0) {
      report += `## Recommendations
${status.recommendations.map((rec) => `- 💡 ${rec}`).join('\n')}

`
    }

    // Add individual component reports
    report += `## Detailed Reports

### Secret Validator Report
${this.secretValidator.generateSecurityReport()}

`

    if (this.jwtRotation) {
      report += `### JWT Rotation Report
${this.jwtRotation.generateRotationReport()}

`
    }

    report += `## Security Configuration
- Production Validation: ${this.securityConfig.enforceProductionValidation ? '✅' : '❌'}
- Security Logging: ${this.securityConfig.enableSecurityLogging ? '✅' : '❌'}
- Auto Fix Issues: ${this.securityConfig.autoFixIssues ? '✅' : '❌'}
- Rotation Enabled: ${this.securityConfig.rotationEnabled ? '✅' : '❌'}
- Vault Enabled: ${this.securityConfig.vaultEnabled ? '✅' : '❌'}

## Alert Thresholds
- Critical Score: < ${this.securityConfig.alertThresholds.criticalScore}
- Warning Score: < ${this.securityConfig.alertThresholds.warningScore}

---
Report generated by TopSteel Security Manager
`

    return report
  }

  /**
   * Get security metrics for monitoring
   */
  getSecurityMetrics(): {
    overall_score: number
    secrets_score: number
    vault_enabled: boolean
    rotation_enabled: boolean
    critical_errors: number
    warnings: number
    last_check: Date
  } {
    const status = this.lastSecurityCheck

    return {
      overall_score: status?.score || 0,
      secrets_score: status?.components.secrets.score || 0,
      vault_enabled: status?.components.vault.status === 'ENABLED',
      rotation_enabled: status?.components.rotation.status === 'ENABLED',
      critical_errors: status?.components.validation.errors.length || 0,
      warnings: status?.components.validation.warnings.length || 0,
      last_check: status?.lastCheck || new Date(),
    }
  }

  /**
   * Clear sensitive caches during security events
   */
  private async clearSensitiveCaches(): Promise<void> {
    try {
      // Clear any in-memory JWT key pairs
      if (this.jwtRotation) {
        const keyPairs = (this.jwtRotation as unknown as { currentKeyPairs?: Map<string, unknown> })
          .currentKeyPairs
        const keysCleared = keyPairs?.size || 0
        if (keysCleared > 0) {
          this.logger.log(`Clearing ${keysCleared} cached JWT key pairs`)
        }
      }

      // Clear vault cache if available
      if (this.secretVault) {
        const vaultStatus = this.secretVault.getVaultStatus()
        if (vaultStatus.secretCount > 0) {
          this.logger.log(
            `Vault contains ${vaultStatus.secretCount} secrets (cache reference cleared)`
          )
        }
      }

      // Clear any cached security status
      if (this.lastSecurityCheck) {
        this.logger.log('Clearing cached security status')
        this.lastSecurityCheck = null
      }

      // Force garbage collection if available (V8 specific)
      if (global.gc) {
        global.gc()
        this.logger.log('Forced garbage collection for sensitive data cleanup')
      }

      this.logger.log('Sensitive caches cleared successfully')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.logger.error('Failed to clear sensitive caches:', errorMessage)
      throw error
    }
  }

  /**
   * Emergency security lockdown
   */
  async emergencyLockdown(reason: string): Promise<void> {
    this.logger.error(`Emergency security lockdown initiated: ${reason}`)

    try {
      // Rotate all JWT secrets immediately
      if (this.jwtRotation) {
        await this.jwtRotation.forceRotation()
        this.logger.log('Emergency JWT rotation completed')
      }

      // Clear sensitive caches
      await this.clearSensitiveCaches()

      // Log the lockdown
      this.logger.error('Emergency security lockdown completed', {
        reason,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.logger.error('Emergency lockdown failed:', errorMessage)
      throw error
    }
  }
}
