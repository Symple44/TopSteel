import { Injectable, Logger } from '@nestjs/common'
import { OptimizedCacheService } from '../../../infrastructure/cache/redis-optimized.service'

export interface PerformanceMetric {
  operation: string
  duration: number
  success: boolean
  timestamp: Date
  cacheHit?: boolean
  queryCount?: number
}

export interface AggregatedMetrics {
  totalOperations: number
  averageResponseTime: number
  successRate: number
  cacheHitRate: number
  p95ResponseTime: number
  p99ResponseTime: number
  totalQueries: number
  averageQueriesPerOperation: number
}

@Injectable()
export class AuthPerformanceService {
  private readonly logger = new Logger(AuthPerformanceService.name)
  private metrics: PerformanceMetric[] = []
  private readonly MAX_METRICS = 10000 // Keep last 10k operations
  private readonly METRICS_FLUSH_INTERVAL = 60000 // 1 minute

  constructor(private readonly cacheService: OptimizedCacheService) {
    // Flush metrics to cache periodically
    setInterval(() => {
      this.flushMetricsToCache()
    }, this.METRICS_FLUSH_INTERVAL)
  }

  /**
   * Track performance of an authentication operation
   */
  async trackOperation<T>(
    operation: string,
    fn: () => Promise<T>,
    options?: { trackQueries?: boolean }
  ): Promise<T> {
    const start = Date.now()
    const initialQueryCount = this.getQueryCount()
    let cacheStats: { hitRate: number } | null = null

    try {
      // Get cache stats before operation
      if (operation.includes('cache') || operation.includes('role')) {
        cacheStats = await this.cacheService.getStats()
      }

      const result = await fn()
      const duration = Date.now() - start
      const queryCount = options?.trackQueries
        ? this.getQueryCount() - initialQueryCount
        : undefined

      // Record successful operation
      this.recordMetric({
        operation,
        duration,
        success: true,
        timestamp: new Date(),
        queryCount,
        cacheHit: cacheStats ? cacheStats.hitRate > 0 : undefined,
      })

      if (duration > 1000) {
        this.logger.warn(`Slow operation detected: ${operation} took ${duration}ms`)
      }

      return result
    } catch (error) {
      const duration = Date.now() - start
      const queryCount = options?.trackQueries
        ? this.getQueryCount() - initialQueryCount
        : undefined

      // Record failed operation
      this.recordMetric({
        operation,
        duration,
        success: false,
        timestamp: new Date(),
        queryCount,
        cacheHit: false,
      })

      this.logger.error(`Operation failed: ${operation} after ${duration}ms`, error)
      throw error
    }
  }

  /**
   * Record a performance metric
   */
  private recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric)

    // Trim metrics if we exceed the limit
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS)
    }
  }

  /**
   * Get aggregated performance metrics for the last N minutes
   */
  getMetrics(lastMinutes = 30): AggregatedMetrics {
    const cutoff = new Date(Date.now() - lastMinutes * 60 * 1000)
    const recentMetrics = this.metrics.filter((m) => m.timestamp >= cutoff)

    if (recentMetrics.length === 0) {
      return {
        totalOperations: 0,
        averageResponseTime: 0,
        successRate: 0,
        cacheHitRate: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        totalQueries: 0,
        averageQueriesPerOperation: 0,
      }
    }

    // Calculate metrics
    const durations = recentMetrics.map((m) => m.duration).sort((a, b) => a - b)
    const successCount = recentMetrics.filter((m) => m.success).length
    const cacheHitMetrics = recentMetrics.filter((m) => m.cacheHit !== undefined)
    const cacheHits = cacheHitMetrics.filter((m) => m.cacheHit).length
    const queryCounts = recentMetrics
      .filter((m) => m.queryCount !== undefined)
      .map((m) => m.queryCount ?? 0)
    const totalQueries = queryCounts.reduce((sum, count) => sum + count, 0)

    return {
      totalOperations: recentMetrics.length,
      averageResponseTime: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      successRate: (successCount / recentMetrics.length) * 100,
      cacheHitRate: cacheHitMetrics.length > 0 ? (cacheHits / cacheHitMetrics.length) * 100 : 0,
      p95ResponseTime: durations[Math.floor(durations.length * 0.95)] || 0,
      p99ResponseTime: durations[Math.floor(durations.length * 0.99)] || 0,
      totalQueries,
      averageQueriesPerOperation: queryCounts.length > 0 ? totalQueries / queryCounts.length : 0,
    }
  }

  /**
   * Get performance metrics by operation type
   */
  getMetricsByOperation(lastMinutes = 30): Record<string, AggregatedMetrics> {
    const cutoff = new Date(Date.now() - lastMinutes * 60 * 1000)
    const recentMetrics = this.metrics.filter((m) => m.timestamp >= cutoff)

    const operations = [...new Set(recentMetrics.map((m) => m.operation))]
    const result: Record<string, AggregatedMetrics> = {}

    operations.forEach((operation) => {
      const operationMetrics = recentMetrics.filter((m) => m.operation === operation)
      const durations = operationMetrics.map((m) => m.duration).sort((a, b) => a - b)
      const successCount = operationMetrics.filter((m) => m.success).length
      const cacheHitMetrics = operationMetrics.filter((m) => m.cacheHit !== undefined)
      const cacheHits = cacheHitMetrics.filter((m) => m.cacheHit).length
      const queryCounts = operationMetrics
        .filter((m) => m.queryCount !== undefined)
        .map((m) => m.queryCount ?? 0)
      const totalQueries = queryCounts.reduce((sum, count) => sum + count, 0)

      result[operation] = {
        totalOperations: operationMetrics.length,
        averageResponseTime: durations.reduce((sum, d) => sum + d, 0) / durations.length,
        successRate: (successCount / operationMetrics.length) * 100,
        cacheHitRate: cacheHitMetrics.length > 0 ? (cacheHits / cacheHitMetrics.length) * 100 : 0,
        p95ResponseTime: durations[Math.floor(durations.length * 0.95)] || 0,
        p99ResponseTime: durations[Math.floor(durations.length * 0.99)] || 0,
        totalQueries,
        averageQueriesPerOperation: queryCounts.length > 0 ? totalQueries / queryCounts.length : 0,
      }
    })

    return result
  }

  /**
   * Flush metrics to cache for persistence
   */
  private async flushMetricsToCache(): Promise<void> {
    try {
      const aggregated = this.getMetrics(60) // Last hour
      const byOperation = this.getMetricsByOperation(60)

      await this.cacheService.set(
        'auth_performance_metrics',
        {
          aggregated,
          byOperation,
          lastUpdated: new Date(),
        },
        3600
      ) // Cache for 1 hour

      this.logger.debug(`Flushed performance metrics: ${aggregated.totalOperations} operations`)
    } catch (error) {
      this.logger.error('Failed to flush performance metrics to cache', error)
    }
  }

  /**
   * Get cached performance metrics
   */
  async getCachedMetrics(): Promise<{
    aggregated: AggregatedMetrics
    byOperation: Record<string, AggregatedMetrics>
    lastUpdated: Date
  } | null> {
    try {
      return await this.cacheService.get('auth_performance_metrics')
    } catch (error) {
      this.logger.error('Failed to get cached performance metrics', error)
      return null
    }
  }

  /**
   * Simple query counter (for demonstration - in production, use proper query tracking)
   */
  private getQueryCount(): number {
    // This is a placeholder - in production, you'd track this properly
    // through database connection monitoring or ORM query logging
    return 0
  }

  /**
   * Clear all metrics (for testing/reset)
   */
  clearMetrics(): void {
    this.metrics = []
    this.logger.log('Performance metrics cleared')
  }

  /**
   * Get current memory usage
   */
  getMemoryUsage(): {
    rss: number
    heapUsed: number
    heapTotal: number
    external: number
  } {
    const usage = process.memoryUsage()
    return {
      rss: Math.round(usage.rss / 1024 / 1024),
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
      external: Math.round(usage.external / 1024 / 1024),
    }
  }
}
