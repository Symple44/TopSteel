import { Injectable, Logger } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import type { DataSource } from 'typeorm'

@Injectable()
export class DatabaseCleanupService {
  private readonly logger = new Logger(DatabaseCleanupService.name)

  constructor(
    @InjectDataSource()
    private readonly _dataSource: DataSource
  ) {}

  async cleanupBeforeSync(): Promise<void> {
    try {
      this.logger.log('🧹 Nettoyage de la base de données avant synchronisation...')

      // Nettoyer les index problématiques
      await this.cleanProblematicIndexes()

      // Nettoyer les tables orphelines
      await this.cleanOrphanedTables()

      this.logger.log('✅ Nettoyage terminé')
    } catch (error) {
      this.logger.error('❌ Erreur lors du nettoyage:', error)
    }
  }

  private async cleanProblematicIndexes(): Promise<void> {
    const problematicIndexes = ['IDX_97672ac88f789774dd47f7c8be3', 'IDX_e4a5a4bcd15ca9eedd81916638']

    for (const indexName of problematicIndexes) {
      try {
        await this._dataSource.query(`DROP INDEX IF EXISTS "${indexName}" CASCADE`)
        this.logger.log(`🗑️ Index ${indexName} supprimé`)
      } catch (_error) {
        // Ignorer les erreurs, l'index n'existe peut-être pas
      }
    }
  }

  private async cleanOrphanedTables(): Promise<void> {
    try {
      // Supprimer les tables qui pourraient causer des conflits
      const tablesToClean = ['user_menu_preferences']

      for (const tableName of tablesToClean) {
        try {
          await this._dataSource.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE`)
          this.logger.log(`🗑️ Table ${tableName} supprimée`)
        } catch (_error) {
          // Ignorer les erreurs
        }
      }
    } catch (error) {
      this.logger.error('Erreur lors du nettoyage des tables:', error)
    }
  }
}
