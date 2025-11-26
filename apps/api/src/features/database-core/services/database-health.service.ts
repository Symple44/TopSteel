import { PrismaService } from '../../../core/database/prisma/prisma.service'
import { Injectable } from '@nestjs/common'

export interface DatabaseHealthStatus {
  database: string
  status: 'healthy' | 'unhealthy'
  isConnected: boolean
  responseTime?: number
  error?: string
}

export interface SystemDatabaseHealth {
  database: DatabaseHealthStatus
  overallStatus: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
}

/**
 * Service de santé de base de données simplifié pour Prisma
 */
@Injectable()
export class DatabaseHealthService {
  constructor(
    private readonly prisma: PrismaService
  ) {}

  /**
   * Vérifier la santé de la base de données Prisma
   */
  private async checkDatabaseHealth(name: string): Promise<DatabaseHealthStatus> {
    const startTime = Date.now()

    try {
      // Test simple de connectivité avec Prisma
      await this.prisma.$queryRawUnsafe('SELECT 1')

      const responseTime = Date.now() - startTime

      return {
        database: name,
        status: 'healthy',
        isConnected: true,
        responseTime,
      }
    } catch (error) {
      return {
        database: name,
        status: 'unhealthy',
        isConnected: false,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Vérifier la santé complète du système
   */
  async checkSystemHealth(): Promise<SystemDatabaseHealth> {
    const databaseHealth = await this.checkDatabaseHealth('prisma')

    // Déterminer le statut global basé sur la santé de Prisma
    const overallStatus = databaseHealth.status === 'healthy' ? 'healthy' : 'unhealthy'

    return {
      database: databaseHealth,
      overallStatus,
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * Vérifier la santé d'un tenant spécifique (simplifié)
   */
  async checkTenantHealth(tenantCode: string): Promise<DatabaseHealthStatus> {
    // Simplifié - utilise la même connexion Prisma
    return await this.checkDatabaseHealth(`tenant_${tenantCode}`)
  }
}
