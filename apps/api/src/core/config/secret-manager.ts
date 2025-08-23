import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto'
import { promisify } from 'util'
import { readFile, writeFile, existsSync } from 'fs'
import { join } from 'path'

/**
 * Secure Secret Management Utilities
 * 
 * Provides utilities for:
 * - Generating cryptographically secure secrets
 * - Encrypting/decrypting sensitive configuration
 * - Validating secret strength
 * - Secure secret rotation
 * - Key derivation from master passwords
 */

const scryptAsync = promisify(scrypt)
const readFileAsync = promisify(readFile)
const writeFileAsync = promisify(writeFile)

interface SecretOptions {
  length?: number
  encoding?: 'hex' | 'base64' | 'ascii'
  includeSpecialChars?: boolean
}

interface EncryptionResult {
  encrypted: string
  iv: string
  salt: string
}

interface SecretMetadata {
  created: Date
  lastRotated?: Date
  strength: 'weak' | 'medium' | 'strong'
  purpose: string
}

export class SecretManager {
  private static readonly DEFAULT_KEY_LENGTH = 32
  private static readonly MIN_PASSWORD_LENGTH = 12
  private static readonly ENCRYPTION_ALGORITHM = 'aes-256-gcm'

  /**
   * Generate a cryptographically secure random secret
   */
  static generateSecret(options: SecretOptions = {}): string {
    const {
      length = this.DEFAULT_KEY_LENGTH,
      encoding = 'hex',
      includeSpecialChars = false
    } = options

    if (includeSpecialChars && encoding === 'ascii') {
      // Generate password with special characters
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
    // JWT secrets should be at least 256 bits (32 bytes) for HS256
    return this.generateSecret({ length: 32, encoding: 'hex' })
  }

  /**
   * Generate a session secret
   */
  static generateSessionSecret(): string {
    // Session secrets should be at least 256 bits
    return this.generateSecret({ length: 32, encoding: 'hex' })
  }

  /**
   * Generate a database password
   */
  static generateDatabasePassword(length = 20): string {
    return this.generateSecret({ 
      length, 
      encoding: 'ascii', 
      includeSpecialChars: true 
    })
  }

  /**
   * Generate an API key
   */
  static generateAPIKey(length = 32): string {
    return this.generateSecret({ length, encoding: 'base64' })
      .replace(/[+/=]/g, '') // Remove URL-unsafe characters
      .substring(0, length)
  }

  /**
   * Validate secret strength
   */
  static validateSecretStrength(secret: string): SecretMetadata['strength'] {
    if (secret.length < 16) return 'weak'
    if (secret.length < 32) return 'medium'
    
    // Check for entropy
    const uniqueChars = new Set(secret).size
    const entropyRatio = uniqueChars / secret.length
    
    if (entropyRatio < 0.3) return 'weak'
    if (entropyRatio < 0.6) return 'medium'
    
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
      /key/i
    ]

    return defaultPatterns.some(pattern => pattern.test(secret))
  }

  /**
   * Derive encryption key from master password
   */
  static async deriveKey(password: string, salt?: Buffer): Promise<{ key: Buffer; salt: Buffer }> {
    const actualSalt = salt || randomBytes(16)
    const key = await scryptAsync(password, actualSalt, 32) as Buffer
    return { key, salt: actualSalt }
  }

  /**
   * Encrypt sensitive data
   */
  static async encryptSecret(data: string, masterPassword: string): Promise<EncryptionResult> {
    const { key, salt } = await this.deriveKey(masterPassword)
    const iv = randomBytes(12) // GCM recommends 12 bytes for AES-256-GCM
    
    const cipher = createCipheriv(this.ENCRYPTION_ALGORITHM, key, iv)
    
    let encrypted = cipher.update(data, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    // Get the authentication tag for GCM mode
    const authTag = cipher.getAuthTag()
    
    return {
      encrypted: encrypted + ':' + authTag.toString('hex'), // Append auth tag
      iv: iv.toString('hex'),
      salt: salt.toString('hex')
    }
  }

  /**
   * Decrypt sensitive data
   */
  static async decryptSecret(
    encryptionResult: EncryptionResult, 
    masterPassword: string
  ): Promise<string> {
    const salt = Buffer.from(encryptionResult.salt, 'hex')
    const iv = Buffer.from(encryptionResult.iv, 'hex')
    const { key } = await this.deriveKey(masterPassword, salt)
    
    // Split encrypted data and auth tag
    const [encryptedData, authTagHex] = encryptionResult.encrypted.split(':')
    const authTag = Buffer.from(authTagHex, 'hex')
    
    const decipher = createDecipheriv(this.ENCRYPTION_ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  }

  /**
   * Create secure environment file with encrypted secrets
   */
  static async createSecureEnvFile(
    secrets: Record<string, string>,
    masterPassword: string,
    filePath: string
  ): Promise<void> {
    const encryptedSecrets: Record<string, EncryptionResult> = {}
    
    for (const [key, value] of Object.entries(secrets)) {
      encryptedSecrets[key] = await this.encryptSecret(value, masterPassword)
    }
    
    const envData = {
      version: '1.0',
      encrypted: true,
      algorithm: this.ENCRYPTION_ALGORITHM,
      created: new Date().toISOString(),
      secrets: encryptedSecrets
    }
    
    await writeFileAsync(filePath, JSON.stringify(envData, null, 2))
  }

  /**
   * Read secure environment file and decrypt secrets
   */
  static async readSecureEnvFile(
    filePath: string,
    masterPassword: string
  ): Promise<Record<string, string>> {
    if (!existsSync(filePath)) {
      throw new Error(`Secure environment file not found: ${filePath}`)
    }
    
    const envData = JSON.parse(await readFileAsync(filePath, 'utf8'))
    
    if (!envData.encrypted) {
      throw new Error('Environment file is not encrypted')
    }
    
    const decryptedSecrets: Record<string, string> = {}
    
    for (const [key, encryptionResult] of Object.entries(envData.secrets)) {
      decryptedSecrets[key] = await this.decryptSecret(
        encryptionResult as EncryptionResult,
        masterPassword
      )
    }
    
    return decryptedSecrets
  }

  /**
   * Rotate secrets in secure environment file
   */
  static async rotateSecrets(
    filePath: string,
    masterPassword: string,
    secretsToRotate: string[]
  ): Promise<Record<string, string>> {
    const currentSecrets = await this.readSecureEnvFile(filePath, masterPassword)
    const newSecrets: Record<string, string> = {}
    
    for (const secretKey of secretsToRotate) {
      if (currentSecrets[secretKey]) {
        // Generate new secret based on the key type
        if (secretKey.includes('JWT')) {
          newSecrets[secretKey] = this.generateJWTSecret()
        } else if (secretKey.includes('SESSION')) {
          newSecrets[secretKey] = this.generateSessionSecret()
        } else if (secretKey.includes('API_KEY')) {
          newSecrets[secretKey] = this.generateAPIKey()
        } else {
          newSecrets[secretKey] = this.generateSecret()
        }
      }
    }
    
    // Update file with new secrets
    const updatedSecrets = { ...currentSecrets, ...newSecrets }
    await this.createSecureEnvFile(updatedSecrets, masterPassword, filePath)
    
    return newSecrets
  }

  /**
   * Validate all secrets in environment
   */
  static validateEnvironmentSecrets(env: Record<string, any>): {
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
      'OPENAI_API_KEY'
    ]

    const results = {
      weak: [] as string[],
      medium: [] as string[],
      strong: [] as string[],
      defaults: [] as string[]
    }

    for (const key of secretKeys) {
      const value = env[key]
      if (value) {
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
      BACKUP_STORAGE_SECRET: this.generateSecret({ length: 40, encoding: 'base64' })
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

export default SecretManager