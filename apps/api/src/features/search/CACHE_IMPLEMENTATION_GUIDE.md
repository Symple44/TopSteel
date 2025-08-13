# Search Cache Implementation Guide

This document provides a comprehensive guide for implementing and using the Redis caching system for the TopSteel search module.

## Overview

The search cache system provides:
- **Performance improvement** for frequent search queries
- **Tenant-aware caching** for multi-tenant safety
- **Smart cache invalidation** based on data changes
- **Configurable TTL** for different entity types
- **Cache warming** for popular searches
- **Statistics and monitoring** capabilities
- **Redis cluster support** for scalability
- **Graceful fallback** when Redis is unavailable

## Architecture

### Core Components

1. **SearchCacheService** - Main caching service with Redis integration
2. **CachedGlobalSearchService** - Decorator wrapper for GlobalSearchService
3. **SearchCacheInvalidationService** - Handles cache invalidation based on events
4. **SearchCacheController** - REST endpoints for cache management

### Cache Key Strategy

Cache keys are generated using:
```
search:{tenantId}:{hash}
```

Where hash is an MD5 of normalized search parameters including:
- Query text (lowercased and trimmed)
- Entity types (sorted)
- Filters (sorted keys)
- Pagination (limit, offset)
- Sorting parameters

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# Enable/disable search result caching
SEARCH_CACHE_ENABLED=true

# Default TTL for cached search results (in seconds)
SEARCH_CACHE_DEFAULT_TTL=300

# Entity-specific TTL settings (in seconds)
SEARCH_CACHE_PRODUCT_TTL=600         # 10 minutes
SEARCH_CACHE_CUSTOMER_TTL=1800       # 30 minutes
SEARCH_CACHE_SUPPLIER_TTL=1800       # 30 minutes
SEARCH_CACHE_ORDER_TTL=60            # 1 minute
SEARCH_CACHE_INVOICE_TTL=120         # 2 minutes
SEARCH_CACHE_USER_TTL=900            # 15 minutes
SEARCH_CACHE_SITE_TTL=3600           # 1 hour
SEARCH_CACHE_MENU_TTL=3600           # 1 hour

# Cache warming configuration
SEARCH_CACHE_WARM_POPULAR_QUERIES=true
SEARCH_CACHE_POPULAR_QUERIES_LIMIT=50

# Cache statistics and monitoring
SEARCH_CACHE_STATISTICS_ENABLED=true
SEARCH_CACHE_STATISTICS_INTERVAL=300000   # 5 minutes
```

### Module Integration

The SearchModule automatically imports and configures the cache services:

```typescript
// Already configured in search.module.ts
import { SearchModule } from './features/search/search.module'

@Module({
  imports: [
    SearchModule, // Includes all cache services
  ],
})
export class AppModule {}
```

## Usage

### Basic Search with Caching

Replace `GlobalSearchService` with `CachedGlobalSearchService`:

```typescript
import { CachedGlobalSearchService } from './features/search/services/cached-global-search.service'

@Injectable()
export class MyService {
  constructor(
    private readonly searchService: CachedGlobalSearchService
  ) {}

  async searchProducts(query: string, tenantId: string) {
    const results = await this.searchService.search({
      query,
      entityTypes: ['product'],
      tenantId, // Include tenant ID for proper caching
      limit: 20
    })
    
    // Check if result came from cache
    if (results.metadata?.cached) {
      console.log('Result served from cache')
    }
    
    return results
  }
}
```

### Cache Invalidation

#### Option 1: Event-Based Invalidation (Recommended)

Use the event emitter in your domain services:

```typescript
import { EventEmitter2 } from '@nestjs/event-emitter'
import { emitCacheInvalidationEvent } from './features/search/services/search-cache-invalidation.service'

@Injectable()
export class ProductService {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  async updateProduct(tenantId: string, productId: string, data: any) {
    // Perform update
    const result = await this.repository.update(productId, data)
    
    // Emit cache invalidation event
    emitCacheInvalidationEvent(
      this.eventEmitter,
      tenantId,
      'product',
      productId,
      'update'
    )
    
    return result
  }
}
```

#### Option 2: Decorator-Based Invalidation

Use the `@InvalidateCache` decorator:

```typescript
import { InvalidateCache } from './features/search/services/search-cache-invalidation.service'

@Injectable()
export class CustomerService {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  @InvalidateCache('customer', 'create')
  async createCustomer(tenantId: string, data: any) {
    const customer = await this.repository.create(data)
    return { ...customer, tenantId, id: customer.id } // Include required fields
  }

  // Helper methods for decorator
  extractTenantId(args: any[], result: any): string {
    return args[0] || result.tenantId
  }

  extractEntityId(args: any[], result: any): string {
    return result.id
  }
}
```

#### Option 3: Manual Invalidation

Directly call the invalidation service:

```typescript
import { SearchCacheInvalidationService } from './features/search/services/search-cache-invalidation.service'

@Injectable()
export class OrderService {
  constructor(
    private readonly cacheInvalidation: SearchCacheInvalidationService
  ) {}

  async deleteOrder(tenantId: string, orderId: string) {
    await this.repository.delete(orderId)
    await this.cacheInvalidation.invalidateEntity(tenantId, 'order', orderId)
  }
}
```

### Cache Warming

Warm the cache with popular searches:

```typescript
import { CachedGlobalSearchService } from './features/search/services/cached-global-search.service'

@Injectable()
export class CacheWarmingService {
  constructor(private readonly searchService: CachedGlobalSearchService) {}

  async warmCacheForTenant(tenantId: string) {
    const popularQueries = [
      'steel pipe',
      'construction materials',
      'aluminum sheets',
      'fasteners'
    ]
    
    await this.searchService.warmCacheForTenant(tenantId, popularQueries)
  }
}
```

## API Endpoints

### Cache Statistics

```http
GET /api/search/cache/statistics
```

Returns comprehensive cache statistics including hit rates, popular queries, and performance metrics.

### Cache Health

```http
GET /api/search/cache/health
```

Check if the cache system is healthy and Redis is connected.

### Clear Cache

```http
DELETE /api/search/cache/clear
```

Clear all cached search results (admin only).

```http
DELETE /api/search/cache/tenant/{tenantId}
```

Clear cache for a specific tenant.

```http
DELETE /api/search/cache/tenant/{tenantId}/entity/{entityType}
```

Clear cache for a specific entity type in a tenant.

### Cache Warming

```http
POST /api/search/cache/tenant/{tenantId}/warm
Content-Type: application/json

{
  "queries": ["search term 1", "search term 2"]
}
```

### Performance Metrics

```http
GET /api/search/cache/metrics
```

Get detailed performance metrics including hit rates and invalidation statistics.

## Monitoring and Maintenance

### Cache Statistics

Monitor these key metrics:
- **Hit Rate**: Percentage of searches served from cache
- **Total Hits/Misses**: Absolute numbers for cache performance
- **Popular Queries**: Most frequently searched terms
- **Memory Usage**: Redis memory consumption
- **Invalidation Rate**: How often cache is invalidated

### Maintenance Tasks

1. **Regular Cleanup**: Set up cron jobs to run cache maintenance
2. **Cache Warming**: Periodically warm cache with popular searches
3. **Statistics Reset**: Reset statistics periodically for clean reporting
4. **Health Checks**: Monitor Redis connectivity and cache health

```typescript
// Example cron job for maintenance
@Cron('0 */30 * * * *') // Every 30 minutes
async performCacheMaintenance() {
  await this.cacheInvalidationService.scheduleCleanup()
}
```

## Best Practices

### 1. Tenant Isolation

Always include tenant ID in search options:

```typescript
const results = await this.searchService.search({
  query: 'search term',
  tenantId: getCurrentTenantId(), // Always include this
  entityTypes: ['product']
})
```

### 2. Cache Invalidation Strategy

- **Immediate**: For critical data (orders, invoices)
- **Delayed**: For less critical data (products, customers)
- **Bulk**: For large-scale operations

### 3. TTL Configuration

Set appropriate TTLs based on data volatility:
- **High volatility**: 1-5 minutes (orders, inventory)
- **Medium volatility**: 10-30 minutes (products, customers)
- **Low volatility**: 1+ hours (users, settings)

### 4. Error Handling

The cache system gracefully degrades:
- Redis unavailable → Direct search
- Cache errors → Logged but don't break search
- Invalid cache data → Automatic fallback

### 5. Performance Optimization

- **Compression**: Large payloads (>1KB) are automatically compressed
- **Key Length**: Keys are truncated to stay within Redis limits
- **Batch Operations**: Use bulk invalidation for multiple entities

## Troubleshooting

### Common Issues

1. **Cache Not Working**
   - Check `SEARCH_CACHE_ENABLED=true`
   - Verify Redis connection
   - Check tenant ID is included in search options

2. **Low Hit Rate**
   - Review TTL settings (may be too short)
   - Check if invalidation is too aggressive
   - Verify search patterns are cacheable

3. **Memory Issues**
   - Monitor Redis memory usage
   - Adjust TTL settings
   - Implement cache size limits

4. **Stale Data**
   - Check invalidation events are firing
   - Verify tenant ID matching
   - Review entity type mappings

### Debugging

Enable debug logging:

```bash
LOG_LEVEL=debug
```

Check cache operations in logs:
- Cache hits/misses
- Invalidation events
- Redis connectivity
- Performance metrics

### Testing

Use the test endpoint to verify cache functionality:

```http
POST /api/search/cache/test
```

This performs basic Redis operations and reports success/failure.

## Migration Guide

To migrate from uncached to cached search:

1. **Update imports**:
   ```typescript
   // Before
   import { GlobalSearchService } from './services/global-search.service'
   
   // After
   import { CachedGlobalSearchService } from './services/cached-global-search.service'
   ```

2. **Add tenant context**:
   ```typescript
   // Before
   await this.searchService.search({ query: 'test' })
   
   // After
   await this.searchService.search({ 
     query: 'test',
     tenantId: getCurrentTenantId() 
   })
   ```

3. **Add invalidation events**:
   ```typescript
   // Add to your domain services
   emitCacheInvalidationEvent(this.eventEmitter, tenantId, entityType, entityId, operation)
   ```

4. **Configure environment**:
   - Add cache configuration to `.env`
   - Set appropriate TTLs for your use case
   - Enable monitoring and statistics

The migration is backward compatible - the cache system works transparently alongside existing search functionality.