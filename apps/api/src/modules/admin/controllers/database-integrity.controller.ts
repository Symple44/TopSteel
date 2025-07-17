import { Controller, Get, Post, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { DatabaseIntegrityService, DatabaseIntegrityReport } from '../services/database-integrity.service'

@ApiTags('Database Management')
@Controller('admin/database')
// @UseGuards(JwtAuthGuard) // Temporairement désactivé pour debug
// @ApiBearerAuth()
export class DatabaseIntegrityController {
  constructor(private readonly databaseIntegrityService: DatabaseIntegrityService) {}

  @Get('integrity-report')
  @ApiOperation({ summary: 'Générer un rapport d\'intégrité de la base de données' })
  @ApiResponse({ status: 200, description: 'Rapport généré avec succès' })
  async getIntegrityReport(): Promise<{ success: boolean; data: DatabaseIntegrityReport }> {
    const report = await this.databaseIntegrityService.generateIntegrityReport()
    
    return {
      success: true,
      data: report
    }
  }

  @Get('connection-status')
  @ApiOperation({ summary: 'Vérifier la connectivité de la base de données' })
  async getConnectionStatus(): Promise<{ success: boolean; data: any }> {
    const status = await this.databaseIntegrityService.checkDatabaseConnection()
    
    return {
      success: true,
      data: status
    }
  }

  @Post('synchronize')
  @ApiOperation({ summary: 'Synchroniser la base de données (créer les tables manquantes)' })
  @ApiResponse({ status: 200, description: 'Synchronisation réussie' })
  async synchronizeDatabase(): Promise<{ success: boolean; message: string; details?: any }> {
    return await this.databaseIntegrityService.synchronizeDatabase()
  }

  @Post('run-migrations')
  @ApiOperation({ summary: 'Exécuter les migrations en attente' })
  @ApiResponse({ status: 200, description: 'Migrations exécutées' })
  async runMigrations(): Promise<{ success: boolean; message: string; migrations?: string[] }> {
    return await this.databaseIntegrityService.runMigration()
  }

  @Get('tables')
  @ApiOperation({ summary: 'Lister toutes les tables de la base de données' })
  async listTables(): Promise<{ success: boolean; data: { expected: string[]; actual: string[] } }> {
    const actualTables = await this.databaseIntegrityService.getActualTables()
    const report = await this.databaseIntegrityService.generateIntegrityReport()
    
    return {
      success: true,
      data: {
        expected: report.expectedTables,
        actual: actualTables
      }
    }
  }
}