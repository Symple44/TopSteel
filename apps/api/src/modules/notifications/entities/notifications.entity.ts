import { Column, Entity, Index } from 'typeorm'
import { BaseAuditEntity } from '../../../common/base/base.entity'

export enum NotificationType {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  SUCCESS = 'success',
}

export enum NotificationCategory {
  SYSTEM = 'system',
  STOCK = 'stock',
  PROJET = 'projet',
  PRODUCTION = 'production',
  MAINTENANCE = 'maintenance',
  QUALITE = 'qualite',
  FACTURATION = 'facturation',
  SAUVEGARDE = 'sauvegarde',
  UTILISATEUR = 'utilisateur',
}

export enum NotificationPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum RecipientType {
  ALL = 'all',
  ROLE = 'role',
  USER = 'user',
  GROUP = 'group',
}

@Entity('notifications')
export class Notifications extends BaseAuditEntity {
  @Column({ length: 255 })
  @Index()
  title!: string

  @Column({ type: 'text' })
  message!: string

  @Column({
    type: 'enum',
    enum: NotificationType,
    default: NotificationType.INFO,
  })
  type!: NotificationType

  @Column({
    type: 'enum',
    enum: NotificationCategory,
    default: NotificationCategory.SYSTEM,
  })
  @Index()
  category!: NotificationCategory

  @Column({
    type: 'enum',
    enum: NotificationPriority,
    default: NotificationPriority.NORMAL,
  })
  @Index()
  priority!: NotificationPriority

  @Column({ type: 'varchar', length: 100, nullable: true })
  @Index()
  source?: string

  @Column({ type: 'varchar', length: 50, nullable: true })
  @Index()
  entityType?: string

  @Column({ type: 'varchar', length: 36, nullable: true })
  @Index()
  entityId?: string

  @Column({ type: 'jsonb', nullable: true })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: Record<string, any>

  @Column({
    type: 'enum',
    enum: RecipientType,
    default: RecipientType.ALL,
  })
  @Index()
  recipientType!: RecipientType

  @Column({ type: 'varchar', length: 36, nullable: true })
  @Index()
  recipientId?: string

  @Column({ type: 'varchar', length: 500, nullable: true })
  actionUrl?: string

  @Column({ type: 'varchar', length: 100, nullable: true })
  actionLabel?: string

  @Column({ type: 'enum', enum: ['primary', 'secondary'], nullable: true })
  actionType?: 'primary' | 'secondary'

  @Column({ type: 'timestamp', nullable: true })
  @Index()
  expiresAt?: Date

  @Column({ type: 'boolean', default: true })
  persistent!: boolean

  @Column({ type: 'boolean', default: false })
  autoRead!: boolean

  @Column({ type: 'boolean', default: false })
  @Index()
  isArchived!: boolean
}