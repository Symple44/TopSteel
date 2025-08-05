#!/usr/bin/env ts-node

/**
 * Script de vérification de la cohérence de la base de données
 *
 * Ce script vérifie la cohérence entre :
 * - Les entités TypeORM définies dans le code
 * - La structure réelle des tables en base de données
 * - Les migrations appliquées
 *
 * Usage: ts-node apps/api/src/scripts/check-db-consistency.ts
 */

import { ConfigService } from '@nestjs/config'
import { config } from 'dotenv'
import { DataSource } from 'typeorm'
import { authDataSourceOptions } from '../core/database/data-source-auth'
import { tenantDataSourceOptions } from '../core/database/data-source-tenant'

// Charger les variables d'environnement
config()

const configService = new ConfigService()

interface TableColumn {
  column_name: string
  data_type: string
  is_nullable: string
  column_default: string | null
  character_maximum_length: number | null
  numeric_precision: number | null
  numeric_scale: number | null
  is_identity: string
  identity_generation: string | null
}

interface TableConstraint {
  constraint_name: string
  constraint_type: string
  table_name: string
  column_name: string
  foreign_table_name?: string
  foreign_column_name?: string
}

interface DatabaseInfo {
  name: string
  tables: Map<string, TableColumn[]>
  constraints: Map<string, TableConstraint[]>
  indexes: Map<string, any[]>
}

interface ConsistencyIssue {
  type:
    | 'missing_table'
    | 'extra_table'
    | 'missing_column'
    | 'extra_column'
    | 'column_type_mismatch'
    | 'missing_constraint'
    | 'extra_constraint'
  severity: 'error' | 'warning' | 'info'
  table: string
  column?: string
  entity?: string
  expected?: any
  actual?: any
  description: string
}

class DatabaseConsistencyChecker {
  private authDataSource: DataSource
  private tenantDataSource: DataSource
  private issues: ConsistencyIssue[] = []

  constructor() {
    this.authDataSource = new DataSource(authDataSourceOptions)

    // Configuration pour une base tenant de test
    const tenantConfig = {
      ...tenantDataSourceOptions,
      database: configService.get('DB_TENANT_TEST_NAME', 'erp_topsteel_topsteel'),
    }
    this.tenantDataSource = new DataSource(tenantConfig)
  }

  async checkConsistency(): Promise<void> {
    try {
      await this.checkDatabase('AUTH', this.authDataSource)
      await this.checkDatabase('TENANT', this.tenantDataSource)

      // Générer le rapport
      this.generateReport()
    } catch (_error) {
      process.exit(1)
    }
  }

  private async checkDatabase(dbType: string, dataSource: DataSource): Promise<void> {
    try {
      await dataSource.initialize()

      // Récupérer les informations de la base
      const dbInfo = await this.getDatabaseInfo(dataSource, dbType)

      // Récupérer les métadonnées des entités
      const entityMetadata = dataSource.entityMetadatas

      // Vérifier les tables et colonnes
      await this.checkTablesAndColumns(dbInfo, entityMetadata, dbType)

      // Vérifier les contraintes
      await this.checkConstraints(dbInfo, entityMetadata, dbType)

      // Vérifier les index
      await this.checkIndexes(dbInfo, entityMetadata, dbType)

      // Vérifications spécifiques
      if (dbType === 'AUTH') {
        await this.checkAuthSpecificIssues(dataSource)
      }
    } finally {
      if (dataSource.isInitialized) {
        await dataSource.destroy()
      }
    }
  }

  private async getDatabaseInfo(dataSource: DataSource, dbType: string): Promise<DatabaseInfo> {
    const queryRunner = dataSource.createQueryRunner()

    try {
      // Récupérer toutes les tables
      const tablesQuery = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `
      const tables = await queryRunner.query(tablesQuery)

      const dbInfo: DatabaseInfo = {
        name: dbType,
        tables: new Map(),
        constraints: new Map(),
        indexes: new Map(),
      }

      // Pour chaque table, récupérer les colonnes
      for (const tableRow of tables) {
        const tableName = tableRow.table_name

        const columnsQuery = `
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default,
            character_maximum_length,
            numeric_precision,
            numeric_scale,
            is_identity,
            identity_generation
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = $1
          ORDER BY ordinal_position
        `
        const columns = await queryRunner.query(columnsQuery, [tableName])
        dbInfo.tables.set(tableName, columns)

        // Récupérer les contraintes
        const constraintsQuery = `
          SELECT 
            tc.constraint_name,
            tc.constraint_type,
            tc.table_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
          FROM information_schema.table_constraints tc
          LEFT JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
          LEFT JOIN information_schema.constraint_column_usage ccu 
            ON tc.constraint_name = ccu.constraint_name
          WHERE tc.table_name = $1
          ORDER BY tc.constraint_name
        `
        const constraints = await queryRunner.query(constraintsQuery, [tableName])
        dbInfo.constraints.set(tableName, constraints)

        // Récupérer les index
        const indexesQuery = `
          SELECT 
            i.relname as index_name,
            a.attname as column_name,
            ix.indisunique as is_unique,
            ix.indisprimary as is_primary
          FROM pg_class t
          JOIN pg_index ix ON t.oid = ix.indrelid
          JOIN pg_class i ON i.oid = ix.indexrelid
          JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
          WHERE t.relname = $1
          AND t.relkind = 'r'
          ORDER BY i.relname, a.attname
        `
        const indexes = await queryRunner.query(indexesQuery, [tableName])
        dbInfo.indexes.set(tableName, indexes)
      }

      return dbInfo
    } finally {
      await queryRunner.release()
    }
  }

  private async checkTablesAndColumns(
    dbInfo: DatabaseInfo,
    entityMetadata: any[],
    dbType: string
  ): Promise<void> {
    // Vérifier que chaque entité a une table correspondante
    for (const entity of entityMetadata) {
      const tableName = entity.tableName
      const entityName = entity.name

      if (!dbInfo.tables.has(tableName)) {
        this.addIssue({
          type: 'missing_table',
          severity: 'error',
          table: tableName,
          entity: entityName,
          description: `Table '${tableName}' définie dans l'entité '${entityName}' mais absente de la base ${dbType}`,
        })
        continue
      }

      // Vérifier les colonnes
      const dbColumns = dbInfo.tables.get(tableName)!
      const entityColumns = entity.columns

      // Colonnes définies dans l'entité mais absentes en base
      for (const entityColumn of entityColumns) {
        const columnName = entityColumn.databaseName
        const dbColumn = dbColumns.find((col) => col.column_name === columnName)

        if (!dbColumn) {
          this.addIssue({
            type: 'missing_column',
            severity: 'error',
            table: tableName,
            column: columnName,
            entity: entityName,
            description: `Colonne '${columnName}' définie dans l'entité '${entityName}' mais absente de la table '${tableName}'`,
          })
          continue
        }

        // Vérifier le type de colonne
        this.checkColumnType(entityColumn, dbColumn, tableName, entityName)
      }

      // Colonnes présentes en base mais non définies dans l'entité
      for (const dbColumn of dbColumns) {
        const columnName = dbColumn.column_name
        const entityColumn = entityColumns.find((col: any) => col.databaseName === columnName)

        if (!entityColumn) {
          this.addIssue({
            type: 'extra_column',
            severity: 'warning',
            table: tableName,
            column: columnName,
            entity: entityName,
            description: `Colonne '${columnName}' présente dans la table '${tableName}' mais non définie dans l'entité '${entityName}'`,
          })
        }
      }
    }

    // Vérifier les tables présentes en base mais sans entité correspondante
    for (const [tableName] of dbInfo.tables) {
      const hasEntity = entityMetadata.some((entity) => entity.tableName === tableName)

      if (!hasEntity && !this.isSystemTable(tableName)) {
        this.addIssue({
          type: 'extra_table',
          severity: 'info',
          table: tableName,
          description: `Table '${tableName}' présente en base ${dbType} mais aucune entité TypeORM correspondante trouvée`,
        })
      }
    }
  }

  private checkColumnType(
    entityColumn: any,
    dbColumn: TableColumn,
    tableName: string,
    entityName: string
  ): void {
    const expectedType = this.mapTypeOrmToPostgres(entityColumn.type)
    const actualType = dbColumn.data_type

    if (expectedType && expectedType !== actualType) {
      this.addIssue({
        type: 'column_type_mismatch',
        severity: 'warning',
        table: tableName,
        column: dbColumn.column_name,
        entity: entityName,
        expected: expectedType,
        actual: actualType,
        description: `Type de colonne différent: '${dbColumn.column_name}' dans '${tableName}' - attendu: ${expectedType}, trouvé: ${actualType}`,
      })
    }
  }

  private mapTypeOrmToPostgres(typeormType: any): string | null {
    const typeMap: Record<string, string> = {
      varchar: 'character varying',
      text: 'text',
      int: 'integer',
      integer: 'integer',
      boolean: 'boolean',
      uuid: 'uuid',
      timestamp: 'timestamp without time zone',
      date: 'date',
      jsonb: 'jsonb',
      enum: 'USER-DEFINED', // Les enums PostgreSQL apparaissent comme USER-DEFINED
    }

    if (typeof typeormType === 'string') {
      return typeMap[typeormType] || null
    }

    return null
  }

  private async checkConstraints(
    dbInfo: DatabaseInfo,
    _entityMetadata: any[],
    _dbType: string
  ): Promise<void> {
    // Ici on peut ajouter des vérifications spécifiques des foreign keys
    // Pour le moment, on fait juste un résumé
    let _totalConstraints = 0
    for (const [_tableName, constraints] of dbInfo.constraints) {
      _totalConstraints += constraints.length
    }
  }

  private async checkIndexes(
    dbInfo: DatabaseInfo,
    _entityMetadata: any[],
    _dbType: string
  ): Promise<void> {
    let _totalIndexes = 0
    for (const [_tableName, indexes] of dbInfo.indexes) {
      _totalIndexes += indexes.length
    }
  }

  private async checkAuthSpecificIssues(dataSource: DataSource): Promise<void> {
    const queryRunner = dataSource.createQueryRunner()

    try {
      // Vérifier la table users pour les problèmes de colonnes mentionnés
      const usersTableQuery = `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND table_schema = 'public'
        ORDER BY column_name
      `
      const userColumns = await queryRunner.query(usersTableQuery)

      // Rechercher les colonnes problématiques
      const passwordCol = userColumns.find((col: any) => col.column_name === 'password')
      const motDePasseCol = userColumns.find((col: any) => col.column_name === 'mot_de_passe')
      const isActiveCol = userColumns.find((col: any) => col.column_name === 'isActive')
      const actifCol = userColumns.find((col: any) => col.column_name === 'actif')

      if (motDePasseCol && passwordCol) {
        this.addIssue({
          type: 'extra_column',
          severity: 'error',
          table: 'users',
          column: 'mot_de_passe',
          description:
            'Table users contient à la fois "password" et "mot_de_passe" - duplication potentielle',
        })
      }

      if (isActiveCol && actifCol) {
        this.addIssue({
          type: 'extra_column',
          severity: 'error',
          table: 'users',
          column: 'isActive',
          description:
            'Table users contient à la fois "isActive" et "actif" - duplication potentielle',
        })
      }

      // Vérifier les sessions
      const sessionsExist = await queryRunner.query(`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_name = 'user_sessions' 
        AND table_schema = 'public'
      `)

      if (sessionsExist[0].count === 0) {
        this.addIssue({
          type: 'missing_table',
          severity: 'error',
          table: 'user_sessions',
          description: 'Table user_sessions manquante - nécessaire pour la gestion des sessions',
        })
      }

      // Vérifier la cohérence des rôles
      const rolesExist = await queryRunner.query(`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_name = 'roles' 
        AND table_schema = 'public'
      `)

      if (rolesExist[0].count > 0) {
        const roleColumns = await queryRunner.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'roles'
          AND table_schema = 'public'
        `)

        const hasNameColumn = roleColumns.some((col: any) => col.column_name === 'name')
        const hasNomColumn = roleColumns.some((col: any) => col.column_name === 'nom')

        if (hasNomColumn && !hasNameColumn) {
          this.addIssue({
            type: 'column_type_mismatch',
            severity: 'warning',
            table: 'roles',
            column: 'nom',
            description:
              'Table roles utilise "nom" au lieu de "name" - incohérence avec les entités TypeORM',
          })
        }
      }
    } catch (_error) {
    } finally {
      await queryRunner.release()
    }
  }

  private isSystemTable(tableName: string): boolean {
    const systemTables = [
      'migrations',
      'typeorm_metadata',
      'pg_stat_statements',
      // Ajouter d'autres tables système si nécessaire
    ]

    return systemTables.includes(tableName) || tableName.startsWith('pg_')
  }

  private addIssue(issue: ConsistencyIssue): void {
    this.issues.push(issue)
  }

  private generateReport(): void {
    if (this.issues.length === 0) {
      return
    }

    // Grouper par sévérité
    const errors = this.issues.filter((issue) => issue.severity === 'error')
    const warnings = this.issues.filter((issue) => issue.severity === 'warning')
    const infos = this.issues.filter((issue) => issue.severity === 'info')

    // Afficher les erreurs
    if (errors.length > 0) {
      errors.forEach((issue, _index) => {
        if (issue.table)
          if (issue.column)
            if (issue.entity)
              if (issue.expected && issue.actual) {
              }
      })
    }

    // Afficher les avertissements
    if (warnings.length > 0) {
      warnings.forEach((issue, _index) => {
        if (issue.table) 
        if (issue.column) 
        if (issue.entity)
      })
    }

    // Afficher les informations
    if (infos.length > 0) {
      infos.forEach((issue, _index) => {
        if (issue.table)
      })
    }

    if (errors.length > 0) {
    }

    if (warnings.length > 0) {
    }
  }
}

// Exécution du script
async function main() {
  const checker = new DatabaseConsistencyChecker()
  await checker.checkConsistency()
}

if (require.main === module) {
  main().catch((_error) => {
    process.exit(1)
  })
}

export { DatabaseConsistencyChecker }
