import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../../domains/auth/security/guards/jwt-auth.guard'
import {
  MarketplacePermission,
  RequireMarketplacePermissions,
} from '../auth/decorators/marketplace-permissions.decorator'
import { MarketplacePermissionsGuard } from '../auth/guards/marketplace-permissions.guard'
import type {
  MarketplaceStockService,
  StockReservation,
  StockUpdateResult,
} from './marketplace-stock.service'

export class ReserveStockDto {
  productId: string
  quantity: number
  customerId: string
  orderId?: string
}

export class UpdateStockDto {
  quantity: number
  reason?: string
}

@Controller('api/marketplace/stock')
@UseGuards(JwtAuthGuard)
export class MarketplaceStockController {
  constructor(private readonly stockService: MarketplaceStockService) {}

  @Get('available/:productId')
  async getAvailableStock(@Param('productId') productId: string): Promise<{ available: number }> {
    const available = await this.stockService.getAvailableStock(productId)
    return { available }
  }

  @Post('reserve')
  @HttpCode(HttpStatus.CREATED)
  async reserveStock(@Body() reserveStockDto: ReserveStockDto): Promise<StockReservation> {
    return this.stockService.reserveStock(
      reserveStockDto.productId,
      reserveStockDto.quantity,
      reserveStockDto.customerId,
      reserveStockDto.orderId
    )
  }

  @Post('confirm/:reservationId')
  @HttpCode(HttpStatus.OK)
  async confirmReservation(
    @Param('reservationId') reservationId: string
  ): Promise<StockUpdateResult> {
    return this.stockService.confirmReservation(reservationId)
  }

  @Post('release/:reservationId')
  @HttpCode(HttpStatus.OK)
  async releaseReservation(
    @Param('reservationId') reservationId: string
  ): Promise<{ success: boolean }> {
    await this.stockService.releaseReservation(reservationId)
    return { success: true }
  }

  @Get('reservation/:reservationId')
  async getReservation(
    @Param('reservationId') reservationId: string
  ): Promise<StockReservation | null> {
    return this.stockService.getReservation(reservationId)
  }

  @Post('update/:productId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(MarketplacePermissionsGuard)
  @RequireMarketplacePermissions(MarketplacePermission.MANAGE_PRODUCTS)
  async updateStock(
    @Param('productId') productId: string,
    @Body() updateStockDto: UpdateStockDto
  ): Promise<StockUpdateResult> {
    return this.stockService.updateStock(productId, updateStockDto.quantity, updateStockDto.reason)
  }

  @Post('cleanup')
  @HttpCode(HttpStatus.OK)
  @UseGuards(MarketplacePermissionsGuard)
  @RequireMarketplacePermissions(MarketplacePermission.MANAGE_PRODUCTS)
  async cleanupExpiredReservations(): Promise<{ success: boolean }> {
    await this.stockService.cleanupExpiredReservations()
    return { success: true }
  }
}
