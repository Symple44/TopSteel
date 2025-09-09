import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common'
import { CurrentTenant } from '../../../core/common/decorators/current-tenant.decorator'
import { JwtAuthGuard } from '../../../domains/auth/security/guards/jwt-auth.guard'
import {
  MarketplacePermission,
  RequireMarketplacePermissions,
} from '../auth/decorators/marketplace-permissions.decorator'
import { MarketplacePermissionsGuard } from '../auth/guards/marketplace-permissions.guard'
import type {
  BulkUpdateDto,
  CreateMarketplaceProductDto as CreateProductDto,
  PaginationOptions,
  ProductCatalogService,
  ProductFilters,
  ProductListResponse,
  ProductSortOptions,
  UpdateMarketplaceProductDto as UpdateProductDto,
} from './product-catalog.service'

@Controller('api/marketplace/admin/products')
@UseGuards(JwtAuthGuard, MarketplacePermissionsGuard)
export class ProductCatalogController {
  constructor(private readonly productCatalogService: ProductCatalogService) {}

  @Get()
  @RequireMarketplacePermissions(MarketplacePermission.VIEW_PRODUCTS)
  async getProducts(
    @CurrentTenant() tenantId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('sortField', new DefaultValuePipe('createdAt')) sortField: string,
    @Query('sortDirection', new DefaultValuePipe('DESC')) sortDirection: 'ASC' | 'DESC',
    @Query('category') category?: string,
    @Query('subcategory') subcategory?: string,
    @Query('brand') brand?: string,
    @Query('priceMin', new DefaultValuePipe(0), ParseIntPipe) priceMin?: number,
    @Query('priceMax') priceMax?: number,
    @Query('stockMin', new DefaultValuePipe(0), ParseIntPipe) stockMin?: number,
    @Query('stockMax') stockMax?: number,
    @Query('isMarketplaceEnabled') isMarketplaceEnabled?: boolean,
    @Query('visibility') visibility?: string,
    @Query('search') search?: string,
    @Query('tags') tags?: string
  ): Promise<ProductListResponse> {
    const filters: ProductFilters = {
      category,
      subcategory,
      brand,
      priceMin: priceMin || undefined,
      priceMax: priceMax ? parseInt(priceMax.toString(), 10) : undefined,
      stockMin: stockMin || undefined,
      stockMax: stockMax ? parseInt(stockMax.toString(), 10) : undefined,
      isMarketplaceEnabled,
      visibility,
      search,
      tags: tags ? tags.split(',') : undefined,
    }

    // Validation et typage sécurisé pour les paramètres de tri
    const validSortFields: Array<ProductSortOptions['field']> = [
      'designation', 'prixVenteHT', 'stockDisponible', 'createdAt', 'updatedAt'
    ]
    const validDirections: Array<ProductSortOptions['direction']> = ['ASC', 'DESC']
    
    const sort: ProductSortOptions = {
      field: validSortFields.includes(sortField as ProductSortOptions['field']) 
        ? (sortField as ProductSortOptions['field']) 
        : 'createdAt',
      direction: validDirections.includes(sortDirection as ProductSortOptions['direction'])
        ? (sortDirection as ProductSortOptions['direction'])
        : 'DESC',
    }

    const pagination: PaginationOptions = {
      page: Math.max(1, page),
      limit: Math.min(100, Math.max(1, limit)),
    }

    return this.productCatalogService.getProducts(tenantId, filters, sort, pagination)
  }

  @Get(':id')
  @RequireMarketplacePermissions(MarketplacePermission.VIEW_PRODUCTS)
  async getProduct(
    @CurrentTenant() tenantId: string,
    @Param('id') productId: string
  ): Promise<unknown> {
    return this.productCatalogService.getProductById(tenantId, productId)
  }

  @Post()
  @RequireMarketplacePermissions(MarketplacePermission.MANAGE_PRODUCTS)
  async createProduct(
    @CurrentTenant() tenantId: string,
    @Body() createProductDto: CreateProductDto
  ): Promise<unknown> {
    return this.productCatalogService.createProduct(tenantId, createProductDto)
  }

  @Put(':id')
  @RequireMarketplacePermissions(MarketplacePermission.MANAGE_PRODUCTS)
  async updateProduct(
    @CurrentTenant() tenantId: string,
    @Param('id') productId: string,
    @Body() updateProductDto: Omit<UpdateProductDto, 'id'>
  ): Promise<unknown> {
    const updateData: UpdateProductDto = { ...updateProductDto, id: productId }
    return this.productCatalogService.updateProduct(tenantId, updateData)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequireMarketplacePermissions(MarketplacePermission.MANAGE_PRODUCTS)
  async deleteProduct(
    @CurrentTenant() tenantId: string,
    @Param('id') productId: string
  ): Promise<void> {
    return this.productCatalogService.deleteProduct(tenantId, productId)
  }

  @Post(':id/restore')
  @RequireMarketplacePermissions(MarketplacePermission.MANAGE_PRODUCTS)
  async restoreProduct(
    @CurrentTenant() tenantId: string,
    @Param('id') productId: string
  ): Promise<unknown> {
    return this.productCatalogService.restoreProduct(tenantId, productId)
  }

  @Post('bulk-update')
  @RequireMarketplacePermissions(MarketplacePermission.MANAGE_PRODUCTS)
  async bulkUpdateProducts(
    @CurrentTenant() tenantId: string,
    @Body() bulkUpdateDto: BulkUpdateDto
  ): Promise<{ updated: number }> {
    return this.productCatalogService.bulkUpdateProducts(tenantId, bulkUpdateDto)
  }

  @Put(':id/stock')
  @HttpCode(HttpStatus.OK)
  @RequireMarketplacePermissions(MarketplacePermission.MANAGE_PRODUCTS)
  async updateProductStock(
    @CurrentTenant() tenantId: string,
    @Param('id') productId: string,
    @Body() body: { quantity: number; reason?: string }
  ): Promise<{ success: boolean }> {
    await this.productCatalogService.updateProductStock(
      tenantId,
      productId,
      body.quantity,
      body.reason
    )
    return { success: true }
  }

  @Get('metadata/categories')
  @RequireMarketplacePermissions(MarketplacePermission.VIEW_PRODUCTS)
  async getCategories(
    @CurrentTenant() tenantId: string
  ): Promise<Array<{ category: string; subcategories: string[]; count: number }>> {
    return this.productCatalogService.getCategories(tenantId)
  }

  @Get('metadata/brands')
  @RequireMarketplacePermissions(MarketplacePermission.VIEW_PRODUCTS)
  async getBrands(
    @CurrentTenant() tenantId: string
  ): Promise<Array<{ brand: string; count: number }>> {
    return this.productCatalogService.getBrands(tenantId)
  }

  @Get('export/csv')
  @RequireMarketplacePermissions(MarketplacePermission.VIEW_PRODUCTS)
  async exportProductsCSV(
    @CurrentTenant() tenantId: string,
    @Query('category') category?: string,
    @Query('subcategory') subcategory?: string,
    @Query('brand') brand?: string,
    @Query('isMarketplaceEnabled') isMarketplaceEnabled?: boolean
  ) {
    const filters: ProductFilters = {
      category,
      subcategory,
      brand,
      isMarketplaceEnabled,
    }

    // Get all products matching filters for export
    const result = await this.productCatalogService.getProducts(
      tenantId,
      filters,
      { field: 'designation', direction: 'ASC' },
      { page: 1, limit: 10000 }
    )

    // Convert to CSV format
    const csvHeader = [
      'ID',
      'Name',
      'SKU',
      'ERP Article ID',
      'Category',
      'Subcategory',
      'Brand',
      'Price',
      'Stock Quantity',
      'Min Stock Level',
      'Weight',
      'Marketplace Enabled',
      'Visibility',
      'Created At',
      'Updated At',
    ].join(',')

    const csvRows = result.products.map((product) =>
      [
        product.id,
        `"${product.name?.replace(/"/g, '""') || ''}"`,
        product.sku,
        product.id || '',
        product.category || '',
        product.subcategory || '',
        product.brand || '',
        product.price,
        product.stockQuantity,
        product.minStockLevel || 0,
        product.weight || '',
        product.isMarketplaceEnabled,
        product.visibility,
        product.createdAt.toISOString(),
        product.updatedAt.toISOString(),
      ].join(',')
    )

    const csvContent = [csvHeader, ...csvRows].join('\n')

    return {
      content: csvContent,
      filename: `products-export-${new Date().toISOString().split('T')[0]}.csv`,
      mimeType: 'text/csv',
      count: result.products.length,
    }
  }

  @Get('search/suggestions')
  @RequireMarketplacePermissions(MarketplacePermission.VIEW_PRODUCTS)
  async getSearchSuggestions(
    @CurrentTenant() tenantId: string,
    @Query('q') query: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number
  ) {
    if (!query || query.length < 2) {
      return []
    }

    const result = await this.productCatalogService.getProducts(
      tenantId,
      { search: query, isMarketplaceEnabled: true },
      { field: 'designation', direction: 'ASC' },
      { page: 1, limit }
    )

    return result.products.map((product) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      category: product.category,
      price: product.price,
      stockQuantity: product.stockQuantity,
    }))
  }
}
