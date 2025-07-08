import { Injectable, Logger } from '@nestjs/common'
import { Redis } from 'ioredis'

@Injectable()
export class OptimizedCacheService {
  private readonly logger = new Logger(OptimizedCacheService.name)
  private redis: Redis

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: Number.parseInt(process.env.REDIS_PORT || '6379'),
      lazyConnect: true,
      connectTimeout: 10000,
      commandTimeout: 5000,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 3,
      family: 4,
    })
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key)
      return value ? JSON.parse(value) : null
    } catch (error) {
      this.logger.error(`Cache GET error for key ${key}:`, error)
      return null
    }
  }

  async set(key: string, value: any, ttl = 3600): Promise<void> {
    try {
      await this.redis.setex(key, ttl, JSON.stringify(value))
    } catch (error) {
      this.logger.error(`Cache SET error for key ${key}:`, error)
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern)
      if (keys.length > 0) {
        await this.redis.del(...keys)
      }
    } catch (error) {
      this.logger.error(`Cache invalidation error for pattern ${pattern}:`, error)
    }
  }
}
