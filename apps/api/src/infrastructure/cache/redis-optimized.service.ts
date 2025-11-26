import { Injectable, Logger } from '@nestjs/common'
import { Redis } from 'ioredis'

@Injectable()
export class OptimizedCacheService {
  private readonly logger = new Logger(OptimizedCacheService.name)
  private redis: Redis | null = null
  private readonly enabled: boolean

  constructor() {
    this.enabled = process.env.CACHE_ENABLED !== 'false'

    if (!this.enabled) {
      this.logger.log('Cache Redis disabled (CACHE_ENABLED=false)')
      return
    }

    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: Number.parseInt(process.env.REDIS_PORT || '6379', 10),
      db: Number.parseInt(process.env.REDIS_DB || '0', 10),
      lazyConnect: false,
      connectTimeout: 10000,
      commandTimeout: 5000,
      enableOfflineQueue: true,
      maxRetriesPerRequest: 3,
      family: 4,
    })

    this.redis.on('connect', () => {
      this.logger.log('Connexion Redis etablie')
    })

    this.redis.on('error', (error) => {
      this.logger.error('Erreur Redis:', error.message)
    })

    this.redis.on('close', () => {
      this.logger.warn('Connexion Redis fermee')
    })
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.enabled || !this.redis) return null
    try {
      const value = await this.redis.get(key)
      return value ? JSON.parse(value) : null
    } catch (error) {
      this.logger.error(`Cache GET error for key ${key}:`, error)
      return null
    }
  }

  async set(key: string, value: unknown, ttl = 3600): Promise<void> {
    if (!this.enabled || !this.redis) return
    try {
      await this.redis.setex(key, ttl, JSON.stringify(value))
    } catch (error) {
      this.logger.error(`Cache SET error for key ${key}:`, error)
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.enabled || !this.redis) return
    try {
      await this.redis.del(key)
    } catch (error) {
      this.logger.error(`Cache DELETE error for key ${key}:`, error)
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    if (!this.enabled || !this.redis) return
    try {
      const keys: string[] = []
      let cursor = 0

      do {
        const result = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100)
        cursor = parseInt(result[0], 10)
        keys.push(...result[1])
      } while (cursor !== 0)

      if (keys.length > 0) {
        const pipeline = this.redis.pipeline()
        keys.forEach((key) => {
          pipeline.del(key)
        })
        await pipeline.exec()
        this.logger.debug(`Invalidated ${keys.length} keys matching pattern: ${pattern}`)
      }
    } catch (error) {
      this.logger.error(`Cache invalidation error for pattern ${pattern}:`, error)
    }
  }

  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    if (!this.enabled || !this.redis) return keys.map(() => null)
    try {
      if (keys.length === 0) return []
      const values = await this.redis.mget(...keys)
      return values.map((value) => (value ? JSON.parse(value) : null))
    } catch (error) {
      this.logger.error('Cache MGET error:', error)
      return keys.map(() => null)
    }
  }

  async mset(keyValuePairs: Record<string, unknown>, ttl = 3600): Promise<void> {
    if (!this.enabled || !this.redis) return
    try {
      const entries = Object.entries(keyValuePairs)
      if (entries.length === 0) return
      const pipeline = this.redis.pipeline()
      entries.forEach(([key, value]) => {
        pipeline.setex(key, ttl, JSON.stringify(value))
      })
      await pipeline.exec()
      this.logger.debug(`Bulk set ${entries.length} cache entries with TTL ${ttl}s`)
    } catch (error) {
      this.logger.error('Cache MSET error:', error)
    }
  }

  private invalidationGroups = new Map<string, Set<string>>()

  async setWithGroup(key: string, value: unknown, groupKey: string, ttl = 3600): Promise<void> {
    if (!this.enabled || !this.redis) return
    try {
      await this.set(key, value, ttl)
      if (!this.invalidationGroups.has(groupKey)) {
        this.invalidationGroups.set(groupKey, new Set())
      }
      this.invalidationGroups.get(groupKey)?.add(key)
    } catch (error) {
      this.logger.error(`Cache SET with group error for key ${key}:`, error)
    }
  }

  async invalidateGroup(groupKey: string): Promise<void> {
    if (!this.enabled || !this.redis) return
    try {
      const keys = this.invalidationGroups.get(groupKey)
      if (!keys || keys.size === 0) return
      const pipeline = this.redis.pipeline()
      keys.forEach((key) => {
        pipeline.del(key)
      })
      await pipeline.exec()
      this.invalidationGroups.delete(groupKey)
      this.logger.debug(`Invalidated group ${groupKey} with ${keys.size} keys`)
    } catch (error) {
      this.logger.error(`Cache group invalidation error for group ${groupKey}:`, error)
    }
  }

  async exists(...keys: string[]): Promise<number> {
    if (!this.enabled || !this.redis) return 0
    try {
      return await this.redis.exists(...keys)
    } catch (error) {
      this.logger.error('Cache EXISTS error:', error)
      return 0
    }
  }

  async pipeline(): Promise<unknown> {
    if (!this.enabled || !this.redis) return { exec: async () => [] }
    return this.redis.pipeline()
  }

  async executePipeline(pipeline: unknown): Promise<unknown> {
    if (!this.enabled || !this.redis) return []
    try {
      return await (pipeline as { exec: () => Promise<unknown> }).exec()
    } catch (error) {
      this.logger.error('Pipeline execution error:', error)
      throw error
    }
  }

  private metrics = {
    hits: 0,
    misses: 0,
    operations: 0,
  }

  async getStats(): Promise<{ hitRate: number; operations: number }> {
    const total = this.metrics.hits + this.metrics.misses
    return {
      hitRate: total > 0 ? (this.metrics.hits / total) * 100 : 0,
      operations: this.metrics.operations,
    }
  }

  private incrementHit(): void {
    this.metrics.hits++
    this.metrics.operations++
  }

  private incrementMiss(): void {
    this.metrics.misses++
    this.metrics.operations++
  }

  async getWithMetrics<T>(key: string): Promise<T | null> {
    if (!this.enabled || !this.redis) {
      this.incrementMiss()
      return null
    }
    try {
      const value = await this.redis.get(key)
      if (value) {
        this.incrementHit()
        return JSON.parse(value)
      } else {
        this.incrementMiss()
        return null
      }
    } catch (error) {
      this.incrementMiss()
      this.logger.error(`Cache GET error for key ${key}:`, error)
      return null
    }
  }
}
