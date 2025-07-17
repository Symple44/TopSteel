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
}

export interface UserPreferences {
  language: string
  timezone: string
  theme: 'light' | 'dark' | 'auto'
  notifications: NotificationSettings
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
      theme: 'light',
      notifications: {
        email: true,
        push: true,
        sms: false
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