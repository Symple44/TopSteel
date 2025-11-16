import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../../core/database/prisma/prisma.service'
import type { UserSettings } from '@prisma/client'
import type { Prisma } from '@prisma/client'

/**
 * UserSettingsPrismaService - Phase 2.1
 *
 * Service pour gestion des préférences utilisateur avec Prisma
 *
 * Schema UserSettings utilise Json pour:
 * - profile: données profil utilisateur
 * - company: préférences entreprise
 * - preferences: préférences générales (thème, langue, notifications, etc.)
 */
@Injectable()
export class UserSettingsPrismaService {
  private readonly logger = new Logger(UserSettingsPrismaService.name)

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Créer les settings par défaut pour un utilisateur
   */
  async createDefaultSettings(userId: string): Promise<UserSettings> {
    this.logger.log(`Creating default settings for user: ${userId}`)

    try {
      const defaultPreferences = {
        theme: 'light',
        language: 'fr',
        timezone: 'Europe/Paris',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h',
        notifications: {
          enable: true,
          email: true,
          sms: false,
          push: true,
        },
      }

      const settings = await this.prisma.userSettings.create({
        data: {
          userId,
          profile: {},
          company: {},
          preferences: defaultPreferences as Prisma.InputJsonValue,
        },
      })

      this.logger.log(`Default settings created for user: ${userId}`)
      return settings
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error creating default settings: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer les settings d'un utilisateur
   */
  async getUserSettings(userId: string): Promise<UserSettings | null> {
    this.logger.debug(`Getting settings for user: ${userId}`)

    try {
      return await this.prisma.userSettings.findUnique({
        where: { userId },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting user settings: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer ou créer les settings d'un utilisateur
   */
  async getOrCreateUserSettings(userId: string): Promise<UserSettings> {
    this.logger.debug(`Getting or creating settings for user: ${userId}`)

    let settings = await this.getUserSettings(userId)

    if (!settings) {
      settings = await this.createDefaultSettings(userId)
    }

    return settings
  }

  /**
   * Mettre à jour les settings d'un utilisateur
   */
  async updateUserSettings(
    userId: string,
    data: {
      profile?: Prisma.InputJsonValue
      company?: Prisma.InputJsonValue
      preferences?: Prisma.InputJsonValue
    }
  ): Promise<UserSettings> {
    this.logger.log(`Updating settings for user: ${userId}`)

    try {
      const settings = await this.prisma.userSettings.update({
        where: { userId },
        data,
      })

      this.logger.log(`Settings updated for user: ${userId}`)
      return settings
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error updating settings: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Mettre à jour uniquement le profil
   */
  async updateProfile(userId: string, profile: Record<string, any>): Promise<UserSettings> {
    this.logger.log(`Updating profile for user: ${userId}`)
    return this.updateUserSettings(userId, { profile: profile as Prisma.InputJsonValue })
  }

  /**
   * Mettre à jour uniquement les préférences entreprise
   */
  async updateCompany(userId: string, company: Record<string, any>): Promise<UserSettings> {
    this.logger.log(`Updating company settings for user: ${userId}`)
    return this.updateUserSettings(userId, { company: company as Prisma.InputJsonValue })
  }

  /**
   * Mettre à jour uniquement les préférences
   */
  async updatePreferences(userId: string, preferences: Record<string, any>): Promise<UserSettings> {
    this.logger.log(`Updating preferences for user: ${userId}`)
    return this.updateUserSettings(userId, { preferences: preferences as Prisma.InputJsonValue })
  }

  /**
   * Mettre à jour une préférence spécifique (helper)
   */
  async updatePreference(
    userId: string,
    key: string,
    value: any
  ): Promise<UserSettings> {
    this.logger.log(`Updating preference ${key} for user: ${userId}`)

    const settings = await this.getUserSettings(userId)
    if (!settings) {
      throw new Error(`Settings not found for user: ${userId}`)
    }

    const currentPreferences = (settings.preferences || {}) as Record<string, any>
    const updatedPreferences = {
      ...currentPreferences,
      [key]: value,
    }

    return this.updatePreferences(userId, updatedPreferences)
  }

  /**
   * Supprimer les settings d'un utilisateur
   */
  async deleteUserSettings(userId: string): Promise<void> {
    this.logger.log(`Deleting settings for user: ${userId}`)

    try {
      await this.prisma.userSettings.delete({
        where: { userId },
      })

      this.logger.log(`Settings deleted for user: ${userId}`)
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error deleting settings: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Réinitialiser les settings aux valeurs par défaut
   */
  async resetToDefaults(userId: string): Promise<UserSettings> {
    this.logger.log(`Resetting settings to defaults for user: ${userId}`)

    try {
      // Supprimer les settings existants
      await this.deleteUserSettings(userId)

      // Créer nouveaux settings par défaut
      return await this.createDefaultSettings(userId)
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error resetting settings: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Helpers pour accéder aux préférences communes
   */
  async getTheme(userId: string): Promise<string | null> {
    const settings = await this.getUserSettings(userId)
    if (!settings || !settings.preferences) return null

    const prefs = settings.preferences as Record<string, any>
    return prefs.theme || null
  }

  async getLanguage(userId: string): Promise<string | null> {
    const settings = await this.getUserSettings(userId)
    if (!settings || !settings.preferences) return null

    const prefs = settings.preferences as Record<string, any>
    return prefs.language || null
  }

  async getTimezone(userId: string): Promise<string | null> {
    const settings = await this.getUserSettings(userId)
    if (!settings || !settings.preferences) return null

    const prefs = settings.preferences as Record<string, any>
    return prefs.timezone || null
  }
}
