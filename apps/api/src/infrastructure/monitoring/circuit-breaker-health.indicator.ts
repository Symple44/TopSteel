// apps/api/src/health/circuit-breaker-health.indicator.ts
import { Injectable } from '@nestjs/common'
import { HealthCheckError, HealthIndicator, type HealthIndicatorResult } from '@nestjs/terminus'
import type { CircuitBreakerService } from './circuit-breaker.service'

@Injectable()
export class CircuitBreakerHealthIndicator extends HealthIndicator {
  constructor(private readonly circuitBreakerService: CircuitBreakerService) {
    super()
  }

  async check(key: string = 'circuitBreakers'): Promise<HealthIndicatorResult> {
    const statuses = this.circuitBreakerService.getAllStatuses()
    const circuitBreakerNames = Object.keys(statuses)

    if (circuitBreakerNames.length === 0) {
      return this.getStatus(key, true, { message: 'No circuit breakers configured' })
    }

    const openCircuitBreakers = circuitBreakerNames.filter(
      (name) => (statuses[name] as { state?: string })?.state === 'OPEN'
    )

    const healthData = {
      total: circuitBreakerNames.length,
      open: openCircuitBreakers.length,
      closed: circuitBreakerNames.filter(
        (name) => (statuses[name] as { state?: string })?.state === 'CLOSED'
      ).length,
      halfOpen: circuitBreakerNames.filter(
        (name) => (statuses[name] as { state?: string })?.state === 'HALF-OPEN'
      ).length,
      details: statuses,
    }

    const isHealthy = openCircuitBreakers.length === 0

    if (!isHealthy) {
      throw new HealthCheckError(
        'Circuit breakers check failed',
        this.getStatus(key, false, {
          ...healthData,
          openCircuitBreakers,
        })
      )
    }

    return this.getStatus(key, true, healthData)
  }

  async checkSpecific(circuitBreakerName: string): Promise<HealthIndicatorResult> {
    const status = this.circuitBreakerService.getStatus(circuitBreakerName)

    if (!status) {
      throw new HealthCheckError(
        `Circuit breaker '${circuitBreakerName}' not found`,
        this.getStatus(circuitBreakerName, false, { message: 'Circuit breaker not found' })
      )
    }

    const isHealthy = status.state !== 'OPEN'

    if (!isHealthy) {
      throw new HealthCheckError(
        `Circuit breaker '${circuitBreakerName}' is open`,
        this.getStatus(circuitBreakerName, false, status)
      )
    }

    return this.getStatus(circuitBreakerName, true, status)
  }
}
