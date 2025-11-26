import { Injectable, Logger } from '@nestjs/common'
import { TenantContextService } from '../multi-tenant/tenant-context.service'

/**
 * TenantCacheService
 *
 * Service de cache tenant-aware avec isolation automatique par société.
 *
 * Fonctionnalités:
 * - Préfixe automatique des clés: societe:{societeId}:{key}
 * - Isolation complète entre tenants
 * - Support des opérations CRUD standard
 * - TTL configurables par clé
 * - Invalidation par pattern
 *
 * Pattern de clé: societe:{societeId}:{resource}:{id}
 *
 * Exemples:
 *   societe:abc123:notifications:user-456
 *   societe:abc123:users:789
 *   societe:abc123:settings:global
 *
 * Usage:
 *   const user = await tenantCache.get<User>('users', userId)
 *   await tenantCache.set('users', userId, userData, 3600)
 *   await tenantCache.invalidate('users', userId)
 *   await tenantCache.invalidatePattern('users:*')
 */
@Injectable()
export class TenantCacheService {
  private readonly logger = new Logger(TenantCacheService.name)
  private cache: Map<string, { value: any; expiresAt: number }> = new Map()
  private readonly DEFAULT_TTL = 3600 // 1 heure par défaut

  constructor(private readonly tenantContext: TenantContextService) {}

  /**
   * Construire la clé de cache avec préfixe tenant
   */
  private buildKey(resource: string, id?: string): string {
    const societeId = this.tenantContext.getSocieteId()
    const baseKey = `societe:${societeId}:${resource}`
    return id ? `${baseKey}:${id}` : baseKey
  }

  /**
   * Obtenir une valeur du cache
   */
  async get<T>(resource: string, id?: string): Promise<T | null> {
    const key = this.buildKey(resource, id)

    try {
      const entry = this.cache.get(key)

      if (!entry) {
        this.logger.debug(`Cache MISS: ${key}`)
        return null
      }

      // Vérifier l'expiration
      if (entry.expiresAt < Date.now()) {
        this.cache.delete(key)
        this.logger.debug(`Cache EXPIRED: ${key}`)
        return null
      }

      this.logger.debug(`Cache HIT: ${key}`)
      return entry.value as T
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
    const key = this.buildKey(resource, id)

    try {
      this.cache.set(key, {
        value,
        expiresAt: Date.now() + ttl * 1000,
      })

      this.logger.debug(`Cache SET: ${key} (TTL: ${ttl}s)`)
    } catch (error) {
      this.logger.error(`Cache SET error for ${key}:`, error)
    }
  }

  /**
   * Supprimer une valeur du cache
   */
  async invalidate(resource: string, id?: string): Promise<void> {
    const key = this.buildKey(resource, id)

    try {
      const deleted = this.cache.delete(key)
      if (deleted) {
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
    const societeId = this.tenantContext.getSocieteId()
    const fullPattern = `societe:${societeId}:${pattern}`

    try {
      let count = 0
      const regex = new RegExp(
        '^' + fullPattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$'
      )

      for (const key of this.cache.keys()) {
        if (regex.test(key)) {
          this.cache.delete(key)
          count++
        }
      }

      this.logger.debug(`Cache INVALIDATED pattern: ${fullPattern} (${count} keys)`)
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
    const targetSocieteId = societeId || this.tenantContext.getSocieteId()
    const prefix = `societe:${targetSocieteId}:`

    try {
      let count = 0

      for (const key of this.cache.keys()) {
        if (key.startsWith(prefix)) {
          this.cache.delete(key)
          count++
        }
      }

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
    expiredKeys: number
    validKeys: number
  }> {
    const targetSocieteId = societeId || this.tenantContext.getSocieteId()
    const prefix = `societe:${targetSocieteId}:`

    let totalKeys = 0
    let expiredKeys = 0
    let validKeys = 0
    const now = Date.now()

    for (const [key, entry] of this.cache.entries()) {
      if (key.startsWith(prefix)) {
        totalKeys++
        if (entry.expiresAt < now) {
          expiredKeys++
        } else {
          validKeys++
        }
      }
    }

    return {
      tenant: targetSocieteId,
      totalKeys,
      expiredKeys,
      validKeys,
    }
  }

  /**
   * Nettoyer les clés expirées (à exécuter périodiquement)
   */
  async cleanExpired(): Promise<number> {
    let count = 0
    const now = Date.now()

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt < now) {
        this.cache.delete(key)
        count++
      }
    }

    if (count > 0) {
      this.logger.debug(`Cleaned ${count} expired cache entries`)
    }

    return count
  }

  /**
   * Nettoyer TOUT le cache (DANGER - use with caution)
   */
  async flushAll(): Promise<void> {
    const size = this.cache.size
    this.cache.clear()
    this.logger.warn(`FLUSHED entire cache: ${size} keys deleted`)
  }
}
