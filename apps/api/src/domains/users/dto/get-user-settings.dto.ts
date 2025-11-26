// Types for JSON fields in UserSettings
interface UserProfile {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  avatar?: string
}

interface CompanyInfo {
  name?: string
  address?: string
  city?: string
  postalCode?: string
  country?: string
  phone?: string
  email?: string
  website?: string
}

interface UserPreferences {
  language?: string
  timezone?: string
  theme?: string
  notifications?: any
  appearance?: any
}

interface UserSettings {
  id: string
  profile: any
  company: any
  preferences: any
  metadata: any
  createdAt: Date
  updatedAt: Date
}

export class GetUserSettingsResponseDto {
  id: string
  profile?: UserProfile
  company?: CompanyInfo
  preferences: UserPreferences
  metadata?: Record<string, unknown>
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
