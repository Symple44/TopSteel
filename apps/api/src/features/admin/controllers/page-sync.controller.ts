import { PrismaService } from '../../../core/database/prisma/prisma.service'
import { Controller, Get, Logger, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Public } from '../../../core/multi-tenant'

import { getErrorMessage } from '../../../core/common/utils'
import { CombinedSecurityGuard } from '../../../domains/auth/security/guards/combined-security.guard'
import { RequireSystemAdmin } from '../../../domains/auth/security/guards/enhanced-roles.guard'

import { PageSyncService } from '../../menu/services/page-sync.service'



@Controller('admin/page-sync')
@ApiTags('🔧 Admin - Page Synchronization')
@Public() // Bypass global TenantGuard - CombinedSecurityGuard handles JWT auth
@UseGuards(CombinedSecurityGuard)
@RequireSystemAdmin()
@ApiBearerAuth('JWT-auth')
export class PageSyncController {
  private readonly logger = new Logger(PageSyncController.name)

  constructor(
    private readonly pageSyncService: PageSyncService,
    private readonly prisma: PrismaService
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
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      this.logger.error('Erreur lors de la synchronisation:', error)
      return {
        success: false,
        message: 'Erreur lors de la synchronisation',
        error: error instanceof Error ? getErrorMessage(error) : 'Erreur inconnue',
        timestamp: new Date().toISOString(),
      }
    }
  }

  @Get('status')
  @ApiOperation({ summary: 'Obtenir le statut de synchronisation des pages' })
  @ApiResponse({ status: 200, description: 'Statut de synchronisation récupéré avec succès' })
  async getSyncStatus() {
    try {
      // Récupérer les statistiques réelles depuis la base de données
      const totalPages = await this.prisma.discoveredPage.count()
      const enabledPages = await this.prisma.discoveredPage.count({
        where: { isActive: true },
      })

      // Obtenir la dernière page mise à jour
      const lastUpdatedPage = await this.prisma.discoveredPage.findFirst({
        orderBy: { updatedAt: 'desc' },
      })

      // Compter les pages par catégorie
      const pagesByCategory = await this.prisma.discoveredPage.groupBy({
        by: ['category'],
        _count: true,
      })

      const categoryStats: Record<string, number> = {}
      for (const item of pagesByCategory) {
        categoryStats[item.category || 'uncategorized'] = item._count
      }

      return {
        success: true,
        data: {
          lastSync: lastUpdatedPage?.updatedAt || null,
          totalPages,
          enabledPages,
          visiblePages: enabledPages, // isActive is used for both enabled and visible
          disabledPages: totalPages - enabledPages,
          categoryStats,
          syncHealth: {
            status: totalPages > 0 ? 'healthy' : 'warning',
            message:
              totalPages > 0
                ? `${totalPages} pages découvertes`
                : 'Aucune page découverte - exécutez une synchronisation',
          },
        },
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      this.logger.error('Erreur lors de la récupération du statut:', error)
      return {
        success: false,
        message: 'Erreur lors de la récupération du statut',
        error: error instanceof Error ? getErrorMessage(error) : 'Erreur inconnue',
        timestamp: new Date().toISOString(),
      }
    }
  }
}

