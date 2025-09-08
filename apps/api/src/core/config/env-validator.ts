import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { config } from 'dotenv'
import {
  envValidationSchema,
  type ValidatedEnv,
  validateSmsProviderDependencies,
} from './env-validation.schema'

/**
 * Secure Environment Variables Validator
 *
 * This utility provides:
 * - Runtime validation of environment variables
 * - Secure loading of .env files in correct priority order
 * - Production-specific security checks
 * - Detailed error reporting for missing/invalid variables
 */

interface EnvValidatorOptions {
  throwOnError?: boolean
  logValidation?: boolean
  validateSecrets?: boolean
}

interface ValidationResult {
  success: boolean
  data?: ValidatedEnv
  errors?: string[]
  warnings?: string[]
}

class EnvironmentValidator {
  private static instance: EnvironmentValidator
  private validatedEnv: ValidatedEnv | null = null
  private isProduction = process.env.NODE_ENV === 'production'

  private constructor() {}

  static getInstance(): EnvironmentValidator {
    if (!EnvironmentValidator.instance) {
      EnvironmentValidator.instance = new EnvironmentValidator()
    }
    return EnvironmentValidator.instance
  }

  /**
   * Load and validate environment variables
   */
  async validate(options: EnvValidatorOptions = {}): Promise<ValidationResult> {
    const { throwOnError = true, logValidation = true, validateSecrets = true } = options

    try {
      // Load environment files in priority order
      this.loadEnvironmentFiles()

      // Validate environment variables against schema
      const result = envValidationSchema.safeParse(process.env)

      if (!result.success) {
        const errors = result.error.issues.map((err) => `${err.path.join('.')}: ${err.message}`)

        if (logValidation) {
          errors.forEach((_error) => {})
        }

        if (throwOnError) {
          throw new Error(`Environment validation failed:\n${errors.join('\n')}`)
        }

        return { success: false, errors }
      }

      // Additional SMS provider validation
      if (result.data.SMS_PROVIDER) {
        validateSmsProviderDependencies(result.data)
      }

      // Production-specific security validations
      const warnings: string[] = []
      if (validateSecrets && this.isProduction) {
        warnings.push(...this.validateProductionSecrets(result.data))
      }

      this.validatedEnv = result.data

      if (logValidation) {
        if (warnings.length > 0) {
          warnings.forEach((_warning) => {})
        }
      }

      return {
        success: true,
        data: result.data,
        warnings: warnings.length > 0 ? warnings : undefined,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown validation error'

      if (logValidation) {
      }

      if (throwOnError) {
        throw error
      }

      return { success: false, errors: [errorMessage] }
    }
  }

  /**
   * Get validated environment variables
   */
  getValidatedEnv(): ValidatedEnv {
    if (!this.validatedEnv) {
      throw new Error('Environment variables not validated. Call validate() first.')
    }
    return this.validatedEnv
  }

  /**
   * Check if a secret is secure (not using default/example values)
   */
  private isSecretSecure(value: string | undefined, secretName: string): boolean {
    if (!value) return false

    const insecurePatterns = [
      'your-secret',
      'your_secret',
      'change-me',
      'changeme',
      'change-in-production',
      'example',
      'test',
      'development',
      'secret',
      'password',
      '123456',
      'admin',
      secretName.toLowerCase(),
    ]

    const lowerValue = value.toLowerCase()
    return !insecurePatterns.some((pattern) => lowerValue.includes(pattern))
  }

  /**
   * Load environment files in correct priority order
   */
  private loadEnvironmentFiles(): void {
    const rootDir = join(__dirname, '../../../..')

    // Load in priority order (last loaded takes precedence)
    const envFiles = [
      join(rootDir, '.env'),
      join(rootDir, '.env.local'),
      join(rootDir, '.env.vault'), // For production secrets
    ]

    envFiles.forEach((envFile) => {
      if (existsSync(envFile)) {
        config({ path: envFile, override: false })
      }
    })
  }

  /**
   * Validate production-specific security requirements
   */
  private validateProductionSecrets(env: ValidatedEnv): string[] {
    const warnings: string[] = []

    // Check JWT secrets
    if (!this.isSecretSecure(env.JWT_SECRET, 'JWT_SECRET')) {
      warnings.push('JWT_SECRET appears to be using a default or insecure value')
    }

    if (!this.isSecretSecure(env.JWT_REFRESH_SECRET, 'JWT_REFRESH_SECRET')) {
      warnings.push('JWT_REFRESH_SECRET appears to be using a default or insecure value')
    }

    if (!this.isSecretSecure(env.SESSION_SECRET, 'SESSION_SECRET')) {
      warnings.push('SESSION_SECRET appears to be using a default or insecure value')
    }

    // Check database security
    if (env.DATABASE_URL.includes('localhost') || env.DATABASE_URL.includes('127.0.0.1')) {
      warnings.push('DATABASE_URL is pointing to localhost in production')
    }

    // Check if using default passwords in database URL
    const dbUrlPatterns = ['password', 'admin', '123456', 'postgres']
    if (dbUrlPatterns.some((pattern) => env.DATABASE_URL.toLowerCase().includes(pattern))) {
      warnings.push('DATABASE_URL may contain a default or weak password')
    }

    // Check CORS settings
    if (env.CORS_ORIGIN.includes('localhost') || env.CORS_ORIGIN.includes('127.0.0.1')) {
      warnings.push('CORS_ORIGIN includes localhost in production')
    }

    // Check if debug features are enabled in production
    if (env.DEBUG) {
      warnings.push('DEBUG mode is enabled in production')
    }

    if (env.ENABLE_SWAGGER) {
      warnings.push('Swagger documentation is enabled in production')
    }

    if (env.ENABLE_GRAPHQL_PLAYGROUND) {
      warnings.push('GraphQL playground is enabled in production')
    }

    // Check external service keys
    if (env.STRIPE_SECRET_KEY?.startsWith('sk_test_')) {
      warnings.push('Using Stripe test keys in production')
    }

    return warnings
  }

  /**
   * Generate a secure random secret for development
   */
  static generateSecureSecret(length = 64): string {
    const crypto = require('node:crypto')
    return crypto.randomBytes(length).toString('hex')
  }

  /**
   * Mask sensitive values for logging
   */
  static maskSensitiveValue(value: string): string {
    if (value.length <= 8) {
      return '*'.repeat(value.length)
    }
    return value.substring(0, 4) + '*'.repeat(value.length - 8) + value.substring(value.length - 4)
  }
}

// Export singleton instance
export const envValidator = EnvironmentValidator.getInstance()

// Export utility functions
export { EnvironmentValidator, type ValidationResult, type EnvValidatorOptions }

// Helper function for quick validation
export async function validateEnvironment(options?: EnvValidatorOptions): Promise<ValidatedEnv> {
  const result = await envValidator.validate(options)
  if (!result.success || !result.data) {
    throw new Error('Environment validation failed')
  }
  return result.data
}
