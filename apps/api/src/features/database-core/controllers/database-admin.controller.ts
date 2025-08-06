import { Controller, Get, Param, Post, Request } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import type { DatabaseHealthSimpleService } from '../services/database-health-simple.service'
import type { MigrationManagerService } from '../services/migration-manager.service'
import type {
  ConnectionsResponse,
  TenantConnectionSimpleService,
} from '../services/tenant-connection-simple.service'

@ApiTags('Database Admin')
@Controller('admin/database')
// @UseGuards(JwtAuthGuard, RolesGuard) // Désactivé pour debug
// @Roles('SUPER_ADMIN')
// @ApiBearerAuth()
export class DatabaseAdminController {
  constructor(
    private databaseHealthService: DatabaseHealthSimpleService,
    private migrationManagerService: MigrationManagerService,
    private tenantConnectionService: TenantConnectionSimpleService
  ) {}

  @Get('health')
  @ApiOperation({ summary: 'Vérifier la santé des bases de données' })
  async checkHealth() {
    return this.databaseHealthService.checkSystemHealth()
  }

  @Get('health/tenant/:tenantCode')
  @ApiOperation({ summary: "Vérifier la santé d'un tenant spécifique" })
  async checkTenantHealth(@Param('tenantCode') tenantCode: string) {
    const health = await this.databaseHealthService.checkTenantHealth(tenantCode)

    // Ajouter des informations supplémentaires sur la configuration
    const config = {
      database: `erp_topsteel_${tenantCode.toLowerCase()}`,
      poolSize: 10, // Valeur par défaut configurée
      connectionTimeout: 30000, // 30 secondes
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
    }

    return {
      ...health,
      configuration: config,
      metrics: {
        activeConnections: 1, // Au minimum la connexion courante
        idleConnections: 9,
        totalConnections: 10,
        waitingClients: 0,
      },
    }
  }

  @Get('migrations/status')
  @ApiOperation({ summary: 'Obtenir le statut des migrations' })
  async getMigrationStatus() {
    return this.migrationManagerService.getAllMigrationStatus()
  }

  @Get('migrations/tenant/:tenantCode/status')
  @ApiOperation({ summary: "Obtenir le statut des migrations d'un tenant" })
  async getTenantMigrationStatus(@Param('tenantCode') tenantCode: string) {
    return this.migrationManagerService.getTenantMigrationStatus(tenantCode)
  }

  @Post('migrations/run')
  @ApiOperation({ summary: 'Exécuter toutes les migrations' })
  async runMigrations() {
    const results = await this.migrationManagerService.runAllMigrations()
    return results
  }

  @Post('migrations/tenant/:tenantCode/run')
  @ApiOperation({ summary: 'Exécuter les migrations pour un tenant' })
  async runTenantMigrations(@Param('tenantCode') tenantCode: string) {
    return this.migrationManagerService.runTenantMigrations(tenantCode)
  }

  @Get('connections')
  @ApiOperation({ summary: 'Lister les connexions actives' })
  async getActiveConnections(
    @Request() req: Record<string, unknown>
  ): Promise<ConnectionsResponse> {
    const connections = this.tenantConnectionService.getActiveConnections()

    // Ajouter la connexion du tenant actuel si l'utilisateur est connecté à une société
    const currentUser = req.user
    if (currentUser?.societeCode) {
      const currentTenantKey = currentUser.societeCode.toLowerCase()
      const isAlreadyListed = connections.some(
        (conn) => conn.tenant.toLowerCase() === currentTenantKey
      )

      if (isAlreadyListed) {
        // Marquer la connexion actuelle
        connections.forEach((conn) => {
          if (conn.tenant.toLowerCase() === currentTenantKey) {
            conn.isCurrent = true
          }
        })
      } else {
        connections.push({
          tenant: currentUser.societeCode,
          isInitialized: true,
          isCurrent: true,
        })
      }
    }

    return {
      connections,
      currentTenant: currentUser?.societeCode || null,
      timestamp: new Date().toISOString(),
    }
  }

  @Post('connections/tenant/:tenantCode/close')
  @ApiOperation({ summary: "Fermer la connexion d'un tenant" })
  async closeTenantConnection(@Param('tenantCode') tenantCode: string) {
    await this.tenantConnectionService.closeTenantConnection(tenantCode)
    return {
      message: `Connexion fermée pour le tenant: ${tenantCode}`,
      timestamp: new Date().toISOString(),
    }
  }

  @Get('migrations/:database/:migrationName/details')
  @ApiOperation({ summary: "Obtenir le détail d'une migration" })
  async getMigrationDetails(
    @Param('database') database: string,
    @Param('migrationName') migrationName: string
  ) {
    return this.migrationManagerService.getMigrationDetails(database, migrationName)
  }
}
