#!/usr/bin/env ts-node

/**
 * Script de test de migration en mode dry-run
 * Valide la logique de migration sans exécuter les changements
 */

import { DataSource } from 'typeorm'
import { config } from 'dotenv'
import * as path from 'path'

// Charger les variables d'environnement
config({ path: path.join(__dirname, '../../../.env') })

interface ValidationResult {
  step: string
  status: 'SUCCESS' | 'WARNING' | 'ERROR' | 'INFO'
  message: string
  details?: any
}

class MigrationDryRun {
  private results: ValidationResult[] = []
  private currentDataSource: DataSource

  constructor() {
    this.currentDataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'erp_topsteel',
    })
  }

  private addResult(step: string, status: 'SUCCESS' | 'WARNING' | 'ERROR' | 'INFO', message: string, details?: any) {
    this.results.push({ step, status, message, details })
    const emoji = status === 'SUCCESS' ? '✅' : status === 'WARNING' ? '⚠️' : status === 'INFO' ? 'ℹ️' : '❌'
    console.log(`${emoji} [${step}] ${message}`)
    if (details) {
      console.log(`   Détails: ${JSON.stringify(details, null, 2)}`)
    }
  }

  async initialize(): Promise<void> {
    try {
      await this.currentDataSource.initialize()
      this.addResult('INIT', 'SUCCESS', 'Connexion à la base de données établie')
    } catch (error) {
      this.addResult('INIT', 'ERROR', 'Échec de connexion à la base de données', (error as Error).message)
      throw error
    }
  }

  async destroy(): Promise<void> {
    if (this.currentDataSource.isInitialized) {
      await this.currentDataSource.destroy()
      this.addResult('CLEANUP', 'SUCCESS', 'Connexion fermée')
    }
  }

  /**
   * Valide les variables d'environnement nécessaires
   */
  async validateEnvironment(): Promise<void> {
    const requiredVars = ['DB_HOST', 'DB_PORT', 'DB_USERNAME', 'DB_PASSWORD', 'DB_NAME']
    const missingVars = requiredVars.filter(varName => !process.env[varName])

    if (missingVars.length > 0) {
      this.addResult('ENV', 'ERROR', 'Variables d\'environnement manquantes', missingVars)
    } else {
      this.addResult('ENV', 'SUCCESS', 'Variables d\'environnement validées')
    }

    // Vérifier les nouvelles variables multi-tenant
    const multiTenantVars = ['DB_AUTH_NAME', 'DB_SHARED_NAME', 'DB_TENANT_PREFIX']
    const defaultValues = {
      DB_AUTH_NAME: 'erp_topsteel_auth',
      DB_SHARED_NAME: 'erp_topsteel_shared',
      DB_TENANT_PREFIX: 'erp_topsteel'
    }

    multiTenantVars.forEach(varName => {
      const value = process.env[varName] || defaultValues[varName]
      this.addResult('ENV', 'SUCCESS', `${varName}: ${value}`)
    })
  }

  /**
   * Valide la structure de la base de données actuelle
   */
  async validateCurrentSchema(): Promise<void> {
    try {
      // Vérifier les tables principales
      const tables = await this.currentDataSource.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `)

      this.addResult('SCHEMA', 'SUCCESS', `${tables.length} tables trouvées dans la base actuelle`, 
        tables.map(t => t.table_name))

      // Vérifier si des tables critiques existent
      const criticalTables = ['users', 'roles', 'permissions']
      const existingTables = tables.map(t => t.table_name)
      
      criticalTables.forEach(tableName => {
        if (existingTables.includes(tableName)) {
          this.addResult('SCHEMA', 'SUCCESS', `Table critique trouvée: ${tableName}`)
        } else {
          this.addResult('SCHEMA', 'WARNING', `Table critique manquante: ${tableName}`)
        }
      })

    } catch (error) {
      this.addResult('SCHEMA', 'ERROR', 'Impossible de valider le schéma actuel', (error as Error).message)
    }
  }

  /**
   * Valide les fichiers de migration
   */
  async validateMigrationFiles(): Promise<void> {
    const migrationPaths = [
      path.join(__dirname, '../../database/migrations/auth'),
      path.join(__dirname, '../../database/migrations/shared'),
      path.join(__dirname, '../../database/migrations/tenant')
    ]

    const fs = require('fs')

    migrationPaths.forEach(migrationPath => {
      try {
        if (fs.existsSync(migrationPath)) {
          const files = fs.readdirSync(migrationPath).filter(f => f.endsWith('.ts'))
          this.addResult('MIGRATIONS', 'SUCCESS', 
            `Migrations trouvées dans ${path.basename(migrationPath)}: ${files.length} fichiers`, files)
        } else {
          this.addResult('MIGRATIONS', 'WARNING', 
            `Dossier de migration manquant: ${path.basename(migrationPath)}`)
        }
      } catch (error) {
        this.addResult('MIGRATIONS', 'ERROR', 
          `Erreur lors de la lecture des migrations ${path.basename(migrationPath)}`, (error as Error).message)
      }
    })
  }

  /**
   * Simule la validation des données à migrer
   */
  async validateDataMigration(): Promise<void> {
    try {
      // Compter les utilisateurs
      const userCount = await this.currentDataSource.query('SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL')
      this.addResult('DATA', 'SUCCESS', `Utilisateurs à migrer: ${userCount[0]?.count || 0}`)

      // Compter les tables métier (si elles existent)
      const businessTables = ['clients', 'fournisseurs', 'materiaux', 'stocks', 'commandes']
      
      for (const tableName of businessTables) {
        try {
          const count = await this.currentDataSource.query(`SELECT COUNT(*) as count FROM ${tableName} WHERE deleted_at IS NULL`)
          this.addResult('DATA', 'SUCCESS', `${tableName} à migrer: ${count[0]?.count || 0}`)
        } catch (error) {
          this.addResult('DATA', 'INFO', `Table ${tableName} non trouvée (normal si pas encore créée)`)
        }
      }

    } catch (error) {
      this.addResult('DATA', 'ERROR', 'Erreur lors de la validation des données', (error as Error).message)
    }
  }

  /**
   * Valide les services de migration
   */
  async validateMigrationServices(): Promise<void> {
    const serviceFiles = [
      'migration-service.ts',
      'audit-current-data.ts', 
      'backup-current-database.ts',
      'clean-test-data.ts'
    ]

    const fs = require('fs')
    const servicePath = __dirname

    serviceFiles.forEach(fileName => {
      const filePath = path.join(servicePath, fileName)
      if (fs.existsSync(filePath)) {
        this.addResult('SERVICES', 'SUCCESS', `Service de migration trouvé: ${fileName}`)
      } else {
        this.addResult('SERVICES', 'WARNING', `Service de migration manquant: ${fileName}`)
      }
    })
  }

  /**
   * Génère le rapport de validation
   */
  generateReport(): void {
    console.log('\n' + '='.repeat(60))
    console.log('📋 RAPPORT DE VALIDATION DE MIGRATION')
    console.log('='.repeat(60))

    const successCount = this.results.filter(r => r.status === 'SUCCESS').length
    const warningCount = this.results.filter(r => r.status === 'WARNING').length
    const errorCount = this.results.filter(r => r.status === 'ERROR').length

    console.log(`\n📊 RÉSUMÉ:`)
    console.log(`   ✅ Succès: ${successCount}`)
    console.log(`   ⚠️  Avertissements: ${warningCount}`)
    console.log(`   ❌ Erreurs: ${errorCount}`)

    if (errorCount > 0) {
      console.log('\n🚨 ERREURS CRITIQUES:')
      this.results
        .filter(r => r.status === 'ERROR')
        .forEach(r => console.log(`   • [${r.step}] ${r.message}`))
    }

    if (warningCount > 0) {
      console.log('\n⚠️  AVERTISSEMENTS:')
      this.results
        .filter(r => r.status === 'WARNING')
        .forEach(r => console.log(`   • [${r.step}] ${r.message}`))
    }

    console.log('\n💡 RECOMMANDATIONS:')
    if (errorCount === 0 && warningCount === 0) {
      console.log('   🎉 Aucun problème détecté. La migration peut être exécutée.')
    } else if (errorCount === 0) {
      console.log('   ✅ Les avertissements peuvent être ignorés. La migration peut être exécutée avec prudence.')
    } else {
      console.log('   ❌ Corrigez les erreurs critiques avant d\'exécuter la migration.')
    }
  }

  /**
   * Processus complet de validation
   */
  async runDryRun(): Promise<void> {
    console.log('🔍 DÉMARRAGE DU TEST DE MIGRATION (DRY-RUN)')
    console.log('=' + '='.repeat(49))

    try {
      await this.initialize()
      
      await this.validateEnvironment()
      await this.validateCurrentSchema()
      await this.validateMigrationFiles()
      await this.validateDataMigration()
      await this.validateMigrationServices()
      
      this.generateReport()
      
    } catch (error) {
      console.error('❌ Erreur critique lors du dry-run:', error)
      this.addResult('CRITICAL', 'ERROR', 'Erreur fatale', (error as Error).message)
    } finally {
      await this.destroy()
    }
  }
}

// Exécution du script
if (require.main === module) {
  const dryRun = new MigrationDryRun()
  dryRun.runDryRun()
    .then(() => {
      console.log('\n✅ Validation terminée.')
      process.exit(0)
    })
    .catch(error => {
      console.error('❌ Erreur fatale:', error)
      process.exit(1)
    })
}

export { MigrationDryRun }