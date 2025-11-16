import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../../core/database/prisma/prisma.service'
import type { Notification, Prisma } from '@prisma/client'

/**
 * NotificationPrismaService - Phase 2.5
 *
 * Service pour gestion des notifications utilisateur avec Prisma
 *
 * Notification = Notification envoyée à un utilisateur
 * Stocke les messages, actions, et tracking de lecture
 *
 * Fonctionnalités:
 * - CRUD notifications
 * - Types et catégories
 * - Priorité (low/medium/high/urgent)
 * - Actions avec URL et label
 * - Données Json extensibles
 * - Tracking lecture (readAt)
 * - Expiration automatique
 * - Relations avec reads et executions
 */
@Injectable()
export class NotificationPrismaService {
  private readonly logger = new Logger(NotificationPrismaService.name)

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Créer une notification
   */
  async createNotification(data: {
    userId: string
    type: string
    title: string
    message: string
    category?: string
    priority?: string
    data?: Record<string, any>
    actionUrl?: string
    actionLabel?: string
    expiresAt?: Date
  }): Promise<Notification> {
    this.logger.log(`Creating notification for user ${data.userId}: ${data.title}`)

    try {
      const notification = await this.prisma.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          category: data.category || null,
          priority: data.priority || null,
          data: data.data ? (data.data as Prisma.InputJsonValue) : undefined,
          actionUrl: data.actionUrl || null,
          actionLabel: data.actionLabel || null,
          expiresAt: data.expiresAt || null,
        },
      })

      this.logger.log(`Notification created: ${notification.id}`)
      return notification
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error creating notification: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer une notification par ID
   */
  async getNotificationById(id: string): Promise<Notification | null> {
    this.logger.debug(`Getting notification: ${id}`)

    try {
      return await this.prisma.notification.findUnique({
        where: { id },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting notification: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer une notification avec relations
   */
  async getNotificationWithRelations(id: string) {
    this.logger.debug(`Getting notification with relations: ${id}`)

    try {
      return await this.prisma.notification.findUnique({
        where: { id },
        include: {
          reads: true,
          executions: {
            include: {
              rule: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                },
              },
            },
          },
        },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting notification with relations: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Lister les notifications d'un utilisateur
   */
  async getUserNotifications(userId: string, includeRead = false): Promise<Notification[]> {
    this.logger.debug(`Getting notifications for user: ${userId}`)

    try {
      return await this.prisma.notification.findMany({
        where: {
          userId,
          ...(includeRead ? {} : { readAt: null }),
        },
        orderBy: { createdAt: 'desc' },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting user notifications: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer les notifications non lues
   */
  async getUnreadNotifications(userId: string): Promise<Notification[]> {
    this.logger.debug(`Getting unread notifications for user: ${userId}`)

    return this.getUserNotifications(userId, false)
  }

  /**
   * Récupérer les notifications par type
   */
  async getNotificationsByType(userId: string, type: string): Promise<Notification[]> {
    this.logger.debug(`Getting notifications by type: ${type}`)

    try {
      return await this.prisma.notification.findMany({
        where: {
          userId,
          type,
        },
        orderBy: { createdAt: 'desc' },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting notifications by type: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer les notifications par catégorie
   */
  async getNotificationsByCategory(userId: string, category: string): Promise<Notification[]> {
    this.logger.debug(`Getting notifications by category: ${category}`)

    try {
      return await this.prisma.notification.findMany({
        where: {
          userId,
          category,
        },
        orderBy: { createdAt: 'desc' },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting notifications by category: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer les notifications par priorité
   */
  async getNotificationsByPriority(userId: string, priority: string): Promise<Notification[]> {
    this.logger.debug(`Getting notifications by priority: ${priority}`)

    try {
      return await this.prisma.notification.findMany({
        where: {
          userId,
          priority,
        },
        orderBy: { createdAt: 'desc' },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting notifications by priority: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer les notifications récentes
   */
  async getRecentNotifications(userId: string, limit = 10): Promise<Notification[]> {
    this.logger.debug(`Getting recent notifications for user: ${userId}`)

    try {
      return await this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting recent notifications: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Marquer une notification comme lue
   */
  async markAsRead(id: string): Promise<Notification> {
    this.logger.log(`Marking notification as read: ${id}`)

    try {
      const notification = await this.prisma.notification.update({
        where: { id },
        data: { readAt: new Date() },
      })

      this.logger.log(`Notification marked as read: ${id}`)
      return notification
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error marking notification as read: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Marquer plusieurs notifications comme lues
   */
  async markMultipleAsRead(ids: string[]): Promise<number> {
    this.logger.log(`Marking ${ids.length} notifications as read`)

    try {
      const result = await this.prisma.notification.updateMany({
        where: { id: { in: ids } },
        data: { readAt: new Date() },
      })

      this.logger.log(`${result.count} notifications marked as read`)
      return result.count
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error marking multiple notifications as read: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Marquer toutes les notifications d'un utilisateur comme lues
   */
  async markAllAsRead(userId: string): Promise<number> {
    this.logger.log(`Marking all notifications as read for user: ${userId}`)

    try {
      const result = await this.prisma.notification.updateMany({
        where: {
          userId,
          readAt: null,
        },
        data: { readAt: new Date() },
      })

      this.logger.log(`${result.count} notifications marked as read`)
      return result.count
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error marking all notifications as read: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Mettre à jour une notification
   */
  async updateNotification(
    id: string,
    data: {
      title?: string
      message?: string
      category?: string
      priority?: string
      data?: Record<string, any>
      actionUrl?: string
      actionLabel?: string
      expiresAt?: Date
    }
  ): Promise<Notification> {
    this.logger.log(`Updating notification: ${id}`)

    try {
      const updateData: any = {}

      if (data.title !== undefined) updateData.title = data.title
      if (data.message !== undefined) updateData.message = data.message
      if (data.category !== undefined) updateData.category = data.category
      if (data.priority !== undefined) updateData.priority = data.priority
      if (data.data !== undefined) updateData.data = data.data as Prisma.InputJsonValue
      if (data.actionUrl !== undefined) updateData.actionUrl = data.actionUrl
      if (data.actionLabel !== undefined) updateData.actionLabel = data.actionLabel
      if (data.expiresAt !== undefined) updateData.expiresAt = data.expiresAt

      const notification = await this.prisma.notification.update({
        where: { id },
        data: updateData,
      })

      this.logger.log(`Notification updated: ${id}`)
      return notification
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error updating notification: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Supprimer une notification
   */
  async deleteNotification(id: string): Promise<void> {
    this.logger.log(`Deleting notification: ${id}`)

    try {
      await this.prisma.notification.delete({
        where: { id },
      })

      this.logger.log(`Notification deleted: ${id}`)
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error deleting notification: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Supprimer les notifications expirées
   */
  async deleteExpiredNotifications(): Promise<number> {
    this.logger.log('Deleting expired notifications')

    try {
      const result = await this.prisma.notification.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      })

      this.logger.log(`${result.count} expired notifications deleted`)
      return result.count
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error deleting expired notifications: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Supprimer les anciennes notifications lues
   */
  async deleteOldReadNotifications(daysOld = 30): Promise<number> {
    this.logger.log(`Deleting read notifications older than ${daysOld} days`)

    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysOld)

      const result = await this.prisma.notification.deleteMany({
        where: {
          readAt: {
            lt: cutoffDate,
          },
        },
      })

      this.logger.log(`${result.count} old read notifications deleted`)
      return result.count
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error deleting old read notifications: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Compter les notifications non lues
   */
  async countUnreadNotifications(userId: string): Promise<number> {
    this.logger.debug(`Counting unread notifications for user: ${userId}`)

    try {
      return await this.prisma.notification.count({
        where: {
          userId,
          readAt: null,
        },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error counting unread notifications: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Compter par type
   */
  async countByType(userId: string, type: string): Promise<number> {
    this.logger.debug(`Counting notifications by type: ${type}`)

    try {
      return await this.prisma.notification.count({
        where: {
          userId,
          type,
        },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error counting notifications by type: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Compter par priorité
   */
  async countByPriority(userId: string, priority: string): Promise<number> {
    this.logger.debug(`Counting notifications by priority: ${priority}`)

    try {
      return await this.prisma.notification.count({
        where: {
          userId,
          priority,
        },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error counting notifications by priority: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Vérifier si une notification est lue
   */
  async isRead(id: string): Promise<boolean> {
    const notification = await this.getNotificationById(id)
    return notification !== null && notification.readAt !== null
  }

  /**
   * Vérifier si une notification est expirée
   */
  async isExpired(id: string): Promise<boolean> {
    const notification = await this.getNotificationById(id)
    if (!notification || !notification.expiresAt) return false
    return notification.expiresAt < new Date()
  }
}
