// apps/api/src/common/decorators/circuit-breaker.decorator.ts
import { SetMetadata } from '@nestjs/common'

export const CIRCUIT_BREAKER_KEY = 'circuitBreaker'

export interface CircuitBreakerMetadata {
  name: string
  timeout?: number
  errorThresholdPercentage?: number
  resetTimeout?: number
  volumeThreshold?: number
  fallback?: string // Nom de la méthode fallback
}

/**
 * Decorator pour appliquer un circuit breaker à une méthode
 */
export const UseCircuitBreaker = (config: CircuitBreakerMetadata) =>
  SetMetadata(CIRCUIT_BREAKER_KEY, config)

/**
 * Decorator pour marquer une méthode comme fallback
 */
export const CircuitBreakerFallback = (circuitBreakerName: string) =>
  SetMetadata('circuitBreakerFallback', circuitBreakerName)

// Configurations prédéfinies
export const CIRCUIT_BREAKER_CONFIGS = {
  DATABASE: {
    timeout: 5000,
    errorThresholdPercentage: 60,
    resetTimeout: 30000,
    volumeThreshold: 5,
  },
  EXTERNAL_API: {
    timeout: 10000,
    errorThresholdPercentage: 50,
    resetTimeout: 60000,
    volumeThreshold: 3,
  },
  CACHE: {
    timeout: 1000,
    errorThresholdPercentage: 70,
    resetTimeout: 15000,
    volumeThreshold: 10,
  },
  EMAIL: {
    timeout: 15000,
    errorThresholdPercentage: 40,
    resetTimeout: 120000,
    volumeThreshold: 2,
  },
} as const

// Decorators spécialisés
export const DatabaseCircuitBreaker = (name: string, fallback?: string) =>
  UseCircuitBreaker({ name, ...CIRCUIT_BREAKER_CONFIGS.DATABASE, fallback })

export const ExternalApiCircuitBreaker = (name: string, fallback?: string) =>
  UseCircuitBreaker({ name, ...CIRCUIT_BREAKER_CONFIGS.EXTERNAL_API, fallback })

export const CacheCircuitBreaker = (name: string, fallback?: string) =>
  UseCircuitBreaker({ name, ...CIRCUIT_BREAKER_CONFIGS.CACHE, fallback })

export const EmailCircuitBreaker = (name: string, fallback?: string) =>
  UseCircuitBreaker({ name, ...CIRCUIT_BREAKER_CONFIGS.EMAIL, fallback })