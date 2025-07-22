import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { User } from './user.entity'

export interface NotificationSettings {
  email: boolean
  push: boolean
  sms: boolean
  emailTypes?: {
    newMessages: boolean
    systemAlerts: boolean
    taskReminders: boolean
    weeklyReports: boolean
    securityAlerts: boolean
    maintenanceNotice: boolean
  }
  pushTypes?: {
    enabled: boolean
    sound: boolean
    urgent: boolean
    normal: boolean
    quiet: boolean
  }
  quietHours?: {
    enabled: boolean
    start: string
    end: string
  }
}

export interface AppearanceSettings {
  theme: 'light' | 'dark' | 'vibrant' | 'system'
  language: string
  fontSize: 'small' | 'medium' | 'large'
  sidebarWidth: 'compact' | 'normal' | 'wide'
  density: 'compact' | 'comfortable' | 'spacious'
  accentColor: 'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'red'
  contentWidth: 'compact' | 'full'
}

export interface UserPreferences {
  language: string
  timezone: string
  theme: 'light' | 'dark' | 'vibrant' | 'system'
  notifications: NotificationSettings
  appearance: AppearanceSettings
}

export interface CompanyInfo {
  name?: string
  address?: string
  city?: string
  postalCode?: string
  country?: string
}

export interface UserProfile {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  position?: string
  department?: string
  avatar?: string
}

@Entity('user_settings')
export class UserSettings {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user!: User

  @Column({ type: 'uuid' })
  userId!: string

  @Column({ type: 'jsonb', nullable: true })
  profile?: UserProfile

  @Column({ type: 'jsonb', nullable: true })
  company?: CompanyInfo

  @Column({ 
    type: 'jsonb', 
    default: {
      language: 'fr',
      timezone: 'Europe/Paris',
      theme: 'vibrant',
      notifications: {
        email: true,
        push: true,
        sms: false,
        emailTypes: {
          newMessages: true,
          systemAlerts: true,
          taskReminders: false,
          weeklyReports: true,
          securityAlerts: true,
          maintenanceNotice: false
        },
        pushTypes: {
          enabled: true,
          sound: true,
          urgent: true,
          normal: false,
          quiet: true
        },
        quietHours: {
          enabled: true,
          start: '22:00',
          end: '07:00'
        }
      },
      appearance: {
        theme: 'vibrant',
        language: 'fr',
        fontSize: 'medium',
        sidebarWidth: 'normal',
        density: 'comfortable',
        accentColor: 'blue',
        contentWidth: 'compact'
      }
    }
  })
  preferences!: UserPreferences

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date
}