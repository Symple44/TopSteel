import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

/**
 * Entity for storing audit log entries
 */
@Entity('audit_logs')
@Index(['userId', 'timestamp'])
@Index(['societeId', 'timestamp'])
@Index(['eventType', 'timestamp'])
@Index(['severity', 'timestamp'])
@Index(['resource', 'action', 'timestamp'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'timestamp with time zone' })
  @Index()
  timestamp!: Date

  @Column({ type: 'varchar', length: 50 })
  @Index()
  eventType!: string

  @Column({ type: 'varchar', length: 20 })
  @Index()
  severity!: string

  @Column({ type: 'uuid', nullable: true })
  @Index()
  userId?: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  @Index()
  userEmail?: string

  @Column({ type: 'uuid', nullable: true })
  @Index()
  societeId?: string

  @Column({ type: 'uuid', nullable: true })
  siteId?: string

  @Column({ type: 'varchar', length: 100, nullable: true })
  @Index()
  resource?: string

  @Column({ type: 'varchar', length: 50, nullable: true })
  @Index()
  action?: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  resourceId?: string

  @Column({ type: 'inet', nullable: true })
  @Index()
  ipAddress?: string

  @Column({ type: 'text', nullable: true })
  userAgent?: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  sessionId?: string

  @Column({ type: 'boolean', default: false })
  @Index()
  success!: boolean

  @Column({ type: 'varchar', length: 100, nullable: true })
  errorCode?: string

  @Column({ type: 'text', nullable: true })
  errorMessage?: string

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>

  @Column({ type: 'integer', nullable: true })
  duration?: number // Milliseconds

  @Column({ type: 'integer', nullable: true })
  affectedRecords?: number

  @Column({ type: 'jsonb', nullable: true })
  oldValue?: any

  @Column({ type: 'jsonb', nullable: true })
  newValue?: any

  @Column({ type: 'jsonb', nullable: true })
  location?: {
    country?: string
    region?: string
    city?: string
    latitude?: number
    longitude?: number
  }

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  // Utility methods

  /**
   * Check if this is a security-related event
   */
  isSecurityEvent(): boolean {
    const securityEvents = [
      'LOGIN_SUCCESS',
      'LOGIN_FAILED',
      'LOGOUT',
      'MFA_ENABLED',
      'MFA_DISABLED',
      'MFA_VERIFIED',
      'MFA_FAILED',
      'ACCESS_DENIED',
      'SUSPICIOUS_ACTIVITY',
      'RATE_LIMIT_EXCEEDED',
      'INVALID_TOKEN',
      'PASSWORD_CHANGED',
      'PASSWORD_RESET',
    ]
    return securityEvents.includes(this.eventType)
  }

  /**
   * Check if this is a data modification event
   */
  isDataModificationEvent(): boolean {
    const dataEvents = ['DATA_CREATED', 'DATA_UPDATED', 'DATA_DELETED']
    return dataEvents.includes(this.eventType)
  }

  /**
   * Check if this is a critical event
   */
  isCriticalEvent(): boolean {
    return (
      this.severity === 'CRITICAL' ||
      this.eventType === 'SUSPICIOUS_ACTIVITY' ||
      (this.eventType === 'LOGIN_FAILED' && this.metadata?.attemptCount > 5)
    )
  }

  /**
   * Get a human-readable description
   */
  getDescription(): string {
    const descriptions: Record<string, string> = {
      LOGIN_SUCCESS: `User ${this.userEmail || this.userId} logged in successfully`,
      LOGIN_FAILED: `Failed login attempt for ${this.userEmail || 'unknown user'}`,
      LOGOUT: `User ${this.userEmail || this.userId} logged out`,
      ACCESS_GRANTED: `Access granted to ${this.resource}:${this.action}`,
      ACCESS_DENIED: `Access denied to ${this.resource}:${this.action}`,
      DATA_CREATED: `Created ${this.resource} ${this.resourceId || ''}`,
      DATA_UPDATED: `Updated ${this.resource} ${this.resourceId || ''}`,
      DATA_DELETED: `Deleted ${this.resource} ${this.resourceId || ''}`,
      PERMISSION_CHANGED: `Permissions changed for user ${this.metadata?.targetUserId}`,
      SUSPICIOUS_ACTIVITY: `Suspicious activity detected: ${this.errorMessage}`,
    }

    return descriptions[this.eventType] || `${this.eventType} event occurred`
  }

  /**
   * Get risk score based on event type and severity
   */
  getRiskScore(): number {
    let score = 0

    // Base score by severity
    const severityScores: Record<string, number> = {
      INFO: 0,
      WARNING: 25,
      ERROR: 50,
      CRITICAL: 100,
    }
    score += severityScores[this.severity] || 0

    // Additional points for specific events
    if (this.eventType === 'SUSPICIOUS_ACTIVITY') score += 50
    if (this.eventType === 'ACCESS_DENIED') score += 10
    if (this.eventType === 'LOGIN_FAILED') score += 5
    if (this.eventType === 'RATE_LIMIT_EXCEEDED') score += 20
    if (this.eventType === 'DATA_DELETED') score += 15

    // Failed events get additional score
    if (!this.success) score += 10

    return Math.min(score, 100) // Cap at 100
  }

  /**
   * Check if event requires immediate attention
   */
  requiresAttention(): boolean {
    return (
      this.isCriticalEvent() ||
      this.getRiskScore() > 75 ||
      (this.eventType === 'ACCESS_DENIED' && this.metadata?.attemptCount > 10)
    )
  }

  /**
   * Format for export/reporting
   */
  toExportFormat(): Record<string, any> {
    return {
      id: this.id,
      timestamp: this.timestamp.toISOString(),
      eventType: this.eventType,
      severity: this.severity,
      user: this.userEmail || this.userId || 'anonymous',
      resource: this.resource,
      action: this.action,
      success: this.success,
      ipAddress: this.ipAddress,
      duration: this.duration,
      description: this.getDescription(),
      riskScore: this.getRiskScore(),
    }
  }
}
