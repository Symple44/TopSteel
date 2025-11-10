import { Injectable, Logger, type OnModuleInit } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import type { DataSource } from 'typeorm'
import { DatabaseSyncService } from '../database/database-sync.service'
import { DatabaseInitBaseService } from './database-init/database-init-base.service'

@Injectable()
export class DatabaseInitService extends DatabaseInitBaseService implements OnModuleInit {
  protected readonly logger = new Logger(DatabaseInitService.name)

  constructor(
    @InjectDataSource()
    dataSource: DataSource,
    private readonly databaseSyncService: DatabaseSyncService
  ) {
    super(dataSource)
  }

  async onModuleInit() {
    try {
      this.logger.log('Initialisation de la base de données...')

      // Vérifier la connexion
      const isConnected = await this.checkConnection()
      if (!isConnected) {
        this.logger.error('Impossible de se connecter à la base de données')
        return
      }

      // Utiliser le nouveau service de synchronisation
      await this.databaseSyncService.safeSynchronize()

      // TEMPORAIREMENT DÉSACTIVÉ - Les scripts d'initialisation doivent être corrigés
      // pour correspondre aux entités TypeORM réelles
      /*
      // Initialiser les enums
      await this.initializeEnums()
      
      // Initialiser les modules, rôles, permissions et groupes
      await this.initializeModules()
      await this.initializePermissions()
      await this.initializeRoles()
      await this._initializeRolePermissions()
      await this.initializeGroups()
      
      // Initialiser les paramètres système
      await this.initializeSystemParameters()
      
      // Initialiser les données par défaut (menus)
      await this._initializeDefaultData()
      
      // Créer un utilisateur administrateur par défaut
      await this._createDefaultAdminUser()
      */

      this.logger.log('✅ Synchronisation de la base de données terminée avec succès')
      this.logger.warn("⚠️  Scripts d'initialisation temporairement désactivés")
      this.logger.warn('⚠️  Il faut corriger les scripts pour correspondre aux entités TypeORM')
    } catch (error) {
      this.logger.error("❌ Erreur lors de l'initialisation de la base de données:", error)
      throw error
    }
  }
}
