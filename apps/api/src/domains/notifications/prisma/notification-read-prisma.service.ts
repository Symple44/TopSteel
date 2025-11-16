import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../../core/database/prisma/prisma.service'
import type { NotificationRead } from '@prisma/client'

/**
 * NotificationReadPrismaService - Phase 2.5
 *
 * Service pour gestion du tracking de lecture des notifications avec Prisma
 *
 * NotificationRead = Enregistrement de lecture d'une notification par un utilisateur
 * Permet de tracker qui a lu quoi et quand
 *
 * Fonctionnalités:
 * - CRUD tracking de lecture
 * - Unique constraint (notificationId + userId)
 * - Timestamp de lecture
 * - Statistiques de lecture
 */
@Injectable()
export class NotificationReadPrismaService {
  private readonly logger = new Logger(NotificationReadPrismaService.name)

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Enregistrer une lecture de notification
   */
  async createNotificationRead(data: {
    notificationId: string
    userId: string
  }): Promise<NotificationRead> {
    this.logger.log(`Recording notification read: notification=${data.notificationId}, user=${data.userId}`)

    try {
      const read = await this.prisma.notificationRead.create({
        data: {
          notificationId: data.notificationId,
          userId: data.userId,
        },
      })

      this.logger.log(`Notification read recorded: ${read.id}`)
      return read
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error recording notification read: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Enregistrer ou mettre à jour une lecture (upsert)
   */
  async upsertNotificationRead(data: {
    notificationId: string
    userId: string
  }): Promise<NotificationRead> {
    this.logger.log(`Upserting notification read: notification=${data.notificationId}, user=${data.userId}`)

    try {
      const read = await this.prisma.notificationRead.upsert({
        where: {
          notificationId_userId: {
            notificationId: data.notificationId,
            userId: data.userId,
          },
        },
        create: {
          notificationId: data.notificationId,
          userId: data.userId,
        },
        update: {
          readAt: new Date(),
        },
      })

      this.logger.log(`Notification read upserted: ${read.id}`)
      return read
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error upserting notification read: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer une lecture par ID
   */
  async getNotificationReadById(id: string): Promise<NotificationRead | null> {
    this.logger.debug(`Getting notification read: ${id}`)

    try {
      return await this.prisma.notificationRead.findUnique({
        where: { id },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting notification read: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer une lecture par notification et utilisateur
   */
  async getNotificationRead(notificationId: string, userId: string): Promise<NotificationRead | null> {
    this.logger.debug(`Getting notification read: notification=${notificationId}, user=${userId}`)

    try {
      return await this.prisma.notificationRead.findUnique({
        where: {
          notificationId_userId: {
            notificationId,
            userId,
          },
        },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting notification read: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer toutes les lectures d'une notification
   */
  async getNotificationReads(notificationId: string): Promise<NotificationRead[]> {
    this.logger.debug(`Getting all reads for notification: ${notificationId}`)

    try {
      return await this.prisma.notificationRead.findMany({
        where: { notificationId },
        orderBy: { readAt: 'desc' },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting notification reads: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer toutes les lectures d'un utilisateur
   */
  async getUserNotificationReads(userId: string): Promise<NotificationRead[]> {
    this.logger.debug(`Getting all reads for user: ${userId}`)

    try {
      return await this.prisma.notificationRead.findMany({
        where: { userId },
        orderBy: { readAt: 'desc' },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting user notification reads: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer les lectures avec relations
   */
  async getReadsWithNotifications(userId: string) {
    this.logger.debug(`Getting reads with notifications for user: ${userId}`)

    try {
      return await this.prisma.notificationRead.findMany({
        where: { userId },
        include: {
          notification: {
            select: {
              id: true,
              title: true,
              message: true,
              type: true,
              category: true,
              priority: true,
              createdAt: true,
            },
          },
        },
        orderBy: { readAt: 'desc' },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting reads with notifications: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Vérifier si une notification a été lue par un utilisateur
   */
  async hasUserReadNotification(notificationId: string, userId: string): Promise<boolean> {
    this.logger.debug(`Checking if user read notification: notification=${notificationId}, user=${userId}`)

    try {
      const read = await this.getNotificationRead(notificationId, userId)
      return read !== null
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error checking if notification was read: ${err.message}`, err.stack)
      return false
    }
  }

  /**
   * Supprimer une lecture
   */
  async deleteNotificationRead(id: string): Promise<void> {
    this.logger.log(`Deleting notification read: ${id}`)

    try {
      await this.prisma.notificationRead.delete({
        where: { id },
      })

      this.logger.log(`Notification read deleted: ${id}`)
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error deleting notification read: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Supprimer toutes les lectures d'une notification
   */
  async deleteNotificationReads(notificationId: string): Promise<number> {
    this.logger.log(`Deleting all reads for notification: ${notificationId}`)

    try {
      const result = await this.prisma.notificationRead.deleteMany({
        where: { notificationId },
      })

      this.logger.log(`${result.count} notification reads deleted`)
      return result.count
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error deleting notification reads: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Supprimer les anciennes lectures
   */
  async deleteOldReads(daysOld = 90): Promise<number> {
    this.logger.log(`Deleting reads older than ${daysOld} days`)

    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysOld)

      const result = await this.prisma.notificationRead.deleteMany({
        where: {
          readAt: {
            lt: cutoffDate,
          },
        },
      })

      this.logger.log(`${result.count} old reads deleted`)
      return result.count
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error deleting old reads: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Compter les lectures d'une notification
   */
  async countNotificationReads(notificationId: string): Promise<number> {
    this.logger.debug(`Counting reads for notification: ${notificationId}`)

    try {
      return await this.prisma.notificationRead.count({
        where: { notificationId },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error counting notification reads: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Compter les lectures d'un utilisateur
   */
  async countUserReads(userId: string): Promise<number> {
    this.logger.debug(`Counting reads for user: ${userId}`)

    try {
      return await this.prisma.notificationRead.count({
        where: { userId },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error counting user reads: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Obtenir les utilisateurs qui ont lu une notification
   */
  async getUsersWhoReadNotification(notificationId: string): Promise<string[]> {
    this.logger.debug(`Getting users who read notification: ${notificationId}`)

    try {
      const reads = await this.prisma.notificationRead.findMany({
        where: { notificationId },
        select: { userId: true },
        distinct: ['userId'],
      })

      return reads.map((r) => r.userId)
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting users who read notification: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Calculer le taux de lecture
   */
  async calculateReadRate(notificationId: string, totalUsers: number): Promise<number> {
    this.logger.debug(`Calculating read rate for notification: ${notificationId}`)

    try {
      const readCount = await this.countNotificationReads(notificationId)
      if (totalUsers === 0) return 0
      return (readCount / totalUsers) * 100
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error calculating read rate: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Obtenir les statistiques de lecture
   */
  async getReadStats(notificationId: string): Promise<{
    totalReads: number
    uniqueUsers: number
    firstRead: Date | null
    lastRead: Date | null
  }> {
    this.logger.debug(`Getting read statistics for notification: ${notificationId}`)

    try {
      const reads = await this.prisma.notificationRead.findMany({
        where: { notificationId },
        select: {
          userId: true,
          readAt: true,
        },
      })

      const totalReads = reads.length
      const uniqueUsers = new Set(reads.map((r) => r.userId)).size
      const firstRead = reads.length > 0 ? reads.reduce((min, r) => (r.readAt < min ? r.readAt : min), reads[0].readAt) : null
      const lastRead = reads.length > 0 ? reads.reduce((max, r) => (r.readAt > max ? r.readAt : max), reads[0].readAt) : null

      return {
        totalReads,
        uniqueUsers,
        firstRead,
        lastRead,
      }
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting read statistics: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer les lectures récentes
   */
  async getRecentReads(limit = 50): Promise<NotificationRead[]> {
    this.logger.debug(`Getting recent reads (limit: ${limit})`)

    try {
      return await this.prisma.notificationRead.findMany({
        orderBy: { readAt: 'desc' },
        take: limit,
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting recent reads: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer les lectures d'une période
   */
  async getReadsByPeriod(startDate: Date, endDate: Date): Promise<NotificationRead[]> {
    this.logger.debug(`Getting reads for period: ${startDate} to ${endDate}`)

    try {
      return await this.prisma.notificationRead.findMany({
        where: {
          readAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { readAt: 'desc' },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting reads by period: ${err.message}`, err.stack)
      throw error
    }
  }
}
