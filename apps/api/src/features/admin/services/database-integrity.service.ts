import { Injectable, Logger } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import type { DataSource } from 'typeorm'
import { getErrorMessage } from '../../../core/common/utils'

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
    @InjectDataSource('auth')
    private readonly _dataSource: DataSource
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
      'typeorm_metadata',
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

      const result = await this._dataSource.query(query)
      return result.map((row: Record<string, unknown>) => row.table_name)
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

      const result = await this._dataSource.query(query, [tableName])
      return result.map((row: Record<string, unknown>) => row.column_name)
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
          status: exists ? 'ok' : 'missing',
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
            status: 'extra',
          })
        }
      }

      // Calculer le résumé
      const summary = {
        total: tableDetails.length,
        ok: tableDetails.filter((t) => t.status === 'ok').length,
        missing: tableDetails.filter((t) => t.status === 'missing').length,
        extra: tableDetails.filter((t) => t.status === 'extra').length,
        errors: tableDetails.filter((t) => t.status === 'error').length,
      }

      const canSynchronize = summary.missing > 0 && summary.errors === 0

      this.logger.log(`Rapport d'intégrité généré: ${summary.ok}/${summary.total} tables OK`)

      return {
        expectedTables,
        actualTables,
        tableDetails,
        summary,
        canSynchronize,
      }
    } catch (error) {
      this.logger.error("Erreur lors de la génération du rapport d'intégrité:", error)
      throw error
    }
  }

  /**
   * Force la synchronisation de la base de données
   */
  async synchronizeDatabase(): Promise<{
    success: boolean
    message: string
    details?: Record<string, unknown>
  }> {
    try {
      this.logger.log('Début de la synchronisation de la base de données...')

      // Nettoyer les index problématiques avant la synchronisation
      await this.cleanupProblematicIndexes()

      // Activer la synchronisation temporairement
      await this._dataSource.synchronize(false) // false = ne pas supprimer les données existantes

      // Initialiser les paramètres système par défaut
      await this.initializeSystemDefaults()

      this.logger.log('Synchronisation terminée avec succès')

      return {
        success: true,
        message: 'Base de données synchronisée avec succès et paramètres système initialisés',
      }
    } catch (error) {
      this.logger.error('Erreur lors de la synchronisation:', error)

      // Si c'est une erreur d'index, essayer de la résoudre
      const errorMessage = error instanceof Error ? getErrorMessage(error) : getErrorMessage(error)
      if (errorMessage.includes('existe déjà') || errorMessage.includes('already exists')) {
        this.logger.log("Tentative de résolution des conflits d'index...")

        try {
          // Extraire le nom de l'index de l'erreur
          const indexMatch = errorMessage.match(/«\s*([^»]+)\s*»|"([^"]+)"/)
          if (indexMatch) {
            const indexName = indexMatch[1] || indexMatch[2]
            await this.dropIndexIfExists(indexName)

            // Réessayer la synchronisation
            await this._dataSource.synchronize(false)
            await this.initializeSystemDefaults()

            return {
              success: true,
              message: "Base de données synchronisée après résolution des conflits d'index",
            }
          }
        } catch (retryError) {
          this.logger.error('Erreur lors de la tentative de résolution:', retryError)
        }
      }

      return {
        success: false,
        message: 'Erreur lors de la synchronisation',
        details: { error: errorMessage },
      }
    }
  }

  /**
   * Nettoie les index problématiques
   */
  private async cleanupProblematicIndexes(): Promise<void> {
    try {
      const problematicIndexes: string[] = [
        // Pas d'index problématique actuellement
      ]

      for (const indexName of problematicIndexes) {
        await this.dropIndexIfExists(indexName)
      }
    } catch (error) {
      this.logger.error('Erreur lors du nettoyage des index:', error)
    }
  }

  /**
   * Supprime un index s'il existe
   */
  private async dropIndexIfExists(indexName: string): Promise<void> {
    try {
      await this._dataSource.query(`DROP INDEX IF EXISTS "${indexName}"`)
      this.logger.log(`Index ${indexName} supprimé s'il existait`)
    } catch (error) {
      this.logger.error(`Erreur lors de la suppression de l'index ${indexName}:`, error)
    }
  }

  /**
   * Initialise les paramètres système par défaut
   */
  private async initializeSystemDefaults(): Promise<void> {
    try {
      // Vérifier si les enums existent et les créer si nécessaire
      await this.ensureEnumsExist()

      // Créer les paramètres système par défaut
      await this.createDefaultSystemParameters()

      this.logger.log('Paramètres système par défaut initialisés')
    } catch (error) {
      this.logger.error("Erreur lors de l'initialisation des paramètres système:", error)
      throw error
    }
  }

  /**
   * S'assurer que tous les enums nécessaires existent
   */
  private async ensureEnumsExist(): Promise<void> {
    try {
      // Vérifier et créer l'enum notifications_type_enum
      const notifTypeEnumExists = await this._dataSource.query(`
        SELECT EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'notifications_type_enum'
        );
      `)

      if (notifTypeEnumExists[0]?.exists) {
        // Vérifier si 'info' existe dans l'enum
        const enumValues = await this._dataSource.query(`
          SELECT enumlabel 
          FROM pg_enum 
          WHERE enumtypid = (
            SELECT oid 
            FROM pg_type 
            WHERE typname = 'notifications_type_enum'
          )
        `)

        const hasInfo = enumValues.some((row: Record<string, unknown>) => row.enumlabel === 'info')
        if (!hasInfo) {
          await this._dataSource.query(`ALTER TYPE notifications_type_enum ADD VALUE 'info'`)
          this.logger.log('Valeur "info" ajoutée à l\'enum notifications_type_enum')
        }
      } else {
        await this._dataSource.query(`
          CREATE TYPE notifications_type_enum AS ENUM ('info', 'warning', 'error', 'success');
        `)
        this.logger.log('Enum notifications_type_enum créé')
      }
    } catch (error) {
      this.logger.error('Erreur lors de la vérification des enums:', error)
      throw error
    }
  }

  /**
   * Créer les paramètres système par défaut
   */
  private async createDefaultSystemParameters(): Promise<void> {
    try {
      // Vérifier si des paramètres système existent déjà
      const existingParams = await this._dataSource.query(`
        SELECT COUNT(*) as count FROM system_parameters
      `)

      if (existingParams[0]?.count > 0) {
        this.logger.log("Paramètres système déjà présents, pas d'initialisation nécessaire")
        return
      }

      // Créer les paramètres système par défaut
      const defaultParams = [
        {
          key: 'app_name',
          value: 'TopSteel ERP',
          description: "Nom de l'application",
          type: 'string',
          category: 'general',
        },
        {
          key: 'app_version',
          value: '1.0.0',
          description: "Version de l'application",
          type: 'string',
          category: 'general',
        },
        {
          key: 'maintenance_mode',
          value: 'false',
          description: 'Mode maintenance activé',
          type: 'boolean',
          category: 'system',
        },
        {
          key: 'notifications_enabled',
          value: 'true',
          description: 'Notifications activées',
          type: 'boolean',
          category: 'notifications',
        },
      ]

      for (const param of defaultParams) {
        await this._dataSource.query(
          `
          INSERT INTO system_parameters (key, value, description, type, category, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        `,
          [param.key, param.value, param.description, param.type, param.category]
        )
      }

      this.logger.log('Paramètres système par défaut créés')
    } catch (error) {
      this.logger.error('Erreur lors de la création des paramètres système par défaut:', error)
      throw error
    }
  }

  /**
   * Vérifie la connectivité de la base de données
   */
  async checkDatabaseConnection(): Promise<{
    connected: boolean
    version?: string
    error?: string
  }> {
    try {
      const result = await this._dataSource.query('SELECT version()')
      const version = result[0]?.version || 'Unknown'

      return {
        connected: true,
        version,
      }
    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? getErrorMessage(error) : getErrorMessage(error),
      }
    }
  }
}
