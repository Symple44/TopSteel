import { Prisma } from '@prisma/client'
import type { NotificationRule as PrismaNotificationRule, NotificationEvent as PrismaNotificationEvent, NotificationRuleExecution as PrismaNotificationRuleExecution, Notification } from '@prisma/client'
import { TenantPrismaService } from '../../../core/multi-tenant/tenant-prisma.service'
import { Injectable, Logger } from '@nestjs/common'


import { getErrorMessage } from '../../../core/common/utils'
import {
  EventStatus,
  ExecutionResult,
  type NotificationCategory,
  type NotificationPriority,
  type NotificationType,
  type RecipientType,
  TriggerType,
} from '../entities'
import { NotificationRuleService } from './notification-rule.service'

@Injectable()
export class NotificationRuleEngineService {
  private readonly logger = new Logger(NotificationRuleEngineService.name)

  constructor(
    private readonly tenantPrisma: TenantPrismaService,
    private readonly ruleService: NotificationRuleService
  ) {}

  /** Client Prisma avec filtrage automatique par tenant */
  private get prisma() {
    return this.tenantPrisma.client
  }

  // ===== TRAITEMENT DES ÉVÉNEMENTS =====

  async processEvent(event: PrismaNotificationEvent): Promise<void> {
    const startTime = Date.now()

    try {
      this.logger.log(`Processing event: ${event.type}`)

      // Marquer l'événement comme en cours de traitement
      await this.prisma.notificationEvent.update({
        where: { id: event.id },
        data: {
          processed: false,
          processingDetails: { status: 'processing', startedAt: new Date().toISOString() } as Prisma.InputJsonValue
        }
      })

      // Récupérer les règles actives pour ce type d'événement
      const applicableRules = await this.getApplicableRules(event)

      let notificationsCreated = 0
      let rulesTriggered = 0

      // Traiter chaque règle applicable
      for (const rule of applicableRules) {
        try {
          const wasTriggered = await this.processRuleForEvent(rule, event)
          if (wasTriggered) {
            rulesTriggered++
            notificationsCreated++
          }
        } catch (error) {
          this.logger.error(`Error processing rule ${rule.id} for event ${event.id}:`, error)
        }
      }

      // Marquer l'événement comme traité
      await this.prisma.notificationEvent.update({
        where: { id: event.id },
        data: {
          processed: true,
          processedAt: new Date(),
          processingDetails: {
            status: 'completed',
            rulesTriggered,
            notificationsCreated,
            completedAt: new Date().toISOString()
          } as Prisma.InputJsonValue
        }
      })

      const executionTime = Date.now() - startTime
      this.logger.log(
        `Event processed in ${executionTime}ms. Rules triggered: ${rulesTriggered}, Notifications created: ${notificationsCreated}`
      )
    } catch (error) {
      this.logger.error(`Error processing event ${event.id}:`, error)
      const errorMessage = error instanceof Error ? getErrorMessage(error) : getErrorMessage(error)
      const errorStack = error instanceof Error ? error.stack : undefined
      await this.prisma.notificationEvent.update({
        where: { id: event.id },
        data: {
          processed: false,
          processingDetails: {
            status: 'failed',
            error: errorMessage,
            stack: errorStack,
            failedAt: new Date().toISOString()
          } as Prisma.InputJsonValue
        }
      })
    }
  }

  private async getApplicableRules(event: PrismaNotificationEvent): Promise<PrismaNotificationRule[]> {
    // Get all active rules
    const activeRules = await this.prisma.notificationRule.findMany({
      where: {
        isActive: true,
        enabled: true,
        societeId: event.societeId
      }
    })

    // Filter by trigger type in JSON field
    return activeRules.filter(rule => {
      const trigger = rule.trigger as Record<string, unknown> | null
      return trigger?.type === event.type
    })
  }

  private async processRuleForEvent(
    rule: PrismaNotificationRule,
    event: PrismaNotificationEvent
  ): Promise<boolean> {
    const startTime = Date.now()

    try {
      // Vérifier si la règle peut être exécutée
      if (!rule.isActive || !rule.enabled) {
        await this.ruleService.createExecution({
          ruleId: rule.id,
          triggered: false,
          success: false,
          errorMessage: 'Rule is not active or enabled',
          executionTime: Date.now() - startTime,
          data: { result: ExecutionResult.RULE_INACTIVE }
        })
        return false
      }

      // Cast event data from JsonValue
      const eventData = (event.data || {}) as Record<string, unknown>

      // Évaluer les conditions
      const conditions = rule.conditions as unknown[] | null
      const conditionResult = this.ruleService.evaluateConditions(conditions || [], eventData)

      if (!conditionResult.result) {
        await this.ruleService.createExecution({
          ruleId: rule.id,
          triggered: false,
          success: false,
          errorMessage: 'Conditions not met',
          executionTime: Date.now() - startTime,
          data: {
            result: ExecutionResult.CONDITIONS_NOT_MET,
            details: conditionResult.details
          } as any
        })
        return false
      }

      // Préparer les variables pour le template
      const templateVariables = this.prepareTemplateVariables(eventData, rule)

      // Créer la notification
      const notification = await this.createNotificationFromRule(rule, templateVariables, event.societeId)

      // Incrémenter le compteur de déclenchements
      await this.prisma.notificationRule.update({
        where: { id: rule.id },
        data: {
          triggerCount: { increment: 1 },
          lastTriggered: new Date().toISOString()
        }
      })

      // Enregistrer l'exécution réussie
      await this.ruleService.createExecution({
        ruleId: rule.id,
        notificationId: notification.id,
        triggered: true,
        success: true,
        executionTime: Date.now() - startTime,
        data: {
          eventData,
          templateVariables
        } as any
      })

      this.logger.log(
        `Rule ${rule.id} triggered successfully, notification ${notification.id} created`
      )
      return true
    } catch (error) {
      this.logger.error(`Error executing rule ${rule.id}:`, error)

      const errorMessage = error instanceof Error ? getErrorMessage(error) : getErrorMessage(error)
      const errorStack = error instanceof Error ? error.stack : undefined
      await this.ruleService.createExecution({
        ruleId: rule.id,
        triggered: false,
        success: false,
        errorMessage,
        executionTime: Date.now() - startTime,
        data: {
          result: ExecutionResult.SYSTEM_ERROR,
          error: errorMessage,
          stack: errorStack
        }
      })

      return false
    }
  }

  private prepareTemplateVariables(
    eventData: Record<string, unknown>,
    rule: PrismaNotificationRule
  ): Record<string, unknown> {
    // Commencer avec les données de l'événement
    const variables = { ...eventData }

    // Ajouter des variables système
    variables.timestamp = new Date().toISOString()
    variables.rule_name = rule.name
    variables.rule_id = rule.id

    // Cast trigger JsonValue to proper type
    const trigger = rule.trigger as Record<string, unknown> | null
    const triggerType = trigger?.type as TriggerType | undefined

    // Ajouter des variables spécifiques selon le type d'événement
    switch (triggerType) {
      case TriggerType.STOCK:
        variables.stock_url = `/stock/materials/${variables.material_id}`
        variables.threshold_percentage = variables.threshold
          ? Math.round(((variables.quantity as number) / (variables.threshold as number)) * 100)
          : 0
        break

      case TriggerType.USER:
        variables.user_profile_url = `/users/${variables.user_id}/profile`
        break

      case TriggerType.PROJECT:
        variables.project_url = `/projets/${variables.project_id}`
        break

      case TriggerType.PRODUCTION:
        variables.machine_url = `/production/machines/${variables.machine_id}`
        break

      case TriggerType.EMAIL:
        variables.email_url = `/emails/${variables.email_id}`
        break

      case TriggerType.SYSTEM:
        variables.system_logs_url = `/admin/logs?component=${variables.component}`
        break
    }

    return variables
  }

  private async createNotificationFromRule(
    rule: PrismaNotificationRule,
    variables: Record<string, unknown>,
    societeId: string
  ): Promise<Notification> {
    // Cast notification JsonValue to proper type
    const config = rule.notification as Record<string, unknown> | null

    if (!config) {
      throw new Error('Notification configuration is missing')
    }

    try {
      const titleTemplate = config.titleTemplate as string
      const messageTemplate = config.messageTemplate as string
      const actionUrlTemplate = config.actionUrl as string | undefined

      // Substituer les variables dans les templates
      const title = this.ruleService.substituteVariables(titleTemplate, variables)
      const message = this.ruleService.substituteVariables(messageTemplate, variables)
      const actionUrl = actionUrlTemplate
        ? this.ruleService.substituteVariables(actionUrlTemplate, variables)
        : undefined

      // Calculer la date d'expiration
      const expiresIn = config.expiresIn as number | undefined
      const expiresAt = expiresIn
        ? new Date(Date.now() + expiresIn * 60 * 60 * 1000)
        : undefined

      const recipientIds = config.recipientIds as string[] | undefined
      const userId = recipientIds?.[0] || 'system'

      // Créer la notification
      return await this.prisma.notification.create({
        data: {
          societeId,
          userId,
          title,
          message,
          type: (config.type as string) || 'info',
          category: config.category as string | undefined,
          priority: config.priority as string | undefined,
          data: variables as Prisma.InputJsonValue,
          actionUrl,
          actionLabel: config.actionLabel as string | undefined,
          expiresAt,
        }
      })
    } catch (error) {
      this.logger.error(`Error creating notification from rule ${rule.id}:`, error)
      throw new Error(
        `Template error: ${error instanceof Error ? getErrorMessage(error) : getErrorMessage(error)}`
      )
    }
  }

  // ===== MÉTHODES UTILITAIRES =====

  async processAllPendingEvents(): Promise<void> {
    const pendingEvents = await this.prisma.notificationEvent.findMany({
      where: { processed: false },
      orderBy: { createdAt: 'asc' },
      take: 100, // Traiter par batch
    })

    this.logger.log(`Processing ${pendingEvents.length} pending events`)

    for (const event of pendingEvents) {
      await this.processEvent(event)
    }
  }

  async reprocessFailedEvents(maxAge: number = 24): Promise<void> {
    const maxAgeDate = new Date()
    maxAgeDate.setHours(maxAgeDate.getHours() - maxAge)

    const failedEvents = await this.prisma.notificationEvent.findMany({
      where: {
        processed: false,
        createdAt: { gte: maxAgeDate }
      },
      orderBy: { createdAt: 'asc' },
      take: 50
    })

    this.logger.log(`Reprocessing ${failedEvents.length} failed events`)

    for (const event of failedEvents) {
      // Réinitialiser le statut
      const resetEvent = await this.prisma.notificationEvent.update({
        where: { id: event.id },
        data: {
          processed: false,
          processingDetails: Prisma.DbNull
        }
      })

      // Retraiter l'événement
      await this.processEvent(resetEvent)
    }
  }

  async cleanupOldEvents(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

    const result = await this.prisma.notificationEvent.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        processed: true
      }
    })

    this.logger.log(`Cleaned up ${result.count} old events`)
    return result.count
  }

  async cleanupOldExecutions(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

    const result = await this.prisma.notificationRuleExecution.deleteMany({
      where: {
        createdAt: { lt: cutoffDate }
      }
    })

    this.logger.log(`Cleaned up ${result.count} old executions`)
    return result.count
  }

  // ===== MÉTHODES DE DÉCLENCHEMENT MANUEL =====

  async triggerEvent(
    type: TriggerType,
    event: string,
    data: Record<string, unknown>,
    source: string = 'manual',
    userId?: string,
    societeId?: string
  ): Promise<PrismaNotificationEvent> {
    const notificationEvent = await this.ruleService.createEvent(type, event, data, source, userId, undefined, undefined, societeId)

    // Traiter immédiatement l'événement
    await this.processEvent(notificationEvent)

    return notificationEvent
  }

  async testRule(
    ruleId: string,
    testData: Record<string, unknown>
  ): Promise<{
    success: boolean
    conditionResult: { result: boolean; details: Record<string, unknown> }
    templateVariables?: Record<string, unknown>
    notificationPreview?: {
      title: string
      message: string
      actionUrl?: string
    }
    error?: string
  }> {
    try {
      const rule = await this.ruleService.getRuleById(ruleId)

      // Évaluer les conditions
      const conditions = rule.conditions as unknown[] | null
      const conditionResult = this.ruleService.evaluateConditions(conditions || [], testData)

      if (!conditionResult.result) {
        return {
          success: false,
          conditionResult,
          error: 'Conditions not met',
        }
      }

      // Préparer les variables
      const templateVariables = this.prepareTemplateVariables(testData, rule)

      // Cast notification JsonValue to proper type
      const config = rule.notification as Record<string, unknown> | null

      if (!config) {
        throw new Error('Notification configuration is missing')
      }

      const titleTemplate = config.titleTemplate as string
      const messageTemplate = config.messageTemplate as string
      const actionUrlTemplate = config.actionUrl as string | undefined

      // Générer un aperçu de la notification
      const title = this.ruleService.substituteVariables(titleTemplate, templateVariables)
      const message = this.ruleService.substituteVariables(
        messageTemplate,
        templateVariables
      )
      const actionUrl = actionUrlTemplate
        ? this.ruleService.substituteVariables(actionUrlTemplate, templateVariables)
        : undefined

      return {
        success: true,
        conditionResult,
        templateVariables,
        notificationPreview: {
          title,
          message,
          actionUrl,
        },
      }
    } catch (error) {
      return {
        success: false,
        conditionResult: { result: false, details: {} },
        error: error instanceof Error ? getErrorMessage(error) : getErrorMessage(error),
      }
    }
  }
}
