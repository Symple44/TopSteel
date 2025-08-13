import { Controller, Get, HttpStatus, Logger, Post } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import type { MenuSyncService } from '../services/menu-sync.service'

@ApiTags('Admin - Menu Sync')
@Controller('admin/menu-sync')
export class MenuSyncController {
  private readonly logger = new Logger(MenuSyncController.name)

  constructor(private readonly menuSyncService: MenuSyncService) {}

  @Post('sync')
  @ApiOperation({
    summary: 'Synchroniser le menu depuis le sidebar',
    description:
      'Force la synchronisation de la structure de menu du sidebar vers la base de données',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Menu synchronisé avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        configurationId: { type: 'string' },
        itemsCount: { type: 'number' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Erreur lors de la synchronisation',
  })
  async syncMenu() {
    try {
      this.logger.log('Démarrage de la synchronisation manuelle du menu')
      const configuration = await this.menuSyncService.syncMenuFromSidebar()

      const itemsCount = await this.menuSyncService.itemRepository.count({
        where: { configId: configuration.id },
      })

      return {
        success: true,
        message: 'Menu synchronisé avec succès',
        configurationId: configuration.id,
        itemsCount,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      this.logger.error('Erreur lors de la synchronisation du menu', error)
      throw error
    }
  }

  @Get('status')
  @ApiOperation({
    summary: 'Vérifier le statut de synchronisation',
    description: 'Vérifie si une synchronisation est nécessaire',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statut de synchronisation',
    schema: {
      type: 'object',
      properties: {
        needsSync: { type: 'boolean' },
        lastSyncDate: { type: 'string', nullable: true },
        currentItemsCount: { type: 'number' },
        expectedItemsCount: { type: 'number' },
        systemConfigExists: { type: 'boolean' },
      },
    },
  })
  async getSyncStatus() {
    try {
      const needsSync = await this.menuSyncService.needsSync()

      // Récupérer la configuration système pour obtenir la date de dernière sync
      const systemConfig = await this.menuSyncService.configRepository.findOne({
        where: { name: 'Configuration Système Auto-Sync', isSystem: true },
        relations: ['items'],
      })

      const currentItemsCount = systemConfig?.items?.length || 0
      const sidebarNavigation = this.menuSyncService.getSidebarNavigationStructure()
      const expectedItemsCount = this.menuSyncService.countTotalItems(sidebarNavigation)

      return {
        needsSync,
        lastSyncDate: systemConfig?.updatedAt?.toISOString() || null,
        currentItemsCount,
        expectedItemsCount,
        systemConfigExists: !!systemConfig,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      this.logger.error('Erreur lors de la vérification du statut', error)
      return {
        needsSync: true,
        lastSyncDate: null,
        currentItemsCount: 0,
        expectedItemsCount: 0,
        systemConfigExists: false,
        error: 'Erreur lors de la vérification du statut',
        timestamp: new Date().toISOString(),
      }
    }
  }

  @Post('auto-sync')
  @ApiOperation({
    summary: 'Synchronisation automatique',
    description:
      'Lance la synchronisation automatique (vérifie si nécessaire avant de synchroniser)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Résultat de la synchronisation automatique',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        synchronized: { type: 'boolean' },
        message: { type: 'string' },
        configurationId: { type: 'string', nullable: true },
      },
    },
  })
  async autoSync() {
    try {
      const needsSync = await this.menuSyncService.needsSync()

      if (!needsSync) {
        return {
          success: true,
          synchronized: false,
          message: 'Synchronisation non nécessaire, menu déjà à jour',
          configurationId: null,
          timestamp: new Date().toISOString(),
        }
      }

      const syncResult = await this.menuSyncService.autoSync()

      if (syncResult) {
        const systemConfig = await this.menuSyncService.configRepository.findOne({
          where: { name: 'Configuration Système Auto-Sync', isSystem: true },
        })

        return {
          success: true,
          synchronized: true,
          message: 'Menu synchronisé automatiquement avec succès',
          configurationId: systemConfig?.id || null,
          timestamp: new Date().toISOString(),
        }
      } else {
        return {
          success: false,
          synchronized: false,
          message: 'Échec de la synchronisation automatique',
          configurationId: null,
          timestamp: new Date().toISOString(),
        }
      }
    } catch (error) {
      this.logger.error('Erreur lors de la synchronisation automatique', error)
      return {
        success: false,
        synchronized: false,
        message: 'Erreur lors de la synchronisation automatique',
        configurationId: null,
        error: error.message,
        timestamp: new Date().toISOString(),
      }
    }
  }
}
