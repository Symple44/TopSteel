import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../../core/database/prisma/prisma.service'
import type { NotificationSettings, Prisma } from '@prisma/client'

/**
 * NotificationSettingsPrismaService - Phase 2.5
 *
 * Service pour gestion des paramètres de notification utilisateur avec Prisma
 *
 * NotificationSettings = Préférences de notification par utilisateur
 * Permet aux utilisateurs de contrôler quelles notifications ils reçoivent
 *
 * Fonctionnalités:
 * - CRUD paramètres de notification
 * - Catégories actives/désactivées (Json)
 * - Priorités actives/désactivées (Json)
 * - Horaires de réception (schedules Json)
 * - Un seul enregistrement par utilisateur (unique userId)
 */
@Injectable()
export class NotificationSettingsPrismaService {
  private readonly logger = new Logger(NotificationSettingsPrismaService.name)

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Créer des paramètres de notification
   */
  async createNotificationSettings(data: {
    userId: string
    categories?: Record<string, any>
    priorities?: Record<string, any>
    schedules?: Record<string, any>
  }): Promise<NotificationSettings> {
    this.logger.log(`Creating notification settings for user: ${data.userId}`)

    try {
      const settings = await this.prisma.notificationSettings.create({
        data: {
          userId: data.userId,
          categories: data.categories ? (data.categories as Prisma.InputJsonValue) : undefined,
          priorities: data.priorities ? (data.priorities as Prisma.InputJsonValue) : undefined,
          schedules: data.schedules ? (data.schedules as Prisma.InputJsonValue) : undefined,
        },
      })

      this.logger.log(`Notification settings created for user: ${data.userId}`)
      return settings
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error creating notification settings: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Créer des paramètres par défaut
   */
  async createDefaultSettings(userId: string): Promise<NotificationSettings> {
    this.logger.log(`Creating default notification settings for user: ${userId}`)

    const defaultCategories = {
      system: true,
      security: true,
      updates: true,
      marketing: false,
      social: true,
    }

    const defaultPriorities = {
      urgent: true,
      high: true,
      medium: true,
      low: false,
    }

    const defaultSchedules = {
      enabled: false,
      startTime: '09:00',
      endTime: '18:00',
      daysOfWeek: [1, 2, 3, 4, 5], // Monday to Friday
      timezone: 'UTC',
    }

    return this.createNotificationSettings({
      userId,
      categories: defaultCategories,
      priorities: defaultPriorities,
      schedules: defaultSchedules,
    })
  }

  /**
   * Récupérer les paramètres d'un utilisateur
   */
  async getNotificationSettings(userId: string): Promise<NotificationSettings | null> {
    this.logger.debug(`Getting notification settings for user: ${userId}`)

    try {
      return await this.prisma.notificationSettings.findUnique({
        where: { userId },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting notification settings: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer ou créer les paramètres d'un utilisateur
   */
  async getOrCreateNotificationSettings(userId: string): Promise<NotificationSettings> {
    this.logger.debug(`Getting or creating notification settings for user: ${userId}`)

    let settings = await this.getNotificationSettings(userId)

    if (!settings) {
      settings = await this.createDefaultSettings(userId)
    }

    return settings
  }

  /**
   * Mettre à jour les paramètres
   */
  async updateNotificationSettings(
    userId: string,
    data: {
      categories?: Record<string, any>
      priorities?: Record<string, any>
      schedules?: Record<string, any>
    }
  ): Promise<NotificationSettings> {
    this.logger.log(`Updating notification settings for user: ${userId}`)

    try {
      const updateData: any = {}

      if (data.categories !== undefined) updateData.categories = data.categories as Prisma.InputJsonValue
      if (data.priorities !== undefined) updateData.priorities = data.priorities as Prisma.InputJsonValue
      if (data.schedules !== undefined) updateData.schedules = data.schedules as Prisma.InputJsonValue

      const settings = await this.prisma.notificationSettings.update({
        where: { userId },
        data: updateData,
      })

      this.logger.log(`Notification settings updated for user: ${userId}`)
      return settings
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error updating notification settings: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Mettre à jour les catégories
   */
  async updateCategories(userId: string, categories: Record<string, any>): Promise<NotificationSettings> {
    this.logger.log(`Updating categories for user: ${userId}`)

    return this.updateNotificationSettings(userId, { categories })
  }

  /**
   * Activer/désactiver une catégorie
   */
  async toggleCategory(userId: string, category: string, enabled: boolean): Promise<NotificationSettings> {
    this.logger.log(`Toggling category ${category} for user ${userId}: ${enabled}`)

    const settings = await this.getOrCreateNotificationSettings(userId)
    const categories = (settings.categories as Record<string, any>) || {}
    categories[category] = enabled

    return this.updateCategories(userId, categories)
  }

  /**
   * Mettre à jour les priorités
   */
  async updatePriorities(userId: string, priorities: Record<string, any>): Promise<NotificationSettings> {
    this.logger.log(`Updating priorities for user: ${userId}`)

    return this.updateNotificationSettings(userId, { priorities })
  }

  /**
   * Activer/désactiver une priorité
   */
  async togglePriority(userId: string, priority: string, enabled: boolean): Promise<NotificationSettings> {
    this.logger.log(`Toggling priority ${priority} for user ${userId}: ${enabled}`)

    const settings = await this.getOrCreateNotificationSettings(userId)
    const priorities = (settings.priorities as Record<string, any>) || {}
    priorities[priority] = enabled

    return this.updatePriorities(userId, priorities)
  }

  /**
   * Mettre à jour les horaires
   */
  async updateSchedules(userId: string, schedules: Record<string, any>): Promise<NotificationSettings> {
    this.logger.log(`Updating schedules for user: ${userId}`)

    return this.updateNotificationSettings(userId, { schedules })
  }

  /**
   * Activer/désactiver le mode horaire
   */
  async toggleScheduleMode(userId: string, enabled: boolean): Promise<NotificationSettings> {
    this.logger.log(`Toggling schedule mode for user ${userId}: ${enabled}`)

    const settings = await this.getOrCreateNotificationSettings(userId)
    const schedules = (settings.schedules as Record<string, any>) || {}
    schedules.enabled = enabled

    return this.updateSchedules(userId, schedules)
  }

  /**
   * Fusionner les catégories (merge)
   */
  async mergeCategories(userId: string, partialCategories: Record<string, any>): Promise<NotificationSettings> {
    this.logger.log(`Merging categories for user: ${userId}`)

    const settings = await this.getOrCreateNotificationSettings(userId)
    const currentCategories = (settings.categories as Record<string, any>) || {}
    const mergedCategories = {
      ...currentCategories,
      ...partialCategories,
    }

    return this.updateCategories(userId, mergedCategories)
  }

  /**
   * Fusionner les priorités (merge)
   */
  async mergePriorities(userId: string, partialPriorities: Record<string, any>): Promise<NotificationSettings> {
    this.logger.log(`Merging priorities for user: ${userId}`)

    const settings = await this.getOrCreateNotificationSettings(userId)
    const currentPriorities = (settings.priorities as Record<string, any>) || {}
    const mergedPriorities = {
      ...currentPriorities,
      ...partialPriorities,
    }

    return this.updatePriorities(userId, mergedPriorities)
  }

  /**
   * Fusionner les horaires (merge)
   */
  async mergeSchedules(userId: string, partialSchedules: Record<string, any>): Promise<NotificationSettings> {
    this.logger.log(`Merging schedules for user: ${userId}`)

    const settings = await this.getOrCreateNotificationSettings(userId)
    const currentSchedules = (settings.schedules as Record<string, any>) || {}
    const mergedSchedules = {
      ...currentSchedules,
      ...partialSchedules,
    }

    return this.updateSchedules(userId, mergedSchedules)
  }

  /**
   * Réinitialiser aux paramètres par défaut
   */
  async resetToDefaults(userId: string): Promise<NotificationSettings> {
    this.logger.log(`Resetting notification settings to defaults for user: ${userId}`)

    try {
      // Supprimer les paramètres existants
      await this.deleteNotificationSettings(userId)

      // Créer les paramètres par défaut
      return await this.createDefaultSettings(userId)
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error resetting notification settings: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Supprimer les paramètres
   */
  async deleteNotificationSettings(userId: string): Promise<void> {
    this.logger.log(`Deleting notification settings for user: ${userId}`)

    try {
      await this.prisma.notificationSettings.delete({
        where: { userId },
      })

      this.logger.log(`Notification settings deleted for user: ${userId}`)
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error deleting notification settings: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Vérifier si une catégorie est activée
   */
  async isCategoryEnabled(userId: string, category: string): Promise<boolean> {
    const settings = await this.getNotificationSettings(userId)
    if (!settings || !settings.categories) return true // Activé par défaut si pas de paramètres

    const categories = settings.categories as Record<string, any>
    return categories[category] !== false
  }

  /**
   * Vérifier si une priorité est activée
   */
  async isPriorityEnabled(userId: string, priority: string): Promise<boolean> {
    const settings = await this.getNotificationSettings(userId)
    if (!settings || !settings.priorities) return true // Activé par défaut si pas de paramètres

    const priorities = settings.priorities as Record<string, any>
    return priorities[priority] !== false
  }

  /**
   * Vérifier si l'utilisateur peut recevoir une notification maintenant
   */
  canReceiveNotificationNow(settings: NotificationSettings): boolean {
    if (!settings.schedules) return true

    const schedules = settings.schedules as Record<string, any>
    if (!schedules.enabled) return true

    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    const currentDay = now.getDay()

    // Vérifier le jour de la semaine
    if (schedules.daysOfWeek && Array.isArray(schedules.daysOfWeek)) {
      if (!schedules.daysOfWeek.includes(currentDay)) {
        return false
      }
    }

    // Vérifier l'heure
    if (schedules.startTime && schedules.endTime) {
      const [startHour, startMinute] = schedules.startTime.split(':').map(Number)
      const [endHour, endMinute] = schedules.endTime.split(':').map(Number)

      const currentTimeInMinutes = currentHour * 60 + currentMinute
      const startTimeInMinutes = startHour * 60 + startMinute
      const endTimeInMinutes = endHour * 60 + endMinute

      if (currentTimeInMinutes < startTimeInMinutes || currentTimeInMinutes > endTimeInMinutes) {
        return false
      }
    }

    return true
  }

  /**
   * Compter les utilisateurs avec paramètres personnalisés
   */
  async countUsersWithSettings(): Promise<number> {
    this.logger.debug('Counting users with notification settings')

    try {
      return await this.prisma.notificationSettings.count()
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error counting users with settings: ${err.message}`, err.stack)
      throw error
    }
  }
}
