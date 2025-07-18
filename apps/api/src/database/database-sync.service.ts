import { Injectable, Logger } from '@nestjs/common'
import { DataSource } from 'typeorm'
import { DatabasePreSyncService } from './database-pre-sync.service'

@Injectable()
export class DatabaseSyncService {
  private readonly logger = new Logger(DatabaseSyncService.name)
  private readonly isDevelopment = process.env.NODE_ENV !== 'production'

  constructor(
    private readonly dataSource: DataSource,
    private readonly preSyncService: DatabasePreSyncService
  ) {}

  /**
   * Réinitialise complètement la base de données (UNIQUEMENT en développement)
   */
  async resetDatabase(): Promise<void> {
    if (!this.isDevelopment) {
      this.logger.error('❌ Réinitialisation interdite en production!')
      throw new Error('Database reset is not allowed in production')
    }
    
    this.logger.warn('⚠️  RÉINITIALISATION COMPLÈTE DE LA BASE DE DONNÉES (MODE DÉVELOPPEMENT) ⚠️')
    
    try {
      // 1. Fermer toutes les connexions actives
      await this.closeActiveConnections()
      
      // 2. Supprimer toutes les tables dans l'ordre correct (gestion des FK)
      await this.dropAllTables()
      
      // 3. Supprimer tous les types ENUM
      await this.dropAllEnums()
      
      // 4. Supprimer toutes les fonctions et triggers
      await this.dropAllFunctionsAndTriggers()
      
      // 5. Nettoyer les séquences orphelines
      await this.cleanOrphanedSequences()
      
      this.logger.log('✅ Base de données réinitialisée avec succès')
    } catch (error) {
      this.logger.error('❌ Erreur lors de la réinitialisation:', error)
      throw error
    }
  }

  /**
   * Synchronise la base de données de manière sûre (préserve les données)
   */
  async safeSynchronize(): Promise<void> {
    this.logger.log('🔄 Début de la synchronisation sécurisée...')
    
    try {
      // 1. Vérifier l'état de la base de données
      const dbState = await this.checkDatabaseState()
      this.logger.log(`État de la base: ${dbState.tableCount} tables, ${dbState.indexCount} index`)
      
      // 2. Vérifier s'il y a des index spécifiquement problématiques
      const hasSpecificProblems = await this.hasSpecificProblematicIndexes()
      
      if (hasSpecificProblems) {
        this.logger.warn('⚠️  Index problématiques détectés, nettoyage ciblé nécessaire')
        await this.preSyncService.cleanBeforeSync()
      }
      
      // 3. Synchronisation normale TypeORM (préserve les données)
      this.logger.log('📊 Synchronisation des entités TypeORM...')
      await this.dataSource.synchronize(false) // false = pas de drop des colonnes
      
      // 4. Vérifier la cohérence après synchronisation
      await this.verifyDatabaseIntegrity()
      
      this.logger.log('✅ Synchronisation terminée avec succès')
    } catch (error) {
      this.logger.error('❌ Erreur lors de la synchronisation:', error)
      
      // En cas d'erreur spécifique d'index, nettoyer et réessayer
      if (error instanceof Error && error.message?.includes('existe déjà')) {
        this.logger.warn('🔧 Nettoyage des index problématiques et nouvelle tentative...')
        await this.preSyncService.cleanBeforeSync()
        await this.dataSource.synchronize(false)
        this.logger.log('✅ Synchronisation terminée après nettoyage')
      } else {
        // En développement seulement, proposer une réinitialisation
        if (this.isDevelopment) {
          this.logger.warn('🔧 Erreur persistante. Utilisez npm run db:reset pour réinitialiser en développement.')
        }
        throw error
      }
    }
  }

  /**
   * Vérifie s'il y a des index spécifiquement problématiques
   */
  private async hasSpecificProblematicIndexes(): Promise<boolean> {
    const problematicIndexes = [
      'IDX_e4a5a4bcd15ca9eedd81916638',
      'IDX_97672ac88f789774dd47f7c8be3'
    ]
    
    for (const indexName of problematicIndexes) {
      const exists = await this.dataSource.query(`
        SELECT 1 FROM pg_indexes 
        WHERE indexname = $1 AND schemaname = 'public'
      `, [indexName])
      
      if (exists.length > 0) {
        this.logger.warn(`⚠️  Index problématique détecté: ${indexName}`)
        return true
      }
    }
    
    return false
  }

  /**
   * Vérifie l'état de la base de données
   */
  private async checkDatabaseState(): Promise<{
    tableCount: number
    indexCount: number
    hasOrphanedIndexes: boolean
    hasConflicts: boolean
  }> {
    const tables = await this.dataSource.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `)
    
    const indexes = await this.dataSource.query(`
      SELECT COUNT(*) as count 
      FROM pg_indexes 
      WHERE schemaname = 'public'
    `)
    
    // Chercher les index orphelins (index sans table correspondante)
    const orphanedIndexes = await this.dataSource.query(`
      SELECT i.indexname 
      FROM pg_indexes i
      LEFT JOIN information_schema.tables t 
        ON i.tablename = t.table_name 
        AND t.table_schema = 'public'
      WHERE i.schemaname = 'public' 
      AND t.table_name IS NULL
    `)
    
    // Chercher les conflits potentiels
    const conflicts = await this.dataSource.query(`
      SELECT COUNT(*) as count
      FROM pg_indexes i
      JOIN pg_class c ON i.tablename = c.relname
      JOIN pg_namespace n ON c.relnamespace = n.oid
      WHERE i.schemaname = 'public'
      AND n.nspname = 'public'
      AND i.indexname LIKE 'IDX_%'
      AND length(i.indexname) BETWEEN 30 AND 34
      AND c.relkind = 'r'
    `)
    
    return {
      tableCount: parseInt(tables[0]?.count || '0'),
      indexCount: parseInt(indexes[0]?.count || '0'),
      hasOrphanedIndexes: orphanedIndexes.length > 0,
      hasConflicts: parseInt(conflicts[0]?.count || '0') > 20 // Plus de 20 index auto-générés = vraiment suspect
    }
  }

  /**
   * Ferme toutes les connexions actives à la base
   */
  private async closeActiveConnections(): Promise<void> {
    const dbName = this.dataSource.options.database
    
    try {
      await this.dataSource.query(`
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = $1 
        AND pid <> pg_backend_pid()
      `, [dbName])
      
      this.logger.log('Connexions actives fermées')
    } catch (error) {
      this.logger.warn('Impossible de fermer les connexions:', error instanceof Error ? error.message : String(error))
    }
  }

  /**
   * Supprime toutes les tables en gérant les contraintes FK
   */
  private async dropAllTables(): Promise<void> {
    try {
      // Désactiver temporairement les contraintes FK
      await this.dataSource.query('SET session_replication_role = replica')
      
      // Récupérer toutes les tables
      const tables = await this.dataSource.query(`
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY tablename
      `)
      
      // Supprimer chaque table
      for (const { tablename } of tables) {
        try {
          await this.dataSource.query(`DROP TABLE IF EXISTS "${tablename}" CASCADE`)
          this.logger.log(`Table ${tablename} supprimée`)
        } catch (error) {
          this.logger.warn(`Impossible de supprimer ${tablename}:`, error instanceof Error ? error.message : String(error))
        }
      }
      
      // Réactiver les contraintes FK
      await this.dataSource.query('SET session_replication_role = DEFAULT')
      
      this.logger.log('Toutes les tables ont été supprimées')
    } catch (error) {
      this.logger.error('Erreur lors de la suppression des tables:', error)
      throw error
    }
  }

  /**
   * Supprime tous les types ENUM
   */
  private async dropAllEnums(): Promise<void> {
    try {
      const enums = await this.dataSource.query(`
        SELECT typname 
        FROM pg_type 
        WHERE typtype = 'e' 
        AND typnamespace = (
          SELECT oid FROM pg_namespace WHERE nspname = 'public'
        )
      `)
      
      for (const { typname } of enums) {
        try {
          await this.dataSource.query(`DROP TYPE IF EXISTS "${typname}" CASCADE`)
          this.logger.log(`Type ENUM ${typname} supprimé`)
        } catch (error) {
          this.logger.warn(`Impossible de supprimer l'enum ${typname}:`, error instanceof Error ? error.message : String(error))
        }
      }
    } catch (error) {
      this.logger.error('Erreur lors de la suppression des enums:', error)
    }
  }

  /**
   * Supprime toutes les fonctions et triggers
   */
  private async dropAllFunctionsAndTriggers(): Promise<void> {
    try {
      // Supprimer les triggers
      const triggers = await this.dataSource.query(`
        SELECT DISTINCT trigger_name, event_object_table
        FROM information_schema.triggers
        WHERE trigger_schema = 'public'
      `)
      
      for (const { trigger_name, event_object_table } of triggers) {
        try {
          await this.dataSource.query(
            `DROP TRIGGER IF EXISTS "${trigger_name}" ON "${event_object_table}" CASCADE`
          )
          this.logger.log(`Trigger ${trigger_name} supprimé`)
        } catch (error) {
          this.logger.warn(`Impossible de supprimer le trigger ${trigger_name}:`, error instanceof Error ? error.message : String(error))
        }
      }
      
      // Supprimer les fonctions
      const functions = await this.dataSource.query(`
        SELECT routine_name 
        FROM information_schema.routines
        WHERE routine_schema = 'public'
        AND routine_type = 'FUNCTION'
      `)
      
      for (const { routine_name } of functions) {
        try {
          await this.dataSource.query(`DROP FUNCTION IF EXISTS "${routine_name}" CASCADE`)
          this.logger.log(`Fonction ${routine_name} supprimée`)
        } catch (error) {
          this.logger.warn(`Impossible de supprimer la fonction ${routine_name}:`, error instanceof Error ? error.message : String(error))
        }
      }
    } catch (error) {
      this.logger.error('Erreur lors de la suppression des fonctions/triggers:', error)
    }
  }

  /**
   * Nettoie les séquences orphelines
   */
  private async cleanOrphanedSequences(): Promise<void> {
    try {
      const sequences = await this.dataSource.query(`
        SELECT sequence_name
        FROM information_schema.sequences
        WHERE sequence_schema = 'public'
      `)
      
      for (const { sequence_name } of sequences) {
        try {
          await this.dataSource.query(`DROP SEQUENCE IF EXISTS "${sequence_name}" CASCADE`)
          this.logger.log(`Séquence ${sequence_name} supprimée`)
        } catch (error) {
          this.logger.warn(`Impossible de supprimer la séquence ${sequence_name}:`, error instanceof Error ? error.message : String(error))
        }
      }
    } catch (error) {
      this.logger.error('Erreur lors du nettoyage des séquences:', error)
    }
  }

  /**
   * Nettoie les index problématiques avant la synchronisation
   */
  private async cleanProblematicIndexes(): Promise<void> {
    try {
      // D'abord, supprimer spécifiquement l'index problématique connu
      const specificIndexes = [
        'IDX_e4a5a4bcd15ca9eedd81916638',
        'IDX_97672ac88f789774dd47f7c8be3'
      ]
      
      for (const indexName of specificIndexes) {
        try {
          await this.dataSource.query(`DROP INDEX IF EXISTS "${indexName}" CASCADE`)
          this.logger.log(`Index spécifique ${indexName} supprimé`)
        } catch (error) {
          // Ignorer si l'index n'existe pas
        }
      }
      
      // Ensuite, supprimer tous les index auto-générés par TypeORM
      const autoGeneratedIndexes = await this.dataSource.query(`
        SELECT i.indexname, i.tablename
        FROM pg_indexes i
        JOIN pg_class c ON i.tablename = c.relname
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE i.schemaname = 'public'
        AND n.nspname = 'public'
        AND i.indexname LIKE 'IDX_%'
        AND length(i.indexname) BETWEEN 30 AND 34
        AND c.relkind = 'r'
      `)
      
      for (const { indexname } of autoGeneratedIndexes) {
        try {
          await this.dataSource.query(`DROP INDEX IF EXISTS "${indexname}" CASCADE`)
          this.logger.log(`Index auto-généré ${indexname} supprimé`)
        } catch (error) {
          this.logger.warn(`Impossible de supprimer l'index ${indexname}:`, error instanceof Error ? error.message : String(error))
        }
      }
      
      // Supprimer les contraintes uniques orphelines (seulement tables utilisateur)
      const orphanedConstraints = await this.dataSource.query(`
        SELECT c.conname, c.conrelid::regclass as table_name
        FROM pg_constraint c
        JOIN pg_class cl ON c.conrelid = cl.oid
        JOIN pg_namespace n ON cl.relnamespace = n.oid
        WHERE c.contype = 'u'
        AND n.nspname = 'public'
        AND cl.relkind = 'r'
        AND NOT EXISTS (
          SELECT 1 
          FROM information_schema.tables t
          WHERE t.table_name = cl.relname
          AND t.table_schema = 'public'
        )
      `)
      
      for (const { conname, table_name } of orphanedConstraints) {
        try {
          await this.dataSource.query(
            `ALTER TABLE IF EXISTS ${table_name} DROP CONSTRAINT IF EXISTS "${conname}" CASCADE`
          )
          this.logger.log(`Contrainte orpheline ${conname} supprimée`)
        } catch (error) {
          this.logger.warn(`Impossible de supprimer la contrainte ${conname}:`, error instanceof Error ? error.message : String(error))
        }
      }
    } catch (error) {
      this.logger.error('Erreur lors du nettoyage des index:', error)
    }
  }

  /**
   * Vérifie l'intégrité de la base après synchronisation
   */
  private async verifyDatabaseIntegrity(): Promise<void> {
    try {
      // Vérifier les contraintes FK
      const invalidFks = await this.dataSource.query(`
        SELECT conname, conrelid::regclass as table_name
        FROM pg_constraint
        WHERE contype = 'f'
        AND NOT convalidated
      `)
      
      if (invalidFks.length > 0) {
        this.logger.warn(`⚠️  ${invalidFks.length} contraintes FK invalides détectées`)
      }
      
      // Vérifier les index dupliqués
      const duplicateIndexes = await this.dataSource.query(`
        SELECT tablename, indexname, COUNT(*) as count
        FROM pg_indexes
        WHERE schemaname = 'public'
        GROUP BY tablename, indexname
        HAVING COUNT(*) > 1
      `)
      
      if (duplicateIndexes.length > 0) {
        this.logger.warn(`⚠️  ${duplicateIndexes.length} index dupliqués détectés`)
      }
      
      // Compter les entités créées
      const tableCount = await this.dataSource.query(`
        SELECT COUNT(*) as count
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      `)
      
      this.logger.log(`✅ Intégrité vérifiée: ${tableCount[0].count} tables créées`)
    } catch (error) {
      this.logger.error('Erreur lors de la vérification d\'intégrité:', error)
    }
  }
}