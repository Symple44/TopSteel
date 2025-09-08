import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../../domains/auth/security/guards/jwt-auth.guard'
import {
  MarketplacePermission,
  RequireMarketplacePermissions,
} from '../auth/decorators/marketplace-permissions.decorator'
import { MarketplacePermissionsGuard } from '../auth/guards/marketplace-permissions.guard'
import type { MarketplaceShipment } from '../entities/marketplace-shipment.entity'
import type {
  CreateShipmentDto,
  MarketplaceShippingService,
  TrackingUpdate,
} from './marketplace-shipping.service'

export class UpdateTrackingDto {
  status: string
  location: string
  description: string
  nextAction?: string
}

@Controller('api/marketplace/shipping')
@UseGuards(JwtAuthGuard)
export class MarketplaceShippingController {
  constructor(private readonly shippingService: MarketplaceShippingService) {}

  @Post('shipments')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(MarketplacePermissionsGuard)
  @RequireMarketplacePermissions(MarketplacePermission.MANAGE_ORDERS)
  async createShipment(@Body() createShipmentDto: CreateShipmentDto): Promise<MarketplaceShipment> {
    return this.shippingService.createShipment(createShipmentDto)
  }

  @Get('track/:trackingNumber')
  async getTrackingInfo(
    @Param('trackingNumber') trackingNumber: string
  ): Promise<MarketplaceShipment | null> {
    return this.shippingService.getTrackingInfo(trackingNumber)
  }

  @Get('orders/:orderId/shipment')
  async trackByOrderId(@Param('orderId') orderId: string): Promise<MarketplaceShipment | null> {
    return this.shippingService.trackByOrderId(orderId)
  }

  @Get('customers/:customerId/shipments')
  async getCustomerShipments(
    @Param('customerId') customerId: string
  ): Promise<MarketplaceShipment[]> {
    return this.shippingService.getCustomerShipments(customerId)
  }

  @Get('orders/:orderId/shipping-methods')
  async getAvailableShippingMethods(@Param('orderId') orderId: string) {
    return this.shippingService.getAvailableShippingMethods(orderId)
  }

  @Post('shipments/:shipmentId/tracking')
  @HttpCode(HttpStatus.OK)
  @UseGuards(MarketplacePermissionsGuard)
  @RequireMarketplacePermissions(MarketplacePermission.MANAGE_ORDERS)
  async updateTrackingInfo(
    @Param('shipmentId') shipmentId: string,
    @Body() updateTrackingDto: UpdateTrackingDto
  ): Promise<MarketplaceShipment> {
    const trackingUpdate: TrackingUpdate = {
      ...updateTrackingDto,
      timestamp: new Date(),
      status: updateTrackingDto.status as any,
    }

    return this.shippingService.updateTrackingInfo(shipmentId, trackingUpdate)
  }

  @Get('health')
  async healthCheck(): Promise<{ healthy: boolean }> {
    const healthy = await this.shippingService.isHealthy()
    return { healthy }
  }
}
