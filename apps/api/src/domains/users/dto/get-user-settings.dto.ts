import type {
  CompanyInfo,
  UserPreferences,
  UserProfile,
  UserSettings,
} from '../entities/user-settings.entity'

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
