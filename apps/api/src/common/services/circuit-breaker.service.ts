// apps/api/src/common/services/circuit-breaker.service.ts
import { Injectable, Logger } from '@nestjs/common'
import * as CircuitBreaker from 'opossum'
import { MetricsService } from './metrics.service'

export interface CircuitBreakerOptions {
  timeout?: number
  errorThresholdPercentage?: number
  resetTimeout?: number
  volumeThreshold?: number
  name?: string
}

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name)
  private circuitBreakers = new Map<string, CircuitBreaker>()

  constructor(private readonly metricsService?: MetricsService) {}

  /**
   * Crée ou récupère un circuit breaker existant
   */
  getCircuitBreaker<T extends any[], R>(
    name: string,
    fn: (...args: T) => Promise<R>,
    options: CircuitBreakerOptions = {}
  ): CircuitBreaker<T, R> {
    if (this.circuitBreakers.has(name)) {
      return this.circuitBreakers.get(name) as CircuitBreaker<T, R>
    }

    const defaultOptions = {
      timeout: 3000, // 3 secondes
      errorThresholdPercentage: 50, // 50% d'erreurs
      resetTimeout: 30000, // 30 secondes avant de réessayer
      volumeThreshold: 10, // Minimum 10 requêtes pour activer
      ...options,
    }

    const circuitBreaker = new CircuitBreaker(fn, defaultOptions)

    // Événements de monitoring
    circuitBreaker.on('open', () => {
      this.logger.warn(`Circuit breaker '${name}' OPENED`)
      this.recordMetric(name, 'open')
    })

    circuitBreaker.on('halfOpen', () => {
      this.logger.log(`Circuit breaker '${name}' HALF-OPEN`)
      this.recordMetric(name, 'half_open')
    })

    circuitBreaker.on('close', () => {
      this.logger.log(`Circuit breaker '${name}' CLOSED`)
      this.recordMetric(name, 'close')
    })

    circuitBreaker.on('failure', (error) => {
      this.logger.warn(`Circuit breaker '${name}' failure:`, error.message)
      this.recordMetric(name, 'failure')
    })

    circuitBreaker.on('success', () => {
      this.recordMetric(name, 'success')
    })

    circuitBreaker.on('reject', () => {
      this.logger.warn(`Circuit breaker '${name}' REJECTED request`)
      this.recordMetric(name, 'reject')
    })

    circuitBreaker.on('timeout', () => {
      this.logger.warn(`Circuit breaker '${name}' TIMEOUT`)
      this.recordMetric(name, 'timeout')
    })

    this.circuitBreakers.set(name, circuitBreaker)
    return circuitBreaker
  }

  /**
   * Exécute une fonction avec protection circuit breaker
   */
  async execute<T extends any[], R>(
    name: string,
    fn: (...args: T) => Promise<R>,
    args: T,
    options?: CircuitBreakerOptions
  ): Promise<R> {
    const circuitBreaker = this.getCircuitBreaker(name, fn, options)
    return circuitBreaker.fire(...args)
  }

  /**
   * Ajoute un fallback à un circuit breaker
   */
  withFallback<T extends any[], R>(
    name: string,
    fallback: (...args: T) => Promise<R> | R
  ): void {
    const circuitBreaker = this.circuitBreakers.get(name)
    if (circuitBreaker) {
      circuitBreaker.fallback(fallback)
    }
  }

  /**
   * Obtient le statut d'un circuit breaker
   */
  getStatus(name: string): {
    state: string
    stats: any
  } | null {
    const circuitBreaker = this.circuitBreakers.get(name)
    if (!circuitBreaker) return null

    return {
      state: circuitBreaker.opened ? 'OPEN' : circuitBreaker.halfOpen ? 'HALF-OPEN' : 'CLOSED',
      stats: circuitBreaker.stats,
    }
  }

  /**
   * Obtient tous les circuit breakers et leurs statuts
   */
  getAllStatuses(): Record<string, any> {
    const statuses: Record<string, any> = {}
    
    for (const [name, cb] of this.circuitBreakers) {
      statuses[name] = this.getStatus(name)
    }
    
    return statuses
  }

  /**
   * Force l'ouverture d'un circuit breaker
   */
  forceOpen(name: string): void {
    const circuitBreaker = this.circuitBreakers.get(name)
    if (circuitBreaker) {
      circuitBreaker.open()
    }
  }

  /**
   * Force la fermeture d'un circuit breaker
   */
  forceClose(name: string): void {
    const circuitBreaker = this.circuitBreakers.get(name)
    if (circuitBreaker) {
      circuitBreaker.close()
    }
  }

  private recordMetric(name: string, event: string): void {
    try {
      this.metricsService?.recordBusinessMetric('circuit_breaker_events_total', 1, {
        circuit_breaker: name,
        event,
      })
    } catch (error) {
      // Ignore les erreurs de métriques pour éviter les boucles
    }
  }
}