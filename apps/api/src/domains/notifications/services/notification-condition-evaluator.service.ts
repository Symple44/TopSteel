import { Injectable, Logger } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { firstValueFrom } from 'rxjs'
import { Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import {
  NotificationCondition,
  ConditionType,
} from '../entities/notification-condition.entity'
import { RuleExecutionContext } from './notification-rules-engine.service'

/**
 * Notification condition evaluator service
 */
@Injectable()
export class NotificationConditionEvaluator {
  private readonly logger = new Logger(NotificationConditionEvaluator.name)

  constructor(
    private readonly httpService: HttpService,
    @InjectRepository(NotificationCondition, 'auth')
    private readonly conditionRepository: Repository<NotificationCondition>
  ) {}

  /**
   * Evaluate a condition
   */
  async evaluate(
    condition: NotificationCondition,
    context: RuleExecutionContext
  ): Promise<boolean> {
    this.logger.debug(`Evaluating condition ${condition.name} (${condition.type})`)

    try {
      switch (condition.type) {
        case ConditionType.FIELD:
          return await this.evaluateFieldCondition(condition, context)
        
        case ConditionType.EXPRESSION:
          return await this.evaluateExpressionCondition(condition, context)
        
        case ConditionType.QUERY:
          return await this.evaluateQueryCondition(condition, context)
        
        case ConditionType.API:
          return await this.evaluateApiCondition(condition, context)
        
        case ConditionType.AGGREGATE:
          return await this.evaluateAggregateCondition(condition, context)
        
        case ConditionType.TIME:
          return await this.evaluateTimeCondition(condition, context)
        
        case ConditionType.COUNT:
          return await this.evaluateCountCondition(condition, context)
        
        default:
          throw new Error(`Unknown condition type: ${condition.type}`)
      }
    } catch (error) {
      this.logger.error(`Error evaluating condition ${condition.name}:`, error)
      return false
    }
  }

  /**
   * Evaluate field condition
   */
  private async evaluateFieldCondition(
    condition: NotificationCondition,
    context: RuleExecutionContext
  ): Promise<boolean> {
    const data = context.triggerData || {}
    return condition.evaluateField(data)
  }

  /**
   * Evaluate expression condition
   */
  private async evaluateExpressionCondition(
    condition: NotificationCondition,
    context: RuleExecutionContext
  ): Promise<boolean> {
    const evalContext = {
      ...context.triggerData,
      rule: context.rule,
      metadata: context.metadata,
      societeId: context.societeId,
      siteId: context.siteId,
      userId: context.userId,
    }
    return condition.evaluateExpression(evalContext)
  }

  /**
   * Evaluate query condition
   */
  private async evaluateQueryCondition(
    condition: NotificationCondition,
    context: RuleExecutionContext
  ): Promise<boolean> {
    if (!condition.query) {
      return false
    }

    // Here you would execute the query against the appropriate database
    // For now, we'll simulate it
    this.logger.debug(`Would execute query: ${condition.query}`)
    
    // Simulate query result
    return true
  }

  /**
   * Evaluate API condition
   */
  private async evaluateApiCondition(
    condition: NotificationCondition,
    context: RuleExecutionContext
  ): Promise<boolean> {
    if (!condition.apiUrl) {
      return false
    }

    try {
      const headers = {
        ...condition.apiHeaders,
        'Content-Type': 'application/json',
      }

      const requestConfig = {
        headers,
        timeout: 30000,
      }

      let response
      if (condition.apiMethod === 'POST') {
        response = await firstValueFrom(
          this.httpService.post(condition.apiUrl, condition.apiBody || {}, requestConfig)
        )
      } else {
        response = await firstValueFrom(
          this.httpService.get(condition.apiUrl, requestConfig)
        )
      }

      // Extract value from response if path is specified
      if (condition.apiResponsePath) {
        const value = this.extractValueFromPath(response.data, condition.apiResponsePath)
        return this.evaluateValue(value, condition)
      }

      // If no path, check if response is truthy
      return !!response.data
    } catch (error) {
      this.logger.error(`API condition failed:`, error)
      return false
    }
  }

  /**
   * Evaluate aggregate condition
   */
  private async evaluateAggregateCondition(
    condition: NotificationCondition,
    context: RuleExecutionContext
  ): Promise<boolean> {
    // Here you would perform the aggregation query
    // For now, we'll simulate it
    this.logger.debug(`Would perform aggregation: ${condition.aggregateFunction} on ${condition.aggregateField}`)
    
    // Simulate aggregation result
    const simulatedValue = 100
    return this.evaluateValue(simulatedValue, condition)
  }

  /**
   * Evaluate time condition
   */
  private async evaluateTimeCondition(
    condition: NotificationCondition,
    context: RuleExecutionContext
  ): Promise<boolean> {
    if (!condition.timeUnit || !condition.timeValue) {
      return false
    }

    const now = new Date()
    let referenceTime: Date

    switch (condition.timeReference) {
      case 'event_time':
        referenceTime = new Date(context.triggerData?.timestamp || now)
        break
      case 'field_value':
        referenceTime = new Date(context.triggerData?.[condition.aggregateField || 'createdAt'] || now)
        break
      case 'now':
      default:
        referenceTime = now
        break
    }

    const diffMs = now.getTime() - referenceTime.getTime()
    let diffValue: number

    switch (condition.timeUnit) {
      case 'minutes':
        diffValue = diffMs / (1000 * 60)
        break
      case 'hours':
        diffValue = diffMs / (1000 * 60 * 60)
        break
      case 'days':
        diffValue = diffMs / (1000 * 60 * 60 * 24)
        break
      case 'weeks':
        diffValue = diffMs / (1000 * 60 * 60 * 24 * 7)
        break
      case 'months':
        diffValue = diffMs / (1000 * 60 * 60 * 24 * 30)
        break
      default:
        diffValue = 0
    }

    return this.evaluateValue(diffValue, condition)
  }

  /**
   * Evaluate count condition
   */
  private async evaluateCountCondition(
    condition: NotificationCondition,
    context: RuleExecutionContext
  ): Promise<boolean> {
    // Here you would count entities based on filters
    // For now, we'll simulate it
    this.logger.debug(`Would count ${condition.countEntity} with filters:`, condition.countFilters)
    
    // Simulate count result
    const simulatedCount = 5
    return this.evaluateValue(simulatedCount, condition)
  }

  /**
   * Extract value from object using dot notation path
   */
  private extractValueFromPath(obj: any, path: string): any {
    const keys = path.split('.')
    let value = obj

    for (const key of keys) {
      if (value === null || value === undefined) {
        return undefined
      }
      value = value[key]
    }

    return value
  }

  /**
   * Evaluate a value against condition operator
   */
  private evaluateValue(value: any, condition: NotificationCondition): boolean {
    if (!condition.operator || condition.value === undefined) {
      return !!value
    }

    // Create a temporary condition to evaluate the value
    const tempCondition = new NotificationCondition()
    Object.assign(tempCondition, condition)
    tempCondition.fieldPath = 'value'
    tempCondition.type = ConditionType.FIELD

    const tempData = { value }
    return tempCondition.evaluateField(tempData)
  }
}