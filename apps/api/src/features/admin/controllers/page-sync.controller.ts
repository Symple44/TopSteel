import { Controller, Get, Post, UseGuards, Logger } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { InjectRepository } from '@nestjs/typeorm'
import type { Repository } from 'typeorm'
import { CombinedSecurityGuard } from '../../../domains/auth/security/guards/combined-security.guard'
import { RequireSystemAdmin } from '../../../domains/auth/security/guards/enhanced-roles.guard'
import type { PageSyncService } from '../../menu/services/page-sync.service'
import { DiscoveredPage } from '../../menu/entities/discovered-page.entity'

@Controller('admin/page-sync')
@ApiTags('🔧 Admin - Page Synchronization')
@UseGuards(CombinedSecurityGuard)
@RequireSystemAdmin()
@ApiBearerAuth('JWT-auth')
export class PageSyncController {
  private readonly logger = new Logger(PageSyncController.name)
  
  constructor(
    private readonly pageSyncService: PageSyncService,
    @InjectRepository(DiscoveredPage, 'auth')
    private readonly discoveredPageRepository: Repository<DiscoveredPage>
  ) {}

  @Post('sync')
  @ApiOperation({ summary: 'Synchroniser les pages découvertes' })
  @ApiResponse({ status: 200, description: 'Synchronisation réussie' })
  @ApiResponse({ status: 500, description: 'Erreur lors de la synchronisation' })
  async syncPages() {
    try {
      this.logger.log('Début de la synchronisation des pages...')
      const result = await this.pageSyncService.syncPages()
      
      this.logger.log(
        `Synchronisation terminée: ${result.synced}/${result.discovered} pages synchronisées`
      )
      
      return {
        success: true,
        message: 'Synchronisation terminée',
        data: result,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      this.logger.error('Erreur lors de la synchronisation:', error)
      return {
        success: false,
        message: 'Erreur lors de la synchronisation',
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        timestamp: new Date().toISOString()
      }
    }
  }

  @Get('status')
  @ApiOperation({ summary: 'Obtenir le statut de synchronisation des pages' })
  @ApiResponse({ status: 200, description: 'Statut de synchronisation récupéré avec succès' })
  async getSyncStatus() {
    try {
      // Récupérer les statistiques réelles depuis la base de données
      const totalPages = await this.discoveredPageRepository.count()
      const enabledPages = await this.discoveredPageRepository.count({ 
        where: { isEnabled: true } 
      })
      const visiblePages = await this.discoveredPageRepository.count({ 
        where: { isVisible: true } 
      })
      
      // Obtenir la dernière page mise à jour
      const lastUpdatedPage = await this.discoveredPageRepository.findOne({
        order: { updatedAt: 'DESC' }
      })
      
      // Compter les pages par catégorie
      const pagesByCategory = await this.discoveredPageRepository
        .createQueryBuilder('page')
        .select('page.category, COUNT(*) as count')
        .groupBy('page.category')
        .getRawMany()
      
      const categoryStats = pagesByCategory.reduce((acc, item) => {
        acc[item.category || 'uncategorized'] = parseInt(item.count, 10)
        return acc
      }, {} as Record<string, number>)
      
      return {
        success: true,
        data: {
          lastSync: lastUpdatedPage?.updatedAt || null,
          totalPages,
          enabledPages,
          visiblePages,
          disabledPages: totalPages - enabledPages,
          categoryStats,
          syncHealth: {
            status: totalPages > 0 ? 'healthy' : 'warning',
            message: totalPages > 0 
              ? `${totalPages} pages découvertes` 
              : 'Aucune page découverte - exécutez une synchronisation'
          }
        },
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      this.logger.error('Erreur lors de la récupération du statut:', error)
      return {
        success: false,
        message: 'Erreur lors de la récupération du statut',
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        timestamp: new Date().toISOString()
      }
    }
  }
}
