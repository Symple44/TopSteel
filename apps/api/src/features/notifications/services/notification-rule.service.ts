import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import type { Repository } from 'typeorm'
import {
  ConditionOperator,
  EventStatus,
  ExecutionStatus,
  NotificationEvent,
  NotificationRule,
  NotificationRuleExecution,
  type TriggerType,
} from '../entities'

@Injectable()
export class NotificationRuleService {
  constructor(
    @InjectRepository(NotificationRule)
    private readonly _ruleRepository: Repository<NotificationRule>,
    @InjectRepository(NotificationRuleExecution)
    public readonly _executionRepository: Repository<NotificationRuleExecution>,
    @InjectRepository(NotificationEvent)
    public readonly _eventRepository: Repository<NotificationEvent>
  ) {}

  // ===== GESTION DES RÈGLES =====

  async createRule(ruleData: Partial<NotificationRule>): Promise<NotificationRule> {
    // Validation des données
    if (!ruleData.name || !ruleData.trigger || !ruleData.notification) {
      throw new BadRequestException('Nom, déclencheur et configuration de notification sont requis')
    }

    // Vérifier l'unicité du nom
    const existingRule = await this._ruleRepository.findOne({
      where: { name: ruleData.name },
    })
    if (existingRule) {
      throw new BadRequestException('Une règle avec ce nom existe déjà')
    }

    const rule = this._ruleRepository.create({
      ...ruleData,
      isActive: ruleData.isActive ?? true,
      triggerCount: 0,
      conditions: ruleData.conditions || [],
    })

    return await this._ruleRepository.save(rule)
  }

  async updateRule(id: string, updates: Partial<NotificationRule>): Promise<NotificationRule> {
    const rule = await this._ruleRepository.findOne({ where: { id } })
    if (!rule) {
      throw new NotFoundException('Règle de notification non trouvée')
    }

    // Vérifier l'unicité du nom si modifié
    if (updates.name && updates.name !== rule.name) {
      const existingRule = await this._ruleRepository.findOne({
        where: { name: updates.name },
      })
      if (existingRule) {
        throw new BadRequestException('Une règle avec ce nom existe déjà')
      }
    }

    Object.assign(rule, updates)
    rule.lastModified = new Date()

    return await this._ruleRepository.save(rule)
  }

  async deleteRule(id: string): Promise<void> {
    const rule = await this._ruleRepository.findOne({ where: { id } })
    if (!rule) {
      throw new NotFoundException('Règle de notification non trouvée')
    }

    await this._ruleRepository.remove(rule)
  }

  async getRuleById(id: string): Promise<NotificationRule> {
    const rule = await this._ruleRepository.findOne({
      where: { id },
      relations: ['executions'],
    })
    if (!rule) {
      throw new NotFoundException('Règle de notification non trouvée')
    }
    return rule
  }

  async getAllRules(filters?: {
    isActive?: boolean
    triggerType?: TriggerType
    createdBy?: string
  }): Promise<NotificationRule[]> {
    const query = this._ruleRepository.createQueryBuilder('rule')

    if (filters?.isActive !== undefined) {
      query.andWhere('rule.isActive = :isActive', { isActive: filters.isActive })
    }

    if (filters?.triggerType) {
      query.andWhere("rule.trigger ->> 'type' = :triggerType", { triggerType: filters.triggerType })
    }

    if (filters?.createdBy) {
      query.andWhere('rule.createdBy = :createdBy', { createdBy: filters.createdBy })
    }

    return await query.orderBy('rule.createdAt', 'DESC').getMany()
  }

  async toggleRuleStatus(id: string): Promise<NotificationRule> {
    const rule = await this._ruleRepository.findOne({ where: { id } })
    if (!rule) {
      throw new NotFoundException('Règle de notification non trouvée')
    }

    rule.isActive = !rule.isActive
    rule.lastModified = new Date()

    return await this._ruleRepository.save(rule)
  }

  // ===== GESTION DES ÉVÉNEMENTS =====

  async createEvent(
    type: TriggerType,
    event: string,
    data: Record<string, unknown>,
    source?: string,
    userId?: string,
    entityType?: string,
    entityId?: string
  ): Promise<NotificationEvent> {
    const notificationEvent = NotificationEvent.create(
      type,
      event,
      data,
      source,
      userId,
      entityType,
      entityId
    )

    return await this._eventRepository.save(notificationEvent)
  }

  async getEventById(id: string): Promise<NotificationEvent> {
    const event = await this._eventRepository.findOne({ where: { id } })
    if (!event) {
      throw new NotFoundException('Événement non trouvé')
    }
    return event
  }

  async getEvents(filters?: {
    type?: TriggerType
    event?: string
    status?: EventStatus
    userId?: string
    limit?: number
    offset?: number
  }): Promise<{ events: NotificationEvent[]; total: number }> {
    const query = this._eventRepository.createQueryBuilder('event')

    if (filters?.type) {
      query.andWhere('event.type = :type', { type: filters.type })
    }

    if (filters?.event) {
      query.andWhere('event.event = :event', { event: filters.event })
    }

    if (filters?.status) {
      query.andWhere('event.status = :status', { status: filters.status })
    }

    if (filters?.userId) {
      query.andWhere('event.userId = :userId', { userId: filters.userId })
    }

    const total = await query.getCount()

    const events = await query
      .orderBy('event.occurredAt', 'DESC')
      .limit(filters?.limit || 50)
      .offset(filters?.offset || 0)
      .getMany()

    return { events, total }
  }

  // ===== GESTION DES EXÉCUTIONS =====

  async createExecution(execution: NotificationRuleExecution): Promise<NotificationRuleExecution> {
    return await this._executionRepository.save(execution)
  }

  async getExecutionsByRule(
    ruleId: string,
    limit: number = 50
  ): Promise<NotificationRuleExecution[]> {
    return await this._executionRepository.find({
      where: { ruleId },
      order: { executedAt: 'DESC' },
      take: limit,
      relations: ['notification'],
    })
  }

  async getExecutionStats(ruleId?: string): Promise<{
    total: number
    success: number
    failed: number
    skipped: number
    successRate: number
  }> {
    const query = this._executionRepository.createQueryBuilder('execution')

    if (ruleId) {
      query.where('execution.ruleId = :ruleId', { ruleId })
    }

    const executions = await query.getMany()
    const total = executions.length
    const success = executions.filter((e) => e.status === ExecutionStatus.SUCCESS).length
    const failed = executions.filter((e) => e.status === ExecutionStatus.FAILED).length
    const skipped = executions.filter((e) => e.status === ExecutionStatus.SKIPPED).length
    const successRate = total > 0 ? (success / total) * 100 : 0

    return {
      total,
      success,
      failed,
      skipped,
      successRate: Math.round(successRate * 100) / 100,
    }
  }

  // ===== ÉVALUATION DES CONDITIONS =====

  evaluateConditions(
    conditions: unknown[],
    eventData: Record<string, unknown>
  ): { result: boolean; details: Record<string, unknown> } {
    if (!conditions || conditions.length === 0) {
      return { result: true, details: {} }
    }

    const results: Record<string, unknown> = {}
    let finalResult = true

    for (let i = 0; i < conditions.length; i++) {
      const condition = conditions[i]
      const cond = condition as {
        field: string
        value: unknown
        operator: string
        logic?: string
        id?: string
      }
      const conditionResult = this.evaluateCondition(condition, eventData)
      results[cond.id || `condition_${i}`] = conditionResult

      if (i === 0) {
        finalResult = conditionResult
      } else {
        const logic = cond.logic || 'AND'
        if (logic === 'AND') {
          finalResult = finalResult && conditionResult
        } else if (logic === 'OR') {
          finalResult = finalResult || conditionResult
        }
      }
    }

    return { result: finalResult, details: results }
  }

  private evaluateCondition(condition: unknown, eventData: Record<string, unknown>): boolean {
    const cond = condition as {
      field: string
      value: unknown
      operator: string
      logic?: string
      id?: string
    }
    const fieldValue = this.getFieldValue(cond.field, eventData)
    const conditionValue = cond.value

    switch (cond.operator) {
      case ConditionOperator.EQUALS:
        return fieldValue === conditionValue

      case ConditionOperator.NOT_EQUALS:
        return fieldValue !== conditionValue

      case ConditionOperator.CONTAINS:
        return typeof fieldValue === 'string' && fieldValue.includes(conditionValue)

      case ConditionOperator.NOT_CONTAINS:
        return typeof fieldValue === 'string' && !fieldValue.includes(conditionValue)

      case ConditionOperator.STARTS_WITH:
        return typeof fieldValue === 'string' && fieldValue.startsWith(conditionValue)

      case ConditionOperator.ENDS_WITH:
        return typeof fieldValue === 'string' && fieldValue.endsWith(conditionValue)

      case ConditionOperator.GREATER_THAN:
        return Number(fieldValue) > Number(conditionValue)

      case ConditionOperator.LESS_THAN:
        return Number(fieldValue) < Number(conditionValue)

      case ConditionOperator.GREATER_EQUAL:
        return Number(fieldValue) >= Number(conditionValue)

      case ConditionOperator.LESS_EQUAL:
        return Number(fieldValue) <= Number(conditionValue)

      case ConditionOperator.IN:
        return Array.isArray(conditionValue) && conditionValue.includes(fieldValue)

      case ConditionOperator.NOT_IN:
        return Array.isArray(conditionValue) && !conditionValue.includes(fieldValue)

      case ConditionOperator.IS_NULL:
        return fieldValue === null || fieldValue === undefined

      case ConditionOperator.IS_NOT_NULL:
        return fieldValue !== null && fieldValue !== undefined

      case ConditionOperator.REGEX:
        try {
          const regex = new RegExp(conditionValue)
          return regex.test(String(fieldValue))
        } catch {
          return false
        }

      default:
        return false
    }
  }

  private getFieldValue(field: string, data: Record<string, unknown>): unknown {
    // Support pour les champs imbriqués (ex: "user.profile.name")
    const fieldParts = field.split('.')
    let value = data

    for (const part of fieldParts) {
      if (
        value &&
        typeof value === 'object' &&
        value !== null &&
        part in (value as Record<string, unknown>)
      ) {
        value = (value as Record<string, unknown>)[part]
      } else {
        return undefined
      }
    }

    return value
  }

  // ===== SUBSTITUTION DE VARIABLES =====

  substituteVariables(template: string, variables: Record<string, unknown>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] !== undefined ? String(variables[key]) : match
    })
  }

  // ===== STATISTIQUES =====

  async getDashboardStats(): Promise<{
    totalRules: number
    activeRules: number
    totalEvents: number
    pendingEvents: number
    totalExecutions: number
    successRate: number
    recentActivity: unknown[]
  }> {
    const [totalRules, activeRules] = await Promise.all([
      this._ruleRepository.count(),
      this._ruleRepository.count({ where: { isActive: true } }),
    ])

    const [totalEvents, pendingEvents] = await Promise.all([
      this._eventRepository.count(),
      this._eventRepository.count({ where: { status: EventStatus.PENDING } }),
    ])

    const executionStats = await this.getExecutionStats()

    // Activité récente (dernières 24h)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    const recentActivity = await this._eventRepository.find({
      where: {
        occurredAt: { $gte: yesterday } as unknown,
      },
      order: { occurredAt: 'DESC' },
      take: 10,
    })

    return {
      totalRules,
      activeRules,
      totalEvents,
      pendingEvents,
      totalExecutions: executionStats.total,
      successRate: executionStats.successRate,
      recentActivity,
    }
  }
}
