import { Injectable, Logger, Optional } from '@nestjs/common'
import { DatabaseHealthService } from '../../features/database-core/services/database-health.service'

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  message: string
  databases?: any
}

@Injectable()
export class SystemHealthService {
  private readonly logger = new Logger(SystemHealthService.name);

  constructor(
    @Optional() private _databaseHealthService?: DatabaseHealthService
  ) {}

  async checkSystemHealth(): Promise<SystemHealth> {
    try {
      if (this._databaseHealthService) {
        const dbHealth = await this._databaseHealthService.checkSystemHealth()
        return {
          status: dbHealth.overallStatus,
          timestamp: new Date().toISOString(),
          message: `System ${dbHealth.overallStatus} - Databases: AUTH=${dbHealth.auth.status}, SHARED=${dbHealth.shared.status}, TENANT=${dbHealth.tenant.status}`,
          databases: dbHealth,
        }
      }

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        message: 'System operational (database health service not available)',
      }
    } catch (error) {
      this.logger.error('Error checking system health:', error)
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        message: 'System health check failed',
      }
    }
  }

  async getHealthSummary(): Promise<{ status: string; message: string }> {
    const health = await this.checkSystemHealth()
    return {
      status: health.status,
      message: health.message,
    }
  }
}
