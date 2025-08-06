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

@Entity('mfa_sessions')
export class MFASession {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid' })
  @Index()
  userId!: string

  @Column({ type: 'varchar', length: 255, unique: true })
  @Index()
  sessionToken!: string

  @Column({ type: 'enum', enum: ['pending', 'verified', 'expired', 'failed'], default: 'pending' })
  @Index()
  status!: 'pending' | 'verified' | 'expired' | 'failed'

  @Column({ type: 'enum', enum: ['totp', 'sms', 'email', 'webauthn'] })
  @Index()
  mfaType!: 'totp' | 'sms' | 'email' | 'webauthn'

  @Column({ type: 'varchar', length: 255, nullable: true })
  challengeId?: string // Pour WebAuthn

  @Column({ type: 'text', nullable: true })
  challenge?: string // Challenge WebAuthn ou code SMS/email

  @Column({ type: 'timestamp' })
  @Index()
  expiresAt!: Date

  @Column({ type: 'inet', nullable: true })
  ipAddress?: string

  @Column({ type: 'text', nullable: true })
  userAgent?: string

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    attempts?: number
    lastAttemptAt?: string
    deviceInfo?: {
      browser: string
      os: string
      device: string
    }
    webauthnOptions?: Record<string, unknown> // Options pour WebAuthn
    smsCode?: string // Code SMS crypté
    emailCode?: string // Code email crypté
  }

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User

  // Méthodes utilitaires
  isExpired(): boolean {
    return new Date() > this.expiresAt
  }

  isValid(): boolean {
    return this.status === 'pending' && !this.isExpired()
  }

  markAsVerified(): void {
    this.status = 'verified'
    this.updatedAt = new Date()
  }

  markAsExpired(): void {
    this.status = 'expired'
    this.updatedAt = new Date()
  }

  markAsFailed(): void {
    this.status = 'failed'
    this.updatedAt = new Date()
  }

  incrementAttempts(): void {
    if (!this.metadata) {
      this.metadata = {}
    }

    this.metadata.attempts = (this.metadata.attempts || 0) + 1
    this.metadata.lastAttemptAt = new Date().toISOString()
    this.updatedAt = new Date()
  }

  getAttemptsCount(): number {
    return this.metadata?.attempts || 0
  }

  isRateLimited(): boolean {
    const maxAttempts = 3
    return this.getAttemptsCount() >= maxAttempts
  }

  setWebAuthnOptions(options: Record<string, unknown>): void {
    if (!this.metadata) {
      this.metadata = {}
    }

    this.metadata.webauthnOptions = options
    this.updatedAt = new Date()
  }

  getWebAuthnOptions(): Record<string, unknown> | undefined {
    return this.metadata?.webauthnOptions
  }

  setSMSCode(encryptedCode: string): void {
    if (!this.metadata) {
      this.metadata = {}
    }

    this.metadata.smsCode = encryptedCode
    this.updatedAt = new Date()
  }

  getSMSCode(): string | undefined {
    return this.metadata?.smsCode
  }

  setEmailCode(encryptedCode: string): void {
    if (!this.metadata) {
      this.metadata = {}
    }

    this.metadata.emailCode = encryptedCode
    this.updatedAt = new Date()
  }

  getEmailCode(): string | undefined {
    return this.metadata?.emailCode
  }

  static create(
    userId: string,
    sessionToken: string,
    mfaType: 'totp' | 'sms' | 'email' | 'webauthn',
    expirationMinutes: number = 10,
    ipAddress?: string,
    userAgent?: string
  ): MFASession {
    const session = new MFASession()
    session.userId = userId
    session.sessionToken = sessionToken
    session.status = 'pending'
    session.mfaType = mfaType
    session.expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000)
    session.ipAddress = ipAddress
    session.userAgent = userAgent
    session.metadata = {
      attempts: 0,
    }
    return session
  }

  static createWebAuthn(
    userId: string,
    sessionToken: string,
    challengeId: string,
    challenge: string,
    options: Record<string, unknown>,
    ipAddress?: string,
    userAgent?: string
  ): MFASession {
    const session = MFASession.create(userId, sessionToken, 'webauthn', 5, ipAddress, userAgent)
    session.challengeId = challengeId
    session.challenge = challenge
    session.setWebAuthnOptions(options)
    return session
  }

  static createSMS(
    userId: string,
    sessionToken: string,
    encryptedCode: string,
    ipAddress?: string,
    userAgent?: string
  ): MFASession {
    const session = MFASession.create(userId, sessionToken, 'sms', 10, ipAddress, userAgent)
    session.setSMSCode(encryptedCode)
    return session
  }

  static createTOTP(
    userId: string,
    sessionToken: string,
    ipAddress?: string,
    userAgent?: string
  ): MFASession {
    return MFASession.create(userId, sessionToken, 'totp', 10, ipAddress, userAgent)
  }
}
