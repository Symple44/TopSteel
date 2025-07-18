import { Controller, Get, Post, Body, HttpException, HttpStatus, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { MigrationService } from '../services/migration.service'
import { SeederService } from '../services/seeder.service'
import { DatabaseHealthService } from '../services/health.service'
import { DatabaseStartupService } from '../services/startup.service'
import { ConfigService } from '@nestjs/config'

// Remarque: Ajouter un guard d'authentification admin pour sécuriser ces endpoints
// import { AdminGuard } from '../guards/admin.guard'

@ApiTags('Database Management')
@Controller('admin/database')
// @UseGuards(AdminGuard) // Décommenter quand le guard est implémenté
@ApiBearerAuth()
export class DatabaseController {
  private readonly isProduction: boolean

  constructor(
    private readonly migrationService: MigrationService,
    private readonly seederService: SeederService,
    private readonly healthService: DatabaseHealthService,
    private readonly startupService: DatabaseStartupService,
    private readonly configService: ConfigService
  ) {
    this.isProduction = this.configService.get('NODE_ENV') === 'production'
  }

  @Get('health')
  @ApiOperation({ summary: 'Vérifier la santé de la base de données' })
  @ApiResponse({ status: 200, description: 'Statut de santé de la base' })
  async getHealth() {
    try {
      const health = await this.healthService.checkHealth()
      return {
        success: true,
        data: health
      }
    } catch (error) {
      throw new HttpException(
        { success: false, message: error instanceof Error ? error.message : 'Unknown error' },
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  @Get('health/simple')
  @ApiOperation({ summary: 'Vérification rapide de la santé' })
  @ApiResponse({ status: 200, description: 'Statut simplifié' })
  async getSimpleHealth() {
    try {
      const metrics = await this.healthService.getBasicMetrics()
      return {
        success: true,
        data: {
          isHealthy: metrics.isConnected,
          responseTime: metrics.responseTime,
          connectionCount: metrics.connectionCount
        }
      }
    } catch (error) {
      throw new HttpException(
        { success: false, message: error instanceof Error ? error.message : 'Unknown error' },
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  @Get('migrations/status')
  @ApiOperation({ summary: 'Obtenir le statut des migrations' })
  @ApiResponse({ status: 200, description: 'Statut des migrations' })
  async getMigrationStatus() {
    try {
      const status = await this.migrationService.getMigrationStatus()
      return {
        success: true,
        data: status
      }
    } catch (error) {
      throw new HttpException(
        { success: false, message: error instanceof Error ? error.message : 'Unknown error' },
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  @Post('migrations/run')
  @ApiOperation({ summary: 'Exécuter les migrations en attente' })
  @ApiResponse({ status: 200, description: 'Migrations exécutées' })
  async runMigrations() {
    try {
      await this.migrationService.runPendingMigrations()
      return {
        success: true,
        message: 'Migrations exécutées avec succès'
      }
    } catch (error) {
      throw new HttpException(
        { success: false, message: error instanceof Error ? error.message : 'Unknown error' },
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  @Post('migrations/revert')
  @ApiOperation({ summary: 'Annuler la dernière migration (développement uniquement)' })
  @ApiResponse({ status: 200, description: 'Migration annulée' })
  async revertMigration() {
    if (this.isProduction) {
      throw new HttpException(
        { success: false, message: 'Opération interdite en production' },
        HttpStatus.FORBIDDEN
      )
    }

    try {
      await this.migrationService.revertLastMigration()
      return {
        success: true,
        message: 'Migration annulée avec succès'
      }
    } catch (error) {
      throw new HttpException(
        { success: false, message: error instanceof Error ? error.message : 'Unknown error' },
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  @Post('seeds/run')
  @ApiOperation({ summary: 'Exécuter les données d\'initialisation' })
  @ApiResponse({ status: 200, description: 'Seeds exécutés' })
  async runSeeds() {
    try {
      await this.seederService.runSeeds()
      return {
        success: true,
        message: 'Données d\'initialisation créées avec succès'
      }
    } catch (error) {
      throw new HttpException(
        { success: false, message: error instanceof Error ? error.message : 'Unknown error' },
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  @Post('seeds/reset')
  @ApiOperation({ summary: 'Reset des seeds (développement uniquement)' })
  @ApiResponse({ status: 200, description: 'Seeds reset' })
  async resetSeeds() {
    if (this.isProduction) {
      throw new HttpException(
        { success: false, message: 'Opération interdite en production' },
        HttpStatus.FORBIDDEN
      )
    }

    try {
      await this.seederService.resetSeeds()
      return {
        success: true,
        message: 'Seeds reset avec succès'
      }
    } catch (error) {
      throw new HttpException(
        { success: false, message: error instanceof Error ? error.message : 'Unknown error' },
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  @Post('development/reset')
  @ApiOperation({ summary: 'Reset complet de la base de développement' })
  @ApiResponse({ status: 200, description: 'Base reset' })
  async resetDevelopmentDatabase() {
    if (this.isProduction) {
      throw new HttpException(
        { success: false, message: 'Opération interdite en production' },
        HttpStatus.FORBIDDEN
      )
    }

    try {
      await this.startupService.resetDevelopmentDatabase()
      return {
        success: true,
        message: 'Base de développement réinitialisée avec succès'
      }
    } catch (error) {
      throw new HttpException(
        { success: false, message: error instanceof Error ? error.message : 'Unknown error' },
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  @Get('stats')
  @ApiOperation({ summary: 'Statistiques détaillées de la base' })
  @ApiResponse({ status: 200, description: 'Statistiques' })
  async getStats() {
    try {
      const stats = await this.healthService.getDetailedStats()
      return {
        success: true,
        data: stats
      }
    } catch (error) {
      throw new HttpException(
        { success: false, message: error instanceof Error ? error.message : 'Unknown error' },
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

}