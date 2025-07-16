import { Column, Entity, Index } from 'typeorm'
import { BaseAuditEntity } from '../../../common/base/base.entity'

interface CategorySettings {
  system: boolean
  stock: boolean
  projet: boolean
  production: boolean
  maintenance: boolean
  qualite: boolean
  facturation: boolean
  sauvegarde: boolean
  utilisateur: boolean
}

interface PrioritySettings {
  low: boolean
  normal: boolean
  high: boolean
  urgent: boolean
}

interface ScheduleSettings {
  workingHours: {
    enabled: boolean
    start: string
    end: string
  }
  weekdays: {
    enabled: boolean
    days: number[]
  }
}

@Entity('notification_settings')
export class NotificationSettings extends BaseAuditEntity {
  @Column({ type: 'varchar', length: 36, unique: true })
  @Index()
  userId!: string

  @Column({ type: 'boolean', default: true })
  enableSound!: boolean

  @Column({ type: 'boolean', default: true })
  enableToast!: boolean

  @Column({ type: 'boolean', default: true })
  enableBrowser!: boolean

  @Column({ type: 'boolean', default: false })
  enableEmail!: boolean

  @Column({ 
    type: 'jsonb', 
    default: {
      system: true,
      stock: true,
      projet: true,
      production: true,
      maintenance: true,
      qualite: true,
      facturation: true,
      sauvegarde: false,
      utilisateur: true,
    }
  })
  categories!: CategorySettings

  @Column({ 
    type: 'jsonb', 
    default: {
      low: false,
      normal: true,
      high: true,
      urgent: true,
    }
  })
  priorities!: PrioritySettings

  @Column({ 
    type: 'jsonb', 
    default: {
      workingHours: {
        enabled: false,
        start: '09:00',
        end: '18:00',
      },
      weekdays: {
        enabled: false,
        days: [1, 2, 3, 4, 5],
      },
    }
  })
  schedules!: ScheduleSettings
}