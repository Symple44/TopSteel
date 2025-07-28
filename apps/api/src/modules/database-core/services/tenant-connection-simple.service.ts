import { Injectable, Logger } from '@nestjs/common'

interface ConnectionInfo {
  tenant: string
  isInitialized: boolean
  isCurrent?: boolean
}

@Injectable()
export class TenantConnectionSimpleService {
  private readonly logger = new Logger(TenantConnectionSimpleService.name)

  getActiveConnections(): ConnectionInfo[] {
    return [
      {
        tenant: 'TOPSTEEL',
        isInitialized: true,
        isCurrent: true
      },
      {
        tenant: 'DEMO',
        isInitialized: true,
        isCurrent: false
      }
    ]
  }

  async closeTenantConnection(tenantCode: string): Promise<void> {
    this.logger.log(`Fermeture de la connexion pour le tenant: ${tenantCode} (simulé)`)
    // Simulation de fermeture de connexion
  }
}