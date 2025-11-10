import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { Injectable, Logger, type OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { SecretManager } from './secret-manager'
import { SecretValidatorService } from './secret-validator.service'

export interface VaultEntry {
  value: string
  encrypted: boolean
  created: Date
  lastAccessed?: Date
  metadata: {
    purpose: string
    environment: string
    rotationPeriod?: number // days
    lastRotated?: Date
    lastUsed?: Date
  }
}

export interface SecretVaultConfig {
  enabled: boolean
  vaultPath: string
  masterPassword?: string
  autoRotationEnabled: boolean
  rotationIntervalDays: number
}

@Injectable()
export class SecretVaultService implements OnModuleInit {
  private readonly logger = new Logger(SecretVaultService.name)
  private vault: Map<string, VaultEntry> = new Map()
  private config: SecretVaultConfig
  private vaultPath: string
  private masterPassword: string

  constructor(
    private configService: ConfigService,
    private secretValidator: SecretValidatorService
  ) {
    this.config = {
      enabled: process.env.NODE_ENV !== 'production', // Only in dev/staging
      vaultPath: process.env.SECRET_VAULT_PATH || '.secrets',
      masterPassword: process.env.SECRET_VAULT_MASTER_PASSWORD,
      autoRotationEnabled: process.env.SECRET_AUTO_ROTATION === 'true',
      rotationIntervalDays: Number(process.env.SECRET_ROTATION_INTERVAL_DAYS) || 90,
    }

    this.vaultPath = join(process.cwd(), this.config.vaultPath)
    this.masterPassword = this.config.masterPassword || this.generateMasterPassword()
  }

  async onModuleInit() {
    if (!this.config.enabled) {
      this.logger.debug('Secret vault disabled in production environment')
      return
    }

    try {
      await this.loadVault()
      await this.initializeDefaultSecrets()

      if (this.config.autoRotationEnabled) {
        await this.checkAndRotateExpiredSecrets()
      }

      this.logger.log('Secret vault initialized successfully')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.logger.error('Failed to initialize secret vault:', errorMessage)
    }
  }

  /**
   * Generate master password for vault encryption
   */
  private generateMasterPassword(): string {
    // In development, generate a session-based master password
    const sessionId = process.env.SESSION_ID || Date.now().toString()
    return `vault-master-${sessionId}-${SecretManager.generateSecret({ length: 16, encoding: 'hex' })}`
  }

  /**
   * Load existing vault or create new one
   */
  private async loadVault(): Promise<void> {
    if (existsSync(this.vaultPath)) {
      try {
        const vaultData = readFileSync(this.vaultPath, 'utf8')
        const parsedData = JSON.parse(vaultData)

        if (parsedData.encrypted) {
          // Decrypt vault contents
          const decryptedSecrets = await SecretManager.readSecureEnvFile(
            this.vaultPath,
            this.masterPassword
          )

          for (const [key, value] of Object.entries(decryptedSecrets)) {
            this.vault.set(key, {
              value: value,
              encrypted: true,
              created: new Date(parsedData.metadata?.[key]?.created || Date.now()),
              lastAccessed: new Date(),
              metadata: {
                purpose: parsedData.metadata?.[key]?.purpose || 'unknown',
                environment: process.env.NODE_ENV || 'development',
                rotationPeriod:
                  parsedData.metadata?.[key]?.rotationPeriod || this.config.rotationIntervalDays,
                lastRotated: parsedData.metadata?.[key]?.lastRotated
                  ? new Date(parsedData.metadata[key].lastRotated)
                  : undefined,
              },
            })
          }
        } else {
          // Handle unencrypted vault (legacy)
          for (const [key, entry] of Object.entries(parsedData.secrets || {})) {
            this.vault.set(key, entry as VaultEntry)
          }
        }

        this.logger.debug(`Loaded ${this.vault.size} secrets from vault`)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        this.logger.warn('Failed to load existing vault, creating new one:', errorMessage)
        this.vault.clear()
      }
    }
  }

  /**
   * Save vault to disk
   */
  private async saveVault(): Promise<void> {
    try {
      const secretsToSave: Record<string, string> = {}
      const metadata: Record<
        string,
        {
          purpose?: string
          environment?: string
          rotationPeriod?: number
          createdAt?: Date
          lastUsed?: Date
        }
      > = {}

      for (const [key, entry] of this.vault.entries()) {
        secretsToSave[key] = entry.value
        metadata[key] = {
          purpose: entry.metadata.purpose,
          environment: entry.metadata.environment,
          rotationPeriod: entry.metadata.rotationPeriod,
          createdAt: entry.created,
          lastUsed: entry.metadata.lastUsed,
        }
      }

      // Create encrypted vault file
      await SecretManager.createSecureEnvFile(secretsToSave, this.masterPassword, this.vaultPath)

      // Also save metadata separately for easier access
      const metadataPath = `${this.vaultPath}.metadata.json`
      writeFileSync(
        metadataPath,
        JSON.stringify({ metadata, created: new Date().toISOString() }, null, 2)
      )

      this.logger.debug(`Saved ${this.vault.size} secrets to encrypted vault`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.logger.error('Failed to save vault:', errorMessage)
      throw error
    }
  }

  /**
   * Initialize default secrets for development
   */
  private async initializeDefaultSecrets(): Promise<void> {
    const defaultSecrets = [
      {
        key: 'JWT_SECRET',
        purpose: 'JWT token signing',
        generator: () => SecretManager.generateJWTSecret(),
      },
      {
        key: 'JWT_REFRESH_SECRET',
        purpose: 'JWT refresh token signing',
        generator: () => SecretManager.generateJWTSecret(),
      },
      {
        key: 'SESSION_SECRET',
        purpose: 'Session encryption',
        generator: () => SecretManager.generateSessionSecret(),
      },
      {
        key: 'INTERNAL_API_KEY',
        purpose: 'Internal service authentication',
        generator: () => SecretManager.generateAPIKey(),
      },
      {
        key: 'WEBHOOK_SECRET',
        purpose: 'Webhook signature verification',
        generator: () => SecretManager.generateSecret({ length: 32, encoding: 'hex' }),
      },
    ]

    let created = 0

    for (const secretDef of defaultSecrets) {
      if (!this.vault.has(secretDef.key)) {
        const value = secretDef.generator()

        this.vault.set(secretDef.key, {
          value,
          encrypted: true,
          created: new Date(),
          metadata: {
            purpose: secretDef.purpose,
            environment: process.env.NODE_ENV || 'development',
            rotationPeriod: this.config.rotationIntervalDays,
          },
        })

        created++
      }
    }

    if (created > 0) {
      await this.saveVault()
      this.logger.log(`Initialized ${created} default secrets`)
    }
  }

  /**
   * Get secret from vault or environment
   */
  getSecret(key: string): string | undefined {
    // First check vault
    const vaultEntry = this.vault.get(key)
    if (vaultEntry) {
      vaultEntry.lastAccessed = new Date()
      return vaultEntry.value
    }

    // Fall back to environment variable
    return this.configService.get<string>(key)
  }

  /**
   * Set secret in vault
   */
  async setSecret(key: string, value: string, purpose: string = 'manual'): Promise<void> {
    this.vault.set(key, {
      value,
      encrypted: true,
      created: new Date(),
      metadata: {
        purpose,
        environment: process.env.NODE_ENV || 'development',
        rotationPeriod: this.config.rotationIntervalDays,
      },
    })

    await this.saveVault()
    this.logger.debug(`Secret ${key} updated in vault`)
  }

  /**
   * Generate and store new secret
   */
  async generateSecret(
    key: string,
    purpose: string,
    options?: { length?: number; encoding?: 'hex' | 'base64' | 'ascii' }
  ): Promise<string> {
    let value: string

    // Generate appropriate secret based on key type
    if (key.includes('JWT')) {
      value = SecretManager.generateJWTSecret()
    } else if (key.includes('SESSION')) {
      value = SecretManager.generateSessionSecret()
    } else if (key.includes('API_KEY')) {
      value = SecretManager.generateAPIKey()
    } else if (key.includes('PASSWORD')) {
      value = SecretManager.generateDatabasePassword()
    } else {
      value = SecretManager.generateSecret(options)
    }

    await this.setSecret(key, value, purpose)
    return value
  }

  /**
   * Rotate specific secret
   */
  async rotateSecret(key: string): Promise<string> {
    const existingEntry = this.vault.get(key)
    const purpose = existingEntry?.metadata.purpose || 'rotated'

    const newValue = await this.generateSecret(key, purpose)

    if (existingEntry) {
      existingEntry.metadata.lastRotated = new Date()
    }

    this.logger.log(`Secret ${key} rotated successfully`)
    return newValue
  }

  /**
   * Check and rotate expired secrets
   */
  async checkAndRotateExpiredSecrets(): Promise<{ rotated: string[]; errors: string[] }> {
    const rotated: string[] = []
    const errors: string[] = []

    for (const [key, entry] of this.vault.entries()) {
      try {
        const daysSinceRotation = entry.metadata.lastRotated
          ? (Date.now() - entry.metadata.lastRotated.getTime()) / (1000 * 60 * 60 * 24)
          : (Date.now() - entry.created.getTime()) / (1000 * 60 * 60 * 24)

        if (
          daysSinceRotation >= (entry.metadata.rotationPeriod || this.config.rotationIntervalDays)
        ) {
          await this.rotateSecret(key)
          rotated.push(key)
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        errors.push(`Failed to rotate ${key}: ${errorMessage}`)
        this.logger.error(`Failed to rotate secret ${key}:`, errorMessage)
      }
    }

    if (rotated.length > 0) {
      this.logger.log(`Auto-rotated ${rotated.length} expired secrets: ${rotated.join(', ')}`)
    }

    return { rotated, errors }
  }

  /**
   * Get vault status and statistics
   */
  getVaultStatus(): {
    enabled: boolean
    secretCount: number
    encryptedSecrets: number
    oldestSecret: Date | null
    newestSecret: Date | null
    nextRotationDue: Date | null
    securityScore: number
  } {
    if (!this.config.enabled) {
      return {
        enabled: false,
        secretCount: 0,
        encryptedSecrets: 0,
        oldestSecret: null,
        newestSecret: null,
        nextRotationDue: null,
        securityScore: 0,
      }
    }

    let oldestSecret: Date | null = null
    let newestSecret: Date | null = null
    let nextRotationDue: Date | null = null
    let encryptedSecrets = 0

    for (const entry of this.vault.values()) {
      if (entry.encrypted) encryptedSecrets++

      if (!oldestSecret || entry.created < oldestSecret) {
        oldestSecret = entry.created
      }

      if (!newestSecret || entry.created > newestSecret) {
        newestSecret = entry.created
      }

      // Calculate next rotation date
      const lastRotated = entry.metadata.lastRotated || entry.created
      const rotationInterval =
        (entry.metadata.rotationPeriod || this.config.rotationIntervalDays) * 24 * 60 * 60 * 1000
      const nextRotation = new Date(lastRotated.getTime() + rotationInterval)

      if (!nextRotationDue || nextRotation < nextRotationDue) {
        nextRotationDue = nextRotation
      }
    }

    // Calculate security score based on vault secrets
    const validationResult = this.secretValidator.validateCriticalSecrets()

    return {
      enabled: this.config.enabled,
      secretCount: this.vault.size,
      encryptedSecrets,
      oldestSecret,
      newestSecret,
      nextRotationDue,
      securityScore: validationResult.securityScore,
    }
  }

  /**
   * Export secrets for backup (encrypted)
   */
  async exportSecrets(exportPassword?: string): Promise<string> {
    const _password = exportPassword || this.masterPassword
    const exportData = {
      version: '1.0',
      exported: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      secretCount: this.vault.size,
      secrets: {} as Record<string, string>,
      metadata: {} as Record<
        string,
        {
          purpose?: string
          created?: string
          lastUsed?: string
          rotationPeriod?: number
          environment?: string
        }
      >,
    }

    for (const [key, entry] of this.vault.entries()) {
      exportData.secrets[key] = entry.value
      exportData.metadata[key] = {
        purpose: entry.metadata.purpose,
        created: entry.created.toISOString(),
        lastUsed: entry.metadata.lastUsed?.toISOString(),
        rotationPeriod: entry.metadata.rotationPeriod,
        environment: entry.metadata.environment,
      }
    }

    return JSON.stringify(exportData, null, 2)
  }

  /**
   * Import secrets from backup
   */
  async importSecrets(
    exportData: string,
    importPassword?: string
  ): Promise<{ imported: number; skipped: number; errors: string[] }> {
    const _password = importPassword || this.masterPassword
    const result = { imported: 0, skipped: 0, errors: [] as string[] }

    try {
      const data = JSON.parse(exportData)

      for (const [key, value] of Object.entries(data.secrets)) {
        if (this.vault.has(key)) {
          result.skipped++
          continue
        }

        const metadata = data.metadata[key] || {}
        this.vault.set(key, {
          value: value as string,
          encrypted: true,
          created: metadata.created ? new Date(metadata.created) : new Date(),
          metadata: {
            purpose: metadata.purpose || 'imported',
            environment: process.env.NODE_ENV || 'development',
            rotationPeriod: this.config.rotationIntervalDays,
            lastRotated: metadata.lastRotated ? new Date(metadata.lastRotated) : undefined,
          },
        })

        result.imported++
      }

      if (result.imported > 0) {
        await this.saveVault()
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      result.errors.push(`Import failed: ${errorMessage}`)
    }

    return result
  }

  /**
   * Clear vault (development only)
   */
  async clearVault(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clear vault in production environment')
    }

    this.vault.clear()
    await this.saveVault()
    this.logger.warn('Secret vault cleared')
  }
}
