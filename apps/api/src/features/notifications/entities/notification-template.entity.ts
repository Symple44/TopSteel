import { Column, Entity, Index } from 'typeorm'
import { BaseAuditEntity } from '../../../core/common/base/base.entity'
import {
  NotificationCategory,
  NotificationPriority,
  NotificationType,
} from './notifications.entity'

@Entity('notification_templates')
export class NotificationTemplate extends BaseAuditEntity {
  @Column({ length: 100, unique: true })
  @Index()
  name!: string

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

  @Column({ length: 255 })
  titleTemplate!: string

  @Column({ type: 'text' })
  messageTemplate!: string

  @Column({
    type: 'enum',
    enum: NotificationPriority,
    default: NotificationPriority.NORMAL,
  })
  priority!: NotificationPriority

  @Column({ type: 'boolean', default: true })
  persistent!: boolean

  @Column({ type: 'varchar', length: 500, nullable: true })
  actionUrlTemplate?: string

  @Column({ type: 'varchar', length: 100, nullable: true })
  actionLabel?: string

  @Column({ type: 'jsonb', nullable: true })
  variables?: Record<string, unknown>

  @Column({ type: 'text', nullable: true })
  description?: string
}
