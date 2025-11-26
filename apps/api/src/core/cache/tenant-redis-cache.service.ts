import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { TenantContextService } from '../multi-tenant/tenant-context.service'
import Redis from 'ioredis'

/**
 * TenantRedisCacheService
 *
 * Service de cache Redis tenant-aware pour production.
 *
 * Fonctionnalités:
 * - Cache distribué avec Redis
 * - Préfixe automatique: societe:{societeId}:{key}
 * - Support des patterns d'invalidation
 * - Reconnexion automatique
 * - Métriques et monitoring
 *
 * Configuration (.env):
 *   REDIS_HOST=localhost
 *   REDIS_PORT=6379
 *   REDIS_PASSWORD=secret
 *   REDIS_DB=0
 *   CACHE_ENABLED=true
 *   CACHE_DEFAULT_TTL=3600
 *
 * Usage identique à TenantCacheService (drop-in replacement)
 */
@Injectable()
export class TenantRedisCacheService implements OnModuleInit {
  private readonly logger = new Logger(TenantRedisCacheService.name)
  private redis: Redis | null = null
  private readonly enabled: boolean
  private readonly DEFAULT_TTL: number

  constructor(
    private readonly tenantContext: TenantContextService,
    private readonly configService: ConfigService
  ) {
    this.enabled = this.configService.get<string>('CACHE_ENABLED') !== 'false'
    this.DEFAULT_TTL = this.configService.get<number>('CACHE_DEFAULT_TTL', 3600)
  }

  async onModuleInit() {
    if (!this.enabled) {
      this.logger.warn('Cache is DISABLED by configuration')
      return
    }

    try {
      this.redis = new Redis({
        host: this.configService.get<string>('REDIS_HOST', 'localhost'),
        port: this.configService.get<number>('REDIS_PORT', 6379),
        password: this.configService.get<string>('REDIS_PASSWORD'),
        db: this.configService.get<number>('REDIS_DB', 0),
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000)
          this.logger.debug(`Redis reconnect attempt ${times}, delay: ${delay}ms`)
          return delay
        },
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: false,
      })

      this.redis.on('connect', () => {
        this.logger.log('✅ Redis connected')
      })

      this.redis.on('error', (error) => {
        this.logger.error('❌ Redis error:', error.message)
      })

      this.redis.on('close', () => {
        this.logger.warn('⚠️  Redis connection closed')
      })

      await this.redis.ping()
      this.logger.log('🚀 Redis cache service initialized')
    } catch (error) {
      this.logger.error('Failed to initialize Redis:', error)
      this.redis = null
    }
  }

  /**
   * Construire la clé de cache avec préfixe tenant
   */
  private buildKey(resource: string, id?: string): string {
    const societeId = this.tenantContext.getSocieteId()
    const baseKey = `societe:${societeId}:${resource}`
    return id ? `${baseKey}:${id}` : baseKey
  }

  /**
   * Vérifier si Redis est disponible
   */
  private isAvailable(): boolean {
    return this.enabled && this.redis !== null && this.redis.status === 'ready'
  }

  /**
   * Obtenir une valeur du cache
   */
  async get<T>(resource: string, id?: string): Promise<T | null> {
    if (!this.isAvailable()) return null

    const key = this.buildKey(resource, id)

    try {
      const value = await this.redis!.get(key)

      if (!value) {
        this.logger.debug(`Cache MISS: ${key}`)
        return null
      }

      this.logger.debug(`Cache HIT: ${key}`)
      return JSON.parse(value) as T
    } catch (error) {
      this.logger.error(`Cache GET error for ${key}:`, error)
      return null
    }
  }

  /**
   * Mettre une valeur en cache
   */
  async set<T>(
    resource: string,
    id: string | undefined,
    value: T,
    ttl: number = this.DEFAULT_TTL
  ): Promise<void> {
    if (!this.isAvailable()) return

    const key = this.buildKey(resource, id)

    try {
      const serialized = JSON.stringify(value)
      await this.redis!.setex(key, ttl, serialized)

      this.logger.debug(`Cache SET: ${key} (TTL: ${ttl}s)`)
    } catch (error) {
      this.logger.error(`Cache SET error for ${key}:`, error)
    }
  }

  /**
   * Supprimer une valeur du cache
   */
  async invalidate(resource: string, id?: string): Promise<void> {
    if (!this.isAvailable()) return

    const key = this.buildKey(resource, id)

    try {
      const deleted = await this.redis!.del(key)
      if (deleted > 0) {
        this.logger.debug(`Cache INVALIDATED: ${key}`)
      }
    } catch (error) {
      this.logger.error(`Cache INVALIDATE error for ${key}:`, error)
    }
  }

  /**
   * Invalider par pattern (ex: "users:*")
   */
  async invalidatePattern(pattern: string): Promise<number> {
    if (!this.isAvailable()) return 0

    const societeId = this.tenantContext.getSocieteId()
    const fullPattern = `societe:${societeId}:${pattern}`

    try {
      let count = 0
      let cursor = '0'

      do {
        const [nextCursor, keys] = await this.redis!.scan(
          cursor,
          'MATCH',
          fullPattern,
          'COUNT',
          100
        )

        cursor = nextCursor

        if (keys.length > 0) {
          const deleted = await this.redis!.del(...keys)
          count += deleted
        }
      } while (cursor !== '0')

      this.logger.debug(
        `Cache INVALIDATED pattern: ${fullPattern} (${count} keys)`
      )
      return count
    } catch (error) {
      this.logger.error(`Cache INVALIDATE PATTERN error for ${fullPattern}:`, error)
      return 0
    }
  }

  /**
   * Invalider TOUT le cache d'un tenant
   */
  async invalidateTenant(societeId?: string): Promise<number> {
    if (!this.isAvailable()) return 0

    const targetSocieteId = societeId || this.tenantContext.getSocieteId()
    const pattern = `societe:${targetSocieteId}:*`

    try {
      let count = 0
      let cursor = '0'

      do {
        const [nextCursor, keys] = await this.redis!.scan(
          cursor,
          'MATCH',
          pattern,
          'COUNT',
          100
        )

        cursor = nextCursor

        if (keys.length > 0) {
          const deleted = await this.redis!.del(...keys)
          count += deleted
        }
      } while (cursor !== '0')

      this.logger.warn(
        `Cache CLEARED for tenant ${targetSocieteId}: ${count} keys deleted`
      )
      return count
    } catch (error) {
      this.logger.error(`Cache CLEAR TENANT error for ${targetSocieteId}:`, error)
      return 0
    }
  }

  /**
   * Obtenir ou définir (pattern get-or-set)
   */
  async getOrSet<T>(
    resource: string,
    id: string | undefined,
    factory: () => Promise<T>,
    ttl: number = this.DEFAULT_TTL
  ): Promise<T> {
    // Essayer de récupérer du cache
    const cached = await this.get<T>(resource, id)
    if (cached !== null) {
      return cached
    }

    // Calculer la valeur
    const value = await factory()

    // Mettre en cache
    await this.set(resource, id, value, ttl)

    return value
  }

  /**
   * Obtenir les statistiques du cache pour un tenant
   */
  async getStats(societeId?: string): Promise<{
    tenant: string
    totalKeys: number
    memoryUsage: string
    available: boolean
  }> {
    const targetSocieteId = societeId || this.tenantContext.getSocieteId()

    if (!this.isAvailable()) {
      return {
        tenant: targetSocieteId,
        totalKeys: 0,
        memoryUsage: '0B',
        available: false,
      }
    }

    try {
      const pattern = `societe:${targetSocieteId}:*`
      let totalKeys = 0
      let cursor = '0'

      do {
        const [nextCursor, keys] = await this.redis!.scan(
          cursor,
          'MATCH',
          pattern,
          'COUNT',
          100
        )

        cursor = nextCursor
        totalKeys += keys.length
      } while (cursor !== '0')

      const info = await this.redis!.info('memory')
      const memoryMatch = info.match(/used_memory_human:(.+)/)
      const memoryUsage = memoryMatch ? memoryMatch[1].trim() : 'Unknown'

      return {
        tenant: targetSocieteId,
        totalKeys,
        memoryUsage,
        available: true,
      }
    } catch (error) {
      this.logger.error('Failed to get cache stats:', error)
      return {
        tenant: targetSocieteId,
        totalKeys: 0,
        memoryUsage: 'Error',
        available: false,
      }
    }
  }

  /**
   * Nettoyer TOUT le cache (DANGER - use with caution)
   */
  async flushAll(): Promise<void> {
    if (!this.isAvailable()) return

    try {
      await this.redis!.flushdb()
      this.logger.warn('FLUSHED entire Redis database')
    } catch (error) {
      this.logger.error('Failed to flush Redis:', error)
    }
  }

  /**
   * Fermer la connexion Redis (cleanup)
   */
  async onModuleDestroy() {
    if (this.redis) {
      await this.redis.quit()
      this.logger.log('Redis connection closed')
    }
  }
}
