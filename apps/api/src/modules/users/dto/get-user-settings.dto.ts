import { UserSettings } from '../entities/user-settings.entity'

export class GetUserSettingsResponseDto {
  id: string
  profile?: {
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
    position?: string
    department?: string
    avatar?: string
  }
  company?: {
    name?: string
    address?: string
    city?: string
    postalCode?: string
    country?: string
  }
  preferences: {
    language: string
    timezone: string
    theme: 'light' | 'dark' | 'auto'
    notifications: {
      email: boolean
      push: boolean
      sms: boolean
    }
  }
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date

  static fromEntity(settings: UserSettings): GetUserSettingsResponseDto {
    return {
      id: settings.id,
      profile: settings.profile,
      company: settings.company,
      preferences: settings.preferences,
      metadata: settings.metadata,
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt,
    }
  }
}