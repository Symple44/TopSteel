import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../../core/database/prisma/prisma.service'
import type { NotificationEvent, Prisma } from '@prisma/client'

/**
 * NotificationEventPrismaService - Phase 2.5
 *
 * Service pour gestion des événements de notification avec Prisma
 *
 * NotificationEvent = Événement système qui déclenche des notifications
 * Permet de capturer et traiter les événements asynchrones
 *
 * Fonctionnalités:
 * - CRUD événements de notification
 * - Types et sources variés
 * - Données Json extensibles
 * - Tracking traitement (processed, processedAt)
 * - Détails de traitement (processingDetails Json)
 * - File d'attente d'événements
 */
@Injectable()
export class NotificationEventPrismaService {
  private readonly logger = new Logger(NotificationEventPrismaService.name)

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Créer un événement de notification
   */
  async createNotificationEvent(data: {
    type: string
    source: string
    data: Record<string, any>
  }): Promise<NotificationEvent> {
    this.logger.log(`Creating notification event: ${data.type} from ${data.source}`)

    try {
      const event = await this.prisma.notificationEvent.create({
        data: {
          type: data.type,
          source: data.source,
          data: data.data as Prisma.InputJsonValue,
        },
      })

      this.logger.log(`Notification event created: ${event.id}`)
      return event
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error creating notification event: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer un événement par ID
   */
  async getNotificationEventById(id: string): Promise<NotificationEvent | null> {
    this.logger.debug(`Getting notification event: ${id}`)

    try {
      return await this.prisma.notificationEvent.findUnique({
        where: { id },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting notification event: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Lister tous les événements
   */
  async getAllNotificationEvents(includeProcessed = false): Promise<NotificationEvent[]> {
    this.logger.debug('Getting all notification events')

    try {
      return await this.prisma.notificationEvent.findMany({
        where: includeProcessed ? {} : { processed: false },
        orderBy: { createdAt: 'desc' },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting all notification events: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer les événements non traités
   */
  async getUnprocessedEvents(): Promise<NotificationEvent[]> {
    this.logger.debug('Getting unprocessed notification events')

    return this.getAllNotificationEvents(false)
  }

  /**
   * Récupérer les événements par type
   */
  async getEventsByType(type: string, includeProcessed = false): Promise<NotificationEvent[]> {
    this.logger.debug(`Getting notification events by type: ${type}`)

    try {
      return await this.prisma.notificationEvent.findMany({
        where: {
          type,
          ...(includeProcessed ? {} : { processed: false }),
        },
        orderBy: { createdAt: 'desc' },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting notification events by type: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer les événements par source
   */
  async getEventsBySource(source: string, includeProcessed = false): Promise<NotificationEvent[]> {
    this.logger.debug(`Getting notification events by source: ${source}`)

    try {
      return await this.prisma.notificationEvent.findMany({
        where: {
          source,
          ...(includeProcessed ? {} : { processed: false }),
        },
        orderBy: { createdAt: 'desc' },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting notification events by source: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer les événements récents
   */
  async getRecentEvents(limit = 50): Promise<NotificationEvent[]> {
    this.logger.debug(`Getting recent notification events (limit: ${limit})`)

    try {
      return await this.prisma.notificationEvent.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting recent notification events: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Marquer un événement comme traité
   */
  async markAsProcessed(
    id: string,
    processingDetails?: Record<string, any>
  ): Promise<NotificationEvent> {
    this.logger.log(`Marking notification event as processed: ${id}`)

    try {
      const event = await this.prisma.notificationEvent.update({
        where: { id },
        data: {
          processed: true,
          processedAt: new Date(),
          processingDetails: processingDetails ? (processingDetails as Prisma.InputJsonValue) : undefined,
        },
      })

      this.logger.log(`Notification event marked as processed: ${id}`)
      return event
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error marking notification event as processed: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Marquer plusieurs événements comme traités
   */
  async markMultipleAsProcessed(ids: string[]): Promise<number> {
    this.logger.log(`Marking ${ids.length} notification events as processed`)

    try {
      const result = await this.prisma.notificationEvent.updateMany({
        where: { id: { in: ids } },
        data: {
          processed: true,
          processedAt: new Date(),
        },
      })

      this.logger.log(`${result.count} notification events marked as processed`)
      return result.count
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error marking multiple notification events as processed: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Mettre à jour les détails de traitement
   */
  async updateProcessingDetails(
    id: string,
    processingDetails: Record<string, any>
  ): Promise<NotificationEvent> {
    this.logger.log(`Updating processing details for notification event: ${id}`)

    try {
      const event = await this.prisma.notificationEvent.update({
        where: { id },
        data: {
          processingDetails: processingDetails as Prisma.InputJsonValue,
        },
      })

      this.logger.log(`Processing details updated for notification event: ${id}`)
      return event
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error updating processing details: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Réinitialiser le traitement (reprocess)
   */
  async resetProcessing(id: string): Promise<NotificationEvent> {
    this.logger.log(`Resetting processing for notification event: ${id}`)

    try {
      const event = await this.prisma.notificationEvent.update({
        where: { id },
        data: {
          processed: false,
          processedAt: null,
          processingDetails: undefined,
        },
      })

      this.logger.log(`Processing reset for notification event: ${id}`)
      return event
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error resetting processing: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Supprimer un événement
   */
  async deleteNotificationEvent(id: string): Promise<void> {
    this.logger.log(`Deleting notification event: ${id}`)

    try {
      await this.prisma.notificationEvent.delete({
        where: { id },
      })

      this.logger.log(`Notification event deleted: ${id}`)
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error deleting notification event: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Supprimer les événements traités anciens
   */
  async deleteOldProcessedEvents(daysOld = 7): Promise<number> {
    this.logger.log(`Deleting processed events older than ${daysOld} days`)

    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysOld)

      const result = await this.prisma.notificationEvent.deleteMany({
        where: {
          processed: true,
          processedAt: {
            lt: cutoffDate,
          },
        },
      })

      this.logger.log(`${result.count} old processed events deleted`)
      return result.count
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error deleting old processed events: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Compter les événements non traités
   */
  async countUnprocessedEvents(): Promise<number> {
    this.logger.debug('Counting unprocessed notification events')

    try {
      return await this.prisma.notificationEvent.count({
        where: { processed: false },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error counting unprocessed events: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Compter par type
   */
  async countByType(type: string): Promise<number> {
    this.logger.debug(`Counting notification events by type: ${type}`)

    try {
      return await this.prisma.notificationEvent.count({
        where: { type },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error counting notification events by type: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Compter par source
   */
  async countBySource(source: string): Promise<number> {
    this.logger.debug(`Counting notification events by source: ${source}`)

    try {
      return await this.prisma.notificationEvent.count({
        where: { source },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error counting notification events by source: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Obtenir les statistiques de traitement
   */
  async getProcessingStats(): Promise<{
    total: number
    processed: number
    unprocessed: number
    processingRate: number
  }> {
    this.logger.debug('Getting processing statistics')

    try {
      const total = await this.prisma.notificationEvent.count()
      const processed = await this.prisma.notificationEvent.count({
        where: { processed: true },
      })
      const unprocessed = total - processed
      const processingRate = total > 0 ? (processed / total) * 100 : 0

      return {
        total,
        processed,
        unprocessed,
        processingRate,
      }
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting processing statistics: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Batch: Récupérer les événements à traiter
   */
  async getEventsToProcess(limit = 100): Promise<NotificationEvent[]> {
    this.logger.debug(`Getting events to process (limit: ${limit})`)

    try {
      return await this.prisma.notificationEvent.findMany({
        where: { processed: false },
        orderBy: { createdAt: 'asc' },
        take: limit,
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting events to process: ${err.message}`, err.stack)
      throw error
    }
  }
}
