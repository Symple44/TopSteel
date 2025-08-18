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
import { License } from './license.entity'

/**
 * Activation status
 */
export enum ActivationStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  DEACTIVATED = 'DEACTIVATED',
  BLOCKED = 'BLOCKED',
}

/**
 * License activation entity
 */
@Entity('license_activations')
@Index(['licenseId', 'machineId'])
@Index(['activationKey'], { unique: true })
@Index(['status'])
@Index(['machineId'])
export class LicenseActivation {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid' })
  licenseId!: string

  @Column({ type: 'varchar', length: 255, unique: true })
  activationKey!: string

  @Column({ type: 'varchar', length: 255 })
  machineId!: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  machineName?: string

  @Column({ type: 'varchar', length: 100, nullable: true })
  osType?: string

  @Column({ type: 'varchar', length: 100, nullable: true })
  osVersion?: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  hostname?: string

  @Column({ type: 'inet', nullable: true })
  ipAddress?: string

  @Column({ type: 'varchar', length: 17, nullable: true })
  macAddress?: string

  @Column({
    type: 'enum',
    enum: ActivationStatus,
    default: ActivationStatus.PENDING,
  })
  status!: ActivationStatus

  @Column({ type: 'timestamp with time zone' })
  activatedAt!: Date

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastSeenAt?: Date

  @Column({ type: 'timestamp with time zone', nullable: true })
  deactivatedAt?: Date

  @Column({ type: 'varchar', length: 500, nullable: true })
  deactivationReason?: string

  @Column({ type: 'integer', default: 0 })
  heartbeatCount!: number

  @Column({ type: 'integer', nullable: true })
  maxHeartbeatInterval?: number // in minutes

  @Column({ type: 'jsonb', default: {} })
  hardwareInfo?: {
    cpu?: {
      model?: string
      cores?: number
      speed?: number
    }
    memory?: {
      total?: number
      available?: number
    }
    disk?: {
      total?: number
      available?: number
    }
    network?: {
      interfaces?: Array<{
        name: string
        address: string
        mac: string
      }>
    }
  }

  @Column({ type: 'jsonb', default: {} })
  softwareInfo?: {
    appVersion?: string
    nodeVersion?: string
    platform?: string
    arch?: string
    modules?: string[]
  }

  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, any>

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date

  // Relations
  @ManyToOne(
    () => License,
    (license) => license.activations,
    { onDelete: 'CASCADE' }
  )
  @JoinColumn({ name: 'license_id' })
  license!: License

  // Utility methods

  /**
   * Check if activation is valid
   */
  isValid(): boolean {
    return this.status === ActivationStatus.ACTIVE
  }

  /**
   * Check if activation is stale
   */
  isStale(maxInactiveMinutes: number = 1440): boolean {
    if (!this.lastSeenAt) {
      return true
    }

    const now = new Date()
    const diff = now.getTime() - this.lastSeenAt.getTime()
    const minutesDiff = Math.floor(diff / (1000 * 60))

    return minutesDiff > maxInactiveMinutes
  }

  /**
   * Update heartbeat
   */
  updateHeartbeat(): void {
    this.lastSeenAt = new Date()
    this.heartbeatCount++
  }

  /**
   * Activate
   */
  activate(): void {
    this.status = ActivationStatus.ACTIVE
    this.activatedAt = new Date()
    this.deactivatedAt = null
    this.deactivationReason = null
  }

  /**
   * Deactivate
   */
  deactivate(reason?: string): void {
    this.status = ActivationStatus.DEACTIVATED
    this.deactivatedAt = new Date()
    this.deactivationReason = reason
  }

  /**
   * Block activation
   */
  block(reason?: string): void {
    this.status = ActivationStatus.BLOCKED
    this.deactivatedAt = new Date()
    this.deactivationReason = reason
  }

  /**
   * Generate activation key
   */
  static generateActivationKey(licenseKey: string, machineId: string): string {
    const crypto = require('node:crypto')
    const hash = crypto.createHash('sha256')
    hash.update(`${licenseKey}-${machineId}-${Date.now()}`)
    return hash.digest('hex').substring(0, 32).toUpperCase()
  }

  /**
   * Get machine fingerprint
   */
  getMachineFingerprint(): string {
    const crypto = require('node:crypto')
    const hash = crypto.createHash('sha256')

    const data = [
      this.machineId,
      this.macAddress,
      this.hostname,
      this.hardwareInfo?.cpu?.model,
      this.hardwareInfo?.network?.interfaces?.[0]?.mac,
    ]
      .filter(Boolean)
      .join('-')

    hash.update(data)
    return hash.digest('hex')
  }

  /**
   * Check if machine matches
   */
  matchesMachine(machineId: string, macAddress?: string, hostname?: string): boolean {
    // Primary check: machine ID
    if (this.machineId !== machineId) {
      return false
    }

    // Secondary checks (if available)
    if (macAddress && this.macAddress && this.macAddress !== macAddress) {
      return false
    }

    if (hostname && this.hostname && this.hostname !== hostname) {
      return false
    }

    return true
  }

  /**
   * Get activation summary
   */
  getSummary(): Record<string, any> {
    return {
      id: this.id,
      activationKey: this.activationKey,
      status: this.status,
      machine: {
        id: this.machineId,
        name: this.machineName,
        os: `${this.osType} ${this.osVersion}`,
        hostname: this.hostname,
        ip: this.ipAddress,
        mac: this.macAddress,
      },
      timing: {
        activatedAt: this.activatedAt,
        lastSeenAt: this.lastSeenAt,
        deactivatedAt: this.deactivatedAt,
        isStale: this.isStale(),
      },
      heartbeat: {
        count: this.heartbeatCount,
        maxInterval: this.maxHeartbeatInterval,
      },
    }
  }

  /**
   * Format for API response
   */
  toJSON(): Record<string, any> {
    return {
      ...this.getSummary(),
      hardwareInfo: this.hardwareInfo,
      softwareInfo: this.softwareInfo,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}
