import { Injectable, Logger } from '@nestjs/common'
import { type EventEmitter2, OnEvent } from '@nestjs/event-emitter'
import { Cron, CronExpression } from '@nestjs/schedule'
import { InjectRepository } from '@nestjs/typeorm'
import { CronExpressionParser } from 'cron-parser'
import * as mathjs from 'mathjs'
import type { Repository } from 'typeorm'
import { getErrorMessage } from '../../../core/common/utils'
import type { OptimizedCacheService } from '../../../infrastructure/cache/redis-optimized.service'
import { ActionType, NotificationAction } from '../entities/notification-action.entity'
import { NotificationCondition } from '../entities/notification-condition.entity'
import { ExecutionStatus, NotificationExecution } from '../entities/notification-execution.entity'
import { NotificationRule, RuleStatus, RuleType } from '../entities/notification-rule.entity'
import type {
  ActionExecutionResult,
  NotificationActionResult,
  NotificationConfig,
} from '../types/notification-execution.types'
import type { RuleExecutionContext, RuleExecutionResult } from '../types/notification-types'
import type { NotificationActionExecutor } from './notification-action-executor.service'
import type { NotificationConditionEvaluator } from './notification-condition-evaluator.service'
import type {
  NotificationDeliveryOptions,
  NotificationDeliveryService,
} from './notification-delivery.service'

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
    @InjectRepository(NotificationRule, 'auth')
    private readonly ruleRepository: Repository<NotificationRule>,
    @InjectRepository(NotificationCondition, 'auth')
    private readonly conditionRepository: Repository<NotificationCondition>,
    @InjectRepository(NotificationAction, 'auth')
    private readonly actionRepository: Repository<NotificationAction>,
    @InjectRepository(NotificationExecution, 'auth')
    private readonly executionRepository: Repository<NotificationExecution>,
    private readonly actionExecutor: NotificationActionExecutor,
    private readonly conditionEvaluator: NotificationConditionEvaluator,
    private readonly deliveryService: NotificationDeliveryService,
    private readonly cacheService: OptimizedCacheService,
    private readonly eventEmitter: EventEmitter2
  ) {
    this.startQueueProcessor()
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
        rule,
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
    const rules = await this.ruleRepository.find({
      where: {
        type: RuleType.SCHEDULE,
        status: RuleStatus.ACTIVE,
      },
    })

    for (const rule of rules) {
      if (this.shouldRunScheduledRule(rule, now)) {
        const context: RuleExecutionContext = {
          rule,
          triggerType: 'schedule',
          triggerSource: rule.schedule?.cron || 'manual',
          metadata: {
            scheduledTime: now,
          },
        }

        await this.queueRuleExecution(context)

        // Update next execution time
        const nextTime = this.calculateNextExecutionTime(rule)
        rule.nextExecutionAt = nextTime ?? undefined
        await this.ruleRepository.save(rule)
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
    const rule = await this.ruleRepository.findOne({
      where: { id: ruleId },
      relations: ['conditions', 'actions'],
    })

    if (!rule) {
      throw new Error(`Rule ${ruleId} not found`)
    }

    const executionContext: RuleExecutionContext = {
      rule,
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
      this.logger.debug(`Rule ${context.rule.code} is in cooldown`)
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
          const priorityA = a[1][0]?.rule.getPriorityWeight() || 0
          const priorityB = b[1][0]?.rule.getPriorityWeight() || 0
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
    const execution = this.executionRepository.create({
      ruleId: rule.id,
      status: ExecutionStatus.PROCESSING,
      executedAt: new Date(),
      triggerType: context.triggerType,
      triggerSource: context.triggerSource,
      triggerData: context.triggerData,
      metadata: context.metadata,
    })

    await this.executionRepository.save(execution)

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
      execution.conditionsPassed = conditionsPassed
      result.conditionsPassed = conditionsPassed

      if (conditionsPassed) {
        // Execute actions
        const actionResults = await this.executeActions(rule, context, execution)
        result.actionsExecuted = actionResults.executed
        result.recipientsNotified = actionResults.recipientsNotified
        result.errors.push(...actionResults.errors)

        // Determine final status
        if (actionResults.errors.length === 0) {
          execution.status = ExecutionStatus.COMPLETED
          result.status = ExecutionStatus.COMPLETED
        } else if (actionResults.executed > 0) {
          execution.status = ExecutionStatus.PARTIAL
          result.status = ExecutionStatus.PARTIAL
        } else {
          execution.status = ExecutionStatus.FAILED
          result.status = ExecutionStatus.FAILED
        }

        // Handle escalation if needed
        if (rule.escalation?.enabled && actionResults.errors.length > 0) {
          await this.handleEscalation(rule, context, execution)
        }
      } else {
        execution.status = ExecutionStatus.SKIPPED
        result.status = ExecutionStatus.SKIPPED
        this.logger.debug(`Rule ${rule.code} conditions not met`)
      }

      // Update rule statistics
      rule.executionCount++
      rule.lastExecutedAt = new Date()
      await this.ruleRepository.save(rule)

      // Update cooldown
      if (rule.cooldown?.enabled) {
        this.setCooldown(rule)
      }
    } catch (error) {
      this.logger.error(`Error executing rule ${rule.code}:`, error)
      execution.status = ExecutionStatus.FAILED
      const errorMessage = getErrorMessage(error)
      execution.errorMessage = errorMessage
      execution.errorDetails = error as Record<string, unknown>
      result.status = ExecutionStatus.FAILED
      result.errors.push(errorMessage)
    } finally {
      // Finalize execution
      execution.markCompleted(execution.status)
      result.duration = Date.now() - startTime
      await this.executionRepository.save(execution)

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
    execution: NotificationExecution
  ): Promise<boolean> {
    // Load conditions if not already loaded
    if (!rule.conditions || rule.conditions.length === 0) {
      rule.conditions = await this.conditionRepository.find({
        where: { ruleId: rule.id, isActive: true },
        order: { orderIndex: 'ASC' },
      })
    }

    // If no conditions, always pass
    if (rule.conditions.length === 0) {
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

    for (const condition of rule.conditions as NotificationCondition[]) {
      const startTime = Date.now()
      let result = false
      let error: string | undefined

      try {
        result = await this.conditionEvaluator.evaluate(condition, context)
        condition.updateStatistics(result)
        await this.conditionRepository.save(condition)
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

    execution.conditionResults = results
    return overallResult
  }

  /**
   * Execute rule actions
   */
  private async executeActions(
    rule: NotificationRule,
    context: RuleExecutionContext,
    execution: NotificationExecution
  ): Promise<{
    executed: number
    recipientsNotified: number
    errors: string[]
  }> {
    // Load actions if not already loaded
    if (!rule.actions || rule.actions.length === 0) {
      rule.actions = await this.actionRepository.find({
        where: { ruleId: rule.id, isActive: true },
        order: { orderIndex: 'ASC' },
      })
    }

    let executed = 0
    let recipientsNotified = 0
    const errors: string[] = []

    for (const action of rule.actions as NotificationAction[]) {
      // Apply delay if specified
      if (action.delaySeconds) {
        await new Promise((resolve) => setTimeout(resolve, action.delaySeconds! * 1000))
      }

      const startTime = Date.now()
      let success = false
      let result: ActionExecutionResult | undefined
      let error: string | undefined

      try {
        result = await this.actionExecutor.execute(action, context, execution)
        success = true
        executed++

        // Track recipients for notification actions
        if (action.type === ActionType.SEND_NOTIFICATION && result) {
          const notificationResult = result as NotificationActionResult
          recipientsNotified += notificationResult.recipientsNotified || 0
        }

        action.updateStatistics(true)
      } catch (err) {
        error = getErrorMessage(err)
        errors.push(`Action ${action.name}: ${error}`)
        this.logger.error(`Error executing action ${action.name}:`, err)
        action.updateStatistics(false, error)

        // Stop on error if configured
        if (action.stopOnError) {
          break
        }
      }

      await this.actionRepository.save(action)

      execution.addActionResult({
        actionId: action.id,
        name: action.name,
        type: action.type,
        success,
        executionTime: Date.now() - startTime,
        result: result || null,
        error,
      })
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
    execution: NotificationExecution
  ): Promise<void> {
    if (!rule.escalation?.levels) {
      return
    }

    for (const level of rule.escalation.levels) {
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

      const escalationData = {
        level: rule.escalation.levels.indexOf(level),
        recipients,
        reason: 'Action failures detected',
      }

      execution.addEscalation(escalationData)
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

    const rules = await this.ruleRepository.find({
      where: {
        type: RuleType.EVENT,
        status: RuleStatus.ACTIVE,
        eventName,
      },
      relations: ['conditions', 'actions'],
    })

    // Cache for 5 minutes
    await this.cacheService.set(cacheKey, rules, 300)

    return rules
  }

  /**
   * Check if scheduled rule should run
   */
  private shouldRunScheduledRule(rule: NotificationRule, now: Date): boolean {
    if (!rule.schedule?.cron) {
      return false
    }

    try {
      const interval = CronExpressionParser.parse(rule.schedule.cron, {
        currentDate: rule.lastExecutedAt || rule.createdAt,
        tz: rule.schedule.timezone,
      })

      const nextDate = interval.next().toDate()
      return nextDate <= now
    } catch (error) {
      this.logger.error(`Invalid cron expression for rule ${rule.code}:`, error)
      return false
    }
  }

  /**
   * Calculate next execution time for scheduled rule
   */
  private calculateNextExecutionTime(rule: NotificationRule): Date | null {
    if (!rule.schedule?.cron) {
      return null
    }

    try {
      const interval = CronExpressionParser.parse(rule.schedule.cron, {
        currentDate: new Date(),
        tz: rule.schedule.timezone,
      })

      return interval.next().toDate()
    } catch (error) {
      this.logger.error(`Invalid cron expression for rule ${rule.code}:`, error)
      return null
    }
  }

  /**
   * Check if rule is in cooldown
   */
  private isInCooldown(rule: NotificationRule): boolean {
    if (!rule.cooldown?.enabled) {
      return false
    }

    const cooldownKey = this.getCooldownKey(rule)
    const lastExecution = this.cooldownCache.get(cooldownKey)

    if (!lastExecution) {
      return false
    }

    const cooldownEnd = new Date(lastExecution)
    cooldownEnd.setMinutes(cooldownEnd.getMinutes() + rule.cooldown.minutes)

    return new Date() < cooldownEnd
  }

  /**
   * Set cooldown for rule
   */
  private setCooldown(rule: NotificationRule): void {
    if (!rule.cooldown?.enabled) {
      return
    }

    const cooldownKey = this.getCooldownKey(rule)
    this.cooldownCache.set(cooldownKey, new Date())
  }

  /**
   * Get cooldown key for rule
   */
  private getCooldownKey(rule: NotificationRule): string {
    if (rule.cooldown?.key) {
      return rule.cooldown.key
    }

    let key = `rule:${rule.id}`

    if (rule.cooldown?.perUser) {
      key += ':user'
    }

    if (rule.cooldown?.perResource) {
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
}
