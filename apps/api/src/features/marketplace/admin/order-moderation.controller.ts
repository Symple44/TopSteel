import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { CurrentTenant } from '../../../core/common/decorators/current-tenant.decorator'
import { CurrentUser } from '../../../core/common/decorators/current-user.decorator'
import { JwtAuthGuard } from '../../../domains/auth/security/guards/jwt-auth.guard'
import {
  MarketplacePermission,
  RequireMarketplacePermissions,
} from '../auth/decorators/marketplace-permissions.decorator'
import { MarketplacePermissionsGuard } from '../auth/guards/marketplace-permissions.guard'
import type {
  OrderModerationAction,
  OrderModerationFilters,
  OrderModerationItem,
  OrderModerationResponse,
  OrderModerationService,
} from './order-moderation.service'

@Controller('api/marketplace/admin/order-moderation')
@UseGuards(JwtAuthGuard, MarketplacePermissionsGuard)
export class OrderModerationController {
  constructor(private readonly moderationService: OrderModerationService) {}

  @Get()
  @RequireMarketplacePermissions(MarketplacePermission.MODERATE_ORDERS)
  async getOrdersForModeration(
    @CurrentTenant() tenantId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('status') status?: string,
    @Query('paymentStatus') paymentStatus?: string,
    @Query('customerEmail') customerEmail?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('amountMin', new DefaultValuePipe(0), ParseIntPipe) amountMin?: number,
    @Query('amountMax') amountMax?: number,
    @Query('flagged', ParseBoolPipe) flagged?: boolean,
    @Query('priority') priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
    @Query('assignedTo') assignedTo?: string
  ): Promise<OrderModerationResponse> {
    const filters: OrderModerationFilters = {
      status,
      paymentStatus,
      customerEmail,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      amountMin: amountMin || undefined,
      amountMax: amountMax ? Number(amountMax) : undefined,
      flagged,
      priority,
      assignedTo,
    }

    return this.moderationService.getOrdersForModeration(
      tenantId,
      filters,
      Math.max(1, page),
      Math.min(100, Math.max(1, limit))
    )
  }

  @Get('stats')
  @RequireMarketplacePermissions(MarketplacePermission.VIEW_ANALYTICS)
  async getModerationStats(
    @CurrentTenant() tenantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const dateRange =
      startDate && endDate
        ? {
            start: new Date(startDate),
            end: new Date(endDate),
          }
        : undefined

    return this.moderationService.getModerationStats(tenantId, dateRange)
  }

  @Get('summary')
  @RequireMarketplacePermissions(MarketplacePermission.MODERATE_ORDERS)
  async getModerationSummary(@CurrentTenant() tenantId: string) {
    const result = await this.moderationService.getOrdersForModeration(tenantId, {}, 1, 1)
    return result.summary
  }

  @Get(':orderId')
  @RequireMarketplacePermissions(MarketplacePermission.MODERATE_ORDERS)
  async getOrderForModeration(
    @CurrentTenant() tenantId: string,
    @Param('orderId') orderId: string
  ): Promise<OrderModerationItem> {
    return this.moderationService.getOrderForDetailedModeration(tenantId, orderId)
  }

  @Post(':orderId/actions')
  @HttpCode(HttpStatus.OK)
  @RequireMarketplacePermissions(MarketplacePermission.MODERATE_ORDERS)
  async performModerationAction(
    @CurrentTenant() tenantId: string,
    @Param('orderId') orderId: string,
    @Body() action: OrderModerationAction,
    @CurrentUser() user: any
  ): Promise<{ success: boolean; message: string }> {
    return this.moderationService.performModerationAction(tenantId, orderId, action, user.id)
  }

  @Post(':orderId/approve')
  @HttpCode(HttpStatus.OK)
  @RequireMarketplacePermissions(MarketplacePermission.MODERATE_ORDERS)
  async approveOrder(
    @CurrentTenant() tenantId: string,
    @Param('orderId') orderId: string,
    @Body() body: { reason?: string },
    @CurrentUser() user: any
  ): Promise<{ success: boolean; message: string }> {
    const action: OrderModerationAction = {
      action: 'APPROVE',
      reason: body.reason,
    }

    return this.moderationService.performModerationAction(tenantId, orderId, action, user.id)
  }

  @Post(':orderId/reject')
  @HttpCode(HttpStatus.OK)
  @RequireMarketplacePermissions(MarketplacePermission.MODERATE_ORDERS)
  async rejectOrder(
    @CurrentTenant() tenantId: string,
    @Param('orderId') orderId: string,
    @Body() body: { reason: string },
    @CurrentUser() user: any
  ): Promise<{ success: boolean; message: string }> {
    const action: OrderModerationAction = {
      action: 'REJECT',
      reason: body.reason,
    }

    return this.moderationService.performModerationAction(tenantId, orderId, action, user.id)
  }

  @Post(':orderId/hold')
  @HttpCode(HttpStatus.OK)
  @RequireMarketplacePermissions(MarketplacePermission.MODERATE_ORDERS)
  async holdOrder(
    @CurrentTenant() tenantId: string,
    @Param('orderId') orderId: string,
    @Body() body: { reason: string },
    @CurrentUser() user: any
  ): Promise<{ success: boolean; message: string }> {
    const action: OrderModerationAction = {
      action: 'HOLD',
      reason: body.reason,
    }

    return this.moderationService.performModerationAction(tenantId, orderId, action, user.id)
  }

  @Post(':orderId/flag')
  @HttpCode(HttpStatus.OK)
  @RequireMarketplacePermissions(MarketplacePermission.MODERATE_ORDERS)
  async flagOrder(
    @CurrentTenant() tenantId: string,
    @Param('orderId') orderId: string,
    @Body() body: { flagType: string; reason: string },
    @CurrentUser() user: any
  ): Promise<{ success: boolean; message: string }> {
    const action: OrderModerationAction = {
      action: 'FLAG',
      flagType: body.flagType,
      reason: body.reason,
    }

    return this.moderationService.performModerationAction(tenantId, orderId, action, user.id)
  }

  @Post(':orderId/assign')
  @HttpCode(HttpStatus.OK)
  @RequireMarketplacePermissions(MarketplacePermission.MANAGE_MODERATORS)
  async assignOrder(
    @CurrentTenant() tenantId: string,
    @Param('orderId') orderId: string,
    @Body() body: { assignTo: string },
    @CurrentUser() user: any
  ): Promise<{ success: boolean; message: string }> {
    const action: OrderModerationAction = {
      action: 'ASSIGN',
      assignTo: body.assignTo,
    }

    return this.moderationService.performModerationAction(tenantId, orderId, action, user.id)
  }

  @Post(':orderId/notes')
  @HttpCode(HttpStatus.CREATED)
  @RequireMarketplacePermissions(MarketplacePermission.MODERATE_ORDERS)
  async addNote(
    @CurrentTenant() tenantId: string,
    @Param('orderId') orderId: string,
    @Body() body: { message: string; isInternal?: boolean },
    @CurrentUser() user: any
  ): Promise<{ success: boolean; message: string }> {
    const action: OrderModerationAction = {
      action: 'ADD_NOTE',
      noteMessage: body.message,
      isInternalNote: body.isInternal || false,
    }

    return this.moderationService.performModerationAction(tenantId, orderId, action, user.id)
  }

  @Post(':orderId/resolve-flag')
  @HttpCode(HttpStatus.OK)
  @RequireMarketplacePermissions(MarketplacePermission.MODERATE_ORDERS)
  async resolveFlag(
    @CurrentTenant() tenantId: string,
    @Param('orderId') orderId: string,
    @Body() body: { flagType: string },
    @CurrentUser() user: any
  ): Promise<{ success: boolean; message: string }> {
    const action: OrderModerationAction = {
      action: 'RESOLVE_FLAG',
      flagType: body.flagType,
    }

    return this.moderationService.performModerationAction(tenantId, orderId, action, user.id)
  }

  @Post('auto-flag')
  @HttpCode(HttpStatus.OK)
  @RequireMarketplacePermissions(MarketplacePermission.MANAGE_SETTINGS)
  async autoFlagOrders(@CurrentTenant() tenantId: string): Promise<{ flagged: number }> {
    return this.moderationService.autoFlagOrders(tenantId)
  }

  @Get('export/csv')
  @RequireMarketplacePermissions(MarketplacePermission.VIEW_ANALYTICS)
  async exportModerationData(
    @CurrentTenant() tenantId: string,
    @Query('status') status?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('flagged', ParseBoolPipe) flagged?: boolean
  ) {
    const filters: OrderModerationFilters = {
      status,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      flagged,
    }

    // Get all orders matching filters for export
    const result = await this.moderationService.getOrdersForModeration(
      tenantId,
      filters,
      1,
      10000 // Large limit for export
    )

    // Convert to CSV format
    const csvHeader = [
      'Order ID',
      'Order Number',
      'Customer Name',
      'Customer Email',
      'Total',
      'Status',
      'Payment Status',
      'Priority',
      'Flags',
      'Assigned To',
      'Created At',
      'Updated At',
    ].join(',')

    const csvRows = result.orders.map((order) =>
      [
        order.id,
        order.orderNumber,
        `"${order.customer.name}"`,
        order.customer.email,
        order.total,
        order.status,
        order.paymentStatus,
        order.priority,
        `"${order.flags.map((f) => f.type).join(', ')}"`,
        order.assignedTo || '',
        order.createdAt.toISOString(),
        order.updatedAt.toISOString(),
      ].join(',')
    )

    const csvContent = [csvHeader, ...csvRows].join('\n')

    return {
      content: csvContent,
      filename: `order-moderation-export-${new Date().toISOString().split('T')[0]}.csv`,
      mimeType: 'text/csv',
      count: result.orders.length,
    }
  }

  @Get('queue/pending')
  @RequireMarketplacePermissions(MarketplacePermission.MODERATE_ORDERS)
  async getPendingQueue(
    @CurrentTenant() tenantId: string,
    @Query('assignedTo') assignedTo?: string
  ) {
    const filters: OrderModerationFilters = {
      assignedTo,
    }

    const result = await this.moderationService.getOrdersForModeration(tenantId, filters, 1, 50)

    // Filter only pending orders and sort by priority
    const pendingOrders = result.orders
      .filter((order) => order.status === 'PENDING')
      .sort((a, b) => {
        const priorityOrder = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      })

    return {
      orders: pendingOrders,
      count: pendingOrders.length,
    }
  }

  @Get('flags/types')
  @RequireMarketplacePermissions(MarketplacePermission.MODERATE_ORDERS)
  async getFlagTypes() {
    return {
      flagTypes: [
        { value: 'PAYMENT_FAILED', label: 'Payment Failed', severity: 'HIGH' },
        { value: 'HIGH_VALUE', label: 'High Value Order', severity: 'MEDIUM' },
        { value: 'NEW_CUSTOMER', label: 'New Customer', severity: 'LOW' },
        { value: 'SUSPICIOUS_ACTIVITY', label: 'Suspicious Activity', severity: 'HIGH' },
        { value: 'INVENTORY_ISSUE', label: 'Inventory Issue', severity: 'MEDIUM' },
        { value: 'CUSTOM', label: 'Custom Flag', severity: 'MEDIUM' },
      ],
    }
  }
}
