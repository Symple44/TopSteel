import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common'
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsNumber, IsOptional, IsString, Min } from 'class-validator'
import { CurrentTenant } from '../../../core/common/decorators/current-tenant.decorator'
import { JwtAuthGuard } from '../../../domains/auth/security/guards/jwt-auth.guard'
import type {
  MarketplacePriceResult,
  MarketplacePricingIntegrationService,
  MarketplacePricingOptions,
} from '../pricing/marketplace-pricing-integration.service'

class CalculatePriceDto {
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity: number

  @IsString()
  @IsOptional()
  customerId?: string

  @IsString()
  @IsOptional()
  customerGroup?: string

  @IsString()
  @IsOptional()
  promotionCode?: string
}

class BulkPriceDto {
  items: Array<{
    articleId: string
    quantity: number
    customizations?: Record<string, unknown>
  }>

  @IsString()
  @IsOptional()
  customerId?: string
}

class ShippingCalculationDto {
  items: Array<{
    articleId: string
    quantity: number
    weight?: number
  }>

  @IsString()
  destinationPostalCode: string
}

@ApiTags('Marketplace Pricing')
@Controller('marketplace/pricing')
@UseGuards(JwtAuthGuard)
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  })
)
export class MarketplacePricingController {
  constructor(private readonly pricingService: MarketplacePricingIntegrationService) {}

  @Get('article/:articleId')
  @ApiOperation({
    summary: 'Calculate price for a single article',
    description: 'Get the price of an article with all applicable rules and discounts',
  })
  @ApiParam({ name: 'articleId', type: 'string', format: 'uuid' })
  @ApiQuery({ name: 'quantity', type: 'number', required: true, minimum: 1 })
  @ApiQuery({ name: 'customerId', type: 'string', required: false })
  @ApiQuery({ name: 'promotionCode', type: 'string', required: false })
  @ApiResponse({
    status: 200,
    description: 'Price calculated successfully',
    schema: {
      type: 'object',
      properties: {
        basePrice: { type: 'number' },
        finalPrice: { type: 'number' },
        displayPrice: { type: 'number' },
        originalPrice: { type: 'number' },
        savings: { type: 'number' },
        taxAmount: { type: 'number' },
        appliedRules: { type: 'array' },
      },
    },
  })
  async calculateArticlePrice(
    @CurrentTenant() tenantId: string,
    @Param('articleId', ParseUUIDPipe) articleId: string,
    @Query() query: CalculatePriceDto
  ): Promise<MarketplacePriceResult> {
    const options: MarketplacePricingOptions = {
      quantity: query.quantity,
      customerId: query.customerId,
      customerGroup: query.customerGroup,
      promotionCode: query.promotionCode,
    }

    return this.pricingService.calculateMarketplacePrice(articleId, tenantId, options)
  }

  @Post('bulk')
  @ApiOperation({
    summary: 'Calculate prices for multiple articles',
    description: 'Get prices for a cart or list of articles',
  })
  @ApiResponse({
    status: 200,
    description: 'Bulk prices calculated successfully',
  })
  async calculateBulkPrices(
    @CurrentTenant() tenantId: string,
    @Body() dto: BulkPriceDto
  ): Promise<{
    items: Array<{ articleId: string; price: MarketplacePriceResult }>
    summary: {
      subtotal: number
      totalTax: number
      total: number
      totalSavings: number
    }
  }> {
    const prices = await this.pricingService.calculateBulkPrices(
      dto.items,
      tenantId,
      dto.customerId
    )

    // Calculer le résumé
    let subtotal = 0
    let totalTax = 0
    let totalSavings = 0

    const items: Array<{ articleId: string; price: MarketplacePriceResult }> = []

    for (const [articleId, price] of prices.entries()) {
      items.push({ articleId, price })
      subtotal += price.finalPrice
      totalTax += price.taxAmount || 0
      totalSavings += price.savings || 0
    }

    return {
      items,
      summary: {
        subtotal,
        totalTax,
        total: subtotal + totalTax,
        totalSavings,
      },
    }
  }

  @Post('shipping')
  @ApiOperation({
    summary: 'Calculate shipping cost',
    description: 'Calculate shipping cost based on items and destination',
  })
  @ApiResponse({
    status: 200,
    description: 'Shipping cost calculated successfully',
    schema: {
      type: 'object',
      properties: {
        shippingCost: { type: 'number' },
        estimatedDelivery: { type: 'string' },
        carrier: { type: 'string' },
      },
    },
  })
  async calculateShipping(
    @CurrentTenant() tenantId: string,
    @Body() dto: ShippingCalculationDto
  ): Promise<{
    shippingCost: number
    estimatedDelivery: string
    carrier: string
  }> {
    const shippingCost = await this.pricingService.calculateShippingCost(
      dto.items,
      dto.destinationPostalCode,
      tenantId
    )

    // Calculer la date de livraison estimée (2-5 jours ouvrés)
    const estimatedDays = shippingCost === 0 ? 2 : 3 // Livraison plus rapide si gratuite
    const estimatedDate = new Date()
    estimatedDate.setDate(estimatedDate.getDate() + estimatedDays)

    return {
      shippingCost,
      estimatedDelivery: estimatedDate.toISOString(),
      carrier: shippingCost === 0 ? 'Express' : 'Standard',
    }
  }

  @Post('promotion/apply')
  @ApiOperation({
    summary: 'Apply a promotion code',
    description: 'Validate and apply a promotion code to get the discounted price',
  })
  @ApiResponse({
    status: 200,
    description: 'Promotion applied successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        newPrice: { type: 'number' },
        discount: { type: 'number' },
        message: { type: 'string' },
      },
    },
  })
  async applyPromotion(
    @CurrentTenant() tenantId: string,
    @Body() body: {
      code: string
      currentPrice: number
      articleId: string
    }
  ): Promise<{
    success: boolean
    newPrice?: number
    discount?: number
    message?: string
  }> {
    return this.pricingService.applyPromotionCode(
      body.code,
      body.currentPrice,
      body.articleId,
      tenantId
    )
  }

  @Post('cache/invalidate/:articleId')
  @ApiOperation({
    summary: 'Invalidate price cache for an article',
    description: 'Clear cached prices for an article after price rule changes',
  })
  @ApiParam({ name: 'articleId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Cache invalidated successfully',
  })
  async invalidateCache(
    @CurrentTenant() tenantId: string,
    @Param('articleId', ParseUUIDPipe) articleId: string
  ): Promise<{ success: boolean }> {
    await this.pricingService.invalidateCache(articleId, tenantId)
    return { success: true }
  }

  @Post('cache/invalidate-all')
  @ApiOperation({
    summary: 'Invalidate all price cache for tenant',
    description: 'Clear all cached prices for the tenant',
  })
  @ApiResponse({
    status: 200,
    description: 'All cache invalidated successfully',
  })
  async invalidateAllCache(@CurrentTenant() tenantId: string): Promise<{ success: boolean }> {
    await this.pricingService.invalidateTenantCache(tenantId)
    return { success: true }
  }
}
