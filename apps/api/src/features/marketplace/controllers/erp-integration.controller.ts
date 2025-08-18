import {
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { CurrentTenant } from '../../../core/common/decorators/current-tenant.decorator'
import { JwtAuthGuard } from '../../../domains/auth/security/guards/jwt-auth.guard'
import type { MarketplaceCustomerAdapter } from '../adapters/marketplace-customer.adapter'
import type {
  ERPOrderView,
  MarketplaceOrderAdapter,
  MarketplaceOrderFilters,
} from '../adapters/marketplace-order.adapter'
import type {
  MarketplaceProductAdapter,
  PaginationOptions,
  ProductFilters,
  ProductListResponse,
  ProductSortOptions,
} from '../adapters/marketplace-product.adapter'
import type {
  CustomerFiltersQueryDto,
  CustomerParamsDto,
  OrderFiltersQueryDto,
  OrderParamsDto,
  ProductFiltersQueryDto,
  ProductParamsDto,
} from '../dto/security-validation.dto'
import type {
  ERPMarketplaceIntegrationService,
  ERPMarketplaceStats,
  IntegrationHealth,
  SyncOperationResult,
} from '../integration/erp-marketplace-integration.service'

@ApiTags('ERP Integration')
@Controller('marketplace/erp-integration')
@UseGuards(JwtAuthGuard)
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    validateCustomDecorators: true,
  })
)
export class ERPIntegrationController {
  private readonly logger = new Logger(ERPIntegrationController.name)

  constructor(
    private readonly integrationService: ERPMarketplaceIntegrationService,
    private readonly productAdapter: MarketplaceProductAdapter,
    private readonly customerAdapter: MarketplaceCustomerAdapter,
    private readonly orderAdapter: MarketplaceOrderAdapter
  ) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get ERP-Marketplace integration statistics' })
  @ApiResponse({ status: 200, description: 'Integration statistics retrieved successfully' })
  async getIntegrationStats(@CurrentTenant() tenantId: string): Promise<ERPMarketplaceStats> {
    return this.integrationService.getIntegrationStats(tenantId)
  }

  @Get('health')
  @ApiOperation({ summary: 'Check ERP-Marketplace integration health' })
  @ApiResponse({ status: 200, description: 'Integration health check completed' })
  async checkIntegrationHealth(@CurrentTenant() tenantId: string): Promise<IntegrationHealth> {
    return this.integrationService.checkIntegrationHealth(tenantId)
  }

  @Post('sync/full')
  @ApiOperation({ summary: 'Perform full synchronization between ERP and Marketplace' })
  @ApiResponse({ status: 200, description: 'Full synchronization completed' })
  async performFullSync(@CurrentTenant() tenantId: string): Promise<SyncOperationResult> {
    this.logger.log(`Full sync requested for tenant ${tenantId}`)
    return this.integrationService.performFullSync(tenantId)
  }

  @Get('products')
  @ApiOperation({ summary: 'Get marketplace products with ERP integration' })
  @ApiResponse({ status: 200, description: 'Marketplace products retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid query parameters' })
  async getMarketplaceProducts(
    @CurrentTenant() tenantId: string,
    @Query() query: ProductFiltersQueryDto
  ): Promise<ProductListResponse> {
    const filters: ProductFilters = {
      search: query.search,
      category: query.category,
      brand: query.brand,
      priceMin: query.priceMin,
      priceMax: query.priceMax,
    }

    const sort: ProductSortOptions = {
      field: (query.sortField as any) || 'createdAt',
      direction: (query.sortDirection as any) || 'DESC',
    }

    const pagination: PaginationOptions = {
      page: query.page || 1,
      limit: query.limit || 20,
    }

    return this.productAdapter.getMarketplaceProducts(tenantId, filters, sort, pagination)
  }

  @Get('products/:productId')
  @ApiOperation({ summary: 'Get unified product view (ERP + Marketplace)' })
  @ApiResponse({ status: 200, description: 'Unified product view retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid product ID format' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getUnifiedProductView(
    @CurrentTenant() tenantId: string,
    @Param() params: ProductParamsDto
  ) {
    return this.integrationService.getUnifiedProductView(tenantId, params.productId)
  }

  @Get('customers')
  @ApiOperation({ summary: 'Get marketplace customers with ERP integration' })
  @ApiResponse({ status: 200, description: 'Marketplace customers retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid query parameters' })
  async getMarketplaceCustomers(
    @CurrentTenant() tenantId: string,
    @Query() query: CustomerFiltersQueryDto
  ) {
    return this.customerAdapter.getMarketplaceCustomers(tenantId, {
      page: query.page || 1,
      limit: query.limit || 20,
      search: query.search,
      hasErpPartner: query.hasErpPartner,
      isActive: query.isActive,
    })
  }

  @Get('customers/:customerId')
  @ApiOperation({ summary: 'Get unified customer view (ERP + Marketplace)' })
  @ApiResponse({ status: 200, description: 'Unified customer view retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid customer ID format' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async getUnifiedCustomerView(
    @CurrentTenant() tenantId: string,
    @Param() params: CustomerParamsDto
  ) {
    return this.integrationService.getUnifiedCustomerView(tenantId, params.customerId)
  }

  @Get('orders')
  @ApiOperation({ summary: 'Get marketplace orders in ERP view' })
  @ApiResponse({ status: 200, description: 'ERP order views retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid query parameters' })
  async getERPOrdersView(@CurrentTenant() tenantId: string, @Query() query: OrderFiltersQueryDto) {
    const filters: MarketplaceOrderFilters = {
      status: query.status,
      customerId: query.customerId,
      search: query.search,
    }

    const pagination = {
      page: query.page || 1,
      limit: query.limit || 20,
    }

    return this.orderAdapter.getERPOrdersView(tenantId, filters, pagination)
  }

  @Get('orders/:orderId')
  @ApiOperation({ summary: 'Get marketplace order in ERP view' })
  @ApiResponse({ status: 200, description: 'ERP order view retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid order ID format' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getERPOrderView(
    @CurrentTenant() tenantId: string,
    @Param() params: OrderParamsDto
  ): Promise<ERPOrderView | null> {
    return this.orderAdapter.getERPOrderView(tenantId, params.orderId)
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get marketplace product categories from ERP' })
  @ApiResponse({ status: 200, description: 'Product categories retrieved successfully' })
  async getMarketplaceCategories(@CurrentTenant() tenantId: string) {
    return this.productAdapter.getMarketplaceCategories(tenantId)
  }

  @Get('brands')
  @ApiOperation({ summary: 'Get marketplace product brands from ERP' })
  @ApiResponse({ status: 200, description: 'Product brands retrieved successfully' })
  async getMarketplaceBrands(@CurrentTenant() tenantId: string) {
    return this.productAdapter.getMarketplaceBrands(tenantId)
  }
}
