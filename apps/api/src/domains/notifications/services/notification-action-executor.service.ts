import type { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import type { AxiosResponse } from 'axios'
import { firstValueFrom } from 'rxjs'
import { ActionType, type NotificationAction } from '../entities/notification-action.entity'
import type { NotificationExecution } from '../entities/notification-execution.entity'
import type {
  ActionExecutionResult,
  ApiCallResult,
  CustomActionResult,
  CustomConfig,
  FieldUpdateResult,
  FunctionExecutionResult,
  LogEventResult,
  NotificationActionResult,
  ReportSendResult,
  RuleExecutionContext,
  TaskCreationResult,
  WorkflowTriggerResult,
} from '../types/notification-execution.types'

/**
 * Notification action executor service
 */
@Injectable()
export class NotificationActionExecutor {
  private readonly logger = new Logger(NotificationActionExecutor.name)

  constructor(private readonly httpService: HttpService) {}

  /**
   * Execute an action
   */
  async execute(
    action: NotificationAction,
    context: RuleExecutionContext,
    execution: NotificationExecution
  ): Promise<ActionExecutionResult> {
    this.logger.debug(`Executing action ${action.name} (${action.type})`)

    try {
      switch (action.type) {
        case ActionType.SEND_NOTIFICATION:
          return await this.executeNotification(action, context, execution)

        case ActionType.UPDATE_FIELD:
          return await this.executeFieldUpdate(action, context)

        case ActionType.EXECUTE_FUNCTION:
          return await this.executeFunction(action, context)

        case ActionType.CALL_API:
          return await this.executeApiCall(action, context)

        case ActionType.CREATE_TASK:
          return await this.executeCreateTask(action, context)

        case ActionType.TRIGGER_WORKFLOW:
          return await this.executeTriggerWorkflow(action, context)

        case ActionType.LOG_EVENT:
          return await this.executeLogEvent(action, context)

        case ActionType.SEND_REPORT:
          return await this.executeSendReport(action, context)

        case ActionType.CUSTOM:
          return await this.executeCustom(action, context)

        default:
          throw new Error(`Unknown action type: ${action.type}`)
      }
    } catch (error) {
      this.logger.error(`Error executing action ${action.name}:`, error)
      throw error
    }
  }

  /**
   * Execute notification action
   */
  private async executeNotification(
    action: NotificationAction,
    context: RuleExecutionContext,
    execution: NotificationExecution
  ): Promise<NotificationActionResult> {
    const config = action.notificationConfig
    if (!config) {
      throw new Error('Notification config is missing')
    }

    // Here you would integrate with your notification service
    // For now, we'll simulate it
    const recipients = this.resolveRecipients(context)

    for (const recipient of recipients) {
      execution.addRecipient({
        type: 'email',
        email: recipient,
      })

      // Simulate sending
      execution.markRecipientDelivered(recipient, 'email', `msg-${Date.now()}`)
    }

    return {
      success: true,
      recipientsNotified: recipients.length,
      channels: config.channels || ['email'],
      data: {
        templateId: config.templateId,
        title: config.title,
        body: config.body,
        priority: config.priority,
      },
    }
  }

  /**
   * Execute field update action
   */
  private async executeFieldUpdate(
    action: NotificationAction,
    _context: RuleExecutionContext
  ): Promise<FieldUpdateResult> {
    const config = action.updateFieldConfig
    if (!config) {
      throw new Error('Update field config is missing')
    }

    // Here you would update the database field
    // For now, we'll simulate it
    this.logger.log(`Would update ${config.entity}.${config.fieldPath} to ${config.value}`)

    return {
      success: true,
      entity: config.entity,
      field: config.fieldPath,
      value: config.value,
      updated: true,
      data: {
        previousValue: null, // Would come from database
        timestamp: new Date().toISOString(),
      },
    }
  }

  /**
   * Execute function action
   */
  private async executeFunction(
    action: NotificationAction,
    _context: RuleExecutionContext
  ): Promise<FunctionExecutionResult> {
    const config = action.functionConfig
    if (!config) {
      throw new Error('Function config is missing')
    }

    // Here you would execute the function
    // For now, we'll simulate it
    this.logger.log(`Would execute function ${config.name} with params:`, config.parameters)

    return {
      success: true,
      function: config.name,
      executed: true,
      returnValue: null, // Would come from function execution
      data: {
        parameters: config.parameters,
        timeout: config.timeout,
        timestamp: new Date().toISOString(),
      },
    }
  }

  /**
   * Execute API call action
   */
  private async executeApiCall(
    action: NotificationAction,
    _context: RuleExecutionContext
  ): Promise<ApiCallResult> {
    const config = action.apiConfig
    if (!config) {
      throw new Error('API config is missing')
    }

    const headers: Record<string, string> = {
      ...(config.headers as Record<string, string>),
      'Content-Type': 'application/json',
    }

    // Add authentication if needed
    if (config.authentication?.type === 'bearer' && config.authentication.credentials?.token) {
      headers.Authorization = `Bearer ${config.authentication.credentials.token}`
    }

    const requestConfig = {
      headers,
      timeout: (config.timeoutSeconds || 30) * 1000,
    }

    let response: AxiosResponse<unknown>
    switch (config.method) {
      case 'GET':
        response = await firstValueFrom(this.httpService.get(config.url, requestConfig))
        break
      case 'POST':
        response = await firstValueFrom(
          this.httpService.post(config.url, config.body, requestConfig)
        )
        break
      case 'PUT':
        response = await firstValueFrom(
          this.httpService.put(config.url, config.body, requestConfig)
        )
        break
      case 'DELETE':
        response = await firstValueFrom(this.httpService.delete(config.url, requestConfig))
        break
      case 'PATCH':
        response = await firstValueFrom(
          this.httpService.patch(config.url, config.body, requestConfig)
        )
        break
      default:
        throw new Error(`Unsupported HTTP method: ${config.method}`)
    }

    return {
      success: true,
      status: response.status,
      data: response.data as Record<string, unknown>,
      responseHeaders: response.headers as Record<string, string>,
      metadata: {
        method: config.method,
        url: config.url,
        timestamp: new Date().toISOString(),
      },
    }
  }

  /**
   * Execute create task action
   */
  private async executeCreateTask(
    action: NotificationAction,
    _context: RuleExecutionContext
  ): Promise<TaskCreationResult> {
    const config = action.taskConfig
    if (!config) {
      throw new Error('Task config is missing')
    }

    // Here you would create a task in your task management system
    // For now, we'll simulate it
    this.logger.log(`Would create task: ${config.title}`)

    return {
      success: true,
      taskId: `task-${Date.now()}`,
      title: config.title,
      created: true,
      data: {
        description: config.description,
        assignTo: config.assignTo,
        priority: config.priority,
        dueDate: config.dueDate,
        tags: config.tags,
        metadata: config.metadata,
        timestamp: new Date().toISOString(),
      },
    }
  }

  /**
   * Execute trigger workflow action
   */
  private async executeTriggerWorkflow(
    action: NotificationAction,
    _context: RuleExecutionContext
  ): Promise<WorkflowTriggerResult> {
    const config = action.workflowConfig
    if (!config) {
      throw new Error('Workflow config is missing')
    }

    // Here you would trigger a workflow
    // For now, we'll simulate it
    this.logger.log(`Would trigger workflow ${config.workflowId}`)

    return {
      success: true,
      workflowId: config.workflowId,
      triggered: true,
      executionId: `execution-${Date.now()}`,
      data: {
        parameters: config.parameters,
        waitForCompletion: config.waitForCompletion,
        timeoutSeconds: config.timeoutSeconds,
        timestamp: new Date().toISOString(),
      },
    }
  }

  /**
   * Execute log event action
   */
  private async executeLogEvent(
    action: NotificationAction,
    _context: RuleExecutionContext
  ): Promise<LogEventResult> {
    const config = action.logConfig
    if (!config) {
      throw new Error('Log config is missing')
    }

    // Log the event
    const logMessage = `[${config.category || 'NOTIFICATION'}] ${config.message}`
    const timestamp = new Date().toISOString()

    switch (config.level) {
      case 'debug':
        this.logger.debug(logMessage, config.metadata)
        break
      case 'info':
        this.logger.log(logMessage, config.metadata)
        break
      case 'warn':
        this.logger.warn(logMessage, config.metadata)
        break
      case 'error':
        this.logger.error(logMessage, config.metadata)
        break
    }

    return {
      success: true,
      logged: true,
      level: config.level,
      timestamp,
      data: {
        message: config.message,
        category: config.category,
        metadata: config.metadata,
      },
    }
  }

  /**
   * Execute send report action
   */
  private async executeSendReport(
    action: NotificationAction,
    _context: RuleExecutionContext
  ): Promise<ReportSendResult> {
    const config = action.reportConfig
    if (!config) {
      throw new Error('Report config is missing')
    }

    // Here you would generate and send a report
    // For now, we'll simulate it
    this.logger.log(`Would send report ${config.reportId} in ${config.format} format`)

    return {
      success: true,
      reportId: config.reportId,
      format: config.format,
      sent: true,
      recipients: config.recipients,
      data: {
        parameters: config.parameters,
        timestamp: new Date().toISOString(),
      },
    }
  }

  /**
   * Execute custom action
   */
  private async executeCustom(
    action: NotificationAction,
    _context: RuleExecutionContext
  ): Promise<CustomActionResult> {
    const config = action.customConfig
    if (!config) {
      throw new Error('Custom config is missing')
    }

    // Here you would execute custom logic
    // For now, we'll simulate it
    this.logger.log('Executing custom action', config)

    return {
      success: true,
      custom: true,
      config: { handlerName: 'custom', ...config } as CustomConfig,
      data: {
        handlerName: (config as Record<string, unknown>).handlerName as string || 'custom',
        parameters: (config as Record<string, unknown>).parameters as Record<string, unknown>,
        timestamp: new Date().toISOString(),
      },
    }
  }

  /**
   * Resolve recipients from context
   */
  private resolveRecipients(context: RuleExecutionContext): string[] {
    const recipients: string[] = []
    const rule = context.rule

    // Add direct emails
    if (rule.recipientRules?.emails) {
      recipients.push(...rule.recipientRules.emails)
    }

    // Here you would resolve users, roles, groups
    // For now, we'll return the direct emails

    return recipients
  }
}
