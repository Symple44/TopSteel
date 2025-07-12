// apps/api/src/common/services/redis.service.ts
import { Inject, Injectable, Optional } from '@nestjs/common'
import type { Redis } from 'ioredis'

@Injectable()
export class RedisService {
  constructor(@Optional() @Inject('REDIS_CLIENT') private readonly redisClient?: Redis) {}

  async get(key: string): Promise<string | null> {
    if (!this.redisClient) {
      return null
    }
    return this.redisClient.get(key)
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (!this.redisClient) {
      return
    }

    if (ttl) {
      await this.redisClient.setex(key, ttl, value)
    } else {
      await this.redisClient.set(key, value)
    }
  }

  async del(key: string): Promise<void> {
    if (!this.redisClient) {
      return
    }
    await this.redisClient.del(key)
  }

  async exists(key: string): Promise<boolean> {
    if (!this.redisClient) {
      return false
    }
    const result = await this.redisClient.exists(key)
    return result === 1
  }

  get isConnected(): boolean {
    return !!this.redisClient && this.redisClient.status === 'ready'
  }
}
