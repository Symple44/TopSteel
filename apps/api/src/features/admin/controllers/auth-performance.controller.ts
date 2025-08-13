import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'
import { CombinedSecurityGuard } from '../../../domains/auth/security/guards/combined-security.guard'
import { RequireSystemAdmin } from '../../../domains/auth/security/guards/enhanced-roles.guard'
import type { AuthPerformanceService } from '../../../domains/auth/services/auth-performance.service'
import type { OptimizedCacheService } from '../../../infrastructure/cache/redis-optimized.service'

@Controller('admin/auth-performance')
@ApiTags('🔧 Admin - Performance Monitoring')
@UseGuards(CombinedSecurityGuard)
@RequireSystemAdmin()
@ApiBearerAuth('JWT-auth')
export class AuthPerformanceController {
  constructor(
    private readonly performanceService: AuthPerformanceService,
    private readonly cacheService: OptimizedCacheService
  ) {}

  @Get('metrics')
  @ApiOperation({ summary: "Récupérer les métriques de performance d'authentification" })
  @ApiQuery({
    name: 'minutes',
    required: false,
    type: Number,
    description: 'Période en minutes (défaut: 30)',
  })
  @ApiResponse({ status: 200, description: 'Métriques récupérées avec succès' })
  async getMetrics(@Query('minutes') minutes = 30) {
    const aggregated = this.performanceService.getMetrics(minutes)
    const byOperation = this.performanceService.getMetricsByOperation(minutes)
    const cacheStats = await this.cacheService.getStats()
    const memoryUsage = this.performanceService.getMemoryUsage()

    return {
      success: true,
      data: {
        period: `${minutes} minutes`,
        aggregated,
        byOperation,
        cacheStats,
        memoryUsage,
        timestamp: new Date(),
      },
    }
  }

  @Get('metrics/cached')
  @ApiOperation({ summary: 'Récupérer les métriques mises en cache' })
  @ApiResponse({ status: 200, description: 'Métriques en cache récupérées avec succès' })
  async getCachedMetrics() {
    const cached = await this.performanceService.getCachedMetrics()

    if (!cached) {
      return {
        success: true,
        data: null,
        message: 'Aucune métrique mise en cache disponible',
      }
    }

    return {
      success: true,
      data: cached,
    }
  }

  @Get('health-check')
  @ApiOperation({ summary: "Vérification de l'état des performances du système d'auth" })
  @ApiResponse({ status: 200, description: 'État de santé récupéré avec succès' })
  async getHealthCheck() {
    const metrics = this.performanceService.getMetrics(5) // Dernières 5 minutes
    const cacheStats = await this.cacheService.getStats()
    const memoryUsage = this.performanceService.getMemoryUsage()

    // Définir les seuils de santé
    const isHealthy = {
      responseTime: metrics.averageResponseTime < 500, // < 500ms
      successRate: metrics.successRate > 95, // > 95%
      cacheHitRate: cacheStats.hitRate > 70, // > 70%
      memoryUsage: memoryUsage.heapUsed < 512, // < 512MB
      p95ResponseTime: metrics.p95ResponseTime < 1000, // < 1s
    }

    const overallHealth = Object.values(isHealthy).every(Boolean)

    return {
      success: true,
      data: {
        overall: overallHealth ? 'healthy' : 'degraded',
        checks: {
          responseTime: {
            status: isHealthy.responseTime ? 'ok' : 'warning',
            value: `${metrics.averageResponseTime.toFixed(2)}ms`,
            threshold: '< 500ms',
          },
          successRate: {
            status: isHealthy.successRate ? 'ok' : 'critical',
            value: `${metrics.successRate.toFixed(2)}%`,
            threshold: '> 95%',
          },
          cacheHitRate: {
            status: isHealthy.cacheHitRate ? 'ok' : 'warning',
            value: `${cacheStats.hitRate.toFixed(2)}%`,
            threshold: '> 70%',
          },
          memoryUsage: {
            status: isHealthy.memoryUsage ? 'ok' : 'warning',
            value: `${memoryUsage.heapUsed}MB`,
            threshold: '< 512MB',
          },
          p95ResponseTime: {
            status: isHealthy.p95ResponseTime ? 'ok' : 'warning',
            value: `${metrics.p95ResponseTime.toFixed(2)}ms`,
            threshold: '< 1000ms',
          },
        },
        recommendations: this.generateRecommendations(
          isHealthy,
          metrics as any,
          cacheStats,
          memoryUsage
        ),
        timestamp: new Date(),
      },
    }
  }

  @Get('cache-status')
  @ApiOperation({ summary: 'État détaillé du cache Redis' })
  @ApiResponse({ status: 200, description: 'État du cache récupéré avec succès' })
  async getCacheStatus() {
    const stats = await this.cacheService.getStats()

    return {
      success: true,
      data: {
        hitRate: stats.hitRate,
        totalOperations: stats.operations,
        status: stats.hitRate > 70 ? 'optimal' : stats.hitRate > 40 ? 'suboptimal' : 'poor',
        recommendations:
          stats.hitRate < 70
            ? [
                "Considérer l'augmentation des TTL pour les données stables",
                "Analyser les patterns d'accès pour optimiser la stratégie de cache",
                'Vérifier si des données sont invalidées trop fréquemment',
              ]
            : ['Le cache fonctionne de manière optimale'],
        timestamp: new Date(),
      },
    }
  }

  @Get('slow-operations')
  @ApiOperation({ summary: 'Opérations lentes détectées' })
  @ApiQuery({
    name: 'threshold',
    required: false,
    type: Number,
    description: 'Seuil en ms (défaut: 1000)',
  })
  @ApiQuery({
    name: 'minutes',
    required: false,
    type: Number,
    description: 'Période en minutes (défaut: 60)',
  })
  @ApiResponse({ status: 200, description: 'Opérations lentes récupérées avec succès' })
  async getSlowOperations(@Query('threshold') threshold = 1000, @Query('minutes') minutes = 60) {
    const byOperation = this.performanceService.getMetricsByOperation(minutes)

    const slowOperations = Object.entries(byOperation)
      .filter(([_, metrics]) => metrics.averageResponseTime > threshold)
      .map(([operation, metrics]) => ({
        operation,
        averageResponseTime: metrics.averageResponseTime,
        p95ResponseTime: metrics.p95ResponseTime,
        p99ResponseTime: metrics.p99ResponseTime,
        totalOperations: metrics.totalOperations,
        cacheHitRate: metrics.cacheHitRate,
        averageQueriesPerOperation: metrics.averageQueriesPerOperation,
      }))
      .sort((a, b) => b.averageResponseTime - a.averageResponseTime)

    return {
      success: true,
      data: {
        threshold: `${threshold}ms`,
        period: `${minutes} minutes`,
        slowOperations,
        totalSlowOperations: slowOperations.length,
        recommendations:
          slowOperations.length > 0
            ? [
                'Vérifier les requêtes N+1 dans les opérations lentes',
                'Optimiser les requêtes base de données',
                'Ajouter ou améliorer la mise en cache',
                'Analyser les indexes manquants',
              ]
            : ['Aucune opération lente détectée'],
      },
    }
  }

  private generateRecommendations(
    isHealthy: Record<string, boolean>,
    _metrics: Record<string, unknown>,
    _cacheStats: Record<string, unknown>,
    _memoryUsage: Record<string, unknown>
  ): string[] {
    const recommendations: string[] = []

    if (!isHealthy.responseTime) {
      recommendations.push('Optimiser les requêtes base de données et ajouter des indexes')
    }

    if (!isHealthy.successRate) {
      recommendations.push("Investiguer les erreurs d'authentification fréquentes")
    }

    if (!isHealthy.cacheHitRate) {
      recommendations.push('Améliorer la stratégie de mise en cache et les TTL')
    }

    if (!isHealthy.memoryUsage) {
      recommendations.push("Analyser les fuites mémoire et optimiser l'utilisation")
    }

    if (!isHealthy.p95ResponseTime) {
      recommendations.push('Optimiser les opérations les plus lentes (percentile 95)')
    }

    if (recommendations.length === 0) {
      recommendations.push('Le système fonctionne de manière optimale')
    }

    return recommendations
  }
}
