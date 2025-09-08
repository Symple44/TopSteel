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

@Entity('user_sessions')
@Index(['userId', 'status', 'lastActivity']) // Composite index for user activity queries
@Index(['userId', 'isActive']) // For active sessions by user
@Index(['status', 'lastActivity']) // For session cleanup and monitoring
@Index(['logoutTime']) // For session history queries
@Index(['ipAddress', 'createdAt']) // For security analysis
export class UserSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid' })
  @Index()
  userId!: string

  @Column({ type: 'varchar', length: 255, unique: true })
  @Index({ unique: true }) // Unique index for session lookup
  sessionId!: string

  @Column({ type: 'varchar', length: 255 })
  accessToken!: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  @Index({ where: 'refreshToken IS NOT NULL' }) // Partial index for active refresh tokens
  refreshToken?: string

  @Column({ type: 'timestamp' })
  @Index()
  loginTime!: Date

  @Column({ type: 'timestamp', nullable: true })
  logoutTime?: Date

  @Column({ type: 'timestamp' })
  @Index()
  lastActivity!: Date

  @Column({ type: 'varchar', nullable: true })
  @Index() // Index for IP-based security queries
  ipAddress?: string

  @Column({ type: 'text', nullable: true })
  userAgent?: string

  @Column({ type: 'jsonb', nullable: true })
  @Index() // GIN index for device info queries
  deviceInfo?: {
    browser: string
    os: string
    device: string
    isMobile: boolean
    [key: string]: unknown
  }

  @Column({ type: 'jsonb', nullable: true })
  @Index() // GIN index for location-based queries
  location?: {
    city: string
    country: string
    countryCode: string
    latitude?: number
    longitude?: number
    timezone?: string
    [key: string]: unknown
  }

  @Column({ type: 'boolean', default: true })
  @Index()
  isActive!: boolean

  @Column({ type: 'boolean', default: false })
  isIdle!: boolean

  @Column({ type: 'varchar', length: 50, default: 'active' })
  @Index()
  status!: 'active' | 'ended' | 'forced_logout' | 'expired'

  @Column({ type: 'integer', default: 0 })
  warningCount!: number

  @Column({ type: 'uuid', nullable: true })
  @Index() // Index for forced logout tracking
  forcedLogoutBy?: string

  @Column({ type: 'text', nullable: true })
  forcedLogoutReason?: string

  @Column({ type: 'jsonb', nullable: true })
  @Index() // GIN index for metadata queries
  metadata?: Record<string, unknown>

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'forcedLogoutBy' })
  forcedLogoutByUser?: User

  // Méthodes utilitaires
  getDuration(): string {
    const end = this.logoutTime || new Date()
    const start = this.loginTime
    const diffMs = end.getTime() - start.getTime()

    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  getTimeSinceLastActivity(): number {
    return Date.now() - this.lastActivity.getTime()
  }

  isExpired(tokenExpirationMs: number): boolean {
    return this.getTimeSinceLastActivity() > tokenExpirationMs
  }

  shouldBeMarkedIdle(idleThresholdMs: number = 15 * 60 * 1000): boolean {
    return this.getTimeSinceLastActivity() > idleThresholdMs
  }

  markAsIdle(): void {
    this.isIdle = true
    this.updatedAt = new Date()
  }

  updateActivity(): void {
    this.lastActivity = new Date()
    this.isIdle = false
    this.updatedAt = new Date()
  }

  endSession(reason: 'normal' | 'forced' | 'expired' = 'normal', adminUserId?: string): void {
    this.logoutTime = new Date()
    this.isActive = false

    switch (reason) {
      case 'forced':
        this.status = 'forced_logout'
        this.forcedLogoutBy = adminUserId
        break
      case 'expired':
        this.status = 'expired'
        break
      default:
        this.status = 'ended'
    }

    this.updatedAt = new Date()
  }

  addWarning(): void {
    this.warningCount += 1
    this.updatedAt = new Date()
  }

  static createNew(
    userId: string,
    sessionId: string,
    accessToken: string,
    ipAddress?: string,
    userAgent?: string,
    refreshToken?: string
  ): UserSession {
    const session = new UserSession()
    session.userId = userId
    session.sessionId = sessionId
    session.accessToken = accessToken
    session.refreshToken = refreshToken
    session.loginTime = new Date()
    session.lastActivity = new Date()
    session.ipAddress = ipAddress
    session.userAgent = userAgent
    session.isActive = true
    session.isIdle = false
    session.status = 'active'
    session.warningCount = 0
    return session
  }
}
