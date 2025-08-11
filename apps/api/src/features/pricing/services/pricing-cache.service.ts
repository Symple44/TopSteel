import { Injectable, Logger } from '@nestjs/common'
import { InjectRedis } from '@nestjs-modules/ioredis'
import { Redis } from 'ioredis'
import { createHash } from 'crypto'
import type { PricingContext, PriceCalculationResult } from './pricing-engine.service'

@Injectable()
export class PricingCacheService {
  private readonly logger = new Logger(PricingCacheService.name)
  private readonly TTL = 3600 // 1 heure par défaut
  private readonly PREFIX = 'pricing:'

  constructor(@InjectRedis() private readonly redis: Redis) {}

  /**
   * Génère une clé de cache unique basée sur le contexte
   */
  private generateCacheKey(context: PricingContext): string {
    const normalized = {
      articleId: context.articleId,
      articleReference: context.articleReference,
      societeId: context.societeId,
      customerId: context.customerId,
      customerGroup: context.customerGroup,
      quantity: context.quantity,
      channel: context.channel,
      promotionCode: context.promotionCode
    }
    
    const hash = createHash('sha256')
      .update(JSON.stringify(normalized))
      .digest('hex')
      .substring(0, 16)
    
    return `${this.PREFIX}${context.societeId}:${hash}`
  }

  /**
   * Récupère un résultat depuis le cache
   */
  async get(context: PricingContext): Promise<PriceCalculationResult | null> {
    try {
      const key = this.generateCacheKey(context)
      const cached = await this.redis.get(key)
      
      if (cached) {
        this.logger.debug(`Cache hit for key: ${key}`)
        const result = JSON.parse(cached)
        
        // Ajouter un flag pour indiquer que c'est depuis le cache
        if (result.breakdown?.metadata) {
          result.breakdown.metadata.cacheHit = true
        }
        
        return result
      }
      
      return null
    } catch (error) {
      this.logger.error('Erreur lecture cache:', error)
      return null
    }
  }

  /**
   * Stocke un résultat dans le cache
   */
  async set(
    context: PricingContext, 
    result: PriceCalculationResult,
    ttl?: number
  ): Promise<void> {
    try {
      const key = this.generateCacheKey(context)
      const value = JSON.stringify(result)
      
      await this.redis.setex(key, ttl || this.TTL, value)
      
      // Tracking des clés pour invalidation par société
      await this.redis.sadd(`${this.PREFIX}keys:${context.societeId}`, key)
      
      this.logger.debug(`Cached result for key: ${key}`)
    } catch (error) {
      this.logger.error('Erreur écriture cache:', error)
    }
  }

  /**
   * Invalide le cache pour une société
   */
  async invalidateBySociete(societeId: string): Promise<void> {
    try {
      const keysKey = `${this.PREFIX}keys:${societeId}`
      const keys = await this.redis.smembers(keysKey)
      
      if (keys.length > 0) {
        await this.redis.del(...keys)
        await this.redis.del(keysKey)
        this.logger.log(`Invalidated ${keys.length} cache entries for société ${societeId}`)
      }
    } catch (error) {
      this.logger.error('Erreur invalidation cache:', error)
    }
  }

  /**
   * Invalide le cache pour un article
   */
  async invalidateByArticle(societeId: string, articleId: string): Promise<void> {
    try {
      const pattern = `${this.PREFIX}${societeId}:*`
      const keys = await this.redis.keys(pattern)
      
      // Filtrer les clés qui contiennent l'articleId
      const toDelete: string[] = []
      for (const key of keys) {
        const cached = await this.redis.get(key)
        if (cached && cached.includes(articleId)) {
          toDelete.push(key)
        }
      }
      
      if (toDelete.length > 0) {
        await this.redis.del(...toDelete)
        this.logger.log(`Invalidated ${toDelete.length} cache entries for article ${articleId}`)
      }
    } catch (error) {
      this.logger.error('Erreur invalidation cache article:', error)
    }
  }

  /**
   * Récupère les statistiques du cache
   */
  async getStats(societeId: string): Promise<{
    totalKeys: number
    memoryUsage: number
    hitRate: number
  }> {
    const keysKey = `${this.PREFIX}keys:${societeId}`
    const keys = await this.redis.smembers(keysKey)
    
    let memoryUsage = 0
    for (const key of keys) {
      const memory = await this.redis.memory('USAGE', key)
      memoryUsage += memory || 0
    }
    
    // Récupérer le hit rate depuis les métriques Redis
    const info = await this.redis.info('stats')
    const hits = parseInt(info.match(/keyspace_hits:(\d+)/)?.[1] || '0')
    const misses = parseInt(info.match(/keyspace_misses:(\d+)/)?.[1] || '0')
    const hitRate = hits + misses > 0 ? (hits / (hits + misses)) * 100 : 0
    
    return {
      totalKeys: keys.length,
      memoryUsage,
      hitRate
    }
  }

  /**
   * Précharge le cache pour les articles les plus consultés
   */
  async warmup(
    societeId: string,
    popularArticles: string[],
    calculateFn: (context: PricingContext) => Promise<PriceCalculationResult>
  ): Promise<void> {
    this.logger.log(`Warming up cache for ${popularArticles.length} articles`)
    
    const contexts: PricingContext[] = []
    
    // Générer les contextes les plus courants
    const commonQuantities = [1, 10, 100, 1000]
    const commonGroups = ['VIP', 'GROSSISTE', 'PROFESSIONNEL']
    
    for (const articleId of popularArticles) {
      for (const quantity of commonQuantities) {
        for (const customerGroup of commonGroups) {
          contexts.push({
            articleId,
            societeId,
            quantity,
            customerGroup,
            channel: 'ERP' as any
          })
        }
      }
    }
    
    // Calculer et mettre en cache en parallèle
    const batchSize = 10
    for (let i = 0; i < contexts.length; i += batchSize) {
      const batch = contexts.slice(i, i + batchSize)
      await Promise.all(
        batch.map(async (context) => {
          const cached = await this.get(context)
          if (!cached) {
            const result = await calculateFn(context)
            await this.set(context, result, 7200) // TTL plus long pour le warmup
          }
        })
      )
    }
    
    this.logger.log(`Cache warmup completed for ${contexts.length} combinations`)
  }
}