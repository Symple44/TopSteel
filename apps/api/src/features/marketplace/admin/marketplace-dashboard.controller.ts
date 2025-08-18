import { Controller, Get, HttpCode, HttpStatus, Post, Query, UseGuards } from '@nestjs/common'
import { CurrentTenant } from '../../../core/common/decorators/current-tenant.decorator'
import { JwtAuthGuard } from '../../../domains/auth/security/guards/jwt-auth.guard'
import {
  MarketplacePermission,
  RequireMarketplacePermissions,
} from '../auth/decorators/marketplace-permissions.decorator'
import { MarketplacePermissionsGuard } from '../auth/guards/marketplace-permissions.guard'
import type {
  DashboardMetrics,
  DateRange,
  MarketplaceDashboardService,
} from './marketplace-dashboard.service'

@Controller('api/marketplace/admin/dashboard')
@UseGuards(JwtAuthGuard, MarketplacePermissionsGuard)
@RequireMarketplacePermissions(MarketplacePermission.VIEW_ANALYTICS)
export class MarketplaceDashboardController {
  constructor(private readonly dashboardService: MarketplaceDashboardService) {}

  @Get('metrics')
  async getDashboardMetrics(
    @CurrentTenant() tenantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ): Promise<DashboardMetrics> {
    const dateRange: DateRange | undefined =
      startDate && endDate
        ? {
            startDate: new Date(startDate),
            endDate: new Date(endDate),
          }
        : undefined

    return this.dashboardService.getDashboardMetrics(tenantId, dateRange)
  }

  @Get('overview')
  async getOverview(
    @CurrentTenant() tenantId: string,
    @Query('period') period?: '7d' | '30d' | '90d' | 'custom',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    let dateRange: DateRange | undefined

    if (period === 'custom' && startDate && endDate) {
      dateRange = {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      }
    } else if (period) {
      const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
      dateRange = {
        startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
        endDate: new Date(),
      }
    }

    const metrics = await this.dashboardService.getDashboardMetrics(tenantId, dateRange)
    return {
      overview: metrics.overview,
      recentActivity: metrics.recentActivity,
    }
  }

  @Get('analytics')
  async getAnalytics(
    @CurrentTenant() tenantId: string,
    @Query('period') period?: '7d' | '30d' | '90d' | 'custom',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    let dateRange: DateRange | undefined

    if (period === 'custom' && startDate && endDate) {
      dateRange = {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      }
    } else if (period) {
      const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
      dateRange = {
        startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
        endDate: new Date(),
      }
    }

    const metrics = await this.dashboardService.getDashboardMetrics(tenantId, dateRange)
    return {
      analytics: metrics.analytics,
      performance: metrics.performance,
    }
  }

  @Get('sales-trend')
  async getSalesTrend(@CurrentTenant() tenantId: string, @Query('days') days: number = 30) {
    const dateRange: DateRange = {
      startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      endDate: new Date(),
    }

    const metrics = await this.dashboardService.getDashboardMetrics(tenantId, dateRange)
    return metrics.analytics.salesTrend
  }

  @Get('top-products')
  async getTopProducts(
    @CurrentTenant() tenantId: string,
    @Query('period') period?: '7d' | '30d' | '90d',
    @Query('limit') limit: number = 10
  ) {
    let dateRange: DateRange | undefined

    if (period) {
      const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
      dateRange = {
        startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
        endDate: new Date(),
      }
    }

    const metrics = await this.dashboardService.getDashboardMetrics(tenantId, dateRange)
    return metrics.analytics.topProducts.slice(0, limit)
  }

  @Get('order-status')
  async getOrderStatusBreakdown(
    @CurrentTenant() tenantId: string,
    @Query('period') period?: '7d' | '30d' | '90d'
  ) {
    let dateRange: DateRange | undefined

    if (period) {
      const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
      dateRange = {
        startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
        endDate: new Date(),
      }
    }

    const metrics = await this.dashboardService.getDashboardMetrics(tenantId, dateRange)
    return metrics.analytics.orderStatusBreakdown
  }

  @Get('customer-growth')
  async getCustomerGrowth(@CurrentTenant() tenantId: string, @Query('days') days: number = 30) {
    const dateRange: DateRange = {
      startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      endDate: new Date(),
    }

    const metrics = await this.dashboardService.getDashboardMetrics(tenantId, dateRange)
    return metrics.analytics.customerGrowth
  }

  @Get('recent-activity')
  async getRecentActivity(@CurrentTenant() tenantId: string) {
    const metrics = await this.dashboardService.getDashboardMetrics(tenantId)
    return metrics.recentActivity
  }

  @Get('performance')
  async getPerformanceMetrics(
    @CurrentTenant() tenantId: string,
    @Query('period') period?: '7d' | '30d' | '90d'
  ) {
    let dateRange: DateRange | undefined

    if (period) {
      const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
      dateRange = {
        startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
        endDate: new Date(),
      }
    }

    const metrics = await this.dashboardService.getDashboardMetrics(tenantId, dateRange)
    return metrics.performance
  }

  @Post('refresh-cache')
  @HttpCode(HttpStatus.OK)
  @RequireMarketplacePermissions(MarketplacePermission.MANAGE_SETTINGS)
  async refreshCache(@CurrentTenant() tenantId: string): Promise<{ success: boolean }> {
    await this.dashboardService.clearCache(tenantId)
    return { success: true }
  }
}
