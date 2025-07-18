import { Controller, Get, Post, UseGuards, Param, Body, Delete } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { DatabaseIntegrityService, DatabaseIntegrityReport } from '../services/database-integrity.service'
import { DatabaseBackupService } from '../services/database-backup.service'
import { DatabaseStatsService } from '../services/database-stats.service'
import { DatabaseEnumFixService } from '../services/database-enum-fix.service'

@ApiTags('Database Management')
@Controller('admin/database')
// @UseGuards(JwtAuthGuard) // Temporairement désactivé pour debug
// @ApiBearerAuth()
export class DatabaseIntegrityController {
  constructor(
    private readonly databaseIntegrityService: DatabaseIntegrityService,
    private readonly databaseBackupService: DatabaseBackupService,
    private readonly databaseStatsService: DatabaseStatsService,
    private readonly databaseEnumFixService: DatabaseEnumFixService
  ) {}

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

  @Get('stats')
  @ApiOperation({ summary: 'Obtenir les statistiques de la base de données' })
  async getStats(): Promise<{ success: boolean; data: any }> {
    const stats = await this.databaseStatsService.getStats()
    
    return {
      success: true,
      data: stats
    }
  }

  @Post('optimize')
  @ApiOperation({ summary: 'Optimiser la base de données' })
  async optimizeDatabase(): Promise<{ success: boolean; message: string; details?: any }> {
    return await this.databaseStatsService.optimizeDatabase()
  }

  @Get('backups')
  @ApiOperation({ summary: 'Lister les sauvegardes disponibles' })
  async listBackups(): Promise<{ success: boolean; data: any[] }> {
    const backups = await this.databaseBackupService.listBackups()
    
    return {
      success: true,
      data: backups
    }
  }

  @Post('backup')
  @ApiOperation({ summary: 'Créer une sauvegarde de la base de données' })
  async createBackup(@Body() options: { type?: string; compress?: boolean; includeMedia?: boolean }): Promise<{ success: boolean; message: string; data?: any }> {
    return await this.databaseBackupService.createBackup(options)
  }

  @Post('restore/:id')
  @ApiOperation({ summary: 'Restaurer une sauvegarde' })
  async restoreBackup(@Param('id') backupId: string): Promise<{ success: boolean; message: string }> {
    return await this.databaseBackupService.restoreBackup(backupId)
  }

  @Delete('backups/:id')
  @ApiOperation({ summary: 'Supprimer une sauvegarde' })
  async deleteBackup(@Param('id') backupId: string): Promise<{ success: boolean; message: string }> {
    return await this.databaseBackupService.deleteBackup(backupId)
  }

  @Get('backups/:id/download')
  @ApiOperation({ summary: 'Télécharger une sauvegarde' })
  async downloadBackup(@Param('id') backupId: string): Promise<any> {
    return await this.databaseBackupService.downloadBackup(backupId)
  }

  @Post('fix-enum')
  @ApiOperation({ summary: 'Corriger l\'enum notifications_type_enum' })
  async fixNotificationTypeEnum(): Promise<{ success: boolean; message: string; data?: any }> {
    return await this.databaseEnumFixService.fixNotificationTypeEnum()
  }
}