import { BaseApiClient } from '../core/base-api-client'

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
  name: string
  address: string
  city: string
  postalCode: string
  country: string
}

export interface UserProfile {
  firstName: string
  lastName: string
  email: string
  phone?: string
  position?: string
  department?: string
  avatar?: string
}

export interface UserSettings {
  id: string
  profile?: UserProfile
  company?: CompanyInfo
  preferences: UserPreferences
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface UpdateUserSettingsDto {
  profile?: Partial<UserProfile>
  company?: Partial<CompanyInfo>
  preferences?: Partial<UserPreferences>
  metadata?: Record<string, any>
}

export class UserSettingsApiClient extends BaseApiClient {
  private readonly endpoint = '/users'

  /**
   * Récupérer les paramètres de l'utilisateur connecté
   */
  async getMySettings(): Promise<UserSettings> {
    const response = await this.http.get<UserSettings>(`${this.endpoint}/settings/me`)
    return response.data
  }

  /**
   * Mettre à jour les paramètres de l'utilisateur connecté
   */
  async updateMySettings(settings: UpdateUserSettingsDto): Promise<UserSettings> {
    const response = await this.http.patch<UserSettings>(`${this.endpoint}/settings/me`, settings)
    return response.data
  }

  /**
   * Récupérer les paramètres d'un utilisateur (Admin/Manager uniquement)
   */
  async getUserSettings(userId: string): Promise<UserSettings> {
    const response = await this.http.get<UserSettings>(`${this.endpoint}/${userId}/settings`)
    return response.data
  }

  /**
   * Mettre à jour les paramètres d'un utilisateur (Admin/Manager uniquement)
   */
  async updateUserSettings(userId: string, settings: UpdateUserSettingsDto): Promise<UserSettings> {
    const response = await this.http.patch<UserSettings>(`${this.endpoint}/${userId}/settings`, settings)
    return response.data
  }

  /**
   * Mettre à jour seulement les préférences
   */
  async updatePreferences(preferences: Partial<UserPreferences>): Promise<UserSettings> {
    return this.updateMySettings({ preferences })
  }

  /**
   * Mettre à jour seulement le profil
   */
  async updateProfile(profile: Partial<UserProfile>): Promise<UserSettings> {
    return this.updateMySettings({ profile })
  }

  /**
   * Mettre à jour seulement les informations de l'entreprise
   */
  async updateCompany(company: Partial<CompanyInfo>): Promise<UserSettings> {
    return this.updateMySettings({ company })
  }

  /**
   * Mettre à jour seulement les paramètres de notification
   */
  async updateNotifications(notifications: Partial<NotificationSettings>): Promise<UserSettings> {
    return this.updateMySettings({ 
      preferences: { notifications: notifications as any } 
    })
  }
}