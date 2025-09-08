import { Injectable, Logger } from '@nestjs/common'
import type { ConfigService } from '@nestjs/config'
import { SecretManager } from './secret-manager'

export interface SecretValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  suggestions: string[]
  securityScore: number
  defaults?: string[]
}

export interface SecretRequirements {
  key: string
  minLength: number
  required: boolean
  isProduction: boolean
  allowDefaults: boolean
  customValidator?: (value: string) => boolean
}

@Injectable()
export class SecretValidatorService {
  private readonly logger = new Logger(SecretValidatorService.name)

  constructor(private configService: ConfigService) {}

  /**
   * Validate all critical secrets at application startup
   */
  validateCriticalSecrets(): SecretValidationResult {
    const requirements: SecretRequirements[] = [
      {
        key: 'JWT_SECRET',
        minLength: 32,
        required: true,
        isProduction: process.env.NODE_ENV === 'production',
        allowDefaults: false,
      },
      {
        key: 'JWT_REFRESH_SECRET',
        minLength: 32,
        required: true,
        isProduction: process.env.NODE_ENV === 'production',
        allowDefaults: false,
      },
      {
        key: 'SESSION_SECRET',
        minLength: 32,
        required: true,
        isProduction: process.env.NODE_ENV === 'production',
        allowDefaults: false,
      },
      {
        key: 'DATABASE_URL',
        minLength: 10,
        required: true,
        isProduction: process.env.NODE_ENV === 'production',
        allowDefaults: false,
        customValidator: (value: string) => {
          // Validate PostgreSQL connection string
          return /^postgresql:\/\/[\w\-.]+:[\w\-.]*@[\w\-.]+:\d+\/[\w\-.]+(\?.*)?$/.test(value)
        },
      },
      {
        key: 'REDIS_PASSWORD',
        minLength: 8,
        required: false,
        isProduction: process.env.NODE_ENV === 'production',
        allowDefaults: false,
      },
      {
        key: 'STRIPE_SECRET_KEY',
        minLength: 20,
        required: false,
        isProduction: process.env.NODE_ENV === 'production',
        allowDefaults: false,
        customValidator: (value: string) => {
          // Validate Stripe key format
          return /^sk_(test_|live_)?[a-zA-Z0-9]{24,}$/.test(value)
        },
      },
      {
        key: 'OPENAI_API_KEY',
        minLength: 20,
        required: false,
        isProduction: process.env.NODE_ENV === 'production',
        allowDefaults: false,
        customValidator: (value: string) => {
          return /^sk-[a-zA-Z0-9]{48,}$/.test(value)
        },
      },
      {
        key: 'TWILIO_AUTH_TOKEN',
        minLength: 32,
        required: false,
        isProduction: process.env.NODE_ENV === 'production',
        allowDefaults: false,
      },
      {
        key: 'VONAGE_API_SECRET',
        minLength: 16,
        required: false,
        isProduction: process.env.NODE_ENV === 'production',
        allowDefaults: false,
      },
      {
        key: 'AWS_SECRET_ACCESS_KEY',
        minLength: 40,
        required: false,
        isProduction: process.env.NODE_ENV === 'production',
        allowDefaults: false,
      },
      {
        key: 'SENTRY_DSN',
        minLength: 20,
        required: false,
        isProduction: process.env.NODE_ENV === 'production',
        allowDefaults: false,
        customValidator: (value: string) => {
          return /^https:\/\/[a-zA-Z0-9]+@[a-zA-Z0-9.-]+\/[0-9]+$/.test(value)
        },
      },
    ]

    const result: SecretValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: [],
      securityScore: 100,
      defaults: [],
    }

    let totalSecrets = 0
    let validSecrets = 0

    for (const requirement of requirements) {
      const secretResult = this.validateSecret(requirement)

      if (requirement.required || this.configService.get(requirement.key)) {
        totalSecrets++

        if (secretResult.isValid) {
          validSecrets++
        } else {
          result.isValid = false
          result.errors.push(...secretResult.errors)
        }

        result.warnings.push(...secretResult.warnings)
        result.suggestions.push(...secretResult.suggestions)
      }
    }

    // Calculate security score
    if (totalSecrets > 0) {
      result.securityScore = Math.round((validSecrets / totalSecrets) * 100)
    }

    // Add general security recommendations
    if (process.env.NODE_ENV === 'production') {
      result.suggestions.push(
        'Consider using a secrets management service (AWS Secrets Manager, HashiCorp Vault, etc.)',
        'Implement secret rotation policy',
        'Enable audit logging for secret access',
        'Use encrypted connection strings where possible'
      )
    }

    return result
  }

  /**
   * Validate individual secret
   */
  private validateSecret(requirement: SecretRequirements): SecretValidationResult {
    const value = this.configService.get<string>(requirement.key)
    const result: SecretValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: [],
      securityScore: 100,
      defaults: [],
    }

    // Check if required secret is missing
    if (requirement.required && !value) {
      result.isValid = false
      result.errors.push(`${requirement.key} is required but not set`)
      result.securityScore = 0
      return result
    }

    // Skip validation if not required and not set
    if (!requirement.required && !value) {
      return result
    }

    // Check minimum length
    if (value && value.length < requirement.minLength) {
      result.isValid = false
      result.errors.push(
        `${requirement.key} must be at least ${requirement.minLength} characters long (current: ${value.length})`
      )
      result.securityScore -= 30
    }

    // Check for default/example values
    if (value && SecretManager.isDefaultSecret(value)) {
      if (requirement.isProduction || !requirement.allowDefaults) {
        result.isValid = false
        result.errors.push(`${requirement.key} appears to be a default/example value`)
        result.defaults?.push(requirement.key)
        result.securityScore -= 50
      } else {
        result.warnings.push(`${requirement.key} appears to be a default value - should be changed`)
        result.defaults?.push(requirement.key)
        result.securityScore -= 20
      }
    }

    // Check secret strength
    if (value) {
      const strength = SecretManager.validateSecretStrength(value)
      switch (strength) {
        case 'weak':
          if (requirement.isProduction) {
            result.isValid = false
            result.errors.push(`${requirement.key} is too weak for production use`)
          } else {
            result.warnings.push(`${requirement.key} has weak entropy`)
          }
          result.securityScore -= 40
          break
        case 'medium':
          result.warnings.push(`${requirement.key} has medium strength - consider improving`)
          result.securityScore -= 20
          break
        case 'strong':
          // Good secret
          break
      }
    }

    // Run custom validator if provided
    if (value && requirement.customValidator && !requirement.customValidator(value)) {
      result.isValid = false
      result.errors.push(`${requirement.key} format is invalid`)
      result.securityScore -= 30
    }

    // Specific checks for sensitive secrets in production
    if (requirement.isProduction && value) {
      // Check for localhost/development patterns in production
      if (value.includes('localhost') || value.includes('127.0.0.1') || value.includes('dev')) {
        result.warnings.push(`${requirement.key} contains development patterns in production`)
        result.securityScore -= 25
      }

      // Check for common weak patterns
      if (value.includes('test') || value.includes('example') || value.includes('demo')) {
        result.warnings.push(`${requirement.key} contains test/demo patterns in production`)
        result.securityScore -= 25
      }
    }

    // Add suggestions based on secret type
    if (value) {
      this.addSecretSpecificSuggestions(requirement.key, value, result)
    }

    // Ensure security score doesn't go below 0
    result.securityScore = Math.max(0, result.securityScore)

    return result
  }

  /**
   * Add specific suggestions based on secret type
   */
  private addSecretSpecificSuggestions(
    key: string,
    value: string,
    result: SecretValidationResult
  ): void {
    if (key.includes('JWT') && value) {
      if (value.length < 64) {
        result.suggestions.push(
          `Consider using a longer ${key} (64+ characters) for enhanced security`
        )
      }
      result.suggestions.push(`Rotate ${key} periodically (recommend: every 90 days)`)
    }

    if (key === 'DATABASE_URL' && value) {
      if (!value.includes('sslmode=require') && process.env.NODE_ENV === 'production') {
        result.suggestions.push('Consider enabling SSL for database connections in production')
      }
      if (value.includes('postgres:postgres') || value.includes('root:root')) {
        result.warnings.push('Database URL contains default credentials')
      }
    }

    if (key.includes('STRIPE') && value) {
      if (process.env.NODE_ENV === 'production' && value.includes('sk_test_')) {
        result.warnings.push('Using Stripe test keys in production environment')
      }
      if (process.env.NODE_ENV !== 'production' && value.includes('sk_live_')) {
        result.warnings.push('Using Stripe live keys in non-production environment')
      }
    }

    if (key.includes('REDIS_PASSWORD') && !value && process.env.NODE_ENV === 'production') {
      result.suggestions.push('Consider setting a Redis password for production')
    }
  }

  /**
   * Generate security report
   */
  generateSecurityReport(): string {
    const result = this.validateCriticalSecrets()
    const timestamp = new Date().toISOString()

    let report = `
# TopSteel Secret Security Report
Generated: ${timestamp}
Environment: ${process.env.NODE_ENV || 'unknown'}
Security Score: ${result.securityScore}/100

## Validation Status
${result.isValid ? '✅ PASSED' : '❌ FAILED'}

`

    if (result.errors.length > 0) {
      report += `## Errors (${result.errors.length})
${result.errors.map((error) => `- ❌ ${error}`).join('\n')}

`
    }

    if (result.warnings.length > 0) {
      report += `## Warnings (${result.warnings.length})
${result.warnings.map((warning) => `- ⚠️ ${warning}`).join('\n')}

`
    }

    if (result.suggestions.length > 0) {
      report += `## Security Suggestions (${result.suggestions.length})
${result.suggestions.map((suggestion) => `- 💡 ${suggestion}`).join('\n')}

`
    }

    report += `## Security Score Interpretation
- 90-100: Excellent security posture
- 70-89: Good security, minor improvements needed
- 50-69: Moderate security, several improvements recommended
- 30-49: Poor security, immediate action required
- 0-29: Critical security issues, urgent action required

## Recommendations
1. Generate new secrets using SecretManager.generateProductionSecrets()
2. Use environment-specific configurations
3. Implement secret rotation policy
4. Consider using a dedicated secrets management service
5. Enable audit logging for secret access
6. Regularly review and update secrets

---
Report generated by TopSteel Secret Validator Service
`

    return report
  }

  /**
   * Log security status at startup
   */
  logSecurityStatus(): void {
    const result = this.validateCriticalSecrets()

    if (result.isValid) {
      this.logger.log(`Secret validation passed with security score: ${result.securityScore}/100`)
    } else {
      this.logger.error(
        `Secret validation failed with ${result.errors.length} errors and security score: ${result.securityScore}/100`
      )
      this.logger.error('Errors:', result.errors)
    }

    if (result.warnings.length > 0) {
      this.logger.warn(`Security warnings (${result.warnings.length}):`, result.warnings)
    }

    // In production, log additional security metrics
    if (process.env.NODE_ENV === 'production') {
      this.logger.log('Production security check completed')

      if (result.securityScore < 70) {
        this.logger.warn(
          `Security score ${result.securityScore}/100 is below recommended threshold (70) for production`
        )
      }
    }
  }

  /**
   * Throw error if secrets are invalid in production
   */
  enforceProductionSecurity(): void {
    const result = this.validateCriticalSecrets()

    if (process.env.NODE_ENV === 'production' && !result.isValid) {
      const errorMessage = `
Production security validation failed:
${result.errors.join('\n')}

Security Score: ${result.securityScore}/100

The application cannot start with invalid secrets in production.
Please fix all security issues before deploying.
`
      throw new Error(errorMessage)
    }
  }
}
