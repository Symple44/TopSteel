import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Query, 
  Req, 
  UseGuards,
  HttpCode,
  HttpStatus
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger'
import { Request } from 'express'

import { TenantGuard } from '../../../shared/tenant/tenant.guard'
import { MarketplaceProductsService, ProductFilters } from '../../products/services/marketplace-products.service'
import { MarketplaceCustomersService } from '../../customers/services/marketplace-customers.service'
import { StorefrontService } from '../services/storefront.service'

@ApiTags('storefront')
@Controller('storefront')
@UseGuards(TenantGuard)
export class StorefrontController {
  constructor(
    private productsService: MarketplaceProductsService,
    private customersService: MarketplaceCustomersService,
    private storefrontService: StorefrontService,
  ) {}

  @Get('test')
  @ApiOperation({ summary: 'Test endpoint' })
  async test() {
    return { message: 'API Marketplace fonctionne !', timestamp: new Date().toISOString() }
  }

  @Get('test-products')
  @ApiOperation({ summary: 'Test products endpoint without tenant guard' })
  async testProducts() {
    // Test simple sans guard ni injection complexe
    return [
      {
        id: 'test-1',
        erpArticleId: 'TEST001',
        reference: 'TEST001',
        designation: 'Produit de test',
        description: 'Test sans dépendances',
        basePrice: 50.00,
        calculatedPrice: 50.00,
        images: [],
        categories: ['Test'],
        tags: ['test'],
        inStock: true,
        isActive: true,
        isFeatured: true,
        seo: {
          title: 'Produit de test',
          description: 'Test sans dépendances',
          slug: 'test-product'
        }
      }
    ]
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check for this tenant' })
  async health(@Req() req: Request) {
    const { tenant } = req as any
    
    if (!tenant) {
      return {
        status: 'error',
        message: 'Aucun tenant trouvé dans la requête',
        timestamp: new Date().toISOString()
      }
    }
    
    return {
      status: 'healthy',
      tenant: {
        societeId: tenant.societeId,
        nom: tenant.societe?.nom,
        marketplaceEnabled: tenant.marketplaceEnabled,
        hasConnection: !!tenant.erpTenantConnection,
        isInitialized: tenant.erpTenantConnection?.isInitialized
      },
      timestamp: new Date().toISOString()
    }
  }

  @Get('config')
  @ApiOperation({ summary: 'Get storefront configuration' })
  @ApiResponse({ status: 200, description: 'Storefront configuration' })
  async getStorefrontConfig(@Req() req: Request) {
    // Temporarily return static config for testing
    return {
      storeName: "TopSteel",
      description: "Boutique en ligne TopSteel",
      contactInfo: {
        email: "contact@topsteel.fr",
        address: "123 Rue de la Métallurgie, 75000 Paris"
      },
      features: {
        allowGuestCheckout: true,
        requiresAuth: false,
        showPrices: true,
        showStock: true,
        enableWishlist: false,
        enableCompare: false,
        enableReviews: false
      },
      social: {},
      seo: {
        title: "TopSteel - Boutique en ligne",
        description: "Découvrez nos produits sur la boutique en ligne de TopSteel",
        keywords: ["TopSteel", "boutique", "produits", "métallurgie"]
      }
    }
  }

  @Get('products')
  @ApiOperation({ summary: 'Get products catalog' })
  @ApiQuery({ name: 'search', required: false, description: 'Search query' })
  @ApiQuery({ name: 'category', required: false, description: 'Product category' })
  @ApiQuery({ name: 'tags', required: false, description: 'Product tags (comma separated)' })
  @ApiQuery({ name: 'minPrice', required: false, type: Number })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number })
  @ApiQuery({ name: 'inStock', required: false, type: Boolean })
  @ApiQuery({ name: 'featured', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['name', 'price', 'date', 'popularity'] })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  async getProducts(@Req() req: Request, @Query() query: any) {
    const { tenant } = req as any
    const customerId = req.headers['x-customer-id'] as string

    if (!tenant) {
      throw new Error('Tenant non disponible')
    }

    const filters: ProductFilters = {
      search: query.search,
      categories: query.category ? [query.category] : undefined,
      tags: query.tags ? query.tags.split(',') : undefined,
      priceRange: query.minPrice || query.maxPrice ? {
        min: parseFloat(query.minPrice) || 0,
        max: parseFloat(query.maxPrice) || Number.MAX_VALUE
      } : undefined,
      inStock: query.inStock === 'true',
      featured: query.featured === 'true',
      limit: Math.min(parseInt(query.limit) || 20, 100),
      offset: ((parseInt(query.page) || 1) - 1) * (parseInt(query.limit) || 20),
      sortBy: query.sortBy || 'name',
      sortOrder: query.sortOrder || 'ASC'
    }

    return await this.productsService.getProducts(
      tenant.erpTenantConnection || null,
      tenant.societeId,
      filters,
      customerId
    )
  }

  @Get('products/featured')
  @ApiOperation({ summary: 'Get featured products' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of products (default: 8)' })
  async getFeaturedProducts(@Req() req: Request, @Query('limit') limit?: string) {
    const { tenant } = req as any
    const customerId = req.headers['x-customer-id'] as string

    if (!tenant) {
      throw new Error('Tenant non disponible')
    }

    try {
      return await this.productsService.getFeaturedProducts(
        tenant.erpTenantConnection || null,
        tenant.societeId,
        parseInt(limit) || 8,
        customerId
      )
    } catch (error) {
      console.error('StorefrontController: Erreur dans getFeaturedProducts:', error.message)
      // Retourner une réponse de secours
      return [
        {
          id: 'demo-fallback-1',
          erpArticleId: 'FALLBACK001',
          reference: 'FALLBACK001',
          designation: 'Produit de démonstration',
          description: 'Produit de démonstration en cas d\'erreur',
          basePrice: 99.99,
          calculatedPrice: 99.99,
          images: [],
          categories: ['Demo'],
          tags: ['demo'],
          inStock: true,
          isActive: true,
          isFeatured: true,
          seo: {
            title: 'Produit de démonstration',
            description: 'Produit de démonstration en cas d\'erreur',
            slug: 'demo-fallback'
          }
        }
      ]
    }
  }

  @Get('products/categories')
  @ApiOperation({ summary: 'Get product categories' })
  async getCategories(@Req() req: Request) {
    const { tenant } = req as any
    
    if (!tenant) {
      throw new Error('Tenant non disponible')
    }
    
    return await this.productsService.getCategories(
      tenant.erpTenantConnection || null,
      tenant.societeId
    )
  }

  @Get('products/:productId')
  @ApiOperation({ summary: 'Get product details' })
  @ApiResponse({ status: 200, description: 'Product details' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getProductDetails(@Req() req: Request, @Param('productId') productId: string) {
    const { tenant } = req as any
    const customerId = req.headers['x-customer-id'] as string

    if (!tenant?.erpTenantConnection) {
      throw new Error('Connexion ERP non disponible pour ce tenant')
    }

    return await this.productsService.getProductById(
      tenant.erpTenantConnection,
      tenant.societeId,
      productId,
      customerId
    )
  }

  @Get('products/category/:category')
  @ApiOperation({ summary: 'Get products by category' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getProductsByCategory(
    @Req() req: Request,
    @Param('category') category: string,
    @Query() query: any
  ) {
    const { tenant } = req as any
    const customerId = req.headers['x-customer-id'] as string

    if (!tenant?.erpTenantConnection) {
      throw new Error('Connexion ERP non disponible pour ce tenant')
    }

    const limit = Math.min(parseInt(query.limit) || 20, 100)
    const offset = ((parseInt(query.page) || 1) - 1) * limit

    return await this.productsService.getProductsByCategory(
      tenant.erpTenantConnection,
      tenant.societeId,
      category,
      limit,
      offset,
      customerId
    )
  }

  @Get('search')
  @ApiOperation({ summary: 'Search products' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async searchProducts(@Req() req: Request, @Query() query: any) {
    const { tenant } = req as any
    const customerId = req.headers['x-customer-id'] as string

    if (!tenant?.erpTenantConnection) {
      throw new Error('Connexion ERP non disponible pour ce tenant')
    }

    if (!query.q) {
      return { products: [], total: 0, hasMore: false }
    }

    const limit = Math.min(parseInt(query.limit) || 20, 100)
    const offset = ((parseInt(query.page) || 1) - 1) * limit

    return await this.productsService.searchProducts(
      tenant.erpTenantConnection,
      tenant.societeId,
      query.q,
      limit,
      offset,
      customerId
    )
  }

  @Post('newsletter/subscribe')
  @ApiOperation({ summary: 'Subscribe to newsletter' })
  @HttpCode(HttpStatus.OK)
  async subscribeNewsletter(@Req() req: Request, @Body() body: { email: string }) {
    const { tenant } = req as any
    
    return await this.storefrontService.subscribeNewsletter(
      tenant.societeId,
      body.email
    )
  }

  @Post('contact')
  @ApiOperation({ summary: 'Send contact message' })
  @HttpCode(HttpStatus.OK)
  async sendContactMessage(@Req() req: Request, @Body() body: {
    name: string
    email: string
    subject: string
    message: string
    phone?: string
  }) {
    const { tenant } = req as any
    
    return await this.storefrontService.sendContactMessage(
      tenant.societeId,
      body
    )
  }

  @Get('theme')
  @ApiOperation({ summary: 'Get current theme configuration' })
  async getTheme(@Req() req: Request) {
    const { tenant } = req as any
    
    return await this.storefrontService.getCurrentTheme(tenant.societeId)
  }

  @Get('menu')
  @ApiOperation({ summary: 'Get navigation menu' })
  async getMenu(@Req() req: Request) {
    const { tenant } = req as any
    
    return await this.storefrontService.getNavigationMenu(tenant.societeId)
  }

  @Get('pages/:slug')
  @ApiOperation({ summary: 'Get static page content' })
  async getPage(@Req() req: Request, @Param('slug') slug: string) {
    const { tenant } = req as any
    
    return await this.storefrontService.getPage(tenant.societeId, slug)
  }
}