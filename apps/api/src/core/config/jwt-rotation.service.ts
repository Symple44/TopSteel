import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { Cron, CronExpression } from '@nestjs/schedule'
import { NotificationService } from './notification/notification.service'
import { SecretManager } from './secret-manager'
import { SecretVaultService } from './secret-vault.service'

export interface JwtRotationConfig {
  enabled: boolean
  rotationIntervalHours: number
  gracePeriodHours: number
  autoRotationEnabled: boolean
  notifyRotation: boolean
}

export interface JwtKeyPair {
  keyId: string
  secret: string
  algorithm: string
  createdAt: Date
  expiresAt: Date
  isActive: boolean
}

export interface RotationResult {
  success: boolean
  newKeyId: string
  previousKeyId?: string
  rotationTime: Date
  affectedTokens?: number
  errors?: string[]
}

@Injectable()
export class JwtRotationService {
  private readonly logger = new Logger(JwtRotationService.name)
  private currentKeyPairs: Map<string, JwtKeyPair> = new Map()
  private rotationConfig: JwtRotationConfig

  constructor(
    private configService: ConfigService,
    private jwtService: JwtService,
    private secretVault?: SecretVaultService,
    private notificationService?: NotificationService
  ) {
    this.rotationConfig = {
      enabled: process.env.JWT_ROTATION_ENABLED === 'true',
      rotationIntervalHours: Number(process.env.JWT_ROTATION_INTERVAL_HOURS) || 24,
      gracePeriodHours: Number(process.env.JWT_GRACE_PERIOD_HOURS) || 4,
      autoRotationEnabled: process.env.JWT_AUTO_ROTATION === 'true',
      notifyRotation: process.env.JWT_ROTATION_NOTIFICATIONS === 'true',
    }

    this.initializeKeyPairs()
  }

  /**
   * Initialize JWT key pairs from configuration
   */
  private initializeKeyPairs(): void {
    const jwtSecret = this.configService.get<string>('JWT_SECRET')
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET')

    if (jwtSecret) {
      this.currentKeyPairs.set('access', {
        keyId: this.generateKeyId('access'),
        secret: jwtSecret,
        algorithm: 'HS256',
        createdAt: new Date(),
        expiresAt: this.calculateExpirationDate(),
        isActive: true,
      })
    }

    if (refreshSecret) {
      this.currentKeyPairs.set('refresh', {
        keyId: this.generateKeyId('refresh'),
        secret: refreshSecret,
        algorithm: 'HS256',
        createdAt: new Date(),
        expiresAt: this.calculateExpirationDate(),
        isActive: true,
      })
    }

    this.logger.log(`Initialized ${this.currentKeyPairs.size} JWT key pairs`)
  }

  /**
   * Generate unique key ID
   */
  private generateKeyId(type: string): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    return `${type}-${timestamp}-${random}`
  }

  /**
   * Calculate expiration date for key pair
   */
  private calculateExpirationDate(): Date {
    const now = new Date()
    const expirationTime =
      now.getTime() + this.rotationConfig.rotationIntervalHours * 60 * 60 * 1000
    return new Date(expirationTime)
  }

  /**
   * Rotate JWT access token secret
   */
  async rotateAccessTokenSecret(): Promise<RotationResult> {
    const result: RotationResult = {
      success: false,
      newKeyId: '',
      rotationTime: new Date(),
      errors: [],
    }

    try {
      const currentKeyPair = this.currentKeyPairs.get('access')
      const previousKeyId = currentKeyPair?.keyId

      // Generate new secret
      const newSecret = SecretManager.generateJWTSecret()
      const newKeyId = this.generateKeyId('access')

      // Create new key pair
      const newKeyPair: JwtKeyPair = {
        keyId: newKeyId,
        secret: newSecret,
        algorithm: 'HS256',
        createdAt: new Date(),
        expiresAt: this.calculateExpirationDate(),
        isActive: true,
      }

      // Store in vault if available
      if (this.secretVault) {
        await this.secretVault.setSecret(
          'JWT_SECRET',
          newSecret,
          'JWT access token signing - rotated'
        )
      }

      // Update key pair
      this.currentKeyPairs.set('access', newKeyPair)

      // Keep previous key for grace period
      if (currentKeyPair) {
        const gracePeriodEnd = new Date(
          Date.now() + this.rotationConfig.gracePeriodHours * 60 * 60 * 1000
        )
        currentKeyPair.isActive = false
        currentKeyPair.expiresAt = gracePeriodEnd
        this.currentKeyPairs.set(`access-previous-${currentKeyPair.keyId}`, currentKeyPair)
      }

      result.success = true
      result.newKeyId = newKeyId
      result.previousKeyId = previousKeyId

      this.logger.log(`JWT access token secret rotated successfully. New key ID: ${newKeyId}`)

      // Notify about rotation if enabled
      if (this.rotationConfig.notifyRotation) {
        await this.notifyRotation('access', result)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      result.errors?.push(errorMessage)
      this.logger.error('Failed to rotate JWT access token secret:', errorMessage)
    }

    return result
  }

  /**
   * Rotate JWT refresh token secret
   */
  async rotateRefreshTokenSecret(): Promise<RotationResult> {
    const result: RotationResult = {
      success: false,
      newKeyId: '',
      rotationTime: new Date(),
      errors: [],
    }

    try {
      const currentKeyPair = this.currentKeyPairs.get('refresh')
      const previousKeyId = currentKeyPair?.keyId

      // Generate new secret
      const newSecret = SecretManager.generateJWTSecret()
      const newKeyId = this.generateKeyId('refresh')

      // Create new key pair
      const newKeyPair: JwtKeyPair = {
        keyId: newKeyId,
        secret: newSecret,
        algorithm: 'HS256',
        createdAt: new Date(),
        expiresAt: this.calculateExpirationDate(),
        isActive: true,
      }

      // Store in vault if available
      if (this.secretVault) {
        await this.secretVault.setSecret(
          'JWT_REFRESH_SECRET',
          newSecret,
          'JWT refresh token signing - rotated'
        )
      }

      // Update key pair
      this.currentKeyPairs.set('refresh', newKeyPair)

      // Keep previous key for grace period
      if (currentKeyPair) {
        const gracePeriodEnd = new Date(
          Date.now() + this.rotationConfig.gracePeriodHours * 60 * 60 * 1000
        )
        currentKeyPair.isActive = false
        currentKeyPair.expiresAt = gracePeriodEnd
        this.currentKeyPairs.set(`refresh-previous-${currentKeyPair.keyId}`, currentKeyPair)
      }

      result.success = true
      result.newKeyId = newKeyId
      result.previousKeyId = previousKeyId

      this.logger.log(`JWT refresh token secret rotated successfully. New key ID: ${newKeyId}`)

      // Notify about rotation if enabled
      if (this.rotationConfig.notifyRotation) {
        await this.notifyRotation('refresh', result)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      result.errors?.push(errorMessage)
      this.logger.error('Failed to rotate JWT refresh token secret:', errorMessage)
    }

    return result
  }

  /**
   * Rotate both access and refresh token secrets
   */
  async rotateAllSecrets(): Promise<{ access: RotationResult; refresh: RotationResult }> {
    this.logger.log('Starting full JWT secret rotation')

    const accessResult = await this.rotateAccessTokenSecret()
    const refreshResult = await this.rotateRefreshTokenSecret()

    const successCount = (accessResult.success ? 1 : 0) + (refreshResult.success ? 1 : 0)
    this.logger.log(`JWT rotation completed: ${successCount}/2 secrets rotated successfully`)

    return { access: accessResult, refresh: refreshResult }
  }

  /**
   * Automatic rotation via cron job
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleScheduledRotation(): Promise<void> {
    if (!this.rotationConfig.enabled || !this.rotationConfig.autoRotationEnabled) {
      return
    }

    const now = new Date()
    let rotationNeeded = false

    // Check if any keys need rotation
    for (const [type, keyPair] of this.currentKeyPairs.entries()) {
      if (keyPair.isActive && now >= keyPair.expiresAt) {
        rotationNeeded = true
        this.logger.log(
          `JWT ${type} secret needs rotation (expired at ${keyPair.expiresAt.toISOString()})`
        )
      }
    }

    if (rotationNeeded) {
      await this.rotateAllSecrets()
    }

    // Clean up old keys that are past grace period
    await this.cleanupExpiredKeys()
  }

  /**
   * Clean up expired keys that are past grace period
   */
  async cleanupExpiredKeys(): Promise<number> {
    const now = new Date()
    let cleaned = 0

    for (const [keyId, keyPair] of this.currentKeyPairs.entries()) {
      if (!keyPair.isActive && now >= keyPair.expiresAt) {
        this.currentKeyPairs.delete(keyId)
        cleaned++
        this.logger.debug(`Cleaned up expired key: ${keyId}`)
      }
    }

    if (cleaned > 0) {
      this.logger.log(`Cleaned up ${cleaned} expired JWT keys`)
    }

    return cleaned
  }

  /**
   * Get current active key pair for token type
   */
  getActiveKeyPair(type: 'access' | 'refresh'): JwtKeyPair | undefined {
    return this.currentKeyPairs.get(type)
  }

  /**
   * Get key pair by ID (including inactive ones within grace period)
   */
  getKeyPairById(keyId: string): JwtKeyPair | undefined {
    for (const keyPair of this.currentKeyPairs.values()) {
      if (keyPair.keyId === keyId) {
        return keyPair
      }
    }
    return undefined
  }

  /**
   * Verify JWT token with rotation support
   */
  async verifyTokenWithRotation(
    token: string,
    type: 'access' | 'refresh'
  ): Promise<{ userId?: string; iat?: number; exp?: number; type?: string }> {
    // First try with active key
    const activeKeyPair = this.getActiveKeyPair(type)
    if (activeKeyPair) {
      try {
        return this.jwtService.verify(token, { secret: activeKeyPair.secret })
      } catch (_error) {
        // Token might be signed with previous key, continue to try others
      }
    }

    // Try with previous keys within grace period
    for (const [keyId, keyPair] of this.currentKeyPairs.entries()) {
      if (keyId.startsWith(`${type}-previous-`) && new Date() < keyPair.expiresAt) {
        try {
          const payload = this.jwtService.verify(token, { secret: keyPair.secret })
          this.logger.debug(`Token verified with previous key: ${keyId}`)
          return payload
        } catch (_error) {
          // Continue trying other keys
        }
      }
    }

    throw new Error('Token verification failed with all available keys')
  }

  /**
   * Get rotation status and statistics
   */
  getRotationStatus(): {
    enabled: boolean
    autoRotationEnabled: boolean
    keyCount: number
    activeKeys: number
    nextRotation: Date | null
    gracePeriodHours: number
    rotationIntervalHours: number
  } {
    let activeKeys = 0
    let nextRotation: Date | null = null

    for (const keyPair of this.currentKeyPairs.values()) {
      if (keyPair.isActive) {
        activeKeys++
        if (!nextRotation || keyPair.expiresAt < nextRotation) {
          nextRotation = keyPair.expiresAt
        }
      }
    }

    return {
      enabled: this.rotationConfig.enabled,
      autoRotationEnabled: this.rotationConfig.autoRotationEnabled,
      keyCount: this.currentKeyPairs.size,
      activeKeys,
      nextRotation,
      gracePeriodHours: this.rotationConfig.gracePeriodHours,
      rotationIntervalHours: this.rotationConfig.rotationIntervalHours,
    }
  }

  /**
   * Force immediate rotation
   */
  async forceRotation(): Promise<{ access: RotationResult; refresh: RotationResult }> {
    this.logger.log('Forcing immediate JWT secret rotation')
    return await this.rotateAllSecrets()
  }

  /**
   * Notify about rotation (sends notifications via email, Slack, webhooks)
   */
  private async notifyRotation(type: string, result: RotationResult): Promise<void> {
    // Log rotation event
    this.logger.log(`JWT ${type} token rotated:`, {
      newKeyId: result.newKeyId,
      previousKeyId: result.previousKeyId,
      rotationTime: result.rotationTime,
      success: result.success,
    })

    // Send notification if service is available
    if (this.notificationService) {
      try {
        await this.notificationService.sendNotification({
          type: 'jwt_rotation',
          severity: result.success ? 'info' : 'error',
          title: `JWT ${type.toUpperCase()} Token Rotation`,
          message: result.success
            ? `JWT ${type} token successfully rotated. New key ID: ${result.newKeyId}. Previous key ID: ${result.previousKeyId}. Grace period active for ${this.rotationConfig.gracePeriodHours} hours.`
            : `Failed to rotate JWT ${type} token. Errors: ${result.errors?.join(', ')}`,
          timestamp: result.rotationTime,
          metadata: {
            tokenType: type,
            newKeyId: result.newKeyId,
            previousKeyId: result.previousKeyId || 'N/A',
            affectedTokens: result.affectedTokens || 0,
            gracePeriodHours: this.rotationConfig.gracePeriodHours,
            success: result.success,
            errors: result.errors?.join(', ') || 'None',
            environment: process.env.NODE_ENV || 'unknown',
          },
        })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        this.logger.error(`Failed to send rotation notification: ${errorMessage}`)
      }
    }
  }

  /**
   * Generate rotation report
   */
  generateRotationReport(): string {
    const status = this.getRotationStatus()
    const keyDetails: string[] = []

    for (const [keyId, keyPair] of this.currentKeyPairs.entries()) {
      const status = keyPair.isActive ? 'ACTIVE' : 'INACTIVE'
      const expiresIn = Math.round((keyPair.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60))
      keyDetails.push(`  - ${keyId}: ${status} (expires in ${expiresIn}h)`)
    }

    return `
# JWT Rotation Status Report
Generated: ${new Date().toISOString()}
Environment: ${process.env.NODE_ENV || 'unknown'}

## Configuration
- Rotation Enabled: ${status.enabled ? '✅' : '❌'}
- Auto Rotation: ${status.autoRotationEnabled ? '✅' : '❌'}
- Rotation Interval: ${status.rotationIntervalHours} hours
- Grace Period: ${status.gracePeriodHours} hours

## Current Status
- Total Keys: ${status.keyCount}
- Active Keys: ${status.activeKeys}
- Next Rotation: ${status.nextRotation?.toISOString() || 'N/A'}

## Key Details
${keyDetails.join('\n')}

## Recommendations
${
  status.enabled
    ? '- JWT rotation is properly configured'
    : '- Consider enabling JWT rotation for enhanced security'
}
${
  status.autoRotationEnabled
    ? '- Automatic rotation is active'
    : '- Consider enabling automatic rotation'
}
- Monitor rotation logs for any failures
- Ensure applications handle token rotation gracefully
- Consider implementing rotation notifications

---
Report generated by TopSteel JWT Rotation Service
`
  }
}
