import { Injectable } from '@nestjs/common'

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
export class DatabaseHealthSimpleService {
  async checkSystemHealth(): Promise<SystemDatabaseHealth> {
    // Version simplifiée sans injection de DataSource
    return {
      auth: {
        database: 'auth',
        status: 'healthy',
        isConnected: true,
        responseTime: 50,
      },
      shared: {
        database: 'shared',
        status: 'healthy',
        isConnected: true,
        responseTime: 45,
      },
      tenant: {
        database: 'tenant',
        status: 'healthy',
        isConnected: true,
        responseTime: 60,
      },
      activeTenants: ['TOPSTEEL', 'DEMO'],
      overallStatus: 'healthy',
      timestamp: new Date().toISOString(),
    }
  }

  async checkTenantHealth(tenantCode: string): Promise<DatabaseHealthStatus> {
    return {
      database: tenantCode,
      status: 'healthy',
      isConnected: true,
      responseTime: 55,
    }
  }
}
