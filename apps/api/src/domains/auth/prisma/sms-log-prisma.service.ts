import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../../core/database/prisma/prisma.service'
import type { SmsLog } from '@prisma/client'

/**
 * SmsLogPrismaService - Phase 2.1
 *
 * Service pour gestion des logs SMS avec Prisma
 *
 * Fonctionnalités:
 * - Enregistrement des SMS envoyés
 * - Tracking du statut (sent, delivered, failed)
 * - Gestion des erreurs d'envoi
 * - Statistiques SMS
 */
@Injectable()
export class SmsLogPrismaService {
  private readonly logger = new Logger(SmsLogPrismaService.name)

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Créer un log SMS
   */
  async createSmsLog(data: {
    phoneNumber: string
    message: string
    status: string
    provider?: string
    sentAt?: Date
    errorMessage?: string
  }): Promise<SmsLog> {
    this.logger.log(`Creating SMS log for phone: ${data.phoneNumber}`)

    try {
      const smsLog = await this.prisma.smsLog.create({
        data: {
          phoneNumber: data.phoneNumber,
          message: data.message,
          status: data.status,
          provider: data.provider || null,
          sentAt: data.sentAt || null,
          errorMessage: data.errorMessage || null,
        },
      })

      this.logger.log(`SMS log created: ${smsLog.id}`)
      return smsLog
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error creating SMS log: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer un log SMS par ID
   */
  async getSmsLogById(id: string): Promise<SmsLog | null> {
    this.logger.debug(`Getting SMS log: ${id}`)

    try {
      return await this.prisma.smsLog.findUnique({
        where: { id },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting SMS log: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer les SMS par statut
   */
  async getSmsLogsByStatus(
    status: string,
    options?: {
      limit?: number
      offset?: number
    }
  ): Promise<SmsLog[]> {
    this.logger.debug(`Getting SMS logs with status: ${status}`)

    try {
      return await this.prisma.smsLog.findMany({
        where: { status },
        orderBy: { createdAt: 'desc' },
        take: options?.limit || 100,
        skip: options?.offset || 0,
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting SMS logs by status: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer les SMS par numéro de téléphone
   */
  async getSmsLogsByPhone(
    phoneNumber: string,
    options?: {
      limit?: number
      offset?: number
    }
  ): Promise<SmsLog[]> {
    this.logger.debug(`Getting SMS logs for phone: ${phoneNumber}`)

    try {
      return await this.prisma.smsLog.findMany({
        where: { phoneNumber },
        orderBy: { createdAt: 'desc' },
        take: options?.limit || 100,
        skip: options?.offset || 0,
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting SMS logs by phone: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Mettre à jour le statut d'un SMS
   */
  async updateSmsStatus(
    id: string,
    status: string,
    options?: {
      sentAt?: Date
      errorMessage?: string
    }
  ): Promise<SmsLog> {
    this.logger.log(`Updating SMS status: ${id} -> ${status}`)

    try {
      const updateData: any = { status }

      if (options?.sentAt) updateData.sentAt = options.sentAt
      if (options?.errorMessage) updateData.errorMessage = options.errorMessage

      const smsLog = await this.prisma.smsLog.update({
        where: { id },
        data: updateData,
      })

      this.logger.log(`SMS status updated: ${id}`)
      return smsLog
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error updating SMS status: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Marquer un SMS comme envoyé
   */
  async markAsSent(id: string): Promise<SmsLog> {
    return this.updateSmsStatus(id, 'sent', {
      sentAt: new Date(),
    })
  }

  /**
   * Marquer un SMS comme livré
   */
  async markAsDelivered(id: string): Promise<SmsLog> {
    return this.updateSmsStatus(id, 'delivered')
  }

  /**
   * Marquer un SMS comme échoué
   */
  async markAsFailed(id: string, errorMessage: string): Promise<SmsLog> {
    return this.updateSmsStatus(id, 'failed', {
      errorMessage,
    })
  }

  /**
   * Compter les SMS
   */
  async countSmsLogs(filters?: {
    status?: string
    phoneNumber?: string
  }): Promise<number> {
    this.logger.debug('Counting SMS logs')

    try {
      const where: any = {}

      if (filters?.status) where.status = filters.status
      if (filters?.phoneNumber) where.phoneNumber = filters.phoneNumber

      return await this.prisma.smsLog.count({
        where,
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error counting SMS logs: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Statistiques SMS
   */
  async getSmsStats(): Promise<{
    total: number
    sent: number
    delivered: number
    failed: number
    pending: number
  }> {
    this.logger.debug('Getting SMS stats')

    try {
      const [total, sent, delivered, failed, pending] = await Promise.all([
        this.prisma.smsLog.count(),
        this.prisma.smsLog.count({ where: { status: 'sent' } }),
        this.prisma.smsLog.count({ where: { status: 'delivered' } }),
        this.prisma.smsLog.count({ where: { status: 'failed' } }),
        this.prisma.smsLog.count({ where: { status: 'pending' } }),
      ])

      return {
        total,
        sent,
        delivered,
        failed,
        pending,
      }
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting SMS stats: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Supprimer les vieux logs SMS (nettoyage)
   */
  async deleteOldSmsLogs(olderThanDays: number): Promise<number> {
    this.logger.log(`Deleting SMS logs older than ${olderThanDays} days`)

    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

      const result = await this.prisma.smsLog.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      })

      this.logger.log(`Deleted ${result.count} old SMS logs`)
      return result.count
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error deleting old SMS logs: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer les SMS récents (dernières 24h)
   */
  async getRecentSmsLogs(
    options?: {
      limit?: number
      status?: string
    }
  ): Promise<SmsLog[]> {
    this.logger.debug('Getting recent SMS logs (last 24h)')

    try {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      const where: any = {
        createdAt: {
          gte: yesterday,
        },
      }

      if (options?.status) {
        where.status = options.status
      }

      return await this.prisma.smsLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options?.limit || 100,
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting recent SMS logs: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Supprimer un log SMS
   */
  async deleteSmsLog(id: string): Promise<void> {
    this.logger.log(`Deleting SMS log: ${id}`)

    try {
      await this.prisma.smsLog.delete({
        where: { id },
      })

      this.logger.log(`SMS log deleted: ${id}`)
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error deleting SMS log: ${err.message}`, err.stack)
      throw error
    }
  }
}
