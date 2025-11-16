import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../../core/database/prisma/prisma.service'
import type { AuditLog } from '@prisma/client'

/**
 * AuditLogPrismaService - Phase 2.1
 *
 * Service pour gestion des logs d'audit avec Prisma
 *
 * Fonctionnalités:
 * - Enregistrement des actions utilisateur
 * - Traçabilité complète (who, what, when, where)
 * - Recherche et filtrage des logs
 */
@Injectable()
export class AuditLogPrismaService {
  private readonly logger = new Logger(AuditLogPrismaService.name)

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Créer un log d'audit
   */
  async createAuditLog(data: {
    userId?: string
    action: string
    resource: string
    resourceId?: string
    description?: string
    changes?: any
    metadata?: any
    ipAddress?: string
    userAgent?: string
  }): Promise<AuditLog> {
    this.logger.log(`Creating audit log: ${data.action} on ${data.resource}`)

    try {
      const auditLog = await this.prisma.auditLog.create({
        data: {
          userId: data.userId || null,
          action: data.action,
          resource: data.resource,
          resourceId: data.resourceId || null,
          description: data.description || null,
          changes: data.changes || null,
          metadata: data.metadata || null,
          ipAddress: data.ipAddress || null,
          userAgent: data.userAgent || null,
        },
      })

      this.logger.log(`Audit log created: ${auditLog.id}`)
      return auditLog
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error creating audit log: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer un log d'audit par ID
   */
  async getAuditLogById(id: string): Promise<AuditLog | null> {
    this.logger.debug(`Getting audit log: ${id}`)

    try {
      return await this.prisma.auditLog.findUnique({
        where: { id },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting audit log: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer tous les logs d'un utilisateur
   */
  async getUserAuditLogs(
    userId: string,
    options?: {
      limit?: number
      offset?: number
      startDate?: Date
      endDate?: Date
    }
  ): Promise<AuditLog[]> {
    this.logger.debug(`Getting audit logs for user: ${userId}`)

    try {
      const where: any = { userId }

      // Filter par date si fourni
      if (options?.startDate || options?.endDate) {
        where.createdAt = {}
        if (options.startDate) {
          where.createdAt.gte = options.startDate
        }
        if (options.endDate) {
          where.createdAt.lte = options.endDate
        }
      }

      return await this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options?.limit || 100,
        skip: options?.offset || 0,
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting user audit logs: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer les logs par resource
   */
  async getResourceAuditLogs(
    resource: string,
    resourceId: string,
    options?: {
      limit?: number
      offset?: number
    }
  ): Promise<AuditLog[]> {
    this.logger.debug(`Getting audit logs for resource: ${resource}/${resourceId}`)

    try {
      return await this.prisma.auditLog.findMany({
        where: {
          resource,
          resourceId,
        },
        orderBy: { createdAt: 'desc' },
        take: options?.limit || 100,
        skip: options?.offset || 0,
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting resource audit logs: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer les logs par action
   */
  async getAuditLogsByAction(
    action: string,
    options?: {
      limit?: number
      offset?: number
      startDate?: Date
      endDate?: Date
    }
  ): Promise<AuditLog[]> {
    this.logger.debug(`Getting audit logs for action: ${action}`)

    try {
      const where: any = { action }

      if (options?.startDate || options?.endDate) {
        where.createdAt = {}
        if (options.startDate) {
          where.createdAt.gte = options.startDate
        }
        if (options.endDate) {
          where.createdAt.lte = options.endDate
        }
      }

      return await this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options?.limit || 100,
        skip: options?.offset || 0,
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting action audit logs: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Recherche avancée dans les logs
   */
  async searchAuditLogs(filters: {
    userId?: string
    action?: string
    resource?: string
    resourceId?: string
    startDate?: Date
    endDate?: Date
    ipAddress?: string
    limit?: number
    offset?: number
  }): Promise<AuditLog[]> {
    this.logger.debug('Searching audit logs with filters')

    try {
      const where: any = {}

      if (filters.userId) where.userId = filters.userId
      if (filters.action) where.action = filters.action
      if (filters.resource) where.resource = filters.resource
      if (filters.resourceId) where.resourceId = filters.resourceId
      if (filters.ipAddress) where.ipAddress = filters.ipAddress

      if (filters.startDate || filters.endDate) {
        where.createdAt = {}
        if (filters.startDate) {
          where.createdAt.gte = filters.startDate
        }
        if (filters.endDate) {
          where.createdAt.lte = filters.endDate
        }
      }

      return await this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters.limit || 100,
        skip: filters.offset || 0,
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error searching audit logs: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Compter les logs d'audit
   */
  async countAuditLogs(filters?: {
    userId?: string
    action?: string
    resource?: string
    startDate?: Date
    endDate?: Date
  }): Promise<number> {
    this.logger.debug('Counting audit logs')

    try {
      const where: any = {}

      if (filters?.userId) where.userId = filters.userId
      if (filters?.action) where.action = filters.action
      if (filters?.resource) where.resource = filters.resource

      if (filters?.startDate || filters?.endDate) {
        where.createdAt = {}
        if (filters.startDate) {
          where.createdAt.gte = filters.startDate
        }
        if (filters.endDate) {
          where.createdAt.lte = filters.endDate
        }
      }

      return await this.prisma.auditLog.count({
        where,
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error counting audit logs: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Supprimer les vieux logs (nettoyage)
   */
  async deleteOldAuditLogs(olderThanDays: number): Promise<number> {
    this.logger.log(`Deleting audit logs older than ${olderThanDays} days`)

    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

      const result = await this.prisma.auditLog.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      })

      this.logger.log(`Deleted ${result.count} old audit logs`)
      return result.count
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error deleting old audit logs: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Helper: Logger une action CRUD
   */
  async logCreate(
    userId: string | undefined,
    resource: string,
    resourceId: string,
    data?: any,
    options?: { ipAddress?: string; userAgent?: string }
  ): Promise<AuditLog> {
    return this.createAuditLog({
      userId,
      action: 'CREATE',
      resource,
      resourceId,
      changes: { created: data },
      ...options,
    })
  }

  async logUpdate(
    userId: string | undefined,
    resource: string,
    resourceId: string,
    changes?: any,
    options?: { ipAddress?: string; userAgent?: string }
  ): Promise<AuditLog> {
    return this.createAuditLog({
      userId,
      action: 'UPDATE',
      resource,
      resourceId,
      changes,
      ...options,
    })
  }

  async logDelete(
    userId: string | undefined,
    resource: string,
    resourceId: string,
    options?: { ipAddress?: string; userAgent?: string }
  ): Promise<AuditLog> {
    return this.createAuditLog({
      userId,
      action: 'DELETE',
      resource,
      resourceId,
      ...options,
    })
  }

  async logRead(
    userId: string | undefined,
    resource: string,
    resourceId: string,
    options?: { ipAddress?: string; userAgent?: string }
  ): Promise<AuditLog> {
    return this.createAuditLog({
      userId,
      action: 'READ',
      resource,
      resourceId,
      ...options,
    })
  }
}
