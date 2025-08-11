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
import type { DataSource } from 'typeorm'

import { TenantGuard } from '../../../shared/tenant/tenant.guard'

interface TenantRequest extends Request {
  tenant: {
    societeId: string
    erpTenantConnection: DataSource | null
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

import { MarketplaceProductsService } from '../services/marketplace-products.service'
import { HttpService } from '@nestjs/axios'
import { firstValueFrom } from 'rxjs'
import { PriceRuleChannel } from '@erp/entities'

@ApiTags('admin-products')
@Controller('admin/products')
@UseGuards(TenantGuard)
@ApiBearerAuth()
export class ProductsController {
  constructor(
    private productsService: MarketplaceProductsService,
    private httpService: HttpService
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
      sortBy: (query.sortBy as 'name' | 'price' | 'date' | 'popularity') || 'name',
      sortOrder: (query.sortOrder as 'ASC' | 'DESC') || 'ASC',
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

    if (!tenant.erpTenantConnection) {
      throw new Error('Connexion ERP non disponible pour ce tenant')
    }

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

    if (!tenant.erpTenantConnection) {
      throw new Error('Connexion ERP non disponible pour ce tenant')
    }

    // Récupérer le produit pour avoir le prix de base
    const product = await this.productsService.getProductById(
      tenant.erpTenantConnection,
      tenant.societeId,
      productId
    )

    // Appeler l'API de pricing centralisée
    try {
      const priceResponse = await firstValueFrom(
        this.httpService.post(`${process.env.API_URL || 'http://localhost:3002'}/pricing/calculate`, {
          articleId: productId,
          customerId: query.customerId,
          customerGroup: query.customerGroup,
          quantity: parseInt(query.quantity) || 1,
          promotionCode: query.promotionCode,
          channel: PriceRuleChannel.MARKETPLACE
        })
      )
      return priceResponse.data
    } catch (error) {
      console.error('Erreur calcul prix:', error)
      return {
        basePrice: product.basePrice,
        finalPrice: product.basePrice,
        appliedRules: [],
        totalDiscount: 0,
        totalDiscountPercentage: 0
      }
    }
  }

  @Get(':productId/pricing/rules')
  @ApiOperation({ summary: 'Get pricing rules for product' })
  async getPricingRules(@Req() _req: Request, @Param('productId') productId: string) {
    // Appeler l'API pour récupérer les règles
    try {
      const rulesResponse = await firstValueFrom(
        this.httpService.get(`${process.env.API_URL || 'http://localhost:3002'}/pricing/rules`, {
          params: {
            articleId: productId,
            channel: PriceRuleChannel.MARKETPLACE
          }
        })
      )
      return rulesResponse.data
    } catch (error) {
      console.error('Erreur récupération règles:', error)
      return { rules: [], total: 0 }
    }
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
