// apps/api/src/common/interceptors/circuit-breaker.interceptor.ts
import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Observable } from 'rxjs'
import { CircuitBreakerService } from '../../../infrastructure/monitoring/circuit-breaker.service'
import {
  CIRCUIT_BREAKER_KEY,
  type CircuitBreakerMetadata,
} from '../decorators/circuit-breaker.decorator'

@Injectable()
export class CircuitBreakerInterceptor implements NestInterceptor {
  constructor(
    private readonly circuitBreakerService: CircuitBreakerService,
    private readonly reflector: Reflector
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const circuitBreakerConfig = this.reflector.get<CircuitBreakerMetadata>(
      CIRCUIT_BREAKER_KEY,
      context.getHandler()
    )

    if (!circuitBreakerConfig) {
      return next.handle()
    }

    const { name, fallback, ...options } = circuitBreakerConfig
    const instance = context.switchToHttp().getRequest()

    // Créer une function wrapper pour l'exécution
    const executeHandler = async () => {
      return new Promise((resolve, reject) => {
        const subscription = next.handle().subscribe({
          next: (value) => {
            resolve(value)
            subscription.unsubscribe()
          },
          error: (error) => {
            reject(error)
            subscription.unsubscribe()
          },
        })
      })
    }

    // Configurer le fallback si spécifié
    if (fallback && instance[fallback]) {
      this.circuitBreakerService.withFallback(name, async (...args) => {
        return instance[fallback](...args)
      })
    }

    // Exécuter avec circuit breaker
    try {
      const result = await this.circuitBreakerService.execute(name, executeHandler, [], options)

      return new Observable((subscriber) => {
        subscriber.next(result)
        subscriber.complete()
      })
    } catch (error) {
      return new Observable((subscriber) => {
        subscriber.error(error)
      })
    }
  }
}
