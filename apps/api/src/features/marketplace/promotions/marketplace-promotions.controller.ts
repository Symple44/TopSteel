import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Post,
  Put,
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
import type { MarketplaceCoupon } from '../entities/marketplace-coupon.entity'
import type { MarketplacePromotion } from '../entities/marketplace-promotion.entity'
import type {
  ApplyCouponResult,
  CreateCouponDto,
  CreatePromotionDto,
  MarketplacePromotionsService,
  UpdatePromotionDto,
} from './marketplace-promotions.service'

@Controller('api/marketplace/promotions')
@UseGuards(JwtAuthGuard)
export class MarketplacePromotionsController {
  constructor(private readonly promotionsService: MarketplacePromotionsService) {}

  // Promotion endpoints

  @Post()
  @UseGuards(MarketplacePermissionsGuard)
  @RequireMarketplacePermissions(MarketplacePermission.MANAGE_SETTINGS)
  async createPromotion(
    @CurrentTenant() tenantId: string,
    @Body() createDto: CreatePromotionDto
  ): Promise<MarketplacePromotion> {
    return this.promotionsService.createPromotion(tenantId, createDto)
  }

  @Get()
  @UseGuards(MarketplacePermissionsGuard)
  @RequireMarketplacePermissions(MarketplacePermission.VIEW_ANALYTICS)
  async getPromotions(
    @CurrentTenant() tenantId: string,
    @Query('active', ParseBoolPipe) active?: boolean,
    @Query('type') _type?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number
  ) {
    if (active) {
      const promotions = await this.promotionsService.getActivePromotions(tenantId)
      return {
        promotions,
        total: promotions.length,
        page: 1,
        limit: promotions.length,
      }
    }

    // Get all promotions with pagination
    // This would need additional implementation in service
    return {
      promotions: [],
      total: 0,
      page,
      limit,
    }
  }

  @Get(':id')
  @UseGuards(MarketplacePermissionsGuard)
  @RequireMarketplacePermissions(MarketplacePermission.VIEW_ANALYTICS)
  async getPromotion(
    @CurrentTenant() _tenantId: string,
    @Param('id') _promotionId: string
  ): Promise<MarketplacePromotion> {
    // Would need to add getPromotionById method to service
    throw new Error('Not implemented')
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(MarketplacePermissionsGuard)
  @RequireMarketplacePermissions(MarketplacePermission.MANAGE_SETTINGS)
  async updatePromotion(
    @CurrentTenant() tenantId: string,
    @Param('id') promotionId: string,
    @Body() updateDto: Omit<UpdatePromotionDto, 'id'>
  ): Promise<MarketplacePromotion> {
    return this.promotionsService.updatePromotion(tenantId, { ...updateDto, id: promotionId })
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(MarketplacePermissionsGuard)
  @RequireMarketplacePermissions(MarketplacePermission.MANAGE_SETTINGS)
  async deletePromotion(
    @CurrentTenant() _tenantId: string,
    @Param('id') _promotionId: string
  ): Promise<void> {
    // Would need to add deletePromotion method to service
    throw new Error('Not implemented')
  }

  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  @UseGuards(MarketplacePermissionsGuard)
  @RequireMarketplacePermissions(MarketplacePermission.MANAGE_SETTINGS)
  async activatePromotion(
    @CurrentTenant() tenantId: string,
    @Param('id') promotionId: string
  ): Promise<MarketplacePromotion> {
    return this.promotionsService.updatePromotion(tenantId, {
      id: promotionId,
      isActive: true,
    })
  }

  @Post(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  @UseGuards(MarketplacePermissionsGuard)
  @RequireMarketplacePermissions(MarketplacePermission.MANAGE_SETTINGS)
  async deactivatePromotion(
    @CurrentTenant() tenantId: string,
    @Param('id') promotionId: string
  ): Promise<MarketplacePromotion> {
    return this.promotionsService.updatePromotion(tenantId, {
      id: promotionId,
      isActive: false,
    })
  }

  @Get(':id/statistics')
  @UseGuards(MarketplacePermissionsGuard)
  @RequireMarketplacePermissions(MarketplacePermission.VIEW_ANALYTICS)
  async getPromotionStatistics(
    @CurrentTenant() tenantId: string,
    @Param('id') promotionId: string,
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

    return this.promotionsService.getPromotionStatistics(tenantId, promotionId, dateRange)
  }

  // Coupon endpoints

  @Post('coupons')
  @UseGuards(MarketplacePermissionsGuard)
  @RequireMarketplacePermissions(MarketplacePermission.MANAGE_SETTINGS)
  async createCoupon(
    @CurrentTenant() tenantId: string,
    @Body() createDto: CreateCouponDto
  ): Promise<MarketplaceCoupon> {
    return this.promotionsService.createCoupon(tenantId, createDto)
  }

  @Post('coupons/bulk')
  @UseGuards(MarketplacePermissionsGuard)
  @RequireMarketplacePermissions(MarketplacePermission.MANAGE_SETTINGS)
  async generateBulkCoupons(
    @CurrentTenant() tenantId: string,
    @Body() body: {
      baseConfig: Omit<CreateCouponDto, 'code'>
      quantity: number
      prefix?: string
    }
  ): Promise<{ coupons: MarketplaceCoupon[]; count: number }> {
    const coupons = await this.promotionsService.generateBulkCoupons(
      tenantId,
      body.baseConfig,
      body.quantity,
      body.prefix
    )

    return {
      coupons,
      count: coupons.length,
    }
  }

  @Post('coupons/validate')
  @HttpCode(HttpStatus.OK)
  async validateCoupon(
    @CurrentTenant() tenantId: string,
    @Body() body: {
      code: string
      orderId?: string
      customerId?: string
    }
  ): Promise<{ valid: boolean; message?: string; discount?: number }> {
    if (!body.orderId) {
      // Simple validation without order context
      // Would need to add validateCouponCode method to service
      return {
        valid: false,
        message: 'Order ID required for validation',
      }
    }

    const result = await this.promotionsService.applyCoupon(
      tenantId,
      body.code,
      body.orderId,
      body.customerId
    )

    return {
      valid: result.valid,
      message: result.message,
      discount: result.discount,
    }
  }

  // Order-related endpoints

  @Post('apply-coupon')
  @HttpCode(HttpStatus.OK)
  async applyCouponToOrder(
    @CurrentTenant() tenantId: string,
    @Body() body: {
      couponCode: string
      orderId: string
      customerId?: string
    },
    @CurrentUser() user: any
  ): Promise<ApplyCouponResult> {
    return this.promotionsService.applyCoupon(
      tenantId,
      body.couponCode,
      body.orderId,
      body.customerId || user.customerId
    )
  }

  @Post('remove-coupon')
  @HttpCode(HttpStatus.OK)
  async removeCouponFromOrder(
    @CurrentTenant() tenantId: string,
    @Body() body: { orderId: string }
  ): Promise<{ success: boolean }> {
    await this.promotionsService.removeCoupon(tenantId, body.orderId)
    return { success: true }
  }

  @Get('order/:orderId/applicable')
  async getApplicablePromotions(
    @CurrentTenant() _tenantId: string,
    @Param('orderId') _orderId: string,
    @CurrentUser() _user: any,
    @Query('customerId') _customerId?: string
  ) {
    // Would need to get order first
    // Simplified for now
    return {
      promotions: [],
      totalDiscount: 0,
    }
  }

  @Get('order/:orderId/discount')
  async calculateOrderDiscount(
    @CurrentTenant() tenantId: string,
    @Param('orderId') orderId: string,
    @CurrentUser() user: any,
    @Query('couponCode') couponCode?: string,
    @Query('customerId') customerId?: string
  ) {
    return this.promotionsService.calculateOrderDiscount(
      tenantId,
      orderId,
      customerId || user.customerId,
      couponCode
    )
  }

  // Analytics endpoints

  @Get('analytics/overview')
  @UseGuards(MarketplacePermissionsGuard)
  @RequireMarketplacePermissions(MarketplacePermission.VIEW_ANALYTICS)
  async getPromotionsOverview(
    @CurrentTenant() _tenantId: string,
    @Query('period') _period?: '7d' | '30d' | '90d'
  ) {
    // Get analytics overview
    // Would need additional implementation
    return {
      activePromotions: 0,
      totalDiscountGiven: 0,
      conversionRate: 0,
      averageOrderValue: 0,
      topPromotions: [],
      topCoupons: [],
    }
  }

  @Get('analytics/performance')
  @UseGuards(MarketplacePermissionsGuard)
  @RequireMarketplacePermissions(MarketplacePermission.VIEW_ANALYTICS)
  async getPromotionsPerformance(
    @CurrentTenant() _tenantId: string,
    @Query('startDate') _startDate?: string,
    @Query('endDate') _endDate?: string
  ) {
    // Get performance metrics
    return {
      promotions: [],
      bestPerformers: [],
      worstPerformers: [],
      recommendations: [],
    }
  }

  // Templates

  @Get('templates')
  @UseGuards(MarketplacePermissionsGuard)
  @RequireMarketplacePermissions(MarketplacePermission.VIEW_ANALYTICS)
  async getPromotionTemplates() {
    return {
      templates: [
        {
          name: 'Welcome Discount',
          description: '10% off for new customers',
          type: 'PERCENTAGE',
          value: 10,
          conditions: { customerType: 'NEW' },
        },
        {
          name: 'Free Shipping Weekend',
          description: 'Free shipping on weekends',
          type: 'FREE_SHIPPING',
          value: 0,
          conditions: { validDays: [0, 6] },
        },
        {
          name: 'Buy 2 Get 1 Free',
          description: 'Buy 2 items, get 1 free',
          type: 'BUY_X_GET_Y',
          value: 100,
          conditions: { buyQuantity: 2, getQuantity: 1 },
        },
        {
          name: 'Summer Sale',
          description: '20% off everything',
          type: 'PERCENTAGE',
          value: 20,
        },
        {
          name: 'Bundle Deal',
          description: '15% off when buying bundle',
          type: 'BUNDLE',
          value: 15,
        },
        {
          name: 'Loyalty Reward',
          description: '$10 off for VIP customers',
          type: 'FIXED_AMOUNT',
          value: 10,
          conditions: { customerType: 'VIP' },
        },
      ],
    }
  }

  @Post('templates/:templateName/apply')
  @HttpCode(HttpStatus.OK)
  @UseGuards(MarketplacePermissionsGuard)
  @RequireMarketplacePermissions(MarketplacePermission.MANAGE_SETTINGS)
  async applyPromotionTemplate(
    @CurrentTenant() _tenantId: string,
    @Param('templateName') _templateName: string,
    @Body() _body: {
      name?: string
      startDate?: string
      endDate?: string
      modifyValues?: boolean
    }
  ): Promise<MarketplacePromotion> {
    // Get template and create promotion based on it
    // Would need implementation
    throw new Error('Not implemented')
  }

  // Export

  @Get('export')
  @UseGuards(MarketplacePermissionsGuard)
  @RequireMarketplacePermissions(MarketplacePermission.VIEW_ANALYTICS)
  async exportPromotions(
    @CurrentTenant() tenantId: string,
    @Query('format', new DefaultValuePipe('csv')) format: 'csv' | 'json',
    @Query('active', ParseBoolPipe) active?: boolean
  ) {
    const promotions = active ? await this.promotionsService.getActivePromotions(tenantId) : [] // Would get all promotions

    if (format === 'json') {
      return {
        content: JSON.stringify(promotions, null, 2),
        filename: `promotions-${tenantId}-${new Date().toISOString().split('T')[0]}.json`,
        mimeType: 'application/json',
      }
    }

    // CSV format
    const csvHeader = [
      'ID',
      'Name',
      'Type',
      'Value',
      'Start Date',
      'End Date',
      'Active',
      'Usage Count',
      'Max Usages',
      'Minimum Order',
    ].join(',')

    const csvRows = promotions.map((promo) =>
      [
        promo.id,
        `"${promo.name}"`,
        promo.type,
        promo.value,
        promo.startDate.toISOString(),
        promo.endDate?.toISOString() || '',
        promo.isActive,
        promo.usageCount,
        promo.maxUsages || '',
        promo.minimumOrderAmount || '',
      ].join(',')
    )

    const csvContent = [csvHeader, ...csvRows].join('\n')

    return {
      content: csvContent,
      filename: `promotions-${tenantId}-${new Date().toISOString().split('T')[0]}.csv`,
      mimeType: 'text/csv',
    }
  }
}
