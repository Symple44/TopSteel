import { Injectable, Logger, type OnModuleInit } from '@nestjs/common'
import { type EventEmitter2, OnEvent } from '@nestjs/event-emitter'
import type { SearchCacheService } from './search-cache.service'

// Events that trigger cache invalidation
export interface CacheInvalidationEvent {
  tenantId: string
  entityType: string
  entityId: string
  operation: 'create' | 'update' | 'delete'
  timestamp: Date
  metadata?: Record<string, any>
}

export interface BulkCacheInvalidationEvent {
  tenantId: string
  entityType: string
  operation: 'bulk_update' | 'bulk_delete' | 'reindex'
  count: number
  timestamp: Date
}

/**
 * Service responsible for handling cache invalidation based on data changes
 * This service listens to domain events and invalidates relevant cache entries
 */
@Injectable()
export class SearchCacheInvalidationService implements OnModuleInit {
  private readonly logger = new Logger(SearchCacheInvalidationService.name)

  // Track invalidation statistics
  private stats = {
    totalInvalidations: 0,
    invalidationsByEntity: new Map<string, number>(),
    lastInvalidation: null as Date | null,
  }

  constructor(
    private readonly cacheService: SearchCacheService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  async onModuleInit() {
    this.logger.log('🔄 Search cache invalidation service initialized')
  }

  /**
   * Manually invalidate cache for a specific entity
   */
  async invalidateEntity(tenantId: string, entityType: string, entityId: string): Promise<void> {
    try {
      await this.cacheService.invalidateEntityCache(tenantId, entityType)
      this.updateStats(entityType)

      this.logger.debug(`Cache invalidated for ${entityType}:${entityId} in tenant ${tenantId}`)

      // Emit event for potential listeners
      this.eventEmitter.emit('cache.invalidated', {
        tenantId,
        entityType,
        entityId,
        operation: 'delete' as const, // Use 'delete' instead of 'manual'
        timestamp: new Date(),
      } as CacheInvalidationEvent)
    } catch (error) {
      this.logger.error(`Failed to invalidate cache for ${entityType}:${entityId}`, error.stack)
    }
  }

  /**
   * Invalidate cache for an entire tenant
   */
  async invalidateTenant(tenantId: string): Promise<void> {
    try {
      await this.cacheService.invalidateTenantCache(tenantId)
      this.updateStats('tenant')

      this.logger.debug(`All cache invalidated for tenant ${tenantId}`)

      this.eventEmitter.emit('cache.tenant.invalidated', {
        tenantId,
        timestamp: new Date(),
      })
    } catch (error) {
      this.logger.error(`Failed to invalidate tenant cache for ${tenantId}`, error.stack)
    }
  }

  // Event handlers for automatic cache invalidation

  /**
   * Handle product-related changes
   */
  @OnEvent('product.created')
  @OnEvent('product.updated')
  @OnEvent('product.deleted')
  async handleProductChange(event: CacheInvalidationEvent): Promise<void> {
    await this.invalidateEntity(event.tenantId, 'product', event.entityId)
  }

  /**
   * Handle customer-related changes
   */
  @OnEvent('customer.created')
  @OnEvent('customer.updated')
  @OnEvent('customer.deleted')
  async handleCustomerChange(event: CacheInvalidationEvent): Promise<void> {
    await this.invalidateEntity(event.tenantId, 'customer', event.entityId)
  }

  /**
   * Handle supplier-related changes
   */
  @OnEvent('supplier.created')
  @OnEvent('supplier.updated')
  @OnEvent('supplier.deleted')
  async handleSupplierChange(event: CacheInvalidationEvent): Promise<void> {
    await this.invalidateEntity(event.tenantId, 'supplier', event.entityId)
  }

  /**
   * Handle order-related changes
   */
  @OnEvent('order.created')
  @OnEvent('order.updated')
  @OnEvent('order.deleted')
  @OnEvent('order.status_changed')
  async handleOrderChange(event: CacheInvalidationEvent): Promise<void> {
    await this.invalidateEntity(event.tenantId, 'order', event.entityId)
  }

  /**
   * Handle invoice-related changes
   */
  @OnEvent('invoice.created')
  @OnEvent('invoice.updated')
  @OnEvent('invoice.deleted')
  @OnEvent('invoice.status_changed')
  async handleInvoiceChange(event: CacheInvalidationEvent): Promise<void> {
    await this.invalidateEntity(event.tenantId, 'invoice', event.entityId)
  }

  /**
   * Handle user-related changes
   */
  @OnEvent('user.created')
  @OnEvent('user.updated')
  @OnEvent('user.deleted')
  @OnEvent('user.role_changed')
  async handleUserChange(event: CacheInvalidationEvent): Promise<void> {
    await this.invalidateEntity(event.tenantId, 'user', event.entityId)
  }

  /**
   * Handle site-related changes
   */
  @OnEvent('site.created')
  @OnEvent('site.updated')
  @OnEvent('site.deleted')
  async handleSiteChange(event: CacheInvalidationEvent): Promise<void> {
    await this.invalidateEntity(event.tenantId, 'site', event.entityId)
  }

  /**
   * Handle menu-related changes
   */
  @OnEvent('menu.updated')
  @OnEvent('menu.permission_changed')
  async handleMenuChange(event: CacheInvalidationEvent): Promise<void> {
    await this.invalidateEntity(event.tenantId, 'menu', event.entityId)
  }

  /**
   * Handle bulk operations
   */
  @OnEvent('*.bulk_updated')
  @OnEvent('*.bulk_deleted')
  async handleBulkChange(event: BulkCacheInvalidationEvent): Promise<void> {
    // For bulk operations, invalidate the entire entity type cache
    await this.invalidateEntity(event.tenantId, event.entityType, 'bulk')
    this.logger.debug(
      `Bulk cache invalidation for ${event.entityType} in tenant ${event.tenantId} (${event.count} items)`
    )
  }

  /**
   * Handle search index rebuild
   */
  @OnEvent('search.reindex.started')
  async handleSearchReindexStarted(event: { tenantId?: string }): Promise<void> {
    if (event.tenantId) {
      await this.invalidateTenant(event.tenantId)
    } else {
      // Clear all cache if global reindex
      await this.cacheService.clearCache()
      this.logger.log('All search cache cleared due to global reindex')
    }
  }

  /**
   * Handle tenant-related changes that affect all cached data
   */
  @OnEvent('tenant.updated')
  @OnEvent('tenant.settings_changed')
  async handleTenantChange(event: { tenantId: string }): Promise<void> {
    await this.invalidateTenant(event.tenantId)
  }

  /**
   * Scheduled cache cleanup (can be called by a cron job)
   */
  async scheduleCleanup(): Promise<void> {
    try {
      // This could implement logic to clean up expired cache entries
      // or perform cache warming for popular searches
      this.logger.debug('Performing scheduled cache cleanup')

      // Get current cache statistics
      const stats = await this.cacheService.getCacheStatistics()

      // Log cache health
      this.logger.debug(
        `Cache stats - Hits: ${stats.hits}, Misses: ${stats.misses}, Hit Rate: ${stats.hitRate.toFixed(2)}%`
      )
    } catch (error) {
      this.logger.error('Failed to perform scheduled cache cleanup', error.stack)
    }
  }

  /**
   * Get invalidation statistics
   */
  getInvalidationStats() {
    return {
      ...this.stats,
      invalidationsByEntity: Object.fromEntries(this.stats.invalidationsByEntity),
    }
  }

  /**
   * Reset invalidation statistics
   */
  resetStats(): void {
    this.stats.totalInvalidations = 0
    this.stats.invalidationsByEntity.clear()
    this.stats.lastInvalidation = null
  }

  // Private helper methods

  private updateStats(entityType: string): void {
    this.stats.totalInvalidations++
    this.stats.lastInvalidation = new Date()

    const currentCount = this.stats.invalidationsByEntity.get(entityType) || 0
    this.stats.invalidationsByEntity.set(entityType, currentCount + 1)
  }
}

/**
 * Helper function to emit cache invalidation events
 * This can be used in your domain services to trigger cache invalidation
 */
export function emitCacheInvalidationEvent(
  eventEmitter: EventEmitter2,
  tenantId: string,
  entityType: string,
  entityId: string,
  operation: 'create' | 'update' | 'delete',
  metadata?: Record<string, any>
): void {
  const event: CacheInvalidationEvent = {
    tenantId,
    entityType,
    entityId,
    operation,
    timestamp: new Date(),
    metadata,
  }

  eventEmitter.emit(`${entityType}.${operation}`, event)
}

/**
 * Decorator to automatically emit cache invalidation events
 * Usage: @InvalidateCache('product', 'update')
 */
export function InvalidateCache(entityType: string, operation: 'create' | 'update' | 'delete') {
  return (_target: any, _propertyName: string, descriptor: PropertyDescriptor) => {
    const method = descriptor.value

    descriptor.value = async function (this: any, ...args: any[]) {
      const result = await method.apply(this, args)

      // Try to extract tenant and entity information from result or arguments
      // This is a simplified implementation - you might need to customize based on your data structure
      try {
        const tenantId = args[0]?.tenantId || result?.tenantId
        const entityId = args[0]?.id || result?.id

        // Check if the class instance has an eventEmitter property
        if (tenantId && entityId && this.eventEmitter) {
          emitCacheInvalidationEvent(this.eventEmitter, tenantId, entityType, entityId, operation)
        }
      } catch (_error) {}

      return result
    }

    return descriptor
  }
}
