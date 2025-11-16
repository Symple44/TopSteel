import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../../core/database/prisma/prisma.service'
import type { NotificationRuleExecution, Prisma } from '@prisma/client'

/**
 * NotificationRuleExecutionPrismaService - Phase 2.5
 *
 * Service pour gestion des exécutions de règles de notification avec Prisma
 *
 * NotificationRuleExecution = Historique d'exécution d'une règle
 * Permet de tracker les déclenchements et résultats
 *
 * Fonctionnalités:
 * - CRUD exécutions de règles
 * - Tracking succès/échecs
 * - Temps d'exécution
 * - Messages d'erreur
 * - Données d'exécution (Json)
 * - Relations avec rule et notification
 */
@Injectable()
export class NotificationRuleExecutionPrismaService {
  private readonly logger = new Logger(NotificationRuleExecutionPrismaService.name)

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Créer une exécution de règle
   */
  async createNotificationRuleExecution(data: {
    ruleId: string
    notificationId?: string
    triggered?: boolean
    success?: boolean
    errorMessage?: string
    executionTime?: number
    data?: Record<string, any>
  }): Promise<NotificationRuleExecution> {
    this.logger.log(`Creating rule execution for rule: ${data.ruleId}`)

    try {
      const execution = await this.prisma.notificationRuleExecution.create({
        data: {
          ruleId: data.ruleId,
          notificationId: data.notificationId || null,
          triggered: data.triggered !== undefined ? data.triggered : false,
          success: data.success !== undefined ? data.success : false,
          errorMessage: data.errorMessage || null,
          executionTime: data.executionTime || null,
          data: data.data ? (data.data as Prisma.InputJsonValue) : undefined,
        },
      })

      this.logger.log(`Rule execution created: ${execution.id}`)
      return execution
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error creating rule execution: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer une exécution par ID
   */
  async getNotificationRuleExecutionById(id: string): Promise<NotificationRuleExecution | null> {
    this.logger.debug(`Getting rule execution: ${id}`)

    try {
      return await this.prisma.notificationRuleExecution.findUnique({
        where: { id },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting rule execution: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer une exécution avec relations
   */
  async getExecutionWithRelations(id: string) {
    this.logger.debug(`Getting rule execution with relations: ${id}`)

    try {
      return await this.prisma.notificationRuleExecution.findUnique({
        where: { id },
        include: {
          rule: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          notification: {
            select: {
              id: true,
              title: true,
              type: true,
            },
          },
        },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting execution with relations: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer les exécutions d'une règle
   */
  async getRuleExecutions(ruleId: string): Promise<NotificationRuleExecution[]> {
    this.logger.debug(`Getting executions for rule: ${ruleId}`)

    try {
      return await this.prisma.notificationRuleExecution.findMany({
        where: { ruleId },
        orderBy: { createdAt: 'desc' },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting rule executions: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer les exécutions réussies
   */
  async getSuccessfulExecutions(ruleId: string): Promise<NotificationRuleExecution[]> {
    this.logger.debug(`Getting successful executions for rule: ${ruleId}`)

    try {
      return await this.prisma.notificationRuleExecution.findMany({
        where: {
          ruleId,
          success: true,
        },
        orderBy: { createdAt: 'desc' },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting successful executions: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer les exécutions échouées
   */
  async getFailedExecutions(ruleId: string): Promise<NotificationRuleExecution[]> {
    this.logger.debug(`Getting failed executions for rule: ${ruleId}`)

    try {
      return await this.prisma.notificationRuleExecution.findMany({
        where: {
          ruleId,
          success: false,
        },
        orderBy: { createdAt: 'desc' },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting failed executions: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer les exécutions déclenchées
   */
  async getTriggeredExecutions(ruleId: string): Promise<NotificationRuleExecution[]> {
    this.logger.debug(`Getting triggered executions for rule: ${ruleId}`)

    try {
      return await this.prisma.notificationRuleExecution.findMany({
        where: {
          ruleId,
          triggered: true,
        },
        orderBy: { createdAt: 'desc' },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting triggered executions: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer les exécutions récentes
   */
  async getRecentExecutions(limit = 50): Promise<NotificationRuleExecution[]> {
    this.logger.debug(`Getting recent executions (limit: ${limit})`)

    try {
      return await this.prisma.notificationRuleExecution.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting recent executions: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Mettre à jour une exécution
   */
  async updateNotificationRuleExecution(
    id: string,
    data: {
      triggered?: boolean
      success?: boolean
      errorMessage?: string
      executionTime?: number
      data?: Record<string, any>
    }
  ): Promise<NotificationRuleExecution> {
    this.logger.log(`Updating rule execution: ${id}`)

    try {
      const updateData: any = {}

      if (data.triggered !== undefined) updateData.triggered = data.triggered
      if (data.success !== undefined) updateData.success = data.success
      if (data.errorMessage !== undefined) updateData.errorMessage = data.errorMessage
      if (data.executionTime !== undefined) updateData.executionTime = data.executionTime
      if (data.data !== undefined) updateData.data = data.data as Prisma.InputJsonValue

      const execution = await this.prisma.notificationRuleExecution.update({
        where: { id },
        data: updateData,
      })

      this.logger.log(`Rule execution updated: ${id}`)
      return execution
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error updating rule execution: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Marquer une exécution comme réussie
   */
  async markAsSuccess(id: string, executionTime?: number): Promise<NotificationRuleExecution> {
    this.logger.log(`Marking execution as success: ${id}`)

    return this.updateNotificationRuleExecution(id, {
      success: true,
      triggered: true,
      executionTime,
    })
  }

  /**
   * Marquer une exécution comme échouée
   */
  async markAsFailed(id: string, errorMessage: string, executionTime?: number): Promise<NotificationRuleExecution> {
    this.logger.log(`Marking execution as failed: ${id}`)

    return this.updateNotificationRuleExecution(id, {
      success: false,
      triggered: true,
      errorMessage,
      executionTime,
    })
  }

  /**
   * Supprimer une exécution
   */
  async deleteNotificationRuleExecution(id: string): Promise<void> {
    this.logger.log(`Deleting rule execution: ${id}`)

    try {
      await this.prisma.notificationRuleExecution.delete({
        where: { id },
      })

      this.logger.log(`Rule execution deleted: ${id}`)
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error deleting rule execution: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Supprimer les anciennes exécutions
   */
  async deleteOldExecutions(daysOld = 30): Promise<number> {
    this.logger.log(`Deleting executions older than ${daysOld} days`)

    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysOld)

      const result = await this.prisma.notificationRuleExecution.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      })

      this.logger.log(`${result.count} old executions deleted`)
      return result.count
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error deleting old executions: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Compter les exécutions
   */
  async countExecutions(ruleId: string): Promise<number> {
    this.logger.debug(`Counting executions for rule: ${ruleId}`)

    try {
      return await this.prisma.notificationRuleExecution.count({
        where: { ruleId },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error counting executions: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Compter les exécutions réussies
   */
  async countSuccessfulExecutions(ruleId: string): Promise<number> {
    this.logger.debug(`Counting successful executions for rule: ${ruleId}`)

    try {
      return await this.prisma.notificationRuleExecution.count({
        where: {
          ruleId,
          success: true,
        },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error counting successful executions: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Compter les exécutions échouées
   */
  async countFailedExecutions(ruleId: string): Promise<number> {
    this.logger.debug(`Counting failed executions for rule: ${ruleId}`)

    try {
      return await this.prisma.notificationRuleExecution.count({
        where: {
          ruleId,
          success: false,
        },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error counting failed executions: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Calculer le taux de succès
   */
  async calculateSuccessRate(ruleId: string): Promise<number> {
    this.logger.debug(`Calculating success rate for rule: ${ruleId}`)

    try {
      const total = await this.countExecutions(ruleId)
      if (total === 0) return 0

      const successful = await this.countSuccessfulExecutions(ruleId)
      return (successful / total) * 100
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error calculating success rate: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Calculer le temps d'exécution moyen
   */
  async calculateAverageExecutionTime(ruleId: string): Promise<number> {
    this.logger.debug(`Calculating average execution time for rule: ${ruleId}`)

    try {
      const executions = await this.prisma.notificationRuleExecution.findMany({
        where: {
          ruleId,
          executionTime: { not: null },
        },
        select: { executionTime: true },
      })

      if (executions.length === 0) return 0

      const total = executions.reduce((sum, exec) => sum + (exec.executionTime || 0), 0)
      return total / executions.length
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error calculating average execution time: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Obtenir les statistiques d'exécution
   */
  async getExecutionStats(ruleId: string): Promise<{
    total: number
    successful: number
    failed: number
    successRate: number
    averageExecutionTime: number
  }> {
    this.logger.debug(`Getting execution statistics for rule: ${ruleId}`)

    try {
      const total = await this.countExecutions(ruleId)
      const successful = await this.countSuccessfulExecutions(ruleId)
      const failed = await this.countFailedExecutions(ruleId)
      const successRate = await this.calculateSuccessRate(ruleId)
      const averageExecutionTime = await this.calculateAverageExecutionTime(ruleId)

      return {
        total,
        successful,
        failed,
        successRate,
        averageExecutionTime,
      }
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting execution statistics: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer les dernières erreurs
   */
  async getRecentErrors(ruleId: string, limit = 10): Promise<NotificationRuleExecution[]> {
    this.logger.debug(`Getting recent errors for rule: ${ruleId}`)

    try {
      return await this.prisma.notificationRuleExecution.findMany({
        where: {
          ruleId,
          success: false,
          errorMessage: { not: null },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting recent errors: ${err.message}`, err.stack)
      throw error
    }
  }
}
