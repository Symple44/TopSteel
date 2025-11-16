import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../../core/database/prisma/prisma.service'
import type { NotificationRule, Prisma } from '@prisma/client'

/**
 * NotificationRulePrismaService - Phase 2.5
 *
 * Service pour gestion des règles de notification avec Prisma
 *
 * NotificationRule = Règle automatique pour créer des notifications
 * Permet de définir des triggers et conditions pour notifications automatiques
 *
 * Fonctionnalités:
 * - CRUD règles de notification
 * - Triggers configurables (Json)
 * - Conditions de déclenchement (Json)
 * - Actions à exécuter (Json)
 * - Configuration notification (Json)
 * - Activation/désactivation
 * - Compteur de déclenchements
 * - Relations avec executions
 */
@Injectable()
export class NotificationRulePrismaService {
  private readonly logger = new Logger(NotificationRulePrismaService.name)

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Créer une règle de notification
   */
  async createNotificationRule(data: {
    name: string
    description?: string
    type: string
    enabled?: boolean
    isActive?: boolean
    trigger: Record<string, any>
    conditions?: Record<string, any>
    actions?: Record<string, any>
    notification?: Record<string, any>
  }): Promise<NotificationRule> {
    this.logger.log(`Creating notification rule: ${data.name}`)

    try {
      const rule = await this.prisma.notificationRule.create({
        data: {
          name: data.name,
          description: data.description || null,
          type: data.type,
          enabled: data.enabled !== undefined ? data.enabled : true,
          isActive: data.isActive !== undefined ? data.isActive : true,
          trigger: data.trigger as Prisma.InputJsonValue,
          conditions: data.conditions ? (data.conditions as Prisma.InputJsonValue) : undefined,
          actions: data.actions ? (data.actions as Prisma.InputJsonValue) : undefined,
          notification: data.notification ? (data.notification as Prisma.InputJsonValue) : undefined,
        },
      })

      this.logger.log(`Notification rule created: ${rule.id}`)
      return rule
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error creating notification rule: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer une règle par ID
   */
  async getNotificationRuleById(id: string): Promise<NotificationRule | null> {
    this.logger.debug(`Getting notification rule: ${id}`)

    try {
      return await this.prisma.notificationRule.findUnique({
        where: { id },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting notification rule: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer une règle avec relations
   */
  async getNotificationRuleWithRelations(id: string) {
    this.logger.debug(`Getting notification rule with relations: ${id}`)

    try {
      return await this.prisma.notificationRule.findUnique({
        where: { id },
        include: {
          executions: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting notification rule with relations: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Lister toutes les règles
   */
  async getAllNotificationRules(includeInactive = false): Promise<NotificationRule[]> {
    this.logger.debug('Getting all notification rules')

    try {
      return await this.prisma.notificationRule.findMany({
        where: includeInactive ? {} : { isActive: true },
        orderBy: { name: 'asc' },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting all notification rules: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer les règles actives et activées
   */
  async getActiveEnabledRules(): Promise<NotificationRule[]> {
    this.logger.debug('Getting active and enabled notification rules')

    try {
      return await this.prisma.notificationRule.findMany({
        where: {
          isActive: true,
          enabled: true,
        },
        orderBy: { name: 'asc' },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting active enabled rules: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer les règles par type
   */
  async getRulesByType(type: string, includeInactive = false): Promise<NotificationRule[]> {
    this.logger.debug(`Getting notification rules by type: ${type}`)

    try {
      return await this.prisma.notificationRule.findMany({
        where: {
          type,
          ...(includeInactive ? {} : { isActive: true }),
        },
        orderBy: { name: 'asc' },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting notification rules by type: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Mettre à jour une règle
   */
  async updateNotificationRule(
    id: string,
    data: {
      name?: string
      description?: string
      type?: string
      enabled?: boolean
      isActive?: boolean
      trigger?: Record<string, any>
      conditions?: Record<string, any>
      actions?: Record<string, any>
      notification?: Record<string, any>
    }
  ): Promise<NotificationRule> {
    this.logger.log(`Updating notification rule: ${id}`)

    try {
      const updateData: any = {}

      if (data.name !== undefined) updateData.name = data.name
      if (data.description !== undefined) updateData.description = data.description
      if (data.type !== undefined) updateData.type = data.type
      if (data.enabled !== undefined) updateData.enabled = data.enabled
      if (data.isActive !== undefined) updateData.isActive = data.isActive
      if (data.trigger !== undefined) updateData.trigger = data.trigger as Prisma.InputJsonValue
      if (data.conditions !== undefined) updateData.conditions = data.conditions as Prisma.InputJsonValue
      if (data.actions !== undefined) updateData.actions = data.actions as Prisma.InputJsonValue
      if (data.notification !== undefined) updateData.notification = data.notification as Prisma.InputJsonValue

      const rule = await this.prisma.notificationRule.update({
        where: { id },
        data: updateData,
      })

      this.logger.log(`Notification rule updated: ${id}`)
      return rule
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error updating notification rule: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Activer/désactiver une règle
   */
  async setEnabled(id: string, enabled: boolean): Promise<NotificationRule> {
    this.logger.log(`Setting notification rule enabled: ${id} -> ${enabled}`)

    return this.updateNotificationRule(id, { enabled })
  }

  /**
   * Activer/désactiver le statut actif
   */
  async setActive(id: string, isActive: boolean): Promise<NotificationRule> {
    this.logger.log(`Setting notification rule active: ${id} -> ${isActive}`)

    return this.updateNotificationRule(id, { isActive })
  }

  /**
   * Incrémenter le compteur de déclenchements
   */
  async incrementTriggerCount(id: string): Promise<NotificationRule> {
    this.logger.log(`Incrementing trigger count for notification rule: ${id}`)

    try {
      const rule = await this.prisma.notificationRule.update({
        where: { id },
        data: {
          triggerCount: { increment: 1 },
          lastTriggered: new Date().toISOString(),
        },
      })

      this.logger.log(`Trigger count incremented for notification rule: ${id}`)
      return rule
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error incrementing trigger count: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Réinitialiser le compteur de déclenchements
   */
  async resetTriggerCount(id: string): Promise<NotificationRule> {
    this.logger.log(`Resetting trigger count for notification rule: ${id}`)

    try {
      const rule = await this.prisma.notificationRule.update({
        where: { id },
        data: {
          triggerCount: 0,
          lastTriggered: null,
        },
      })

      this.logger.log(`Trigger count reset for notification rule: ${id}`)
      return rule
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error resetting trigger count: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Supprimer une règle
   */
  async deleteNotificationRule(id: string): Promise<void> {
    this.logger.log(`Deleting notification rule: ${id}`)

    try {
      await this.prisma.notificationRule.delete({
        where: { id },
      })

      this.logger.log(`Notification rule deleted: ${id}`)
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error deleting notification rule: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Rechercher des règles
   */
  async searchNotificationRules(searchTerm: string): Promise<NotificationRule[]> {
    this.logger.debug(`Searching notification rules: ${searchTerm}`)

    try {
      return await this.prisma.notificationRule.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
          ],
          isActive: true,
        },
        orderBy: { name: 'asc' },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error searching notification rules: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Compter les règles
   */
  async countNotificationRules(includeInactive = false): Promise<number> {
    this.logger.debug('Counting notification rules')

    try {
      return await this.prisma.notificationRule.count({
        where: includeInactive ? {} : { isActive: true },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error counting notification rules: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Compter les règles activées
   */
  async countEnabledRules(): Promise<number> {
    this.logger.debug('Counting enabled notification rules')

    try {
      return await this.prisma.notificationRule.count({
        where: {
          enabled: true,
          isActive: true,
        },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error counting enabled rules: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Compter par type
   */
  async countByType(type: string): Promise<number> {
    this.logger.debug(`Counting notification rules by type: ${type}`)

    try {
      return await this.prisma.notificationRule.count({
        where: {
          type,
          isActive: true,
        },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error counting notification rules by type: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer les règles les plus déclenchées
   */
  async getMostTriggeredRules(limit = 10): Promise<NotificationRule[]> {
    this.logger.debug(`Getting most triggered rules (limit: ${limit})`)

    try {
      return await this.prisma.notificationRule.findMany({
        where: { isActive: true },
        orderBy: { triggerCount: 'desc' },
        take: limit,
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting most triggered rules: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer les statistiques de règles
   */
  async getRuleStats(): Promise<{
    total: number
    enabled: number
    disabled: number
    totalTriggers: number
  }> {
    this.logger.debug('Getting rule statistics')

    try {
      const total = await this.prisma.notificationRule.count({
        where: { isActive: true },
      })

      const enabled = await this.prisma.notificationRule.count({
        where: {
          isActive: true,
          enabled: true,
        },
      })

      const disabled = total - enabled

      const rules = await this.prisma.notificationRule.findMany({
        where: { isActive: true },
        select: { triggerCount: true },
      })

      const totalTriggers = rules.reduce((sum, rule) => sum + rule.triggerCount, 0)

      return {
        total,
        enabled,
        disabled,
        totalTriggers,
      }
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting rule statistics: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer tous les types de règles
   */
  async getAllRuleTypes(): Promise<string[]> {
    this.logger.debug('Getting all rule types')

    try {
      const rules = await this.prisma.notificationRule.findMany({
        select: { type: true },
        distinct: ['type'],
        orderBy: { type: 'asc' },
      })

      return rules.map((r) => r.type)
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting all rule types: ${err.message}`, err.stack)
      throw error
    }
  }
}
