#!/usr/bin/env ts-node

/**
 * Rapport détaillé de cohérence de la base de données
 *
 * Ce script génère un rapport JSON détaillé avec toutes les informations
 * de cohérence entre TypeORM et la base de données PostgreSQL
 */

import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { ConfigService } from '@nestjs/config'
import { config } from 'dotenv'
import { DataSource } from 'typeorm'
import { authDataSourceOptions } from '../core/database/data-source-auth'
import { tenantDataSourceOptions } from '../core/database/data-source-tenant'

config()

interface DetailedReport {
  timestamp: string
  databases: {
    auth: DatabaseReport
    tenant: DatabaseReport
  }
  summary: {
    totalIssues: number
    criticalIssues: number
    warnings: number
    infos: number
  }
  recommendations: string[]
}

interface DatabaseReport {
  name: string
  connectionString: string
  tables: TableReport[]
  migrations: MigrationInfo[]
  issues: ConsistencyIssue[]
  statistics: DatabaseStats
}

interface TableReport {
  name: string
  hasEntity: boolean
  entityName?: string
  columns: ColumnReport[]
  constraints: ConstraintReport[]
  indexes: IndexReport[]
  rowCount?: number
}

interface ColumnReport {
  name: string
  type: string
  nullable: boolean
  default: string | null
  inEntity: boolean
  entityType?: string
  consistent: boolean
}

interface ConstraintReport {
  name: string
  type: string
  columns: string[]
  referencedTable?: string
  referencedColumns?: string[]
}

interface IndexReport {
  name: string
  columns: string[]
  unique: boolean
  primary: boolean
}

interface MigrationInfo {
  name: string
  timestamp: number
  executed: boolean
}

interface DatabaseStats {
  totalTables: number
  totalColumns: number
  totalConstraints: number
  totalIndexes: number
  tablesWithEntities: number
  orphanTables: number
}

interface ConsistencyIssue {
  id: string
  type: string
  severity: 'critical' | 'warning' | 'info'
  table: string
  column?: string
  entity?: string
  description: string
  recommendation: string
  sqlFix?: string
}

class DetailedConsistencyReporter {
  private configService = new ConfigService()
  private authDataSource: DataSource
  private tenantDataSource: DataSource

  constructor() {
    this.authDataSource = new DataSource(authDataSourceOptions)

    const tenantConfig = {
      ...tenantDataSourceOptions,
      database: this.configService.get('DB_TENANT_TEST_NAME', 'erp_topsteel_topsteel'),
    }
    this.tenantDataSource = new DataSource(tenantConfig)
  }

  async generateDetailedReport(): Promise<DetailedReport> {
    const report: DetailedReport = {
      timestamp: new Date().toISOString(),
      databases: {
        auth: await this.analyzeDatabaseDetailed('auth', this.authDataSource),
        tenant: await this.analyzeDatabaseDetailed('tenant', this.tenantDataSource),
      },
      summary: {
        totalIssues: 0,
        criticalIssues: 0,
        warnings: 0,
        infos: 0,
      },
      recommendations: [],
    }

    // Calculer le résumé
    const allIssues = [...report.databases.auth.issues, ...report.databases.tenant.issues]
    report.summary.totalIssues = allIssues.length
    report.summary.criticalIssues = allIssues.filter((i) => i.severity === 'critical').length
    report.summary.warnings = allIssues.filter((i) => i.severity === 'warning').length
    report.summary.infos = allIssues.filter((i) => i.severity === 'info').length

    // Générer les recommandations
    report.recommendations = this.generateRecommendations(allIssues)

    return report
  }

  private async analyzeDatabaseDetailed(
    dbType: string,
    dataSource: DataSource
  ): Promise<DatabaseReport> {
    try {
      await dataSource.initialize()

      const report: DatabaseReport = {
        name: dbType,
        connectionString: `${(dataSource.options as any).host}:${(dataSource.options as any).port}/${(dataSource.options as any).database}`,
        tables: [],
        migrations: await this.getMigrationInfo(dataSource),
        issues: [],
        statistics: {
          totalTables: 0,
          totalColumns: 0,
          totalConstraints: 0,
          totalIndexes: 0,
          tablesWithEntities: 0,
          orphanTables: 0,
        },
      }

      // Analyser les tables
      const tables = await this.getAllTables(dataSource)
      const entityMetadata = dataSource.entityMetadatas

      for (const tableName of tables) {
        const tableReport = await this.analyzeTable(tableName, dataSource, entityMetadata)
        report.tables.push(tableReport)

        // Mettre à jour les statistiques
        report.statistics.totalColumns += tableReport.columns.length
        report.statistics.totalConstraints += tableReport.constraints.length
        report.statistics.totalIndexes += tableReport.indexes.length

        if (tableReport.hasEntity) {
          report.statistics.tablesWithEntities++
        } else if (!this.isSystemTable(tableName)) {
          report.statistics.orphanTables++
        }
      }

      report.statistics.totalTables = tables.length

      // Analyser les problèmes de cohérence
      report.issues = await this.findConsistencyIssues(report, entityMetadata, dataSource)

      return report
    } finally {
      if (dataSource.isInitialized) {
        await dataSource.destroy()
      }
    }
  }

  private async getAllTables(dataSource: DataSource): Promise<string[]> {
    const queryRunner = dataSource.createQueryRunner()

    try {
      const result = await queryRunner.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `)

      return result.map((row: any) => row.table_name)
    } finally {
      await queryRunner.release()
    }
  }

  private async analyzeTable(
    tableName: string,
    dataSource: DataSource,
    entityMetadata: any[]
  ): Promise<TableReport> {
    const queryRunner = dataSource.createQueryRunner()

    try {
      // Trouver l'entité correspondante
      const entity = entityMetadata.find((e) => e.tableName === tableName)

      // Analyser les colonnes
      const columns = await this.analyzeTableColumns(tableName, entity, queryRunner)

      // Analyser les contraintes
      const constraints = await this.analyzeTableConstraints(tableName, queryRunner)

      // Analyser les index
      const indexes = await this.analyzeTableIndexes(tableName, queryRunner)

      // Compter les lignes (pour les petites tables seulement)
      let rowCount: number | undefined
      try {
        const countResult = await queryRunner.query(`SELECT COUNT(*) as count FROM "${tableName}"`)
        rowCount = parseInt(countResult[0].count)
        if (rowCount > 10000) rowCount = undefined // Ne pas afficher pour les grandes tables
      } catch {
        // Ignorer les erreurs de comptage
      }

      return {
        name: tableName,
        hasEntity: !!entity,
        entityName: entity?.name,
        columns,
        constraints,
        indexes,
        rowCount,
      }
    } finally {
      await queryRunner.release()
    }
  }

  private async analyzeTableColumns(
    tableName: string,
    entity: any,
    queryRunner: any
  ): Promise<ColumnReport[]> {
    const dbColumns = await queryRunner.query(
      `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length,
        numeric_precision,
        numeric_scale
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = $1
      ORDER BY ordinal_position
    `,
      [tableName]
    )

    return dbColumns.map((col: any) => {
      const entityColumn = entity?.columns.find((ec: any) => ec.databaseName === col.column_name)

      return {
        name: col.column_name,
        type: col.data_type,
        nullable: col.is_nullable === 'YES',
        default: col.column_default,
        inEntity: !!entityColumn,
        entityType: entityColumn?.type,
        consistent: this.isColumnConsistent(col, entityColumn),
      }
    })
  }

  private async analyzeTableConstraints(
    tableName: string,
    queryRunner: any
  ): Promise<ConstraintReport[]> {
    const constraints = await queryRunner.query(
      `
      SELECT 
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name,
        ccu.table_name AS referenced_table,
        ccu.column_name AS referenced_column
      FROM information_schema.table_constraints tc
      LEFT JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      LEFT JOIN information_schema.constraint_column_usage ccu 
        ON tc.constraint_name = ccu.constraint_name
      WHERE tc.table_name = $1
      ORDER BY tc.constraint_name
    `,
      [tableName]
    )

    const constraintMap = new Map<string, ConstraintReport>()

    constraints.forEach((row: any) => {
      if (!constraintMap.has(row.constraint_name)) {
        constraintMap.set(row.constraint_name, {
          name: row.constraint_name,
          type: row.constraint_type,
          columns: [],
          referencedTable: row.referenced_table,
          referencedColumns: [],
        })
      }

      const constraint = constraintMap.get(row.constraint_name)!
      if (row.column_name) constraint.columns.push(row.column_name)
      if (row.referenced_column) constraint.referencedColumns?.push(row.referenced_column)
    })

    return Array.from(constraintMap.values())
  }

  private async analyzeTableIndexes(tableName: string, queryRunner: any): Promise<IndexReport[]> {
    const indexes = await queryRunner.query(
      `
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
    `,
      [tableName]
    )

    const indexMap = new Map<string, IndexReport>()

    indexes.forEach((row: any) => {
      if (!indexMap.has(row.index_name)) {
        indexMap.set(row.index_name, {
          name: row.index_name,
          columns: [],
          unique: row.is_unique,
          primary: row.is_primary,
        })
      }

      indexMap.get(row.index_name)?.columns.push(row.column_name)
    })

    return Array.from(indexMap.values())
  }

  private async getMigrationInfo(dataSource: DataSource): Promise<MigrationInfo[]> {
    const queryRunner = dataSource.createQueryRunner()

    try {
      // Vérifier si la table migrations existe
      const migrationTableExists = await queryRunner.query(`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_name = 'migrations' 
        AND table_schema = 'public'
      `)

      if (migrationTableExists[0].count === 0) {
        return []
      }

      const migrations = await queryRunner.query(`
        SELECT name, timestamp 
        FROM migrations 
        ORDER BY timestamp
      `)

      return migrations.map((m: any) => ({
        name: m.name,
        timestamp: parseInt(m.timestamp),
        executed: true,
      }))
    } catch (_error) {
      return []
    } finally {
      await queryRunner.release()
    }
  }

  private async findConsistencyIssues(
    dbReport: DatabaseReport,
    entityMetadata: any[],
    dataSource: DataSource
  ): Promise<ConsistencyIssue[]> {
    const issues: ConsistencyIssue[] = []
    let issueId = 1

    // Problèmes de tables manquantes
    for (const entity of entityMetadata) {
      const table = dbReport.tables.find((t) => t.name === entity.tableName)
      if (!table) {
        issues.push({
          id: `${dbReport.name.toUpperCase()}-${issueId++}`,
          type: 'missing_table',
          severity: 'critical',
          table: entity.tableName,
          entity: entity.name,
          description: `Table '${entity.tableName}' définie dans l'entité '${entity.name}' mais absente de la base`,
          recommendation: 'Exécuter les migrations ou créer manuellement la table',
          sqlFix: `-- Voir les migrations dans src/core/database/migrations/`,
        })
      }
    }

    // Problèmes de colonnes
    for (const table of dbReport.tables) {
      if (table.hasEntity) {
        const entity = entityMetadata.find((e) => e.tableName === table.name)

        // Colonnes manquantes
        for (const entityColumn of entity.columns) {
          const dbColumn = table.columns.find((c) => c.name === entityColumn.databaseName)
          if (!dbColumn) {
            issues.push({
              id: `${dbReport.name.toUpperCase()}-${issueId++}`,
              type: 'missing_column',
              severity: 'critical',
              table: table.name,
              column: entityColumn.databaseName,
              entity: entity.name,
              description: `Colonne '${entityColumn.databaseName}' manquante dans la table '${table.name}'`,
              recommendation: 'Ajouter la colonne via une migration',
              sqlFix: `ALTER TABLE "${table.name}" ADD COLUMN "${entityColumn.databaseName}" ${this.getPostgreSQLType(entityColumn.type)};`,
            })
          }
        }

        // Colonnes orphelines
        for (const dbColumn of table.columns) {
          if (!dbColumn.inEntity && !this.isSystemColumn(dbColumn.name)) {
            issues.push({
              id: `${dbReport.name.toUpperCase()}-${issueId++}`,
              type: 'orphan_column',
              severity: 'warning',
              table: table.name,
              column: dbColumn.name,
              description: `Colonne '${dbColumn.name}' présente en base mais pas dans l'entité`,
              recommendation: "Ajouter la colonne à l'entité ou la supprimer si obsolète",
              sqlFix: `-- Supprimer si obsolète: ALTER TABLE "${table.name}" DROP COLUMN "${dbColumn.name}";`,
            })
          }
        }

        // Types incohérents
        for (const dbColumn of table.columns) {
          if (!dbColumn.consistent && dbColumn.inEntity) {
            issues.push({
              id: `${dbReport.name.toUpperCase()}-${issueId++}`,
              type: 'type_mismatch',
              severity: 'warning',
              table: table.name,
              column: dbColumn.name,
              description: `Type de colonne incohérent: DB(${dbColumn.type}) vs Entity(${dbColumn.entityType})`,
              recommendation: "Synchroniser les types entre l'entité et la base",
              sqlFix: `-- Vérifier le type requis et modifier si nécessaire`,
            })
          }
        }
      } else if (!this.isSystemTable(table.name)) {
        // Tables orphelines
        issues.push({
          id: `${dbReport.name.toUpperCase()}-${issueId++}`,
          type: 'orphan_table',
          severity: 'info',
          table: table.name,
          description: `Table '${table.name}' sans entité TypeORM correspondante`,
          recommendation: 'Créer une entité ou supprimer si obsolète',
          sqlFix: `-- Supprimer si obsolète: DROP TABLE "${table.name}";`,
        })
      }
    }

    // Vérifications spécifiques pour AUTH
    if (dbReport.name === 'auth') {
      issues.push(...(await this.findAuthSpecificIssues(dbReport, dataSource, issueId)))
    }

    return issues
  }

  private async findAuthSpecificIssues(
    dbReport: DatabaseReport,
    _dataSource: DataSource,
    startId: number
  ): Promise<ConsistencyIssue[]> {
    const issues: ConsistencyIssue[] = []
    let issueId = startId

    const usersTable = dbReport.tables.find((t) => t.name === 'users')
    if (usersTable) {
      // Vérifier les doublons password/mot_de_passe
      const hasPassword = usersTable.columns.some((c) => c.name === 'password')
      const hasMotDePasse = usersTable.columns.some((c) => c.name === 'mot_de_passe')

      if (hasPassword && hasMotDePasse) {
        issues.push({
          id: `AUTH-${issueId++}`,
          type: 'duplicate_columns',
          severity: 'critical',
          table: 'users',
          description: 'Colonnes dupliquées: password et mot_de_passe',
          recommendation: 'Garder seulement "password" et supprimer "mot_de_passe"',
          sqlFix: 'ALTER TABLE users DROP COLUMN mot_de_passe;',
        })
      }

      // Vérifier actif/isActive
      const hasActif = usersTable.columns.some((c) => c.name === 'actif')
      const hasIsActive = usersTable.columns.some((c) => c.name === 'isActive')

      if (hasActif && hasIsActive) {
        issues.push({
          id: `AUTH-${issueId++}`,
          type: 'duplicate_columns',
          severity: 'critical',
          table: 'users',
          description: 'Colonnes dupliquées: actif et isActive',
          recommendation: 'Garder seulement "actif" selon les entités',
          sqlFix: 'ALTER TABLE users DROP COLUMN "isActive";',
        })
      }
    }

    // Vérifier les relations foreign key importantes
    const userSessionsTable = dbReport.tables.find((t) => t.name === 'user_sessions')
    if (userSessionsTable && usersTable) {
      const hasForeignKey = userSessionsTable.constraints.some(
        (c) => c.type === 'FOREIGN KEY' && c.referencedTable === 'users'
      )

      if (!hasForeignKey) {
        issues.push({
          id: `AUTH-${issueId++}`,
          type: 'missing_foreign_key',
          severity: 'warning',
          table: 'user_sessions',
          description: 'Clé étrangère manquante vers la table users',
          recommendation: 'Ajouter la contrainte de clé étrangère',
          sqlFix:
            'ALTER TABLE user_sessions ADD CONSTRAINT fk_user_sessions_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;',
        })
      }
    }

    return issues
  }

  private isColumnConsistent(dbColumn: any, entityColumn: any): boolean {
    if (!entityColumn) return false

    const dbType = dbColumn.data_type
    const entityType = this.getPostgreSQLType(entityColumn.type)

    return dbType === entityType
  }

  private getPostgreSQLType(typeormType: any): string {
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
    }

    return typeMap[typeormType] || typeormType
  }

  private isSystemTable(tableName: string): boolean {
    const systemTables = ['migrations', 'typeorm_metadata']
    return systemTables.includes(tableName) || tableName.startsWith('pg_')
  }

  private isSystemColumn(columnName: string): boolean {
    const systemColumns = [
      'created_at',
      'updated_at',
      'deleted_at',
      'version',
      'created_by_id',
      'updated_by_id',
    ]
    return systemColumns.includes(columnName)
  }

  private generateRecommendations(issues: ConsistencyIssue[]): string[] {
    const recommendations: string[] = []

    const criticalCount = issues.filter((i) => i.severity === 'critical').length
    const warningCount = issues.filter((i) => i.severity === 'warning').length

    if (criticalCount > 0) {
      recommendations.push(
        `🚨 ${criticalCount} problème(s) critique(s) détecté(s) - action immédiate requise`
      )
      recommendations.push('Vérifier et exécuter les migrations manquantes')
      recommendations.push('Corriger les incohérences de structure avant le déploiement')
    }

    if (warningCount > 0) {
      recommendations.push(`⚠️ ${warningCount} avertissement(s) - planifier la résolution`)
      recommendations.push('Standardiser la nomenclature des colonnes')
      recommendations.push('Nettoyer les colonnes et tables obsolètes')
    }

    if (issues.some((i) => i.type === 'duplicate_columns')) {
      recommendations.push(
        'Résoudre les doublons de colonnes (password/mot_de_passe, actif/isActive)'
      )
    }

    if (issues.some((i) => i.type === 'missing_foreign_key')) {
      recommendations.push('Ajouter les contraintes de clés étrangères manquantes')
    }

    if (issues.length === 0) {
      recommendations.push('✅ Structure de base cohérente - aucune action requise')
    }

    return recommendations
  }

  async saveReport(report: DetailedReport, filename?: string): Promise<string> {
    const reportPath =
      filename ||
      join(process.cwd(), `db-consistency-report-${new Date().toISOString().split('T')[0]}.json`)

    writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8')
    return reportPath
  }
}

// Exécution du script
async function main() {
  const reporter = new DetailedConsistencyReporter()

  try {
    const report = await reporter.generateDetailedReport()
    const _reportPath = await reporter.saveReport(report)
    report.recommendations.forEach((_rec, _index) => {})
  } catch (_error) {
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

export { DetailedConsistencyReporter }
