// apps/api/src/config/throttler.config.ts

import { ConfigService } from '@nestjs/config'
import type { ThrottlerModuleOptions } from '@nestjs/throttler'

export const throttlerConfig = (configService: ConfigService): ThrottlerModuleOptions => {
  const isDevelopment = configService.get<string>('app.env') === 'development'

  return {
    throttlers: [
      {
        name: 'global',
        ttl: 60 * 1000, // 1 minute
        limit: isDevelopment ? 1000 : 100, // Plus permissif en dev
      },
      {
        name: 'auth',
        ttl: 60 * 1000, // 1 minute
        limit: isDevelopment ? 20 : 5, // Stricte pour l'auth
      },
      {
        name: 'api',
        ttl: 60 * 1000, // 1 minute
        limit: isDevelopment ? 500 : 200, // Modéré pour API
      },
    ],
    skipIf: (context) => {
      // Skip pour les health checks et métriques
      const request = context.switchToHttp().getRequest()
      const skipPaths = ['/health', '/metrics', '/api/health']
      return skipPaths.some((path) => request.url?.startsWith(path))
    },
  }
}

export const throttlerAsyncConfig = {
  useFactory: throttlerConfig,
  inject: [ConfigService],
}
