import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import type { Request } from 'express'
import type { DataSource } from 'typeorm'
import { TenantGuard } from '../../../shared/tenant/tenant.guard'
import type { PaymentStatus } from '../entities/marketplace-order.entity'
import type {
  CreateOrderDto,
  OrdersService,
  UpdateOrderStatusDto,
} from '../services/orders.service'

interface TenantRequest extends Request {
  tenant: {
    societeId: string
    erpTenantConnection: DataSource | null
  }
  user?: {
    customerId?: string
    role?: string
  }
}

@ApiTags('marketplace-orders')
@Controller('orders')
@UseGuards(TenantGuard)
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiBearerAuth()
  async createOrder(@Req() req: TenantRequest, @Body() createOrderDto: CreateOrderDto) {
    if (!req.user?.customerId) {
      throw new UnauthorizedException('Customer authentication required')
    }

    // Override customerId with authenticated customer
    createOrderDto.customerId = req.user.customerId

    return await this.ordersService.createOrder(
      createOrderDto,
      req.tenant.societeId,
      req.tenant.erpTenantConnection || undefined
    )
  }

  @Get('my-orders')
  @ApiOperation({ summary: 'Get customer orders' })
  @ApiResponse({ status: 200, description: 'List of customer orders' })
  @ApiBearerAuth()
  async getMyOrders(
    @Req() req: TenantRequest,
    @Query() query: {
      status?: string
      limit?: string
      offset?: string
    }
  ) {
    if (!req.user?.customerId) {
      throw new UnauthorizedException('Customer authentication required')
    }

    return await this.ordersService.getCustomerOrders(req.user.customerId, req.tenant.societeId, {
      status: query.status,
      limit: query.limit ? parseInt(query.limit, 10) : 20,
      offset: query.offset ? parseInt(query.offset, 10) : 0,
    })
  }

  @Get(':orderId')
  @ApiOperation({ summary: 'Get order details' })
  @ApiResponse({ status: 200, description: 'Order details' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiBearerAuth()
  async getOrder(@Req() req: TenantRequest, @Param('orderId') orderId: string) {
    // If customer, only allow viewing their own orders
    const customerId = req.user?.role === 'admin' ? undefined : req.user?.customerId

    if (!req.user?.customerId && !req.user?.role) {
      throw new UnauthorizedException('Authentication required')
    }

    return await this.ordersService.getOrderById(orderId, req.tenant.societeId, customerId)
  }

  @Put(':orderId/cancel')
  @ApiOperation({ summary: 'Cancel an order' })
  @ApiResponse({ status: 200, description: 'Order cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Cannot cancel order' })
  @ApiBearerAuth()
  async cancelOrder(
    @Req() req: TenantRequest,
    @Param('orderId') orderId: string,
    @Body() body: { reason?: string }
  ) {
    if (!req.user?.customerId) {
      throw new UnauthorizedException('Customer authentication required')
    }

    return await this.ordersService.cancelOrder(
      orderId,
      req.tenant.societeId,
      req.user.customerId,
      body.reason
    )
  }

  // Admin endpoints
  @Put('admin/:orderId/status')
  @ApiOperation({ summary: 'Update order status (admin)' })
  @ApiResponse({ status: 200, description: 'Order status updated' })
  @ApiBearerAuth()
  async updateOrderStatus(
    @Req() req: TenantRequest,
    @Param('orderId') orderId: string,
    @Body() updateDto: UpdateOrderStatusDto
  ) {
    // Check admin role
    if (req.user?.role !== 'admin') {
      throw new UnauthorizedException('Admin access required')
    }

    return await this.ordersService.updateOrderStatus(orderId, req.tenant.societeId, updateDto)
  }

  @Put('admin/:orderId/payment-status')
  @ApiOperation({ summary: 'Update payment status (admin)' })
  @ApiResponse({ status: 200, description: 'Payment status updated' })
  @ApiBearerAuth()
  async updatePaymentStatus(
    @Req() req: TenantRequest,
    @Param('orderId') orderId: string,
    @Body() body: {
      paymentStatus: PaymentStatus
      paymentDetails?: Record<string, unknown>
    }
  ) {
    // Check admin role
    if (req.user?.role !== 'admin') {
      throw new UnauthorizedException('Admin access required')
    }

    return await this.ordersService.updatePaymentStatus(
      orderId,
      req.tenant.societeId,
      body.paymentStatus,
      body.paymentDetails
    )
  }

  @Get('admin/all')
  @ApiOperation({ summary: 'Get all orders (admin)' })
  @ApiResponse({ status: 200, description: 'List of all orders' })
  @ApiBearerAuth()
  async getAllOrders(
    @Req() req: TenantRequest,
    @Query() query: {
      status?: string
      customerId?: string
      limit?: string
      offset?: string
    }
  ) {
    // Check admin role
    if (req.user?.role !== 'admin') {
      throw new UnauthorizedException('Admin access required')
    }

    if (query.customerId) {
      return await this.ordersService.getCustomerOrders(query.customerId, req.tenant.societeId, {
        status: query.status,
        limit: query.limit ? parseInt(query.limit, 10) : 20,
        offset: query.offset ? parseInt(query.offset, 10) : 0,
      })
    }

    // Return all orders for the tenant
    // This would need to be implemented in the service
    return {
      orders: [],
      total: 0,
      message: 'Full order listing not yet implemented',
    }
  }
}
