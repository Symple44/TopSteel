// apps/api/src/config/prometheus.config.ts
import { PrometheusModule } from '@willsoto/nestjs-prometheus'
import { ConfigService } from '@nestjs/config'

export const prometheusAsyncConfig = {
  useFactory: (configService: ConfigService) => ({
    path: '/metrics',
    // Désactiver les métriques par défaut si nécessaire
    defaultMetrics: {
      enabled: true,
      config: {
        prefix: 'topsteel_api_',
      },
    },
    // Configuration des labels globaux
    defaultLabels: {
      app: 'topsteel-api',
      version: process.env.npm_package_version || '1.0.0',
      environment: configService.get<string>('app.env', 'development'),
    },
  }),
  inject: [ConfigService],
}

// Configuration des métriques personnalisées
export const CUSTOM_METRICS = {
  // Compteur de requêtes HTTP
  HTTP_REQUESTS_TOTAL: {
    name: 'topsteel_http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'] as const,
  },
  
  // Durée des requêtes HTTP
  HTTP_REQUEST_DURATION: {
    name: 'topsteel_http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route'] as const,
    buckets: [0.001, 0.005, 0.015, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 1.0, 5.0, 10.0] as number[],
  },
  
  // Erreurs d'authentification
  AUTH_FAILURES: {
    name: 'topsteel_auth_failures_total',
    help: 'Total number of authentication failures',
    labelNames: ['type', 'reason'] as const,
  },
  
  // Connexions base de données
  DB_CONNECTIONS: {
    name: 'topsteel_db_connections_active',
    help: 'Number of active database connections',
    labelNames: ['database'] as const,
  },
  
  // Cache hits/misses
  CACHE_OPERATIONS: {
    name: 'topsteel_cache_operations_total',
    help: 'Total number of cache operations',
    labelNames: ['operation', 'result'] as const,
  },
  
  // Taille des uploads
  UPLOAD_SIZE: {
    name: 'topsteel_upload_size_bytes',
    help: 'Size of uploaded files in bytes',
    labelNames: ['file_type'] as const,
  },
  
  // Sessions utilisateurs actives
  ACTIVE_SESSIONS: {
    name: 'topsteel_active_sessions',
    help: 'Number of active user sessions',
    labelNames: ['tenant'] as const,
  },
} as const