import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import type { Repository } from 'typeorm'
import { getErrorMessage } from '../../../core/common/utils'
import {
  EventStatus,
  ExecutionResult,
  type NotificationCategory,
  type NotificationEvent,
  type NotificationPriority,
  NotificationRule,
  NotificationRuleExecution,
  Notifications,
  type NotificationType,
  type RecipientType,
  TriggerType,
} from '../entities'
import type { NotificationRuleService } from './notification-rule.service'

@Injectable()
export class NotificationRuleEngineService {
  private readonly logger = new Logger(NotificationRuleEngineService.name)

  constructor(
    @InjectRepository(NotificationRule, 'shared')
    private readonly _ruleRepository: Repository<NotificationRule>,
    @InjectRepository(Notifications, 'auth')
    private readonly _notificationRepository: Repository<Notifications>,
    private readonly ruleService: NotificationRuleService
  ) {}

  // ===== TRAITEMENT DES ÉVÉNEMENTS =====

  async processEvent(event: NotificationEvent): Promise<void> {
    const startTime = Date.now()

    try {
      this.logger.log(`Processing event: ${event.getEventKey()}`)

      // Marquer l'événement comme en cours de traitement
      event.markAsProcessing()
      await this.ruleService._eventRepository.save(event)

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
      event.markAsProcessed(rulesTriggered, notificationsCreated)
      await this.ruleService._eventRepository.save(event)

      const executionTime = Date.now() - startTime
      this.logger.log(
        `Event processed in ${executionTime}ms. Rules triggered: ${rulesTriggered}, Notifications created: ${notificationsCreated}`
      )
    } catch (error) {
      this.logger.error(`Error processing event ${event.id}:`, error)
      const errorMessage = error instanceof Error ? getErrorMessage(error) : getErrorMessage(error)
      const errorStack = error instanceof Error ? error.stack : undefined
      event.markAsFailed(errorMessage, { stack: errorStack })
      await this.ruleService._eventRepository.save(event)
    }
  }

  private async getApplicableRules(event: NotificationEvent): Promise<NotificationRule[]> {
    return await this._ruleRepository
      .createQueryBuilder('rule')
      .where('rule.isActive = :isActive', { isActive: true })
      .andWhere("rule.trigger ->> 'type' = :triggerType", { triggerType: event.type })
      .andWhere("rule.trigger ->> 'event' = :eventName", { eventName: event.event })
      .getMany()
  }

  private async processRuleForEvent(
    rule: NotificationRule,
    event: NotificationEvent
  ): Promise<boolean> {
    const startTime = Date.now()

    try {
      // Vérifier si la règle peut être exécutée
      if (!rule.canExecute()) {
        const execution = NotificationRuleExecution.createSkipped(
          rule.id,
          event.data,
          ExecutionResult.RULE_INACTIVE,
          {},
          Date.now() - startTime
        )
        await this.ruleService.createExecution(execution)
        return false
      }

      // Évaluer les conditions
      const conditionResult = this.ruleService.evaluateConditions(rule.conditions, event.data)

      if (!conditionResult.result) {
        const execution = NotificationRuleExecution.createSkipped(
          rule.id,
          event.data,
          ExecutionResult.CONDITIONS_NOT_MET,
          conditionResult.details,
          Date.now() - startTime
        )
        await this.ruleService.createExecution(execution)
        return false
      }

      // Préparer les variables pour le template
      const templateVariables = this.prepareTemplateVariables(event.data, rule)

      // Créer la notification
      const notification = await this.createNotificationFromRule(rule, templateVariables)

      // Incrémenter le compteur de déclenchements
      rule.incrementTriggerCount()
      await this._ruleRepository.save(rule)

      // Enregistrer l'exécution réussie
      const execution = NotificationRuleExecution.createSuccess(
        rule.id,
        notification.id,
        event.data,
        templateVariables,
        Date.now() - startTime
      )
      await this.ruleService.createExecution(execution)

      this.logger.log(
        `Rule ${rule.id} triggered successfully, notification ${notification.id} created`
      )
      return true
    } catch (error) {
      this.logger.error(`Error executing rule ${rule.id}:`, error)

      const errorMessage = error instanceof Error ? getErrorMessage(error) : getErrorMessage(error)
      const errorStack = error instanceof Error ? error.stack : undefined
      const execution = NotificationRuleExecution.createFailed(
        rule.id,
        event.data,
        ExecutionResult.SYSTEM_ERROR,
        errorMessage,
        { stack: errorStack },
        Date.now() - startTime
      )
      await this.ruleService.createExecution(execution)

      return false
    }
  }

  private prepareTemplateVariables(
    eventData: Record<string, unknown>,
    rule: NotificationRule
  ): Record<string, unknown> {
    // Commencer avec les données de l'événement
    const variables = { ...eventData }

    // Ajouter des variables système
    variables.timestamp = new Date().toISOString()
    variables.rule_name = rule.name
    variables.rule_id = rule.id

    // Ajouter des variables spécifiques selon le type d'événement
    switch (rule.trigger.type) {
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
    rule: NotificationRule,
    variables: Record<string, unknown>
  ): Promise<Notifications> {
    const config = rule.notification

    try {
      // Substituer les variables dans les templates
      const title = this.ruleService.substituteVariables(config.titleTemplate, variables)
      const message = this.ruleService.substituteVariables(config.messageTemplate, variables)
      const actionUrl = config.actionUrl
        ? this.ruleService.substituteVariables(config.actionUrl, variables)
        : undefined

      // Calculer la date d'expiration
      const expiresAt = config.expiresIn
        ? new Date(Date.now() + config.expiresIn * 60 * 60 * 1000)
        : undefined

      // Créer l'objet notification
      const notificationData = {
        title: title,
        message,
        type: config.type as NotificationType,
        category: config.category as NotificationCategory,
        priority: config.priority as NotificationPriority,
        source: `rule:${rule.id}`,
        entityType: 'notification_rule',
        entityId: rule.id,
        data: variables,
        recipientType: config.recipientType as RecipientType,
        recipientId: config.recipientIds?.join(','),
        actionUrl,
        actionLabel: config.actionLabel,
        actionType: config.actionType as 'primary' | 'secondary',
        expiresAt,
        persistent: config.persistent ?? true,
        autoRead: false,
        isArchived: false,
      }

      const notification = this._notificationRepository.create(notificationData)
      return await this._notificationRepository.save(notification)
    } catch (error) {
      this.logger.error(`Error creating notification from rule ${rule.id}:`, error)
      throw new Error(
        `Template error: ${error instanceof Error ? getErrorMessage(error) : getErrorMessage(error)}`
      )
    }
  }

  // ===== MÉTHODES UTILITAIRES =====

  async processAllPendingEvents(): Promise<void> {
    const pendingEvents = await this.ruleService._eventRepository.find({
      where: { status: EventStatus.PENDING },
      order: { occurredAt: 'ASC' },
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

    const failedEvents = await this.ruleService._eventRepository
      .createQueryBuilder('event')
      .where('event.status = :status', { status: EventStatus.FAILED })
      .andWhere('event.occurredAt >= :date', { date: maxAgeDate })
      .orderBy('event.occurredAt', 'ASC')
      .take(50)
      .getMany()

    this.logger.log(`Reprocessing ${failedEvents.length} failed events`)

    for (const event of failedEvents) {
      // Réinitialiser le statut
      event.status = EventStatus.PENDING
      event.processingError = undefined
      event.processingDetails = undefined
      await this.ruleService._eventRepository.save(event)

      // Retraiter l'événement
      await this.processEvent(event)
    }
  }

  async cleanupOldEvents(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

    const result = await this.ruleService._eventRepository
      .createQueryBuilder()
      .delete()
      .where('occurredAt < :cutoffDate', { cutoffDate })
      .andWhere('status = :status', { status: EventStatus.PROCESSED })
      .execute()

    this.logger.log(`Cleaned up ${result.affected} old events`)
    return result.affected || 0
  }

  async cleanupOldExecutions(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

    const result = await this.ruleService._executionRepository
      .createQueryBuilder()
      .delete()
      .where('executedAt < :cutoffDate', { cutoffDate })
      .execute()

    this.logger.log(`Cleaned up ${result.affected} old executions`)
    return result.affected || 0
  }

  // ===== MÉTHODES DE DÉCLENCHEMENT MANUEL =====

  async triggerEvent(
    type: TriggerType,
    event: string,
    data: Record<string, unknown>,
    source: string = 'manual',
    userId?: string
  ): Promise<NotificationEvent> {
    const notificationEvent = await this.ruleService.createEvent(type, event, data, source, userId)

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
      const conditionResult = this.ruleService.evaluateConditions(rule.conditions, testData)

      if (!conditionResult.result) {
        return {
          success: false,
          conditionResult,
          error: 'Conditions not met',
        }
      }

      // Préparer les variables
      const templateVariables = this.prepareTemplateVariables(testData, rule)

      // Générer un aperçu de la notification
      const config = rule.notification
      const title = this.ruleService.substituteVariables(config.titleTemplate, templateVariables)
      const message = this.ruleService.substituteVariables(
        config.messageTemplate,
        templateVariables
      )
      const actionUrl = config.actionUrl
        ? this.ruleService.substituteVariables(config.actionUrl, templateVariables)
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
