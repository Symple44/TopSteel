import { Injectable, Logger } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'

export interface TableInfo {
  name: string
  expected: boolean
  exists: boolean
  columns?: string[]
  status: 'ok' | 'missing' | 'extra' | 'error'
}

export interface DatabaseIntegrityReport {
  expectedTables: string[]
  actualTables: string[]
  tableDetails: TableInfo[]
  summary: {
    total: number
    ok: number
    missing: number
    extra: number
    errors: number
  }
  canSynchronize: boolean
}

@Injectable()
export class DatabaseIntegrityService {
  private readonly logger = new Logger(DatabaseIntegrityService.name)

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Tables attendues dans le système (basées sur les entités)
   */
  private getExpectedTables(): string[] {
    return [
      // Tables système
      'users',
      'user_settings',
      'user_menu_preferences',
      'system_settings',
      'system_parameters',
      
      // Tables métier principales
      'clients',
      'fournisseurs',
      'machines',
      'notifications',
      'production',
      'stocks',
      'chutes',
      'maintenance',
      'materiaux',
      'planning',
      'qualite',
      'tracabilite',
      'devis',
      'ligne_devis',
      'facturation',
      'produits',
      'commandes',
      'ordre_fabrication',
      'operations',
      'projets',
      'documents',
      
      // Tables de menu (nouvelles)
      'menu_configurations',
      'menu_items',
      'menu_item_permissions',
      'menu_item_roles',
      'user_menu_preferences_old',
      'user_menu_item_preferences',
      
      // Tables de notifications
      'notification_events',
      'notification_rules',
      'notification_rule_executions',
      
      // Tables d'authentification
      'roles',
      'permissions',
      'user_roles',
      'role_permissions',
      
      // Tables TypeORM
      'migrations',
      'typeorm_metadata'
    ]
  }

  /**
   * Récupère les tables existantes dans la base de données
   */
  async getActualTables(): Promise<string[]> {
    try {
      const query = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `
      
      const result = await this.dataSource.query(query)
      return result.map((row: any) => row.table_name)
    } catch (error) {
      this.logger.error('Erreur lors de la récupération des tables:', error)
      return []
    }
  }

  /**
   * Récupère les colonnes d'une table
   */
  async getTableColumns(tableName: string): Promise<string[]> {
    try {
      const query = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = $1
        ORDER BY ordinal_position
      `
      
      const result = await this.dataSource.query(query, [tableName])
      return result.map((row: any) => row.column_name)
    } catch (error) {
      this.logger.error(`Erreur lors de la récupération des colonnes pour ${tableName}:`, error)
      return []
    }
  }

  /**
   * Génère un rapport d'intégrité complet
   */
  async generateIntegrityReport(): Promise<DatabaseIntegrityReport> {
    try {
      const expectedTables = this.getExpectedTables()
      const actualTables = await this.getActualTables()
      
      const tableDetails: TableInfo[] = []
      
      // Analyser les tables attendues
      for (const expectedTable of expectedTables) {
        const exists = actualTables.includes(expectedTable)
        const columns = exists ? await this.getTableColumns(expectedTable) : []
        
        tableDetails.push({
          name: expectedTable,
          expected: true,
          exists,
          columns,
          status: exists ? 'ok' : 'missing'
        })
      }
      
      // Analyser les tables supplémentaires
      for (const actualTable of actualTables) {
        if (!expectedTables.includes(actualTable)) {
          const columns = await this.getTableColumns(actualTable)
          
          tableDetails.push({
            name: actualTable,
            expected: false,
            exists: true,
            columns,
            status: 'extra'
          })
        }
      }
      
      // Calculer le résumé
      const summary = {
        total: tableDetails.length,
        ok: tableDetails.filter(t => t.status === 'ok').length,
        missing: tableDetails.filter(t => t.status === 'missing').length,
        extra: tableDetails.filter(t => t.status === 'extra').length,
        errors: tableDetails.filter(t => t.status === 'error').length
      }
      
      const canSynchronize = summary.missing > 0 && summary.errors === 0
      
      this.logger.log(`Rapport d'intégrité généré: ${summary.ok}/${summary.total} tables OK`)
      
      return {
        expectedTables,
        actualTables,
        tableDetails,
        summary,
        canSynchronize
      }
    } catch (error) {
      this.logger.error('Erreur lors de la génération du rapport d\'intégrité:', error)
      throw error
    }
  }

  /**
   * Force la synchronisation de la base de données
   */
  async synchronizeDatabase(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      this.logger.log('Début de la synchronisation de la base de données...')
      
      // Activer la synchronisation temporairement
      await this.dataSource.synchronize(false) // false = ne pas supprimer les données existantes
      
      this.logger.log('Synchronisation terminée avec succès')
      
      return {
        success: true,
        message: 'Base de données synchronisée avec succès'
      }
    } catch (error) {
      this.logger.error('Erreur lors de la synchronisation:', error)
      
      return {
        success: false,
        message: 'Erreur lors de la synchronisation',
        details: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * Vérifie la connectivité de la base de données
   */
  async checkDatabaseConnection(): Promise<{ connected: boolean; version?: string; error?: string }> {
    try {
      const result = await this.dataSource.query('SELECT version()')
      const version = result[0]?.version || 'Unknown'
      
      return {
        connected: true,
        version
      }
    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * Exécute une migration spécifique
   */
  async runMigration(migrationName?: string): Promise<{ success: boolean; message: string; migrations?: string[] }> {
    try {
      // Récupérer les migrations en attente
      const pendingMigrations = await this.dataSource.showMigrations()
      
      // showMigrations retourne boolean, pas un array
      if (!pendingMigrations) {
        return {
          success: true,
          message: 'Aucune migration en attente',
          migrations: []
        }
      }

      await this.dataSource.runMigrations()
      
      return {
        success: true,
        message: 'Migrations exécutées avec succès',
        migrations: ['migrations exécutées']
      }
    } catch (error) {
      this.logger.error('Erreur lors de l\'exécution des migrations:', error)
      
      return {
        success: false,
        message: 'Erreur lors de l\'exécution des migrations: ' + (error instanceof Error ? error.message : String(error))
      }
    }
  }
}