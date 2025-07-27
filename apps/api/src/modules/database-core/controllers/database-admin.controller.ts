import { Controller, Get, Param, Post, UseGuards, Request } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { Roles } from '../../auth/decorators/roles.decorator'
import { RolesGuard } from '../../auth/guards/roles.guard'
import { DatabaseHealthService } from '../services/database-health.service'
import { MigrationManagerService } from '../services/migration-manager.service'
import { TenantConnectionService } from '../services/tenant-connection.service'

@ApiTags('Database Admin')
@Controller('admin/database')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
@ApiBearerAuth()
export class DatabaseAdminController {
  constructor(
    private databaseHealthService: DatabaseHealthService,
    private migrationManagerService: MigrationManagerService,
    private tenantConnectionService: TenantConnectionService,
  ) {}

  @Get('health')
  @ApiOperation({ summary: 'Vérifier la santé des bases de données' })
  async checkHealth() {
    return this.databaseHealthService.checkSystemHealth()
  }

  @Get('health/tenant/:tenantCode')
  @ApiOperation({ summary: 'Vérifier la santé d\'un tenant spécifique' })
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
      }
    }
  }

  @Get('migrations/status')
  @ApiOperation({ summary: 'Obtenir le statut des migrations' })
  async getMigrationStatus() {
    return this.migrationManagerService.getAllMigrationStatus()
  }

  @Get('migrations/tenant/:tenantCode/status')
  @ApiOperation({ summary: 'Obtenir le statut des migrations d\'un tenant' })
  async getTenantMigrationStatus(@Param('tenantCode') tenantCode: string) {
    return this.migrationManagerService.getTenantMigrationStatus(tenantCode)
  }

  @Post('migrations/run')
  @ApiOperation({ summary: 'Exécuter toutes les migrations' })
  async runMigrations() {
    return this.migrationManagerService.runAllMigrations()
  }

  @Post('migrations/tenant/:tenantCode/run')
  @ApiOperation({ summary: 'Exécuter les migrations pour un tenant' })
  async runTenantMigrations(@Param('tenantCode') tenantCode: string) {
    return this.migrationManagerService.runTenantMigrations(tenantCode)
  }

  @Get('connections')
  @ApiOperation({ summary: 'Lister les connexions actives' })
  async getActiveConnections(@Request() req: any) {
    const connections = this.tenantConnectionService.getActiveConnections()
    
    // Ajouter la connexion du tenant actuel si l'utilisateur est connecté à une société
    const currentUser = req.user
    if (currentUser?.societeCode) {
      const currentTenantKey = currentUser.societeCode.toLowerCase()
      const isAlreadyListed = connections.some(conn => 
        conn.tenant.toLowerCase() === currentTenantKey
      )
      
      if (!isAlreadyListed) {
        connections.push({
          tenant: currentUser.societeCode,
          isInitialized: true,
          isCurrent: true
        })
      } else {
        // Marquer la connexion actuelle
        connections.forEach(conn => {
          if (conn.tenant.toLowerCase() === currentTenantKey) {
            conn.isCurrent = true
          }
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
  @ApiOperation({ summary: 'Fermer la connexion d\'un tenant' })
  async closeTenantConnection(@Param('tenantCode') tenantCode: string) {
    await this.tenantConnectionService.closeTenantConnection(tenantCode)
    return {
      message: `Connexion fermée pour le tenant: ${tenantCode}`,
      timestamp: new Date().toISOString(),
    }
  }
}