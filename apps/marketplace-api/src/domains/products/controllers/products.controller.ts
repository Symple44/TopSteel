import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import type { Request } from 'express'

import { TenantGuard } from '../../../shared/tenant/tenant.guard'

interface TenantRequest extends Request {
  tenant: {
    societeId: string
    erpTenantConnection: unknown
  }
}

interface ProductQuery {
  search?: string
  categories?: string
  limit?: string
  offset?: string
  sortBy?: string
  sortOrder?: string
}

interface PricingQuery {
  customerId?: string
  customerGroup?: string
  quantity?: string
  promotionCode?: string
}

import type { MarketplacePricingEngine } from '../services/marketplace-pricing-engine.service'
import type { MarketplaceProductsService } from '../services/marketplace-products.service'

@ApiTags('admin-products')
@Controller('admin/products')
@UseGuards(TenantGuard)
@ApiBearerAuth()
export class ProductsController {
  constructor(
    private productsService: MarketplaceProductsService,
    private pricingEngine: MarketplacePricingEngine
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all marketplace products (admin)' })
  @ApiResponse({ status: 200, description: 'List of marketplace products' })
  async getMarketplaceProducts(@Req() req: TenantRequest, @Query() query: ProductQuery) {
    const { tenant } = req

    return await this.productsService.getProducts(tenant.erpTenantConnection, tenant.societeId, {
      search: query.search,
      categories: query.categories?.split(','),
      limit: parseInt(query.limit) || 50,
      offset: parseInt(query.offset) || 0,
      sortBy: query.sortBy || 'name',
      sortOrder: query.sortOrder || 'ASC',
    })
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get product categories' })
  async getCategories(@Req() req: TenantRequest) {
    const { tenant } = req

    return await this.productsService.getCategories(tenant.erpTenantConnection, tenant.societeId)
  }

  @Get(':productId')
  @ApiOperation({ summary: 'Get product details (admin)' })
  @ApiResponse({ status: 200, description: 'Product details' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getProduct(@Req() req: TenantRequest, @Param('productId') productId: string) {
    const { tenant } = req

    return await this.productsService.getProductById(
      tenant.erpTenantConnection,
      tenant.societeId,
      productId
    )
  }

  @Get(':productId/pricing/preview')
  @ApiOperation({ summary: 'Preview product pricing with rules' })
  async previewPricing(
    @Req() req: TenantRequest,
    @Param('productId') productId: string,
    @Query() query: PricingQuery
  ) {
    const { tenant } = req

    // Récupérer le produit pour avoir le prix de base
    const product = await this.productsService.getProductById(
      tenant.erpTenantConnection,
      tenant.societeId,
      productId
    )

    return await this.pricingEngine.calculatePrice(productId, product.basePrice, query.customerId, {
      customerGroup: query.customerGroup,
      quantity: parseInt(query.quantity) || 1,
      promotionCode: query.promotionCode,
    })
  }

  @Get(':productId/pricing/rules')
  @ApiOperation({ summary: 'Get pricing rules for product' })
  async getPricingRules(@Req() _req: Request, @Param('productId') productId: string) {
    return await this.pricingEngine.getApplicableRules(productId)
  }

  @Post(':productId/pricing/rules')
  @ApiOperation({ summary: 'Create pricing rule for product' })
  async createPricingRule(
    @Req() _req: TenantRequest,
    @Param('productId') productId: string,
    @Body() body: unknown
  ) {
    // TODO: Implémenter création de règle de prix
    return { message: 'Pricing rule created', productId, rule: body }
  }

  @Put(':productId/pricing/rules/:ruleId')
  @ApiOperation({ summary: 'Update pricing rule' })
  async updatePricingRule(
    @Req() _req: TenantRequest,
    @Param('productId') productId: string,
    @Param('ruleId') ruleId: string,
    @Body() body: unknown
  ) {
    // TODO: Implémenter mise à jour de règle de prix
    return { message: 'Pricing rule updated', productId, ruleId, rule: body }
  }

  @Delete(':productId/pricing/rules/:ruleId')
  @ApiOperation({ summary: 'Delete pricing rule' })
  async deletePricingRule(
    @Req() _req: TenantRequest,
    @Param('productId') productId: string,
    @Param('ruleId') ruleId: string
  ) {
    // TODO: Implémenter suppression de règle de prix
    return { message: 'Pricing rule deleted', productId, ruleId }
  }

  @Post('sync')
  @ApiOperation({ summary: 'Sync products from ERP' })
  async syncProducts(@Req() req: TenantRequest) {
    const { tenant } = req

    // TODO: Implémenter synchronisation des produits depuis l'ERP
    return { message: 'Product sync started', societeId: tenant.societeId }
  }

  @Put(':productId/marketplace-settings')
  @ApiOperation({ summary: 'Update marketplace-specific settings for product' })
  async updateMarketplaceSettings(
    @Req() _req: TenantRequest,
    @Param('productId') productId: string,
    @Body() settings: {
      images?: string[]
      description?: string
      seoTitle?: string
      seoDescription?: string
      categories?: string[]
      tags?: string[]
      isVisible?: boolean
      isFeatured?: boolean
    }
  ) {
    // TODO: Implémenter mise à jour des paramètres marketplace
    return { message: 'Marketplace settings updated', productId, settings }
  }
}
