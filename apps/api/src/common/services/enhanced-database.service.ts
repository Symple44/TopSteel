// apps/api/src/common/services/enhanced-database.service.ts
import { Injectable, Logger } from '@nestjs/common'
import { CircuitBreakerService } from './circuit-breaker.service'
import { MetricsService } from './metrics.service'
import { DatabaseCircuitBreaker } from '../decorators/circuit-breaker.decorator'

@Injectable()
export class EnhancedDatabaseService {
  private readonly logger = new Logger(EnhancedDatabaseService.name)

  constructor(
    private readonly circuitBreakerService: CircuitBreakerService,
    private readonly metricsService: MetricsService,
  ) {}

  /**
   * Exemple : Requête critique avec circuit breaker
   */
  async executeWithCircuitBreaker<T>(
    query: string,
    params: any[] = [],
    queryRunner?: any
  ): Promise<T> {
    const circuitBreakerName = 'database-primary'
    
    return this.circuitBreakerService.execute(
      circuitBreakerName,
      async () => {
        // Simulation d'une requête DB
        this.logger.debug(`Executing query: ${query}`)
        
        // Enregistrer les métriques
        this.metricsService.setDbConnections('primary', 1)
        
        // Ici vous pouvez utiliser votre QueryRunner réel
        if (queryRunner) {
          return queryRunner.query(query, params)
        }
        
        // Mock pour l'exemple
        return { success: true, data: 'mock-data' } as any
      },
      [],
      {
        timeout: 5000,
        errorThresholdPercentage: 60,
        resetTimeout: 30000,
        volumeThreshold: 5,
      }
    )
  }

  /**
   * Méthode avec fallback pour les requêtes de lecture
   */
  async findWithFallback<T>(
    primaryQuery: string,
    cacheKey?: string
  ): Promise<T> {
    const circuitBreakerName = 'database-read'

    // Configurer le fallback vers le cache
    this.circuitBreakerService.withFallback(circuitBreakerName, async () => {
      this.logger.warn('Database read failed, falling back to cache')
      
      if (cacheKey) {
        // Récupérer depuis le cache
        this.metricsService.recordCacheOperation('get', 'hit')
        return this.getCachedData(cacheKey)
      }
      
      throw new Error('No fallback available')
    })

    return this.circuitBreakerService.execute(
      circuitBreakerName,
      async () => {
        this.logger.debug(`Read query: ${primaryQuery}`)
        // Exécuter la requête principale
        return { data: 'from-database' } as any
      },
      [],
      {
        timeout: 3000,
        errorThresholdPercentage: 50,
        resetTimeout: 20000,
      }
    )
  }

  /**
   * Méthode fallback pour récupérer les données du cache
   */
  private async getCachedData(key: string): Promise<any> {
    // Implémentation cache (Redis, MemoryCache, etc.)
    this.logger.log(`Fallback: Getting cached data for key: ${key}`)
    return { data: 'from-cache', cached: true }
  }

  /**
   * Health check avec circuit breaker pour la base de données
   */
  async healthCheck(): Promise<{ status: string; details: any }> {
    try {
      await this.executeWithCircuitBreaker('SELECT 1', [])
      return {
        status: 'healthy',
        details: { connection: 'ok' }
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        details: { 
          connection: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }
  }
}