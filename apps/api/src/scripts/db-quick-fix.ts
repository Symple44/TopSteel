#!/usr/bin/env ts-node

/**
 * Script de correction rapide des incohérences de base de données
 *
 * Ce script propose des corrections automatiques pour les problèmes
 * de cohérence les plus courants détectés
 */

import * as readline from 'node:readline'
import { ConfigService } from '@nestjs/config'
import { config } from 'dotenv'
import { DataSource, type QueryRunner } from 'typeorm'
import { authDataSourceOptions } from '../core/database/data-source-auth'
import { tenantDataSourceOptions } from '../core/database/data-source-tenant'

config()

interface QuickFix {
  id: string
  description: string
  sql: string
  severity: 'safe' | 'caution' | 'dangerous'
  reversible: boolean
  backupRequired: boolean
}

class DatabaseQuickFixer {
  private configService = new ConfigService()
  private authDataSource: DataSource
  private tenantDataSource: DataSource
  private rl: readline.Interface

  constructor() {
    this.authDataSource = new DataSource(authDataSourceOptions)

    const tenantConfig = {
      ...tenantDataSourceOptions,
      database: this.configService.get('DB_TENANT_TEST_NAME', 'erp_topsteel_topsteel'),
    }
    this.tenantDataSource = new DataSource(tenantConfig)

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })
  }

  async runQuickFixes(): Promise<void> {
    const proceed = await this.askUser('Continuer avec les corrections? (y/N): ')
    if (proceed.toLowerCase() !== 'y' && proceed.toLowerCase() !== 'yes') {
      this.rl.close()
      return
    }

    try {
      const authFixes = await this.findQuickFixes('AUTH', this.authDataSource)

      if (authFixes.length > 0) {
        await this.presentAndApplyFixes(authFixes, this.authDataSource)
      } else {
      }
      const tenantFixes = await this.findQuickFixes('TENANT', this.tenantDataSource)

      if (tenantFixes.length > 0) {
        await this.presentAndApplyFixes(tenantFixes, this.tenantDataSource)
      } else {
      }
    } catch (_error: unknown) {
    } finally {
      this.rl.close()
    }
  }

  private async findQuickFixes(dbType: string, dataSource: DataSource): Promise<QuickFix[]> {
    const fixes: QuickFix[] = []

    try {
      await dataSource.initialize()
      const queryRunner = dataSource.createQueryRunner()

      if (dbType === 'AUTH') {
        fixes.push(...(await this.findAuthFixes(queryRunner)))
      }

      fixes.push(...(await this.findCommonFixes(queryRunner)))

      await queryRunner.release()
      return fixes
    } finally {
      if (dataSource.isInitialized) {
        await dataSource.destroy()
      }
    }
  }

  private async findAuthFixes(queryRunner: QueryRunner): Promise<QuickFix[]> {
    const fixes: QuickFix[] = []

    try {
      // Vérifier les doublons de colonnes dans users
      const userColumns = await queryRunner.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND table_schema = 'public'
      `)

      const columnNames = userColumns.map(
        (col: unknown) => (col as { column_name: string }).column_name
      )

      // Problème password/mot_de_passe
      if (columnNames.includes('password') && columnNames.includes('mot_de_passe')) {
        fixes.push({
          id: 'auth-fix-001',
          description: 'Supprimer la colonne dupliquée "mot_de_passe" de la table users',
          sql: 'ALTER TABLE users DROP COLUMN IF EXISTS mot_de_passe;',
          severity: 'caution',
          reversible: false,
          backupRequired: true,
        })
      }

      // Problème actif/isActive
      if (columnNames.includes('actif') && columnNames.includes('isActive')) {
        fixes.push({
          id: 'auth-fix-002',
          description: 'Supprimer la colonne dupliquée "isActive" de la table users',
          sql: 'ALTER TABLE users DROP COLUMN IF EXISTS "isActive";',
          severity: 'caution',
          reversible: false,
          backupRequired: true,
        })
      }

      // Vérifier les incohérences de nomenclature dans roles
      const rolesExists = await queryRunner.query(`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_name = 'roles' 
        AND table_schema = 'public'
      `)

      if (rolesExists[0].count > 0) {
        const roleColumns = await queryRunner.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'roles' 
          AND table_schema = 'public'
        `)

        const roleColumnNames = roleColumns.map(
          (col: unknown) => (col as { column_name: string }).column_name
        )

        if (roleColumnNames.includes('nom') && !roleColumnNames.includes('name')) {
          fixes.push({
            id: 'auth-fix-003',
            description: 'Renommer la colonne "nom" en "name" dans la table roles',
            sql: 'ALTER TABLE roles RENAME COLUMN nom TO name;',
            severity: 'safe',
            reversible: true,
            backupRequired: false,
          })
        }
      }

      // Vérifier les index manquants critiques
      const missingIndexes = await this.findMissingCriticalIndexes(queryRunner)
      fixes.push(...missingIndexes)

      // Vérifier les contraintes de clés étrangères manquantes
      const missingForeignKeys = await this.findMissingForeignKeys(queryRunner)
      fixes.push(...missingForeignKeys)
    } catch (_error: unknown) {}

    return fixes
  }

  private async findCommonFixes(queryRunner: QueryRunner): Promise<QuickFix[]> {
    const fixes: QuickFix[] = []

    try {
      // Vérifier les tables avec des colonnes timestamp sans timezone
      const timestampIssues = await queryRunner.query(`
        SELECT table_name, column_name
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND data_type = 'timestamp without time zone'
        AND column_name IN ('created_at', 'updated_at')
      `)

      for (const issue of timestampIssues) {
        // Ce n'est généralement pas un problème critique, mais on peut le signaler
        fixes.push({
          id: `common-timestamp-${issue.table_name}-${issue.column_name}`,
          description: `Colonne ${issue.column_name} dans ${issue.table_name} utilise timestamp without time zone`,
          sql: `-- INFO: Colonne ${issue.table_name}.${issue.column_name} utilise timestamp sans timezone`,
          severity: 'safe',
          reversible: true,
          backupRequired: false,
        })
      }
    } catch (_error: unknown) {}

    return fixes
  }

  private async findMissingCriticalIndexes(queryRunner: QueryRunner): Promise<QuickFix[]> {
    const fixes: QuickFix[] = []

    // Index critiques manquants
    const criticalIndexes = [
      { table: 'users', column: 'email', unique: true },
      { table: 'user_sessions', column: 'sessionId', unique: true },
      { table: 'user_sessions', column: 'userId', unique: false },
      { table: 'societes', column: 'code', unique: true },
    ]

    for (const indexInfo of criticalIndexes) {
      try {
        const existingIndex = await queryRunner.query(
          `
          SELECT indexname 
          FROM pg_indexes 
          WHERE tablename = $1 
          AND indexdef LIKE '%${indexInfo.column}%'
        `,
          [indexInfo.table]
        )

        if (existingIndex.length === 0) {
          const indexName = `idx_${indexInfo.table}_${indexInfo.column}`
          const uniqueClause = indexInfo.unique ? 'UNIQUE ' : ''

          fixes.push({
            id: `index-${indexInfo.table}-${indexInfo.column}`,
            description: `Ajouter un index ${indexInfo.unique ? 'unique ' : ''}sur ${indexInfo.table}.${indexInfo.column}`,
            sql: `CREATE ${uniqueClause}INDEX IF NOT EXISTS ${indexName} ON ${indexInfo.table}(${indexInfo.column});`,
            severity: 'safe',
            reversible: true,
            backupRequired: false,
          })
        }
      } catch (_error: unknown) {
        // Ignorer si la table n'existe pas
      }
    }

    return fixes
  }

  private async findMissingForeignKeys(queryRunner: QueryRunner): Promise<QuickFix[]> {
    const fixes: QuickFix[] = []

    // Vérifier quelques foreign keys critiques
    const criticalForeignKeys = [
      {
        table: 'user_sessions',
        column: 'userId',
        referencedTable: 'users',
        referencedColumn: 'id',
        onDelete: 'CASCADE',
      },
      {
        table: 'user_roles',
        column: 'user_id',
        referencedTable: 'users',
        referencedColumn: 'id',
        onDelete: 'CASCADE',
      },
    ]

    for (const fk of criticalForeignKeys) {
      try {
        const existingFk = await queryRunner.query(
          `
          SELECT constraint_name 
          FROM information_schema.table_constraints 
          WHERE table_name = $1 
          AND constraint_type = 'FOREIGN KEY'
        `,
          [fk.table]
        )

        // Vérification simplifiée - dans un vrai projet, il faudrait vérifier plus précisément
        const hasFkToUsers = existingFk.some((constraint: unknown) =>
          (constraint as { constraint_name: string }).constraint_name.includes('user')
        )

        if (!hasFkToUsers) {
          const constraintName = `fk_${fk.table}_${fk.column}`

          fixes.push({
            id: `fk-${fk.table}-${fk.column}`,
            description: `Ajouter la clé étrangère ${fk.table}.${fk.column} -> ${fk.referencedTable}.${fk.referencedColumn}`,
            sql: `ALTER TABLE ${fk.table} ADD CONSTRAINT ${constraintName} FOREIGN KEY (${fk.column}) REFERENCES ${fk.referencedTable}(${fk.referencedColumn}) ON DELETE ${fk.onDelete};`,
            severity: 'caution',
            reversible: true,
            backupRequired: true,
          })
        }
      } catch (_error: unknown) {
        // Ignorer si les tables n'existent pas
      }
    }

    return fixes
  }

  private async presentAndApplyFixes(fixes: QuickFix[], dataSource: DataSource): Promise<void> {
    for (let i = 0; i < fixes.length; i++) {
      const fix = fixes[i]

      if (fix.backupRequired) {
      }

      const apply = await this.askUser('\nAppliquer cette correction? (y/N/s=skip all): ')

      if (apply.toLowerCase() === 's') {
        break
      }

      if (apply.toLowerCase() === 'y' || apply.toLowerCase() === 'yes') {
        await this.applyFix(fix, dataSource)
      } else {
      }
    }
  }

  private async applyFix(fix: QuickFix, dataSource: DataSource): Promise<void> {
    try {
      await dataSource.initialize()
      const queryRunner = dataSource.createQueryRunner()

      // Exécuter la correction
      if (fix.sql.startsWith('--')) {
      } else {
        await queryRunner.query(fix.sql)
      }

      await queryRunner.release()
    } catch (_error: unknown) {
      if (fix.reversible) {
      }
    } finally {
      if (dataSource.isInitialized) {
        await dataSource.destroy()
      }
    }
  }

  private askUser(question: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer.trim())
      })
    })
  }
}

// Exécution du script
async function main() {
  const fixer = new DatabaseQuickFixer()
  await fixer.runQuickFixes()
}

if (require.main === module) {
  main().catch((_error) => {
    process.exit(1)
  })
}

export { DatabaseQuickFixer }
