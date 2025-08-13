import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { MenuSyncService } from './menu-sync.service'

@Injectable()
export class MenuStartupSyncService implements OnModuleInit {
  private readonly logger = new Logger(MenuStartupSyncService.name)

  constructor(
    private readonly menuSyncService: MenuSyncService,
    private readonly configService: ConfigService
  ) {}

  async onModuleInit() {
    // Synchronisation automatique au démarrage si activée
    const autoSyncEnabled = this.configService.get<boolean>('MENU_AUTO_SYNC_ON_STARTUP', true)
    
    if (!autoSyncEnabled) {
      this.logger.log('Synchronisation automatique du menu désactivée')
      return
    }

    try {
      this.logger.log('Vérification du besoin de synchronisation du menu au démarrage...')
      
      const needsSync = await this.menuSyncService.needsSync()
      
      if (needsSync) {
        this.logger.log('Synchronisation du menu nécessaire - démarrage en cours...')
        await this.menuSyncService.syncMenuFromSidebar()
        this.logger.log('Synchronisation du menu au démarrage terminée avec succès')
      } else {
        this.logger.log('Menu déjà synchronisé - aucune action nécessaire')
      }
    } catch (error) {
      this.logger.error('Erreur lors de la synchronisation du menu au démarrage:', error)
      // Ne pas arrêter l'application en cas d'erreur de sync
    }
  }
}