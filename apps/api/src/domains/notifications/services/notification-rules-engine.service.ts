import type { Prisma, NotificationRule } from '@prisma/client'
import { TenantPrismaService } from '../../../core/multi-tenant/tenant-prisma.service'
import { Injectable, Logger } from '@nestjs/common'
import { type EventEmitter2, OnEvent } from '@nestjs/event-emitter'
import { Cron, CronExpression } from '@nestjs/schedule'

import { CronExpressionParser } from 'cron-parser'
import * as mathjs from 'mathjs'

import { getErrorMessage } from '../../../core/common/utils'
import { OptimizedCacheService } from '../../../infrastructure/cache/redis-optimized.service'
import type {
  ActionExecutionResult,
  RuleExecutionContext as ExecutionRuleContext,
  NotificationActionResult,
} from '../types/notification-execution.types'
import type { RuleExecutionContext, RuleExecutionResult } from '../types/notification-types'
import type { NotificationActionExecutor } from './notification-action-executor.service'
import type { NotificationConditionEvaluator } from './notification-condition-evaluator.service'

import type {
  NotificationDeliveryOptions,
  NotificationDeliveryService,
} from './notification-delivery.service'

// Type definitions for entities that were removed
enum RuleType {
  EVENT = 'EVENT',
  SCHEDULE = 'SCHEDULE',
}

enum RuleStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

enum ExecutionStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  PARTIAL = 'PARTIAL',
  FAILED = 'FAILED',
  SKIPPED = 'SKIPPED',
}

enum ActionType {
  SEND_NOTIFICATION = 'SEND_NOTIFICATION',
  SEND_EMAIL = 'SEND_EMAIL',
  SEND_SMS = 'SEND_SMS',
}

interface NotificationCondition {
  id: string
  name: string
  ruleId: string
  isActive: boolean
  orderIndex: number
  logicalOperator?: 'AND' | 'OR' | 'NOT'
}

interface NotificationAction {
  id: string
  name: string
  type: ActionType
  ruleId: string
  isActive: boolean
  orderIndex: number
  delaySeconds?: number
  stopOnError?: boolean
}

interface NotificationExecution {
  id: string
  ruleId: string
  status: ExecutionStatus
  executedAt: Date
  triggerType: string
  triggerSource: string
  triggerData?: Record<string, unknown>
  metadata?: Record<string, unknown>
  conditionsPassed?: boolean
  conditionResults?: any[]
  errorMessage?: string
  errorDetails?: Record<string, unknown>
}

/**
 * Notification rules engine service
 */
@Injectable()
export class NotificationRulesEngineService {
  private readonly logger = new Logger(NotificationRulesEngineService.name)
  private readonly executionQueue: Map<string, RuleExecutionContext[]> = new Map()
  private readonly cooldownCache: Map<string, Date> = new Map()
  private isProcessing = false

  constructor(
    private readonly tenantPrisma: TenantPrismaService,
    private readonly actionExecutor: NotificationActionExecutor,
    private readonly conditionEvaluator: NotificationConditionEvaluator,
    private readonly deliveryService: NotificationDeliveryService,
    private readonly cacheService: OptimizedCacheService,
    private readonly eventEmitter: EventEmitter2
  ) {
    this.startQueueProcessor()
  }

  /** Client Prisma avec filtrage automatique par tenant */
  private get prisma() {
    return this.tenantPrisma.client
  }

  /**
   * Handle any event for rule processing
   */
  @OnEvent('**')
  async handleEvent(eventName: string, eventData: Record<string, unknown>): Promise<void> {
    // Skip notification system events to avoid loops
    if (eventName.startsWith('notification.')) {
      return
    }

    // Find rules triggered by this event
    const rules = await this.findEventRules(eventName)

    for (const rule of rules) {
      const context: RuleExecutionContext = {
        rule: rule as any,
        triggerType: 'event',
        triggerSource: eventName,
        triggerData: eventData,
        societeId: typeof eventData?.societeId === 'string' ? eventData.societeId : undefined,
        siteId: typeof eventData?.siteId === 'string' ? eventData.siteId : undefined,
        userId: typeof eventData?.userId === 'string' ? eventData.userId : undefined,
        metadata: {
          eventName,
          timestamp: new Date(),
        },
      }

      await this.queueRuleExecution(context)
    }
  }

  /**
   * Process scheduled rules
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async processScheduledRules(): Promise<void> {
    const now = new Date()

    // Find scheduled rules that should run now
    const rules = await this.prisma.notificationRule.findMany({
      where: {
        type: RuleType.SCHEDULE,
        enabled: true,
        isActive: true,
      },
    })

    for (const rule of rules) {
      if (this.shouldRunScheduledRule(rule, now)) {
        // Cast trigger JsonValue to proper type (schedule is in trigger field)
        const trigger = rule.trigger as Record<string, unknown> | null
        const cron = trigger?.cron as string | undefined

        const context: RuleExecutionContext = {
          rule: rule as any,
          triggerType: 'schedule',
          triggerSource: cron || 'manual',
          metadata: {
            scheduledTime: now,
          },
        }

        await this.queueRuleExecution(context)

        // Update next execution time
        const nextTime = this.calculateNextExecutionTime(rule)
        await this.prisma.notificationRule.update({
          where: { id: rule.id },
          data: {
            // nextExecutionAt field would need to be added to schema if needed
            updatedAt: new Date(),
          },
        })
      }
    }
  }

  /**
   * Execute a rule manually
   */
  async executeRuleManually(
    ruleId: string,
    context?: Partial<RuleExecutionContext>
  ): Promise<RuleExecutionResult> {
    const rule = await this.prisma.notificationRule.findUnique({
      where: { id: ruleId },
      include: { executions: true },
    })

    if (!rule) {
      throw new Error(`Rule ${ruleId} not found`)
    }

    const executionContext: RuleExecutionContext = {
      rule: rule as any,
      triggerType: 'manual',
      triggerSource: context?.userId || 'system',
      triggerData: context?.triggerData,
      societeId: context?.societeId,
      siteId: context?.siteId,
      userId: context?.userId,
      metadata: {
        ...context?.metadata,
        manual: true,
      },
    }

    return await this.executeRule(executionContext)
  }

  /**
   * Queue rule execution
   */
  private async queueRuleExecution(context: RuleExecutionContext): Promise<void> {
    const queueKey = context.rule.id

    // Check cooldown
    if (this.isInCooldown(context.rule)) {
      this.logger.debug(`Rule ${context.rule.name} is in cooldown`)
      return
    }

    // Add to queue
    if (!this.executionQueue.has(queueKey)) {
      this.executionQueue.set(queueKey, [])
    }
    this.executionQueue.get(queueKey)?.push(context)

    // Process queue if not already processing
    if (!this.isProcessing) {
      this.processQueue()
    }
  }

  /**
   * Process execution queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing) {
      return
    }

    this.isProcessing = true

    try {
      while (this.executionQueue.size > 0) {
        // Process rules by priority
        const sortedRules = Array.from(this.executionQueue.entries()).sort((a, b) => {
          const priorityA = this.getRulePriorityWeight(a[1][0]?.rule)
          const priorityB = this.getRulePriorityWeight(b[1][0]?.rule)
          return priorityB - priorityA
        })

        for (const [ruleId, contexts] of sortedRules) {
          const context = contexts.shift()

          if (!context) {
            this.executionQueue.delete(ruleId)
            continue
          }

          try {
            await this.executeRule(context)
          } catch (error) {
            this.logger.error(`Error executing rule ${ruleId}:`, error)
          }

          // Remove from queue if empty
          if (contexts.length === 0) {
            this.executionQueue.delete(ruleId)
          }
        }
      }
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * Execute a rule
   */
  private async executeRule(context: RuleExecutionContext): Promise<RuleExecutionResult> {
    const startTime = Date.now()
    const { rule } = context

    // Create execution record
    const execution = await this.prisma.notificationRuleExecution.create({
      data: {
        ruleId: rule.id,
        triggered: true,
        success: false,
        data: {
          status: ExecutionStatus.PROCESSING,
          triggerType: context.triggerType,
          triggerSource: context.triggerSource,
          triggerData: context.triggerData || {},
          metadata: context.metadata || {},
        } as Prisma.InputJsonValue,
      },
    })

    const result: RuleExecutionResult = {
      executionId: execution.id,
      ruleId: rule.id,
      status: ExecutionStatus.PENDING,
      conditionsPassed: false,
      actionsExecuted: 0,
      recipientsNotified: 0,
      errors: [],
      duration: 0,
    }

    try {
      // Evaluate conditions
      const conditionsPassed = await this.evaluateConditions(rule, context, execution)
      result.conditionsPassed = conditionsPassed

      if (conditionsPassed) {
        // Execute actions
        const actionResults = await this.executeActions(rule, context, execution)
        result.actionsExecuted = actionResults.executed
        result.recipientsNotified = actionResults.recipientsNotified
        result.errors.push(...actionResults.errors)

        // Determine final status
        if (actionResults.errors.length === 0) {
          result.status = ExecutionStatus.COMPLETED
        } else if (actionResults.executed > 0) {
          result.status = ExecutionStatus.PARTIAL
        } else {
          result.status = ExecutionStatus.FAILED
        }

        // Handle escalation if needed - escalation is in notification JSON field
        const notification = rule.notification as Record<string, unknown> | null
        const escalation = notification?.escalation as Record<string, unknown> | undefined
        const escalationEnabled = escalation?.enabled as boolean | undefined
        if (escalationEnabled && actionResults.errors.length > 0) {
          await this.handleEscalation(rule, context, execution)
        }
      } else {
        result.status = ExecutionStatus.SKIPPED
        this.logger.debug(`Rule ${rule.name} conditions not met`)
      }

      // Update rule statistics
      await this.prisma.notificationRule.update({
        where: { id: rule.id },
        data: {
          triggerCount: { increment: 1 },
          lastTriggered: new Date().toISOString(),
        },
      })

      // Update cooldown - cooldown is in trigger JSON field
      const trigger = rule.trigger as Record<string, unknown> | null
      const cooldown = trigger?.cooldown as Record<string, unknown> | undefined
      const cooldownEnabled = cooldown?.enabled as boolean | undefined
      if (cooldownEnabled) {
        this.setCooldown(rule)
      }
    } catch (error) {
      this.logger.error(`Error executing rule ${rule.name}:`, error)
      const errorMessage = getErrorMessage(error)
      result.status = ExecutionStatus.FAILED
      result.errors.push(errorMessage)

      // Update execution with error
      const existingData = execution.data as Record<string, unknown> || {}
      await this.prisma.notificationRuleExecution.update({
        where: { id: execution.id },
        data: {
          success: false,
          errorMessage,
          data: {
            ...existingData,
            status: ExecutionStatus.FAILED,
            errorDetails: {
              message: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : undefined,
            },
          } as Prisma.InputJsonValue,
        },
      })
    } finally {
      // Finalize execution
      result.duration = Date.now() - startTime
      const finalStatus = result.status === ExecutionStatus.COMPLETED || result.status === ExecutionStatus.PARTIAL
      const existingData = execution.data as Record<string, unknown> || {}
      await this.prisma.notificationRuleExecution.update({
        where: { id: execution.id },
        data: {
          success: finalStatus,
          executionTime: result.duration,
          data: {
            ...existingData,
            status: result.status,
            conditionsPassed: result.conditionsPassed,
            actionsExecuted: result.actionsExecuted,
            recipientsNotified: result.recipientsNotified,
          } as Prisma.InputJsonValue,
        },
      })

      // Emit execution completed event
      this.eventEmitter.emit('notification.rule.executed', {
        ruleId: rule.id,
        executionId: execution.id,
        result,
      })
    }

    return result
  }

  /**
   * Evaluate rule conditions
   */
  private async evaluateConditions(
    rule: NotificationRule,
    context: RuleExecutionContext,
    execution: any
  ): Promise<boolean> {
    // Load conditions from JSON field
    const conditions = (rule.conditions as any[]) || []

    // If no conditions, always pass
    if (conditions.length === 0) {
      return true
    }

    let overallResult = true
    const results: Array<{
      conditionId: string
      name: string
      result: boolean
      evaluationTime: number
      error?: string
    }> = []

    for (const condition of conditions as NotificationCondition[]) {
      const startTime = Date.now()
      let result = false
      let error: string | undefined

      try {
        // Cast to any since the JSON structure might not match exactly
        result = await this.conditionEvaluator.evaluate(condition as any, context)
      } catch (err) {
        error = getErrorMessage(err)
        this.logger.error(`Error evaluating condition ${condition.name}:`, err)
      }

      results.push({
        conditionId: condition.id,
        name: condition.name,
        result,
        evaluationTime: Date.now() - startTime,
        error,
      })

      // Apply logical operator
      if (condition.logicalOperator === 'AND') {
        overallResult = overallResult && result
      } else if (condition.logicalOperator === 'OR') {
        overallResult = overallResult || result
      } else if (condition.logicalOperator === 'NOT') {
        overallResult = overallResult && !result
      }

      // Short circuit if AND fails
      if (condition.logicalOperator === 'AND' && !result) {
        break
      }
    }

    return overallResult
  }

  /**
   * Execute rule actions
   */
  private async executeActions(
    rule: NotificationRule,
    context: RuleExecutionContext,
    execution: any
  ): Promise<{
    executed: number
    recipientsNotified: number
    errors: string[]
  }> {
    // Load actions from JSON field
    const actions = (rule.actions as any[]) || []

    let executed = 0
    let recipientsNotified = 0
    const errors: string[] = []

    for (const action of actions as NotificationAction[]) {
      // Apply delay if specified
      if (action.delaySeconds) {
        await new Promise((resolve) => setTimeout(resolve, action.delaySeconds! * 1000))
      }

      const startTime = Date.now()
      let success = false
      let result: ActionExecutionResult | undefined
      let error: string | undefined

      try {
        // Convert context to the expected format for action executor
        const executionContext: ExecutionRuleContext = {
          rule: {
            id: context.rule.id,
            name: context.rule.name,
            description: context.rule.description || undefined,
            isActive: context.rule.isActive,
          },
          triggerType: context.triggerType,
          triggerSource: context.triggerSource,
          triggerData: context.triggerData,
          societeId: context.societeId,
          siteId: context.siteId,
          userId: context.userId,
          metadata: context.metadata,
        }

        // Cast to any since the JSON structure might not match exactly
        result = await this.actionExecutor.execute(action as any, executionContext, execution)
        success = true
        executed++

        // Track recipients for notification actions
        if (action.type === ActionType.SEND_NOTIFICATION && result) {
          const notificationResult = result as NotificationActionResult
          recipientsNotified += notificationResult.recipientsNotified || 0
        }
      } catch (err) {
        error = getErrorMessage(err)
        errors.push(`Action ${action.name}: ${error}`)
        this.logger.error(`Error executing action ${action.name}:`, err)

        // Stop on error if configured
        if (action.stopOnError) {
          break
        }
      }
    }

    return {
      executed,
      recipientsNotified,
      errors,
    }
  }

  /**
   * Handle escalation
   */
  private async handleEscalation(
    rule: NotificationRule,
    context: RuleExecutionContext,
    execution: any
  ): Promise<void> {
    // Cast escalation JsonValue to proper type - escalation is in notification JSON field
    const notification = rule.notification as Record<string, unknown> | null
    const escalation = notification?.escalation as Record<string, unknown> | undefined
    const levels = escalation?.levels as Array<{
      condition?: string
      delayMinutes: number
      recipients: { users?: string[]; emails?: string[] }
      channels?: string[]
    }> | undefined

    if (!levels) {
      return
    }

    for (const level of levels) {
      // Check if escalation condition is met
      if (level.condition) {
        try {
          // Use mathjs for safe expression evaluation
          const scope: Record<string, unknown> = {
            context,
            execution,
            // Add commonly used functions
            now: Date.now(),
            minutesSince: (timestamp: number) => (Date.now() - timestamp) / 60000,
            hoursSince: (timestamp: number) => (Date.now() - timestamp) / 3600000,
          }

          const result = mathjs.evaluate(level.condition, scope)
          if (!result) {
            continue
          }
        } catch (error) {
          this.logger.error('Error evaluating escalation condition:', error)
          continue
        }
      }

      // Wait for delay
      if (level.delayMinutes > 0) {
        await new Promise((resolve) => setTimeout(resolve, level.delayMinutes * 60 * 1000))
      }

      // Send escalation notifications
      const recipients = [...(level.recipients.users || []), ...(level.recipients.emails || [])]

      const notificationOptions: NotificationDeliveryOptions = {
        title: `Escalation: ${rule.name}`,
        body: `Rule execution requires attention. Execution ID: ${execution.id}`,
        channels: ((level.channels as string[]) || ['email']).filter(
          (channel): channel is 'email' | 'sms' | 'push' | 'in_app' =>
            ['email', 'sms', 'push', 'in_app'].includes(channel)
        ),
        recipients,
        priority: 'high',
        metadata: {
          ruleId: rule.id,
          executionId: execution.id,
          escalationLevel: level,
        },
      }

      await this.deliveryService.sendNotification(notificationOptions)
    }
  }

  /**
   * Find rules triggered by event
   */
  private async findEventRules(eventName: string): Promise<NotificationRule[]> {
    const cacheKey = `rules:event:${eventName}`
    const cached = await this.cacheService.get<NotificationRule[]>(cacheKey)

    if (cached) {
      return cached
    }

    const rules = await this.prisma.notificationRule.findMany({
      where: {
        type: RuleType.EVENT,
        enabled: true,
        isActive: true,
      },
      include: { executions: true },
    })

    // Filter by eventName from trigger JSON field
    const filteredRules = rules.filter((rule) => {
      const trigger = rule.trigger as any
      return trigger?.eventName === eventName
    })

    // Cache for 5 minutes
    await this.cacheService.set(cacheKey, filteredRules, 300)

    return filteredRules
  }

  /**
   * Check if scheduled rule should run
   */
  private shouldRunScheduledRule(rule: NotificationRule, now: Date): boolean {
    // Cast trigger JsonValue to proper type (schedule is in trigger field)
    const trigger = rule.trigger as Record<string, unknown> | null
    const cron = trigger?.cron as string | undefined

    if (!cron) {
      return false
    }

    try {
      const timezone = trigger?.timezone as string | undefined
      const lastExecutedAt = trigger?.lastExecutedAt as string | undefined
      const interval = CronExpressionParser.parse(cron, {
        currentDate: lastExecutedAt ? new Date(lastExecutedAt) : rule.createdAt,
        tz: timezone,
      })

      const nextDate = interval.next().toDate()
      return nextDate <= now
    } catch (error) {
      this.logger.error(`Invalid cron expression for rule ${rule.name}:`, error)
      return false
    }
  }

  /**
   * Calculate next execution time for scheduled rule
   */
  private calculateNextExecutionTime(rule: NotificationRule): Date | null {
    // Cast trigger JsonValue to proper type (schedule is in trigger field)
    const trigger = rule.trigger as Record<string, unknown> | null
    const cron = trigger?.cron as string | undefined

    if (!cron) {
      return null
    }

    try {
      const timezone = trigger?.timezone as string | undefined
      const interval = CronExpressionParser.parse(cron, {
        currentDate: new Date(),
        tz: timezone,
      })

      return interval.next().toDate()
    } catch (error) {
      this.logger.error(`Invalid cron expression for rule ${rule.name}:`, error)
      return null
    }
  }

  /**
   * Check if rule is in cooldown
   */
  private isInCooldown(rule: NotificationRule): boolean {
    // Cast trigger JsonValue to proper type (cooldown is in trigger field)
    const trigger = rule.trigger as Record<string, unknown> | null
    const cooldown = trigger?.cooldown as Record<string, unknown> | undefined
    const enabled = cooldown?.enabled as boolean | undefined

    if (!enabled) {
      return false
    }

    const cooldownKey = this.getCooldownKey(rule)
    const lastExecution = this.cooldownCache.get(cooldownKey)

    if (!lastExecution) {
      return false
    }

    const cooldownEnd = new Date(lastExecution)
    const minutes = cooldown?.minutes as number | undefined
    if (minutes) {
      cooldownEnd.setMinutes(cooldownEnd.getMinutes() + minutes)
    }

    return new Date() < cooldownEnd
  }

  /**
   * Set cooldown for rule
   */
  private setCooldown(rule: NotificationRule): void {
    // Cast trigger JsonValue to proper type (cooldown is in trigger field)
    const trigger = rule.trigger as Record<string, unknown> | null
    const cooldown = trigger?.cooldown as Record<string, unknown> | undefined
    const enabled = cooldown?.enabled as boolean | undefined

    if (!enabled) {
      return
    }

    const cooldownKey = this.getCooldownKey(rule)
    this.cooldownCache.set(cooldownKey, new Date())
  }

  /**
   * Get cooldown key for rule
   */
  private getCooldownKey(rule: NotificationRule): string {
    // Cast trigger JsonValue to proper type (cooldown is in trigger field)
    const trigger = rule.trigger as Record<string, unknown> | null
    const cooldown = trigger?.cooldown as Record<string, unknown> | undefined
    const cooldownKey = cooldown?.key as string | undefined

    if (cooldownKey) {
      return cooldownKey
    }

    let key = `rule:${rule.id}`

    const perUser = cooldown?.perUser as boolean | undefined
    if (perUser) {
      key += ':user'
    }

    const perResource = cooldown?.perResource as boolean | undefined
    if (perResource) {
      key += ':resource'
    }

    return key
  }

  /**
   * Start queue processor
   */
  private startQueueProcessor(): void {
    setInterval(() => {
      if (this.executionQueue.size > 0 && !this.isProcessing) {
        this.processQueue()
      }
    }, 1000) // Check every second
  }

  /**
   * Get priority weight for a rule
   */
  private getRulePriorityWeight(rule?: NotificationRule): number {
    if (!rule) return 0
    // Extract priority from trigger or use default
    const trigger = rule.trigger as any
    return trigger?.priority || 0
  }
}

