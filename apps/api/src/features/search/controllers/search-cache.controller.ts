import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'
import { getErrorMessage } from '../../../core/common/utils'
import { Roles } from '../../../domains/auth/decorators/roles.decorator'
import { JwtAuthGuard } from '../../../domains/auth/security/guards/jwt-auth.guard'
import { RolesGuard } from '../../../domains/auth/security/guards/roles.guard'
import type { CachedGlobalSearchService } from '../services/cached-global-search.service'
import type { CacheStatistics, SearchCacheService } from '../services/search-cache.service'
import type { SearchCacheInvalidationService } from '../services/search-cache-invalidation.service'

@ApiTags('Search Cache Management')
@Controller('api/search/cache')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SearchCacheController {
  constructor(
    private readonly cacheService: SearchCacheService,
    private readonly invalidationService: SearchCacheInvalidationService,
    private readonly cachedSearchService: CachedGlobalSearchService
  ) {}

  /**
   * Get cache statistics and health status
   */
  @Get('statistics')
  @ApiOperation({ summary: 'Get search cache statistics' })
  @ApiResponse({ status: 200, description: 'Cache statistics retrieved successfully' })
  @Roles('admin', 'developer')
  async getCacheStatistics(): Promise<{
    cache: CacheStatistics
    invalidation: any
    health: boolean
    config: any
  }> {
    const [cacheStats, invalidationStats, health, config] = await Promise.all([
      this.cacheService.getCacheStatistics(),
      this.invalidationService.getInvalidationStats(),
      this.cacheService.isHealthy(),
      this.cacheService.getCacheConfig(),
    ])

    return {
      cache: cacheStats,
      invalidation: invalidationStats,
      health,
      config: {
        enabled: config.enabled,
        defaultTTL: config.defaultTTL,
        entityTTLs: config.entityTTLs,
        popularSearchesLimit: config.popularSearchesLimit,
      },
    }
  }

  /**
   * Get cache health status
   */
  @Get('health')
  @ApiOperation({ summary: 'Check cache health status' })
  @ApiResponse({ status: 200, description: 'Cache health status' })
  async getCacheHealth(): Promise<{
    healthy: boolean
    redis: boolean
    enabled: boolean
    lastCheck: Date
  }> {
    const healthy = await this.cacheService.isHealthy()
    const config = this.cacheService.getCacheConfig()

    return {
      healthy,
      redis: healthy, // Simplified - in reality you might check Redis specifically
      enabled: config.enabled,
      lastCheck: new Date(),
    }
  }

  /**
   * Get cache configuration
   */
  @Get('config')
  @ApiOperation({ summary: 'Get cache configuration' })
  @ApiResponse({ status: 200, description: 'Cache configuration retrieved' })
  @Roles('admin')
  async getCacheConfig() {
    return this.cacheService.getCacheConfig()
  }

  /**
   * Clear all cache
   */
  @Delete('clear')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Clear all search cache' })
  @ApiResponse({ status: 204, description: 'All cache cleared successfully' })
  @Roles('admin')
  async clearAllCache(): Promise<void> {
    await this.cachedSearchService.clearAllCache()
  }

  /**
   * Clear cache for specific tenant
   */
  @Delete('tenant/:tenantId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Clear cache for specific tenant' })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID' })
  @ApiResponse({ status: 204, description: 'Tenant cache cleared successfully' })
  @Roles('admin', 'tenant_admin')
  async clearTenantCache(@Param('tenantId') tenantId: string): Promise<void> {
    await this.invalidationService.invalidateTenant(tenantId)
  }

  /**
   * Clear cache for specific entity type in tenant
   */
  @Delete('tenant/:tenantId/entity/:entityType')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Clear cache for specific entity type in tenant' })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID' })
  @ApiParam({ name: 'entityType', description: 'Entity type (product, customer, order, etc.)' })
  @ApiResponse({ status: 204, description: 'Entity cache cleared successfully' })
  @Roles('admin', 'tenant_admin')
  async clearEntityCache(
    @Param('tenantId') tenantId: string,
    @Param('entityType') entityType: string
  ): Promise<void> {
    await this.invalidationService.invalidateEntity(tenantId, entityType, 'manual')
  }

  /**
   * Warm cache with popular searches for a tenant
   */
  @Post('tenant/:tenantId/warm')
  @ApiOperation({ summary: 'Warm cache with popular searches' })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID' })
  @ApiResponse({ status: 200, description: 'Cache warming initiated' })
  @Roles('admin', 'tenant_admin')
  async warmCache(
    @Param('tenantId') tenantId: string,
    @Body() body: { queries: string[] }
  ): Promise<{ message: string; queriesWarmed: number }> {
    await this.cachedSearchService.warmCacheForTenant(tenantId, body.queries)

    return {
      message: 'Cache warming completed',
      queriesWarmed: body.queries.length,
    }
  }

  /**
   * Get popular search queries
   */
  @Get('popular-queries')
  @ApiOperation({ summary: 'Get popular search queries' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Limit number of results',
  })
  @ApiResponse({ status: 200, description: 'Popular queries retrieved' })
  @Roles('admin', 'analyst')
  async getPopularQueries(
    @Query('limit') limit?: number
  ): Promise<{ query: string; count: number; lastAccess: Date }[]> {
    const stats = await this.cacheService.getCacheStatistics()
    const limitValue = limit || 20

    return stats.popularQueries.slice(0, limitValue)
  }

  /**
   * Get cache performance metrics
   */
  @Get('metrics')
  @ApiOperation({ summary: 'Get cache performance metrics' })
  @ApiResponse({ status: 200, description: 'Cache metrics retrieved' })
  @Roles('admin', 'developer')
  async getCacheMetrics(): Promise<{
    performance: {
      hitRate: number
      totalHits: number
      totalMisses: number
      totalRequests: number
    }
    storage: {
      totalKeys: number
      memoryUsage: number
    }
    invalidation: {
      totalInvalidations: number
      invalidationsByEntity: Record<string, number>
      lastInvalidation: Date | null
    }
  }> {
    const [cacheStats, invalidationStats] = await Promise.all([
      this.cacheService.getCacheStatistics(),
      this.invalidationService.getInvalidationStats(),
    ])

    return {
      performance: {
        hitRate: cacheStats.hitRate,
        totalHits: cacheStats.hits,
        totalMisses: cacheStats.misses,
        totalRequests: cacheStats.hits + cacheStats.misses,
      },
      storage: {
        totalKeys: cacheStats.totalKeys,
        memoryUsage: cacheStats.memoryUsage,
      },
      invalidation: {
        totalInvalidations: invalidationStats.totalInvalidations,
        invalidationsByEntity: invalidationStats.invalidationsByEntity,
        lastInvalidation: invalidationStats.lastInvalidation,
      },
    }
  }

  /**
   * Reset cache statistics
   */
  @Post('statistics/reset')
  @ApiOperation({ summary: 'Reset cache statistics' })
  @ApiResponse({ status: 200, description: 'Statistics reset successfully' })
  @Roles('admin')
  async resetStatistics(): Promise<{ message: string }> {
    this.invalidationService.resetStats()

    return {
      message: 'Cache statistics reset successfully',
    }
  }

  /**
   * Perform cache maintenance
   */
  @Post('maintenance')
  @ApiOperation({ summary: 'Perform cache maintenance tasks' })
  @ApiResponse({ status: 200, description: 'Maintenance completed' })
  @Roles('admin')
  async performMaintenance(): Promise<{ message: string; actions: string[] }> {
    const actions: string[] = []

    try {
      // Perform scheduled cleanup
      await this.invalidationService.scheduleCleanup()
      actions.push('Scheduled cleanup completed')

      // Additional maintenance tasks could be added here
      // - Remove expired cache entries
      // - Optimize cache storage
      // - Update cache statistics

      return {
        message: 'Cache maintenance completed successfully',
        actions,
      }
    } catch (error) {
      return {
        message: 'Cache maintenance completed with some errors',
        actions: [...actions, `Error: ${getErrorMessage(error)}`],
      }
    }
  }

  /**
   * Test cache functionality
   */
  @Post('test')
  @ApiOperation({ summary: 'Test cache functionality' })
  @ApiResponse({ status: 200, description: 'Cache test results' })
  @Roles('admin', 'developer')
  async testCache(): Promise<{
    cacheEnabled: boolean
    redisConnected: boolean
    testResults: {
      setOperation: boolean
      getOperation: boolean
      deleteOperation: boolean
    }
  }> {
    const config = this.cacheService.getCacheConfig()
    const health = await this.cacheService.isHealthy()

    // Perform basic cache operations test
    const testKey = `test:${Date.now()}`
    const testValue = JSON.stringify({ test: true, timestamp: new Date() })

    const testResults = {
      setOperation: false,
      getOperation: false,
      deleteOperation: false,
    }

    try {
      // Test set operation
      await this.cacheService.redisService.set(testKey, testValue, 60)
      testResults.setOperation = true

      // Test get operation
      const retrieved = await this.cacheService.redisService.get(testKey)
      testResults.getOperation = retrieved === testValue

      // Test delete operation
      await this.cacheService.redisService.del(testKey)
      const afterDelete = await this.cacheService.redisService.get(testKey)
      testResults.deleteOperation = afterDelete === null
    } catch (_error) {
      // Test failed, but we don't throw to return partial results
    }

    return {
      cacheEnabled: config.enabled,
      redisConnected: health,
      testResults,
    }
  }
}
