// apps/api/src/common/services/metrics.service.ts
import { Injectable, Logger, Optional } from '@nestjs/common'
import { InjectMetric } from '@willsoto/nestjs-prometheus'
import { Counter, Gauge, Histogram } from 'prom-client'

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);

  constructor(
    @Optional()
    @InjectMetric('topsteel_auth_failures_total')
    private readonly _authFailuresCounter?: Counter<string>,
    
    @Optional()
    @InjectMetric('topsteel_db_connections_active')
    private readonly _dbConnectionsGauge?: Gauge<string>,
    
    @Optional()
    @InjectMetric('topsteel_cache_operations_total')
    private readonly _cacheOperationsCounter?: Counter<string>,
    
    @Optional()
    @InjectMetric('topsteel_upload_size_bytes')
    private readonly _uploadSizeHistogram?: Histogram<string>,
    
    @Optional()
    @InjectMetric('topsteel_active_sessions')
    private readonly _activeSessionsGauge?: Gauge<string>,
  ) {}

  // Métriques d'authentification
  recordAuthFailure(type: 'login' | 'token' | 'mfa', reason: string) {
    try {
      this._authFailuresCounter?.inc({ type, reason })
    } catch (error) {
      this.logger.warn('Failed to record auth failure metric', error)
    }
  }

  // Métriques de base de données
  setDbConnections(database: string, count: number) {
    try {
      this._dbConnectionsGauge?.set({ database }, count)
    } catch (error) {
      this.logger.warn('Failed to set DB connections metric', error)
    }
  }

  // Métriques de cache
  recordCacheOperation(
    operation: 'get' | 'set' | 'del',
    result: 'hit' | 'miss' | 'success' | 'error'
  ) {
    try {
      this._cacheOperationsCounter?.inc({ operation, result })
    } catch (error) {
      this.logger.warn('Failed to record cache operation metric', error)
    }
  }

  // Métriques d'upload
  recordUpload(fileType: string, sizeBytes: number) {
    try {
      this._uploadSizeHistogram?.observe({ file_type: fileType }, sizeBytes)
    } catch (error) {
      this.logger.warn('Failed to record upload metric', error)
    }
  }

  // Métriques de session
  setActiveSessions(tenant: string, count: number) {
    try {
      this._activeSessionsGauge?.set({ tenant }, count)
    } catch (error) {
      this.logger.warn('Failed to set active sessions metric', error)
    }
  }

  // Métriques business spécifiques
  recordBusinessMetric(_metricName: string, _value: number, _labels: Record<string, string> = {}) {}
}
