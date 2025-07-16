import { Column, Entity, Index, ManyToOne, JoinColumn, Unique } from 'typeorm'
import { BaseAuditEntity } from '../../../common/base/base.entity'
import { Notifications } from './notifications.entity'

@Entity('notification_reads')
@Unique(['notificationId', 'userId'])
export class NotificationRead extends BaseAuditEntity {
  @Column({ type: 'varchar', length: 36 })
  @Index()
  notificationId!: string

  @Column({ type: 'varchar', length: 36 })
  @Index()
  userId!: string

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @Index()
  readAt!: Date

  @ManyToOne(() => Notifications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'notificationId' })
  notification!: Notifications
}