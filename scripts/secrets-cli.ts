#!/usr/bin/env tsx

/**
 * TopSteel Secrets Management CLI
 *
 * Utility for managing production secrets securely
 *
 * Usage:
 *   pnpm secrets generate        # Generate new production secrets
 *   pnpm secrets validate        # Validate current secrets
 *   pnpm secrets rotate [keys]   # Rotate specific secrets
 *   pnpm secrets encrypt         # Encrypt secrets file
 *   pnpm secrets mask [value]    # Mask a secret for logging
 */

import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { randomBytes, createCipheriv, createDecipheriv, scrypt } from 'node:crypto'
import { promisify } from 'node:util'
import { Command } from 'commander'
import inquirer from 'inquirer'

const scryptAsync = promisify(scrypt)

/**
 * Simplified SecretManager implementation for CLI usage
 */
class SecretManager {
  private static readonly DEFAULT_KEY_LENGTH = 32
  private static readonly ENCRYPTION_ALGORITHM = 'aes-256-gcm'

  /**
   * Generate a cryptographically secure random secret
   */
  static generateSecret(options: { length?: number; encoding?: 'hex' | 'base64' | 'ascii'; includeSpecialChars?: boolean } = {}): string {
    const { length = this.DEFAULT_KEY_LENGTH, encoding = 'hex', includeSpecialChars = false } = options

    if (includeSpecialChars && encoding === 'ascii') {
      const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?'
      let result = ''
      for (let i = 0; i < length; i++) {
        const randomIndex = randomBytes(1)[0] % charset.length
        result += charset[randomIndex]
      }
      return result
    }

    return randomBytes(length).toString(encoding)
  }

  /**
   * Generate a JWT secret with proper entropy
   */
  static generateJWTSecret(): string {
    return this.generateSecret({ length: 32, encoding: 'hex' })
  }

  /**
   * Generate a session secret
   */
  static generateSessionSecret(): string {
    return this.generateSecret({ length: 32, encoding: 'hex' })
  }

  /**
   * Generate an API key
   */
  static generateAPIKey(length = 32): string {
    return this.generateSecret({ length, encoding: 'base64' })
      .replace(/[+/=]/g, '')
      .substring(0, length)
  }

  /**
   * Validate secret strength
   */
  static validateSecretStrength(secret: string): 'weak' | 'medium' | 'strong' {
    if (secret.length < 16) return 'weak'

    const uniqueChars = new Set(secret).size

    // For very long secrets (>= 48 chars), focus more on length
    if (secret.length >= 48) {
      if (uniqueChars >= 8) return 'strong'
      if (uniqueChars >= 6) return 'medium'
      return 'weak'
    }

    if (secret.length < 32) {
      // For shorter secrets, require better entropy
      const entropyRatio = uniqueChars / secret.length
      if (entropyRatio < 0.4) return 'weak'
      if (entropyRatio < 0.7) return 'medium'
      return 'strong'
    }

    // For medium length secrets (32-47 chars)
    const entropyRatio = uniqueChars / secret.length
    if (entropyRatio < 0.3) return 'weak'
    if (entropyRatio < 0.5) return 'medium'

    return 'strong'
  }

  /**
   * Check if secret appears to be a default/example value
   */
  static isDefaultSecret(secret: string): boolean {
    const defaultPatterns = [
      /your[_-]?secret/i,
      /change[_-]?(me|this|in[_-]?production)/i,
      /example/i,
      /test/i,
      /development/i,
      /localhost/i,
      /admin/i,
      /password/i,
      /123456/i,
      /secret/i,
      /key/i,
    ]

    return defaultPatterns.some((pattern) => pattern.test(secret))
  }

  /**
   * Derive encryption key from master password
   */
  static async deriveKey(password: string, salt?: Buffer): Promise<{ key: Buffer; salt: Buffer }> {
    const actualSalt = salt || randomBytes(16)
    const key = (await scryptAsync(password, actualSalt, 32)) as Buffer
    return { key, salt: actualSalt }
  }

  /**
   * Encrypt sensitive data
   */
  static async encryptSecret(data: string, masterPassword: string): Promise<{ encrypted: string; iv: string; salt: string }> {
    const { key, salt } = await this.deriveKey(masterPassword)
    const iv = randomBytes(12)

    const cipher = createCipheriv(this.ENCRYPTION_ALGORITHM, key, iv)

    let encrypted = cipher.update(data, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    const authTag = cipher.getAuthTag()

    return {
      encrypted: `${encrypted}:${authTag.toString('hex')}`,
      iv: iv.toString('hex'),
      salt: salt.toString('hex'),
    }
  }

  /**
   * Create secure environment file with encrypted secrets
   */
  static async createSecureEnvFile(secrets: Record<string, string>, masterPassword: string, filePath: string): Promise<void> {
    const encryptedSecrets: Record<string, any> = {}

    for (const [key, value] of Object.entries(secrets)) {
      encryptedSecrets[key] = await this.encryptSecret(value, masterPassword)
    }

    const envData = {
      version: '1.0',
      encrypted: true,
      algorithm: this.ENCRYPTION_ALGORITHM,
      created: new Date().toISOString(),
      secrets: encryptedSecrets,
    }

    await writeFile(filePath, JSON.stringify(envData, null, 2))
  }

  /**
   * Validate all secrets in environment
   */
  static validateEnvironmentSecrets(env: Record<string, unknown>): {
    weak: string[]
    medium: string[]
    strong: string[]
    defaults: string[]
  } {
    const secretKeys = [
      'JWT_SECRET',
      'JWT_REFRESH_SECRET',
      'SESSION_SECRET',
      'DATABASE_URL',
      'REDIS_PASSWORD',
      'SMTP_PASS',
      'TWILIO_AUTH_TOKEN',
      'VONAGE_API_SECRET',
      'AWS_SECRET_ACCESS_KEY',
      'STRIPE_SECRET_KEY',
      'OPENAI_API_KEY',
      'INTERNAL_API_KEY',
      'WEBHOOK_SECRET',
    ]

    const results = {
      weak: [] as string[],
      medium: [] as string[],
      strong: [] as string[],
      defaults: [] as string[],
    }

    for (const key of secretKeys) {
      const value = env[key]
      if (value && typeof value === 'string') {
        const strength = this.validateSecretStrength(value)
        results[strength].push(key)

        if (this.isDefaultSecret(value)) {
          results.defaults.push(key)
        }
      }
    }

    return results
  }

  /**
   * Generate a complete set of production secrets
   */
  static generateProductionSecrets(): Record<string, string> {
    return {
      JWT_SECRET: this.generateJWTSecret(),
      JWT_REFRESH_SECRET: this.generateJWTSecret(),
      SESSION_SECRET: this.generateSessionSecret(),
      INTERNAL_API_KEY: this.generateAPIKey(),
      WEBHOOK_SECRET: this.generateSecret({ length: 32, encoding: 'hex' }),
      DATA_ENCRYPTION_KEY: this.generateSecret({ length: 32, encoding: 'hex' }),
      FILE_ENCRYPTION_KEY: this.generateSecret({ length: 32, encoding: 'hex' }),
      BACKUP_STORAGE_KEY: this.generateAPIKey(),
      BACKUP_STORAGE_SECRET: this.generateSecret({ length: 40, encoding: 'base64' }),
    }
  }

  /**
   * Mask sensitive values for logging
   */
  static maskSecret(secret: string, visibleChars = 4): string {
    if (!secret) return ''
    if (secret.length <= visibleChars * 2) {
      return '*'.repeat(secret.length)
    }

    const start = secret.substring(0, visibleChars)
    const end = secret.substring(secret.length - visibleChars)
    const middle = '*'.repeat(secret.length - visibleChars * 2)

    return `${start}${middle}${end}`
  }
}

/**
 * Simplified environment validator for CLI usage
 */
class SimpleEnvValidator {
  private static readonly REQUIRED_ENV_VARS = [
    'DATABASE_URL',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'SESSION_SECRET',
  ]

  static async validate(options: { throwOnError?: boolean; logValidation?: boolean } = {}): Promise<{
    success: boolean
    errors?: string[]
    warnings?: string[]
  }> {
    const errors: string[] = []
    const warnings: string[] = []

    // Check required environment variables
    for (const envVar of this.REQUIRED_ENV_VARS) {
      if (!process.env[envVar]) {
        errors.push(`Missing required environment variable: ${envVar}`)
      }
    }

    // Check for weak secrets
    const secretAnalysis = SecretManager.validateEnvironmentSecrets(process.env)

    if (secretAnalysis.weak.length > 0) {
      warnings.push(`Weak secrets detected: ${secretAnalysis.weak.join(', ')}`)
    }

    if (secretAnalysis.defaults.length > 0) {
      errors.push(`Default/example secrets detected: ${secretAnalysis.defaults.join(', ')}`)
    }

    const success = errors.length === 0

    if (options.logValidation) {
      if (success) {
        console.log('✅ Environment validation passed')
      } else {
        console.log('❌ Environment validation failed')
        errors.forEach(error => console.log(`  Error: ${error}`))
      }

      if (warnings.length > 0) {
        warnings.forEach(warning => console.log(`  Warning: ${warning}`))
      }
    }

    if (!success && options.throwOnError) {
      throw new Error(`Environment validation failed: ${errors.join(', ')}`)
    }

    return { success, errors, warnings }
  }
}

const program = new Command()

program.name('secrets-cli').description('TopSteel Secrets Management CLI').version('1.0.0')

/**
 * Generate new production secrets
 */
program
  .command('generate')
  .description('Generate a complete set of production secrets')
  .option('-o, --output <file>', 'Output file path')
  .option('-f, --format <format>', 'Output format (env|json)', 'env')
  .action(async (options) => {
    try {
      const secrets = SecretManager.generateProductionSecrets()

      if (options.format === 'json') {
        const output = JSON.stringify(secrets, null, 2)
        if (options.output) {
          await writeFile(options.output, output)
          console.log(`✅ Production secrets generated and saved to: ${options.output}`)
        } else {
          console.log(output)
        }
      } else {
        // Generate .env format
        let envContent = '# Generated Production Secrets\n'
        envContent += `# Generated on: ${new Date().toISOString()}\n\n`

        for (const [key, value] of Object.entries(secrets)) {
          envContent += `${key}=${value}\n`
        }

        if (options.output) {
          await writeFile(options.output, envContent)
          console.log(`✅ Production secrets generated and saved to: ${options.output}`)
        } else {
          console.log(envContent)
        }
      }
    } catch (_error) {
      process.exit(1)
    }
  })

/**
 * Validate current environment secrets
 */
program
  .command('validate')
  .description('Validate current environment secrets')
  .option('--env-file <file>', 'Environment file to validate', '.env.local')
  .action(async (options) => {
    try {
      // Load environment file if specified
      if (options.envFile && existsSync(options.envFile)) {
        const { config } = await import('dotenv')
        config({ path: options.envFile })
      }

      // Validate using the environment validator
      const result = await SimpleEnvValidator.validate({ throwOnError: false, logValidation: false })

      if (!result.success) {
        console.log('❌ Environment validation failed:')
        result.errors?.forEach((error) => console.log(`  - ${error}`))
        process.exit(1)
      }

      // Validate secret strength
      const secretAnalysis = SecretManager.validateEnvironmentSecrets(process.env)

      console.log('✅ Environment validation passed!')
      console.log('')

      // Report secret strength
      if (secretAnalysis.strong.length > 0) {
        console.log(`🔒 Strong secrets (${secretAnalysis.strong.length}):`)
        secretAnalysis.strong.forEach((key) => console.log(`  - ${key}`))
        console.log('')
      }

      if (secretAnalysis.medium.length > 0) {
        console.log(`⚠️  Medium strength secrets (${secretAnalysis.medium.length}):`)
        secretAnalysis.medium.forEach((key) => console.log(`  - ${key}`))
        console.log('')
      }

      if (secretAnalysis.weak.length > 0) {
        console.log(`🚨 Weak secrets (${secretAnalysis.weak.length}):`)
        secretAnalysis.weak.forEach((key) => console.log(`  - ${key}`))
        console.log('  Consider regenerating these secrets for better security.')
        console.log('')
      }

      if (secretAnalysis.defaults.length > 0) {
        console.log(`💀 Default/example secrets detected (${secretAnalysis.defaults.length}):`)
        secretAnalysis.defaults.forEach((key) => console.log(`  - ${key}`))
        console.log('  These MUST be changed before production!')
        console.log('')
      }

      // Show warnings if any
      if (result.warnings && result.warnings.length > 0) {
        console.log('⚠️  Warnings:')
        result.warnings.forEach((warning) => console.log(`  - ${warning}`))
        console.log('')
      }
    } catch (_error) {
      process.exit(1)
    }
  })

/**
 * Rotate specific secrets
 */
program
  .command('rotate')
  .description('Rotate specific secrets')
  .argument('[keys...]', 'Secret keys to rotate (default: all)')
  .option('--env-file <file>', 'Environment file to update', '.env.vault')
  .option('--backup', 'Create backup before rotation', true)
  .action(async (keys, options) => {
    try {
      // Default keys to rotate if none specified
      const defaultKeys = [
        'JWT_SECRET',
        'JWT_REFRESH_SECRET',
        'SESSION_SECRET',
        'INTERNAL_API_KEY',
        'WEBHOOK_SECRET',
      ]

      const keysToRotate = keys.length > 0 ? keys : defaultKeys

      // Confirm rotation
      const { confirmed } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmed',
          message: `Rotate the following secrets: ${keysToRotate.join(', ')}?`,
          default: false,
        },
      ])

      if (!confirmed) {
        return
      }

      // Generate new secrets
      const newSecrets: Record<string, string> = {}

      for (const key of keysToRotate) {
        if (key.includes('JWT')) {
          newSecrets[key] = SecretManager.generateJWTSecret()
        } else if (key.includes('SESSION')) {
          newSecrets[key] = SecretManager.generateSessionSecret()
        } else if (key.includes('API_KEY')) {
          newSecrets[key] = SecretManager.generateAPIKey()
        } else {
          newSecrets[key] = SecretManager.generateSecret()
        }
      }

      // Create backup if requested
      if (options.backup && existsSync(options.envFile)) {
        const backupFile = `${options.envFile}.backup.${Date.now()}`
        const originalContent = await readFile(options.envFile, 'utf8')
        await writeFile(backupFile, originalContent)
      }

      // Update environment file
      let envContent = ''
      if (existsSync(options.envFile)) {
        envContent = await readFile(options.envFile, 'utf8')
      }

      // Update or add new secrets
      for (const [key, value] of Object.entries(newSecrets)) {
        const regex = new RegExp(`^${key}=.*$`, 'm')
        if (regex.test(envContent)) {
          envContent = envContent.replace(regex, `${key}=${value}`)
        } else {
          envContent += `\n${key}=${value}`
        }
      }

      await writeFile(options.envFile, envContent)

      console.log(`✅ Successfully rotated ${keysToRotate.length} secrets in ${options.envFile}`)
      console.log(`🔐 Rotated secrets: ${keysToRotate.join(', ')}`)

      if (options.backup && existsSync(options.envFile)) {
        const backupFile = `${options.envFile}.backup.${Date.now()}`
        console.log(`💾 Backup created: ${backupFile}`)
      }
    } catch (error) {
      console.error('❌ Failed to rotate secrets:', error instanceof Error ? error.message : String(error))
      process.exit(1)
    }
  })

/**
 * Encrypt secrets file
 */
program
  .command('encrypt')
  .description('Encrypt a secrets file with a master password')
  .argument('<input>', 'Input file path')
  .option('-o, --output <file>', 'Output encrypted file path')
  .action(async (input, options) => {
    try {
      if (!existsSync(input)) {
        console.error(`❌ Input file not found: ${input}`)
        process.exit(1)
      }

      const { masterPassword } = await inquirer.prompt([
        {
          type: 'password',
          name: 'masterPassword',
          message: 'Enter master password for encryption:',
          mask: '*',
        },
      ])

      const content = await readFile(input, 'utf8')
      const lines = content.split('\n')
      const secrets: Record<string, string> = {}

      // Parse environment file
      for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...valueParts] = trimmed.split('=')
          if (key && valueParts.length > 0) {
            secrets[key] = valueParts.join('=')
          }
        }
      }

      const outputFile = options.output || `${input}.encrypted`
      await SecretManager.createSecureEnvFile(secrets, masterPassword, outputFile)

      console.log(`✅ Successfully encrypted secrets from ${input}`)
      console.log(`🔒 Encrypted file saved to: ${outputFile}`)
      console.log(`📊 Encrypted ${Object.keys(secrets).length} secrets`)
    } catch (error) {
      console.error('❌ Failed to encrypt secrets:', error instanceof Error ? error.message : String(error))
      process.exit(1)
    }
  })

/**
 * Mask a secret value
 */
program
  .command('mask')
  .description('Mask a secret value for safe logging')
  .argument('<value>', 'Secret value to mask')
  .option('--visible <chars>', 'Number of visible characters', '4')
  .action((value, options) => {
    const masked = SecretManager.maskSecret(value, parseInt(options.visible, 10))
    console.log(`🎭 Masked secret: ${masked}`)
  })

/**
 * Check secret strength
 */
program
  .command('strength')
  .description('Check the strength of a secret')
  .argument('<value>', 'Secret value to check')
  .action((value) => {
    const strength = SecretManager.validateSecretStrength(value)
    const isDefault = SecretManager.isDefaultSecret(value)

    console.log(`🔍 Secret strength analysis:`)
    console.log(`  Strength: ${strength}`)
    console.log(`  Length: ${value.length} characters`)
    console.log(`  Unique chars: ${new Set(value).size}`)
    console.log(`  Appears to be default/example: ${isDefault ? 'Yes ❌' : 'No ✅'}`)

    if (strength === 'weak') {
      console.log('  ⚠️  Consider using a longer, more complex secret')
    } else if (strength === 'medium') {
      console.log('  ✅ Good strength, but could be stronger')
    } else {
      console.log('  🔒 Excellent strength!')
    }
  })

// Handle unknown commands
program.on('command:*', () => {
  process.exit(1)
})

// Run the CLI
program.parse()
