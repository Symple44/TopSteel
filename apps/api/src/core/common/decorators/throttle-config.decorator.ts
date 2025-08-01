// apps/api/src/common/decorators/throttle-config.decorator.ts
import { SetMetadata } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'

// Configurations prédéfinies pour différents types d'endpoints
export const THROTTLE_CONFIGS = {
  AUTH: { ttl: 60 * 1000, limit: 5 },
  API_WRITE: { ttl: 60 * 1000, limit: 30 },
  API_READ: { ttl: 60 * 1000, limit: 100 },
  UPLOAD: { ttl: 60 * 1000, limit: 10 },
  ADMIN: { ttl: 60 * 1000, limit: 200 },
}

// Decorators spécialisés
export const ThrottleAuth = () => Throttle({ default: THROTTLE_CONFIGS.AUTH })
export const ThrottleApiWrite = () => Throttle({ default: THROTTLE_CONFIGS.API_WRITE })
export const ThrottleApiRead = () => Throttle({ default: THROTTLE_CONFIGS.API_READ })
export const ThrottleUpload = () => Throttle({ default: THROTTLE_CONFIGS.UPLOAD })
export const ThrottleAdmin = () => Throttle({ default: THROTTLE_CONFIGS.ADMIN })

// Decorator pour exclure du throttling
export const SkipThrottle = () => SetMetadata('skipThrottle', true)

// Decorator pour throttling personnalisé
export const CustomThrottle = (ttl: number, limit: number) => Throttle({ default: { ttl, limit } })
