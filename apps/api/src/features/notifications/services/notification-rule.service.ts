/**
 * Service migré de TypeORM vers Prisma
 * Migration automatique + ajustements manuels
 */

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../../core/database/prisma/prisma.service'
import type { Prisma, NotificationRule, NotificationRuleExecution, NotificationEvent } from '@prisma/client'
import {
  ConditionOperator,
  EventStatus,
  ExecutionStatus,
  type TriggerType,
} from '../entities'

@Injectable()
export class NotificationRuleService {
  constructor(
    private readonly prisma: PrismaService
  ) {}

  // ===== GESTION DES RÈGLES =====

  async createRule(ruleData: Partial<NotificationRule>): Promise<NotificationRule> {
    // Validation des données
    if (!ruleData.name || !ruleData.trigger || !ruleData.notification || !ruleData.societeId || !ruleData.type) {
      throw new BadRequestException('Nom, societeId, type, déclencheur et configuration de notification sont requis')
    }

    // Vérifier l'unicité du nom
    const existingRule = await this.prisma.notificationRule.findFirst({
      where: { name: ruleData.name, societeId: ruleData.societeId },
    })
    if (existingRule) {
      throw new BadRequestException('Une règle avec ce nom existe déjà')
    }

    return await this.prisma.notificationRule.create({
      data: {
        name: ruleData.name,
        societeId: ruleData.societeId,
        type: ruleData.type,
        description: ruleData.description,
        enabled: ruleData.enabled ?? true,
        isActive: ruleData.isActive ?? true,
        trigger: (ruleData.trigger || {}) as Prisma.InputJsonValue,
        conditions: (ruleData.conditions || []) as Prisma.InputJsonValue,
        actions: (ruleData.actions || []) as Prisma.InputJsonValue,
        notification: (ruleData.notification || {}) as Prisma.InputJsonValue,
        triggerCount: 0,
      },
    })
  }

  async updateRule(id: string, updates: Partial<NotificationRule>): Promise<NotificationRule> {
    const rule = await this.prisma.notificationRule.findUnique({ where: { id } })
    if (!rule) {
      throw new NotFoundException('Règle de notification non trouvée')
    }

    // Vérifier l'unicité du nom si modifié
    if (updates.name && updates.name !== rule.name) {
      const existingRule = await this.prisma.notificationRule.findFirst({
        where: { name: updates.name, societeId: rule.societeId, id: { not: id } },
      })
      if (existingRule) {
        throw new BadRequestException('Une règle avec ce nom existe déjà')
      }
    }

    return await this.prisma.notificationRule.update({
      where: { id },
      data: {
        name: updates.name,
        description: updates.description,
        type: updates.type,
        enabled: updates.enabled,
        isActive: updates.isActive,
        trigger: updates.trigger ? (updates.trigger as Prisma.InputJsonValue) : undefined,
        conditions: updates.conditions ? (updates.conditions as Prisma.InputJsonValue) : undefined,
        actions: updates.actions ? (updates.actions as Prisma.InputJsonValue) : undefined,
        notification: updates.notification ? (updates.notification as Prisma.InputJsonValue) : undefined,
      },
    })
  }

  async deleteRule(id: string): Promise<void> {
    const rule = await this.prisma.notificationRule.findUnique({ where: { id } })
    if (!rule) {
      throw new NotFoundException('Règle de notification non trouvée')
    }

    await this.prisma.notificationRule.delete({ where: { id } })
  }

  async getRuleById(id: string): Promise<NotificationRule> {
    const rule = await this.prisma.notificationRule.findUnique({
      where: { id },
      include: { executions: true },
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
    societeId?: string
  }): Promise<NotificationRule[]> {
    const where: Prisma.NotificationRuleWhereInput = {}

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive
    }

    if (filters?.societeId) {
      where.societeId = filters.societeId
    }

    const rules = await this.prisma.notificationRule.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    // Filter by triggerType from JSON field if provided
    if (filters?.triggerType) {
      return rules.filter((rule) => {
        const trigger = rule.trigger as any
        return trigger?.type === filters.triggerType
      })
    }

    return rules
  }

  async toggleRuleStatus(id: string): Promise<NotificationRule> {
    const rule = await this.prisma.notificationRule.findUnique({ where: { id } })
    if (!rule) {
      throw new NotFoundException('Règle de notification non trouvée')
    }

    return await this.prisma.notificationRule.update({
      where: { id },
      data: {
        isActive: !rule.isActive,
      },
    })
  }

  // ===== GESTION DES ÉVÉNEMENTS =====

  async createEvent(
    type: TriggerType,
    event: string,
    data: Record<string, unknown>,
    source?: string,
    userId?: string,
    entityType?: string,
    entityId?: string,
    societeId?: string
  ): Promise<NotificationEvent> {
    if (!societeId) {
      throw new BadRequestException('societeId est requis pour créer un événement')
    }

    return await this.prisma.notificationEvent.create({
      data: {
        societeId,
        type: type.toString(),
        source: source || 'system',
        data: (data || {}) as Prisma.InputJsonValue,
        processed: false,
      },
    })
  }

  async getEventById(id: string): Promise<NotificationEvent> {
    const event = await this.prisma.notificationEvent.findUnique({ where: { id } })
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
    societeId?: string
    limit?: number
    offset?: number
  }): Promise<{ events: NotificationEvent[]; total: number }> {
    const where: Prisma.NotificationEventWhereInput = {}

    if (filters?.type) {
      where.type = filters.type.toString()
    }

    if (filters?.societeId) {
      where.societeId = filters.societeId
    }

    // For status, we map to the processed field
    if (filters?.status === EventStatus.PROCESSED) {
      where.processed = true
    } else if (filters?.status === EventStatus.PENDING) {
      where.processed = false
    }

    const [events, total] = await Promise.all([
      this.prisma.notificationEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
      }),
      this.prisma.notificationEvent.count({ where }),
    ])

    return { events, total }
  }

  // ===== GESTION DES EXÉCUTIONS =====

  async createExecution(executionData: Partial<NotificationRuleExecution>): Promise<NotificationRuleExecution> {
    if (!executionData.ruleId) {
      throw new BadRequestException('ruleId est requis pour créer une exécution')
    }

    return await this.prisma.notificationRuleExecution.create({
      data: {
        ruleId: executionData.ruleId,
        notificationId: executionData.notificationId,
        triggered: executionData.triggered ?? false,
        success: executionData.success ?? false,
        errorMessage: executionData.errorMessage,
        executionTime: executionData.executionTime,
        data: (executionData.data || {}) as Prisma.InputJsonValue,
      },
    })
  }

  async getExecutionsByRule(
    ruleId: string,
    limit: number = 50
  ): Promise<NotificationRuleExecution[]> {
    return await this.prisma.notificationRuleExecution.findMany({
      where: { ruleId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { notification: true },
    })
  }

  async getExecutionStats(ruleId?: string): Promise<{
    total: number
    success: number
    failed: number
    skipped: number
    successRate: number
  }> {
    const where: Prisma.NotificationRuleExecutionWhereInput = {}

    if (ruleId) {
      where.ruleId = ruleId
    }

    const executions = await this.prisma.notificationRuleExecution.findMany({ where })
    const total = executions.length
    const success = executions.filter((e) => e.success).length
    const failed = executions.filter((e) => !e.success && e.triggered).length
    const skipped = executions.filter((e) => !e.triggered).length
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
        return typeof fieldValue === 'string' && fieldValue.includes(conditionValue as string)

      case ConditionOperator.NOT_CONTAINS:
        return typeof fieldValue === 'string' && !fieldValue.includes(conditionValue as string)

      case ConditionOperator.STARTS_WITH:
        return typeof fieldValue === 'string' && fieldValue.startsWith(conditionValue as string)

      case ConditionOperator.ENDS_WITH:
        return typeof fieldValue === 'string' && fieldValue.endsWith(conditionValue as string)

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
          const regex = new RegExp(conditionValue as string)
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
    let value: unknown = data

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

  async getDashboardStats(societeId?: string): Promise<{
    totalRules: number
    activeRules: number
    totalEvents: number
    pendingEvents: number
    totalExecutions: number
    successRate: number
    recentActivity: unknown[]
  }> {
    const ruleWhere: Prisma.NotificationRuleWhereInput = societeId ? { societeId } : {}
    const eventWhere: Prisma.NotificationEventWhereInput = societeId ? { societeId } : {}

    const [totalRules, activeRules] = await Promise.all([
      this.prisma.notificationRule.count({ where: ruleWhere }),
      this.prisma.notificationRule.count({ where: { ...ruleWhere, isActive: true } }),
    ])

    const [totalEvents, pendingEvents] = await Promise.all([
      this.prisma.notificationEvent.count({ where: eventWhere }),
      this.prisma.notificationEvent.count({ where: { ...eventWhere, processed: false } }),
    ])

    const executionStats = await this.getExecutionStats()

    // Activité récente (dernières 24h)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    const recentActivity = await this.prisma.notificationEvent.findMany({
      where: {
        ...eventWhere,
        createdAt: { gte: yesterday },
      },
      orderBy: { createdAt: 'desc' },
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
