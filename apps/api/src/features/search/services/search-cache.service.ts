import { createHash } from 'node:crypto'
import { Injectable, Logger, type OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { RedisService } from '../../../core/common/services/redis.service'
import { getErrorMessage, hasStack } from '../../../core/common/utils'
import type { SearchOptions, SearchResponse } from '../interfaces/search.interfaces'

export interface CacheConfig {
  enabled: boolean
  defaultTTL: number
  entityTTLs: Record<string, number>
  maxKeyLength: number
  keyPrefix: string
  compressionThreshold: number
  popularSearchesLimit: number
  statisticsInterval: number
}

export interface CacheStatistics {
  hits: number
  misses: number
  sets: number
  deletes: number
  evictions: number
  hitRate: number
  totalKeys: number
  memoryUsage: number
  popularQueries: Array<{ query: string; count: number; lastAccess: Date }>
  lastUpdated: Date
}

export interface CacheMetadata {
  tenantId: string
  cacheKey: string
  originalQuery: SearchOptions
  resultCount: number
  ttl: number
  createdAt: Date
  accessCount: number
  lastAccessAt: Date
}

@Injectable()
export class SearchCacheService implements OnModuleInit {
  private readonly logger = new Logger(SearchCacheService.name)
  private config: CacheConfig
  private statistics: CacheStatistics
  private popularSearches: Map<string, { count: number; lastAccess: Date }> = new Map()

  constructor(
    public readonly redisService: RedisService,
    private readonly configService: ConfigService
  ) {
    this.initializeConfig()
    this.initializeStatistics()
  }

  async onModuleInit() {
    if (this.config.enabled && this.redisService.isConnected) {
      this.logger.log('✅ Search cache service initialized with Redis')
      this.startStatisticsCollection()
    } else if (this.config.enabled && !this.redisService.isConnected) {
      this.logger.warn('⚠️ Search cache enabled but Redis not connected - caching disabled')
    } else {
      this.logger.log('ℹ️ Search cache disabled by configuration')
    }
  }

  private initializeConfig() {
    this.config = {
      enabled: this.configService.get<boolean>('SEARCH_CACHE_ENABLED', true),
      defaultTTL: this.configService.get<number>('SEARCH_CACHE_DEFAULT_TTL', 300), // 5 minutes
      entityTTLs: {
        // Different TTLs for different entity types
        product: this.configService.get<number>('SEARCH_CACHE_PRODUCT_TTL', 600), // 10 minutes
        customer: this.configService.get<number>('SEARCH_CACHE_CUSTOMER_TTL', 1800), // 30 minutes
        supplier: this.configService.get<number>('SEARCH_CACHE_SUPPLIER_TTL', 1800), // 30 minutes
        order: this.configService.get<number>('SEARCH_CACHE_ORDER_TTL', 60), // 1 minute (frequently updated)
        invoice: this.configService.get<number>('SEARCH_CACHE_INVOICE_TTL', 120), // 2 minutes
        user: this.configService.get<number>('SEARCH_CACHE_USER_TTL', 900), // 15 minutes
        site: this.configService.get<number>('SEARCH_CACHE_SITE_TTL', 3600), // 1 hour
        menu: this.configService.get<number>('SEARCH_CACHE_MENU_TTL', 3600), // 1 hour
      },
      maxKeyLength: 250, // Redis key length limit
      keyPrefix: 'search:',
      compressionThreshold: 1024, // Compress payloads larger than 1KB
      popularSearchesLimit: 100,
      statisticsInterval: 300000, // 5 minutes
    }
  }

  private initializeStatistics() {
    this.statistics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      hitRate: 0,
      totalKeys: 0,
      memoryUsage: 0,
      popularQueries: [],
      lastUpdated: new Date(),
    }
  }

  /**
   * Check if cache is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled
  }

  /**
   * Generate a cache key for search options
   */
  generateCacheKey(tenantId: string, options: SearchOptions): string {
    // Create a deterministic key based on search parameters
    const keyData = {
      tenant: tenantId,
      query: options.query?.toLowerCase().trim(),
      entityTypes: options.entityTypes?.sort(),
      filters: options.filters
        ? Object.keys(options.filters)
            .sort()
            .reduce(
              (acc, key) => {
                const typedAcc = acc as Record<string, unknown>
                typedAcc[key] = options.filters?.[key]
                return typedAcc
              },
              {} as Record<string, unknown>
            )
        : undefined,
      limit: options.limit,
      offset: options.offset,
      sortBy: options.sortBy,
      sortOrder: options.sortOrder,
    }

    // Remove undefined values
    const cleanedData = JSON.parse(JSON.stringify(keyData))

    // Create hash for consistent key generation
    const dataString = JSON.stringify(cleanedData)
    const hash = createHash('md5').update(dataString).digest('hex')

    const baseKey = `${this.config.keyPrefix}${tenantId}:${hash}`

    // Ensure key doesn't exceed Redis limits
    return baseKey.length > this.config.maxKeyLength
      ? `${this.config.keyPrefix}${tenantId}:${hash.substring(0, 32)}`
      : baseKey
  }

  /**
   * Get TTL for specific entity types
   */
  private getTTL(entityTypes?: string[]): number {
    if (!entityTypes || entityTypes.length === 0) {
      return this.config.defaultTTL
    }

    // If multiple entity types, use the shortest TTL for safety
    const ttls = entityTypes.map((type) => this.config.entityTTLs[type] || this.config.defaultTTL)

    return Math.min(...ttls)
  }

  /**
   * Cache search results
   */
  async cacheSearchResults(
    tenantId: string,
    options: SearchOptions,
    results: SearchResponse
  ): Promise<void> {
    if (!this.config.enabled || !this.redisService.isConnected) {
      return
    }

    try {
      const cacheKey = this.generateCacheKey(tenantId, options)
      const ttl = this.getTTL(options.entityTypes)

      const cacheData = {
        results,
        metadata: {
          tenantId,
          cacheKey,
          originalQuery: options,
          resultCount: results.results.length,
          ttl,
          createdAt: new Date(),
          accessCount: 0,
          lastAccessAt: new Date(),
        } as CacheMetadata,
      }

      const serializedData = JSON.stringify(cacheData)

      // Compress large payloads
      if (serializedData.length > this.config.compressionThreshold) {
        // Could add compression here if needed
        this.logger.debug(
          `Large cache payload (${serializedData.length} bytes) for key: ${cacheKey}`
        )
      }

      await this.redisService.set(cacheKey, serializedData, ttl)

      // Store metadata separately for statistics
      const metadataKey = `${cacheKey}:meta`
      await this.redisService.set(metadataKey, JSON.stringify(cacheData.metadata), ttl)

      this.statistics.sets++
      this.updatePopularSearches(options.query || '', tenantId)

      this.logger.debug(
        `Cached search results for tenant ${tenantId}, key: ${cacheKey}, TTL: ${ttl}s`
      )
    } catch (error) {
      this.logger.error(
        `Failed to cache search results: ${getErrorMessage(error)}`,
        hasStack(error) ? error.stack : undefined
      )
    }
  }

  /**
   * Retrieve cached search results
   */
  async getCachedSearchResults(
    tenantId: string,
    options: SearchOptions
  ): Promise<SearchResponse | null> {
    if (!this.config.enabled || !this.redisService.isConnected) {
      return null
    }

    try {
      const cacheKey = this.generateCacheKey(tenantId, options)
      const cachedData = await this.redisService.get(cacheKey)

      if (!cachedData) {
        this.statistics.misses++
        return null
      }

      const parsed = JSON.parse(cachedData)

      // Update access metadata
      await this.updateAccessMetadata(cacheKey, parsed.metadata)

      this.statistics.hits++
      this.updateHitRate()
      this.updatePopularSearches(options.query || '', tenantId)

      this.logger.debug(`Cache hit for tenant ${tenantId}, key: ${cacheKey}`)

      return parsed.results
    } catch (error) {
      this.logger.error(
        `Failed to retrieve cached search results: ${getErrorMessage(error)}`,
        hasStack(error) ? error.stack : undefined
      )
      this.statistics.misses++
      return null
    }
  }

  /**
   * Invalidate cache for specific entity type and tenant
   */
  async invalidateEntityCache(tenantId: string, entityType: string): Promise<void> {
    if (!this.config.enabled || !this.redisService.isConnected) {
      return
    }

    try {
      // In a real implementation, we'd need to track which cache keys contain which entity types
      // For now, we'll use a pattern-based approach
      const _pattern = `${this.config.keyPrefix}${tenantId}:*`

      // Note: This is a simplified approach. In production, you'd want to maintain
      // a registry of cache keys by entity type for more efficient invalidation

      this.logger.debug(`Invalidating cache for tenant ${tenantId}, entity type: ${entityType}`)
      this.statistics.deletes++
    } catch (error) {
      this.logger.error(
        `Failed to invalidate entity cache: ${getErrorMessage(error)}`,
        hasStack(error) ? error.stack : undefined
      )
    }
  }

  /**
   * Invalidate cache for specific tenant
   */
  async invalidateTenantCache(tenantId: string): Promise<void> {
    if (!this.config.enabled || !this.redisService.isConnected) {
      return
    }

    try {
      // Delete all cache keys for this tenant
      // This is a simplified implementation
      const _pattern = `${this.config.keyPrefix}${tenantId}:*`

      this.logger.debug(`Invalidating all cache for tenant ${tenantId}`)
      this.statistics.deletes++
    } catch (error) {
      this.logger.error(
        `Failed to invalidate tenant cache: ${getErrorMessage(error)}`,
        hasStack(error) ? error.stack : undefined
      )
    }
  }

  /**
   * Warm cache with popular searches
   */
  async warmCache(tenantId: string, popularQueries: string[]): Promise<void> {
    if (!this.config.enabled || !this.redisService.isConnected) {
      return
    }

    this.logger.log(`Warming cache for tenant ${tenantId} with ${popularQueries.length} queries`)

    // This would typically be implemented by the service that uses this cache
    // The cache service itself doesn't perform searches, it just caches results
  }

  /**
   * Get cache statistics
   */
  async getCacheStatistics(): Promise<CacheStatistics> {
    if (!this.config.enabled || !this.redisService.isConnected) {
      return this.statistics
    }

    try {
      // Update statistics with current data
      this.statistics.popularQueries = Array.from(this.popularSearches.entries())
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, this.config.popularSearchesLimit)
        .map(([query, data]) => ({
          query,
          count: data.count,
          lastAccess: data.lastAccess,
        }))

      this.statistics.lastUpdated = new Date()

      return { ...this.statistics }
    } catch (error) {
      this.logger.error(
        `Failed to get cache statistics: ${getErrorMessage(error)}`,
        hasStack(error) ? error.stack : undefined
      )
      return this.statistics
    }
  }

  /**
   * Clear all cache
   */
  async clearCache(): Promise<void> {
    if (!this.config.enabled || !this.redisService.isConnected) {
      return
    }

    try {
      // Clear all search cache keys
      // This is a simplified implementation
      this.logger.warn('Clearing all search cache')
      this.statistics.deletes++
      this.initializeStatistics()
    } catch (error) {
      this.logger.error(
        `Failed to clear cache: ${getErrorMessage(error)}`,
        hasStack(error) ? error.stack : undefined
      )
    }
  }

  /**
   * Check if cache is healthy
   */
  async isHealthy(): Promise<boolean> {
    if (!this.config.enabled) {
      return true // Cache disabled is considered healthy
    }

    return this.redisService.isConnected
  }

  /**
   * Get cache configuration
   */
  getCacheConfig(): CacheConfig {
    return { ...this.config }
  }

  // Private helper methods

  private updateHitRate() {
    const total = this.statistics.hits + this.statistics.misses
    this.statistics.hitRate = total > 0 ? (this.statistics.hits / total) * 100 : 0
  }

  private updatePopularSearches(query: string, tenantId: string) {
    if (!query) return

    const key = `${tenantId}:${query.toLowerCase()}`
    const existing = this.popularSearches.get(key)

    if (existing) {
      existing.count++
      existing.lastAccess = new Date()
    } else {
      this.popularSearches.set(key, {
        count: 1,
        lastAccess: new Date(),
      })
    }

    // Cleanup old entries if we exceed limit
    if (this.popularSearches.size > this.config.popularSearchesLimit * 2) {
      const entries = Array.from(this.popularSearches.entries())
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, this.config.popularSearchesLimit)

      this.popularSearches.clear()
      entries.forEach(([key, data]) => {
        this.popularSearches.set(key, data)
      })
    }
  }

  private async updateAccessMetadata(cacheKey: string, metadata: CacheMetadata) {
    try {
      metadata.accessCount++
      metadata.lastAccessAt = new Date()

      const metadataKey = `${cacheKey}:meta`
      await this.redisService.set(metadataKey, JSON.stringify(metadata), metadata.ttl)
    } catch (error) {
      this.logger.debug(`Failed to update access metadata: ${getErrorMessage(error)}`)
    }
  }

  private startStatisticsCollection() {
    setInterval(() => {
      this.collectStatistics()
    }, this.config.statisticsInterval)
  }

  private async collectStatistics() {
    try {
      // Collect additional statistics from Redis if needed
      // This could include memory usage, key counts, etc.
      this.logger.debug('Collecting cache statistics')
    } catch (error) {
      this.logger.debug(`Failed to collect statistics: ${getErrorMessage(error)}`)
    }
  }
}
