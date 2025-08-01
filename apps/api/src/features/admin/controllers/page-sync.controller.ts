import { Controller, Get, Post, UseGuards } from '@nestjs/common'
import { Roles } from '../../../domains/auth/decorators/roles.decorator'
import { JwtAuthGuard } from '../../../domains/auth/security/guards/jwt-auth.guard'
import { RolesGuard } from '../../../domains/auth/security/guards/roles.guard'
import { PageSyncService } from '../../menu/services/page-sync.service'

@Controller('admin/page-sync')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class PageSyncController {
  constructor(private readonly pageSyncService: PageSyncService) {}

  @Post('sync')
  async syncPages() {
    try {
      const result = await this.pageSyncService.syncPages()
      return {
        success: true,
        message: 'Synchronisation terminée',
        data: result,
      }
    } catch (error) {
      return {
        success: false,
        message: 'Erreur lors de la synchronisation',
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      }
    }
  }

  @Get('status')
  async getSyncStatus() {
    try {
      // TODO: Implémenter la logique de statut
      return {
        success: true,
        data: {
          lastSync: new Date(),
          totalPages: 0,
          syncedPages: 0,
        },
      }
    } catch (error) {
      return {
        success: false,
        message: 'Erreur lors de la récupération du statut',
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      }
    }
  }
}
