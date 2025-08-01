import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { User } from '../../../users/entities/user.entity'

@Entity('user_mfa')
export class UserMFA {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid', name: 'user_id' })
  @Index()
  userId!: string

  @Column({ type: 'varchar', length: 50, default: 'totp' })
  @Index()
  type!: 'totp' | 'sms' | 'email' | 'webauthn'

  @Column({ type: 'boolean', default: false, name: 'is_enabled' })
  @Index()
  isEnabled!: boolean

  @Column({ type: 'boolean', default: false, name: 'is_verified' })
  @Index()
  isVerified!: boolean

  @Column({ type: 'varchar', length: 255, nullable: true })
  secret?: string // Pour TOTP, crypté

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'backup_codes' })
  backupCodes?: string // Codes de récupération, cryptés

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'phone_number' })
  phoneNumber?: string // Pour SMS

  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string // Pour email

  @Column({ type: 'jsonb', nullable: true, name: 'webauthn_credentials' })
  webauthnCredentials?: {
    credentialId: string
    publicKey: string
    counter: number
    deviceName?: string
    userAgent?: string
    createdAt: string
  }[]

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    qrCode?: string // URL du QR code pour TOTP
    deviceInfo?: {
      deviceName: string
      userAgent: string
      ipAddress: string
    }
    lastUsed?: string
    usageCount?: number
    failedAttempts?: number
    lastFailedAttempt?: string
  }

  @Column({ type: 'timestamp', nullable: true, name: 'last_used_at' })
  @Index()
  lastUsedAt?: Date

  @Column({ type: 'timestamp', nullable: true, name: 'verified_at' })
  verifiedAt?: Date

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User

  // Méthodes utilitaires
  markAsUsed(): void {
    this.lastUsedAt = new Date()
    if (this.metadata) {
      this.metadata.lastUsed = new Date().toISOString()
      this.metadata.usageCount = (this.metadata.usageCount || 0) + 1
    } else {
      this.metadata = {
        lastUsed: new Date().toISOString(),
        usageCount: 1,
      }
    }
    this.updatedAt = new Date()
  }

  markFailedAttempt(): void {
    if (this.metadata) {
      this.metadata.failedAttempts = (this.metadata.failedAttempts || 0) + 1
      this.metadata.lastFailedAttempt = new Date().toISOString()
    } else {
      this.metadata = {
        failedAttempts: 1,
        lastFailedAttempt: new Date().toISOString(),
      }
    }
    this.updatedAt = new Date()
  }

  verify(): void {
    this.isVerified = true
    this.verifiedAt = new Date()
    this.updatedAt = new Date()
  }

  enable(): void {
    this.isEnabled = true
    this.updatedAt = new Date()
  }

  disable(): void {
    this.isEnabled = false
    this.updatedAt = new Date()
  }

  addWebAuthnCredential(credential: {
    credentialId: string
    publicKey: string
    counter: number
    deviceName?: string
    userAgent?: string
  }): void {
    if (!this.webauthnCredentials) {
      this.webauthnCredentials = []
    }

    this.webauthnCredentials.push({
      ...credential,
      createdAt: new Date().toISOString(),
    })

    this.updatedAt = new Date()
  }

  removeWebAuthnCredential(credentialId: string): boolean {
    if (!this.webauthnCredentials) {
      return false
    }

    const initialLength = this.webauthnCredentials.length
    this.webauthnCredentials = this.webauthnCredentials.filter(
      (cred) => cred.credentialId !== credentialId
    )

    if (this.webauthnCredentials.length !== initialLength) {
      this.updatedAt = new Date()
      return true
    }

    return false
  }

  updateWebAuthnCounter(credentialId: string, counter: number): boolean {
    if (!this.webauthnCredentials) {
      return false
    }

    const credential = this.webauthnCredentials.find((cred) => cred.credentialId === credentialId)

    if (credential) {
      credential.counter = counter
      this.updatedAt = new Date()
      return true
    }

    return false
  }

  getActiveWebAuthnCredentials(): typeof this.webauthnCredentials {
    return this.webauthnCredentials || []
  }

  hasEnabledMFA(): boolean {
    return this.isEnabled && this.isVerified
  }

  isRateLimited(): boolean {
    if (!this.metadata?.failedAttempts || !this.metadata?.lastFailedAttempt) {
      return false
    }

    const maxAttempts = 5
    const lockoutMinutes = 15
    const lastFailedAttempt = new Date(this.metadata.lastFailedAttempt)
    const now = new Date()
    const minutesSinceLastFailed = (now.getTime() - lastFailedAttempt.getTime()) / (1000 * 60)

    return this.metadata.failedAttempts >= maxAttempts && minutesSinceLastFailed < lockoutMinutes
  }

  resetFailedAttempts(): void {
    if (this.metadata) {
      this.metadata.failedAttempts = 0
      delete this.metadata.lastFailedAttempt
    }
    this.updatedAt = new Date()
  }

  static createTOTP(userId: string, secret: string, phoneNumber?: string): UserMFA {
    const mfa = new UserMFA()
    mfa.userId = userId
    mfa.type = 'totp'
    mfa.secret = secret
    mfa.phoneNumber = phoneNumber
    mfa.isEnabled = false
    mfa.isVerified = false
    mfa.metadata = {
      usageCount: 0,
      failedAttempts: 0,
    }
    return mfa
  }

  static createWebAuthn(userId: string): UserMFA {
    const mfa = new UserMFA()
    mfa.userId = userId
    mfa.type = 'webauthn'
    mfa.isEnabled = false
    mfa.isVerified = false
    mfa.webauthnCredentials = []
    mfa.metadata = {
      usageCount: 0,
      failedAttempts: 0,
    }
    return mfa
  }

  static createSMS(userId: string, phoneNumber: string): UserMFA {
    const mfa = new UserMFA()
    mfa.userId = userId
    mfa.type = 'sms'
    mfa.phoneNumber = phoneNumber
    mfa.isEnabled = false
    mfa.isVerified = false
    mfa.metadata = {
      usageCount: 0,
      failedAttempts: 0,
    }
    return mfa
  }
}
