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

  async cleanupDuplicateIndexes(): Promise<void> {
    try {
      this.logger.log('Recherche des index en double...')

      // Récupérer tous les index de la base de données
      const indexes = await this._dataSource.query(`
        SELECT 
          schemaname,
          tablename,
          indexname,
          indexdef
        FROM pg_indexes
        WHERE schemaname = 'public'
        ORDER BY tablename, indexname
      `)

      // Trouver les index qui semblent être des doublons TypeORM
      const typeormIndexes = indexes.filter(
        (idx: any) =>
          idx.indexname.startsWith('IDX_') ||
          idx.indexname.startsWith('UQ_') ||
          idx.indexname.startsWith('REL_')
      )

      this.logger.log(`Trouvé ${typeormIndexes.length} index TypeORM`)

      // Grouper par table pour identifier les potentiels doublons
      const indexByTable = new Map<string, any[]>()

      for (const idx of typeormIndexes) {
        if (!indexByTable.has(idx.tablename)) {
          indexByTable.set(idx.tablename, [])
        }
        indexByTable.get(idx.tablename)?.push(idx)
      }

      // Analyser chaque table
      for (const [tableName, tableIndexes] of indexByTable) {
        this.logger.log(`Analyse de la table ${tableName} (${tableIndexes.length} index)`)

        // Détecter les index avec des définitions similaires
        const indexDefs = new Map<string, string[]>()

        for (const idx of tableIndexes) {
          // Normaliser la définition de l'index pour comparaison
          const normalizedDef = idx.indexdef
            .replace(/INDEX\s+\S+/i, 'INDEX')
            .replace(/\s+/g, ' ')
            .trim()

          if (!indexDefs.has(normalizedDef)) {
            indexDefs.set(normalizedDef, [])
          }
          indexDefs.get(normalizedDef)?.push(idx.indexname)
        }

        // Identifier les doublons
        for (const [_def, names] of indexDefs) {
          if (names.length > 1) {
            this.logger.warn(`Index en double détectés sur ${tableName}: ${names.join(', ')}`)
          }
        }
      }
    } catch (error) {
      this.logger.error('Erreur lors du nettoyage des index:', error)
      throw error
    }
  }

  async dropIndexIfExists(indexName: string): Promise<boolean> {
    try {
      const result = await this._dataSource.query(
        `
        SELECT EXISTS (
          SELECT 1 FROM pg_indexes 
          WHERE schemaname = 'public' 
          AND indexname = $1
        );
      `,
        [indexName]
      )

      if (result[0]?.exists) {
        await this._dataSource.query(`DROP INDEX IF EXISTS ${indexName}`)
        this.logger.log(`Index ${indexName} supprimé`)
        return true
      }

      return false
    } catch (error) {
      this.logger.error(`Erreur lors de la suppression de l'index ${indexName}:`, error)
      return false
    }
  }

  async safeCreateIndex(tableName: string, indexName: string, columns: string[]): Promise<void> {
    try {
      // Vérifier si l'index existe déjà
      const exists = await this._dataSource.query(
        `
        SELECT EXISTS (
          SELECT 1 FROM pg_indexes 
          WHERE schemaname = 'public' 
          AND tablename = $1
          AND indexname = $2
        );
      `,
        [tableName, indexName]
      )

      if (exists[0]?.exists) {
        this.logger.log(`Index ${indexName} existe déjà sur ${tableName}`)
      } else {
        const columnList = columns.join(', ')
        await this._dataSource.query(`
          CREATE INDEX ${indexName} ON ${tableName} (${columnList})
        `)
        this.logger.log(`Index ${indexName} créé sur ${tableName}`)
      }
    } catch (error) {
      this.logger.error(`Erreur lors de la création de l'index ${indexName}:`, error)
      throw error
    }
  }

  async cleanupProblematicIndex(): Promise<void> {
    try {
      // Supprimer d'autres index potentiellement problématiques
      const problematicIndexes = [
        'IDX_97672ac88f789774dd47f7c8be3',
        'IDX_f0e1b7f3e5e1e7e2e5e1e7e2e5',
      ]

      for (const indexName of problematicIndexes) {
        await this.dropIndexIfExists(indexName)
      }

      this.logger.log('Nettoyage des index problématiques terminé')
    } catch (error) {
      this.logger.error('Erreur lors du nettoyage des index problématiques:', error)
      throw error
    }
  }
}
