import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
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

import { PriceRuleChannel } from '@erp/entities'
import type { HttpService } from '@nestjs/axios'
import { InjectRepository } from '@nestjs/typeorm'
import { firstValueFrom } from 'rxjs'
import type { Repository } from 'typeorm'
import { Article } from '../../../shared/entities/erp/article.entity'
import {
  type AdjustmentType,
  MarketplacePriceRule,
  type PricingCondition,
} from '../entities/marketplace-price-rule.entity'
import { MarketplaceProduct } from '../entities/marketplace-product.entity'
import type { MarketplaceProductsService } from '../services/marketplace-products.service'

@ApiTags('admin-products')
@Controller('admin/products')
@UseGuards(TenantGuard)
@ApiBearerAuth()
export class ProductsController {
  constructor(
    private productsService: MarketplaceProductsService,
    private httpService: HttpService,
    @InjectRepository(MarketplacePriceRule, 'marketplace')
    private priceRuleRepo: Repository<MarketplacePriceRule>,
    @InjectRepository(MarketplaceProduct, 'marketplace')
    private marketplaceProductRepo: Repository<MarketplaceProduct>
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all marketplace products (admin)' })
  @ApiResponse({ status: 200, description: 'List of marketplace products' })
  async getMarketplaceProducts(@Req() req: TenantRequest, @Query() query: ProductQuery) {
    const { tenant } = req

    return await this.productsService.getProducts(tenant.erpTenantConnection, tenant.societeId, {
      search: query.search,
      categories: query.categories?.split(','),
      limit: parseInt(query.limit, 10) || 50,
      offset: parseInt(query.offset, 10) || 0,
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
        this.httpService.post(
          `${process.env.API_URL || 'http://localhost:3002'}/pricing/calculate`,
          {
            articleId: productId,
            customerId: query.customerId,
            customerGroup: query.customerGroup,
            quantity: parseInt(query.quantity, 10) || 1,
            promotionCode: query.promotionCode,
            channel: PriceRuleChannel.MARKETPLACE,
          }
        )
      )
      return priceResponse.data
    } catch (_error) {
      return {
        basePrice: product.basePrice,
        finalPrice: product.basePrice,
        appliedRules: [],
        totalDiscount: 0,
        totalDiscountPercentage: 0,
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
            channel: PriceRuleChannel.MARKETPLACE,
          },
        })
      )
      return rulesResponse.data
    } catch (_error) {
      return { rules: [], total: 0 }
    }
  }

  @Post(':productId/pricing/rules')
  @ApiOperation({ summary: 'Create pricing rule for product' })
  async createPricingRule(
    @Req() req: TenantRequest,
    @Param('productId') productId: string,
    @Body() body: {
      ruleName: string
      description?: string
      conditions: PricingCondition[]
      adjustmentType: AdjustmentType
      adjustmentValue: number
      priority?: number
      validFrom?: Date
      validUntil?: Date
      usageLimit?: number
      combinable?: boolean
    }
  ) {
    const { tenant } = req

    // Créer la nouvelle règle de prix
    const priceRule = this.priceRuleRepo.create({
      societeId: tenant.societeId,
      productId,
      ruleName: body.ruleName,
      description: body.description,
      conditions: body.conditions || [],
      adjustmentType: body.adjustmentType,
      adjustmentValue: body.adjustmentValue,
      priority: body.priority || 0,
      validFrom: body.validFrom,
      validUntil: body.validUntil,
      usageLimit: body.usageLimit,
      combinable: body.combinable || false,
      isActive: true,
      metadata: {
        createdBy: 'admin',
        notes: `Rule created via marketplace admin`,
      },
    })

    const savedRule = await this.priceRuleRepo.save(priceRule)

    // Invalider le cache du produit
    await this.productsService.invalidateProductCache(productId)

    return {
      message: 'Pricing rule created successfully',
      rule: savedRule,
    }
  }

  @Put(':productId/pricing/rules/:ruleId')
  @ApiOperation({ summary: 'Update pricing rule' })
  async updatePricingRule(
    @Req() req: TenantRequest,
    @Param('productId') productId: string,
    @Param('ruleId') ruleId: string,
    @Body() body: Partial<{
      ruleName: string
      description: string
      conditions: PricingCondition[]
      adjustmentType: AdjustmentType
      adjustmentValue: number
      priority: number
      validFrom: Date
      validUntil: Date
      usageLimit: number
      combinable: boolean
      isActive: boolean
    }>
  ) {
    const { tenant } = req

    // Vérifier que la règle existe
    const existingRule = await this.priceRuleRepo.findOne({
      where: {
        id: ruleId,
        productId,
        societeId: tenant.societeId,
      },
    })

    if (!existingRule) {
      throw new NotFoundException('Pricing rule not found')
    }

    // Mettre à jour la règle
    await this.priceRuleRepo.update(ruleId, {
      ...body,
      metadata: {
        ...existingRule.metadata,
        notes: `Updated via marketplace admin at ${new Date().toISOString()}`,
      },
    })

    // Invalider le cache du produit
    await this.productsService.invalidateProductCache(productId)

    const updatedRule = await this.priceRuleRepo.findOne({ where: { id: ruleId } })

    return {
      message: 'Pricing rule updated successfully',
      rule: updatedRule,
    }
  }

  @Delete(':productId/pricing/rules/:ruleId')
  @ApiOperation({ summary: 'Delete pricing rule' })
  async deletePricingRule(
    @Req() req: TenantRequest,
    @Param('productId') productId: string,
    @Param('ruleId') ruleId: string
  ) {
    const { tenant } = req

    // Vérifier que la règle existe
    const existingRule = await this.priceRuleRepo.findOne({
      where: {
        id: ruleId,
        productId,
        societeId: tenant.societeId,
      },
    })

    if (!existingRule) {
      throw new NotFoundException('Pricing rule not found')
    }

    // Supprimer la règle
    await this.priceRuleRepo.delete(ruleId)

    // Invalider le cache du produit
    await this.productsService.invalidateProductCache(productId)

    return {
      message: 'Pricing rule deleted successfully',
      productId,
      ruleId,
    }
  }

  @Post('sync')
  @ApiOperation({ summary: 'Sync products from ERP' })
  async syncProducts(@Req() req: TenantRequest) {
    const { tenant } = req

    if (!tenant.erpTenantConnection) {
      throw new Error('Connexion ERP non disponible pour ce tenant')
    }

    // Récupérer tous les articles marketplace depuis l'ERP
    const articlesRepo = tenant.erpTenantConnection.getRepository(Article)
    const articles = await articlesRepo.find({
      where: {
        societeId: tenant.societeId,
        isMarketplaceEnabled: true,
      },
    })

    let created = 0
    let updated = 0

    // Synchroniser chaque article
    for (const article of articles) {
      const existingProduct = await this.marketplaceProductRepo.findOne({
        where: {
          erpArticleId: article.id,
          societeId: tenant.societeId,
        },
      })

      if (existingProduct) {
        // Mettre à jour le produit existant
        existingProduct.marketplaceData.description = article.description
        existingProduct.basePrice = article.prixVenteHT || 0
        existingProduct.updatedAt = new Date()

        await this.marketplaceProductRepo.save(existingProduct)
        updated++
      } else {
        // Créer un nouveau produit marketplace
        const newProduct = this.marketplaceProductRepo.create({
          societeId: tenant.societeId,
          erpArticleId: article.id,
          basePrice: article.prixVenteHT || 0,
          isActive: true,
          isVisible: true,
          isFeatured: false,
          marketplaceData: {
            description: article.description,
            shortDescription: article.description?.substring(0, 150),
            categories:
              article.marketplaceSettings?.categories || [article.famille].filter(Boolean),
            tags: article.marketplaceSettings?.tags || [],
            images: (article.marketplaceSettings?.images || []).map((url, index) => ({
              url,
              isMain: index === 0,
              order: index,
              alt: `Product image ${index + 1}`,
            })),
            customFields: {
              reference: article.reference,
              unit: article.uniteVente,
              weight: article.poids,
              dimensions: {
                length: article.longueur,
                width: article.largeur,
                height: article.hauteur,
              },
            },
          },
        })

        await this.marketplaceProductRepo.save(newProduct)
        created++
      }

      // Invalider le cache
      await this.productsService.invalidateProductCache(article.id)
    }

    return {
      message: 'Product sync completed',
      societeId: tenant.societeId,
      results: {
        total: articles.length,
        created,
        updated,
      },
    }
  }

  @Put(':productId/marketplace-settings')
  @ApiOperation({ summary: 'Update marketplace-specific settings for product' })
  async updateMarketplaceSettings(
    @Req() req: TenantRequest,
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
    const { tenant } = req

    // Vérifier si le produit marketplace existe
    let marketplaceProduct = await this.marketplaceProductRepo.findOne({
      where: {
        erpArticleId: productId,
        societeId: tenant.societeId,
      },
    })

    if (!marketplaceProduct) {
      // Si le produit n'existe pas, le créer
      if (!tenant.erpTenantConnection) {
        throw new Error('Connexion ERP non disponible pour ce tenant')
      }

      const articlesRepo = tenant.erpTenantConnection.getRepository(Article)
      const article = await articlesRepo.findOne({
        where: {
          id: productId,
          societeId: tenant.societeId,
        },
      })

      if (!article) {
        throw new NotFoundException('Product not found in ERP')
      }

      marketplaceProduct = this.marketplaceProductRepo.create({
        societeId: tenant.societeId,
        erpArticleId: productId,
        basePrice: article.prixVenteHT || 0,
        marketplaceData: {},
      })
    }

    // Mettre à jour les paramètres marketplace
    if (!marketplaceProduct.marketplaceData) {
      marketplaceProduct.marketplaceData = {}
    }
    if (settings.images !== undefined)
      marketplaceProduct.marketplaceData.images = settings.images.map((url, index) => ({
        url,
        isMain: index === 0,
        order: index,
        alt: `Product image ${index + 1}`,
      }))
    if (settings.description !== undefined)
      marketplaceProduct.marketplaceData.description = settings.description
    if (settings.seoTitle !== undefined) {
      if (!marketplaceProduct.marketplaceData.seo) marketplaceProduct.marketplaceData.seo = {}
      marketplaceProduct.marketplaceData.seo.title = settings.seoTitle
    }
    if (settings.seoDescription !== undefined) {
      if (!marketplaceProduct.marketplaceData.seo) marketplaceProduct.marketplaceData.seo = {}
      marketplaceProduct.marketplaceData.seo.description = settings.seoDescription
    }
    if (settings.categories !== undefined)
      marketplaceProduct.marketplaceData.categories = settings.categories
    if (settings.tags !== undefined) marketplaceProduct.marketplaceData.tags = settings.tags
    if (settings.isVisible !== undefined) marketplaceProduct.isVisible = settings.isVisible
    if (settings.isFeatured !== undefined) marketplaceProduct.isFeatured = settings.isFeatured

    marketplaceProduct.updatedAt = new Date()

    const savedProduct = await this.marketplaceProductRepo.save(marketplaceProduct)

    // Invalider le cache
    await this.productsService.invalidateProductCache(productId)

    // Aussi mettre à jour l'article ERP si connecté
    if (tenant.erpTenantConnection) {
      const articlesRepo = tenant.erpTenantConnection.getRepository(Article)
      await articlesRepo.update(productId, {
        marketplaceSettings: {
          images: settings.images,
          description: settings.description,
          seoTitle: settings.seoTitle,
          seoDescription: settings.seoDescription,
          categories: settings.categories,
          tags: settings.tags,
          isVisible: settings.isVisible,
          isFeatured: settings.isFeatured,
        } as any,
      })
    }

    return {
      message: 'Marketplace settings updated successfully',
      product: savedProduct,
    }
  }
}
