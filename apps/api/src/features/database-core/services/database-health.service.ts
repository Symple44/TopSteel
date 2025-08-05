import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import type { DataSource } from 'typeorm'
import type { TenantConnectionService } from './tenant-connection.service'

export interface DatabaseHealthStatus {
  database: string
  status: 'healthy' | 'unhealthy'
  isConnected: boolean
  responseTime?: number
  error?: string
}

export interface SystemDatabaseHealth {
  auth: DatabaseHealthStatus
  shared: DatabaseHealthStatus
  tenant: DatabaseHealthStatus
  activeTenants: string[]
  overallStatus: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
}

@Injectable()
export class DatabaseHealthService {
  constructor(
    @InjectDataSource('auth') private _authDataSource: DataSource,
    @InjectDataSource('shared') private _sharedDataSource: DataSource,
    @InjectDataSource('tenant') private _tenantDataSource: DataSource,
    private tenantConnectionService: TenantConnectionService
  ) {}

  /**
   * Vérifier la santé d'une base de données
   */
  private async checkDatabaseHealth(
    dataSource: DataSource,
    name: string
  ): Promise<DatabaseHealthStatus> {
    const startTime = Date.now()

    try {
      if (!dataSource.isInitialized) {
        return {
          database: name,
          status: 'unhealthy',
          isConnected: false,
          error: 'DataSource not initialized',
        }
      }

      // Test simple de connectivité
      await dataSource.query('SELECT 1')

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
    const [authHealth, sharedHealth, tenantHealth] = await Promise.all([
      this.checkDatabaseHealth(this._authDataSource, 'auth'),
      this.checkDatabaseHealth(this._sharedDataSource, 'shared'),
      this.checkDatabaseHealth(this._tenantDataSource, 'tenant_topsteel'),
    ])

    const activeConnections = this.tenantConnectionService.getActiveConnections()
    const activeTenants = activeConnections
      .filter((conn) => conn.isInitialized)
      .map((conn) => conn.tenant)

    // Déterminer le statut global
    const healthStatuses = [authHealth, sharedHealth, tenantHealth]
    const unhealthyCount = healthStatuses.filter((h) => h.status === 'unhealthy').length

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy'
    if (unhealthyCount === 0) {
      overallStatus = 'healthy'
    } else if (unhealthyCount === healthStatuses.length) {
      overallStatus = 'unhealthy'
    } else {
      overallStatus = 'degraded'
    }

    return {
      auth: authHealth,
      shared: sharedHealth,
      tenant: tenantHealth,
      activeTenants,
      overallStatus,
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * Vérifier la santé d'un tenant spécifique
   */
  async checkTenantHealth(tenantCode: string): Promise<DatabaseHealthStatus> {
    try {
      const connection = await this.tenantConnectionService.getTenantConnection(tenantCode)
      return await this.checkDatabaseHealth(connection, `tenant_${tenantCode}`)
    } catch (error) {
      return {
        database: `tenant_${tenantCode}`,
        status: 'unhealthy',
        isConnected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}
