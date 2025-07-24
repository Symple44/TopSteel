#!/usr/bin/env ts-node

/**
 * Script de test de migration sur une copie de la base de données
 * Crée une copie de test et exécute la migration complète pour validation
 */

import { DataSource } from 'typeorm'
import { config } from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'
import { exec } from 'child_process'
import { promisify } from 'util'
import { MigrationService } from './migration-service'
import { MigrationIntegrityValidator } from './validate-migration-integrity'

// Charger les variables d'environnement
config({ path: path.join(__dirname, '../../../.env') })

const execAsync = promisify(exec)

interface TestEnvironment {
  originalDbName: string
  testDbName: string
  testAuthDbName: string
  testSharedDbName: string
  testTenantDbName: string
}

class MigrationTester {
  private adminDataSource: DataSource
  private testEnv: TestEnvironment

  constructor() {
    this.adminDataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: 'postgres',
    })

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    this.testEnv = {
      originalDbName: process.env.DB_NAME || 'erp_topsteel',
      testDbName: `erp_topsteel_test_${timestamp}`,
      testAuthDbName: `erp_topsteel_auth_test_${timestamp}`,
      testSharedDbName: `erp_topsteel_shared_test_${timestamp}`,
      testTenantDbName: `erp_topsteel_topsteel_test_${timestamp}`
    }
  }

  async initialize(): Promise<void> {
    await this.adminDataSource.initialize()
    console.log('🔗 Connexion administrateur établie')
  }

  async destroy(): Promise<void> {
    if (this.adminDataSource.isInitialized) {
      await this.adminDataSource.destroy()
      console.log('🔌 Connexion fermée')
    }
  }

  /**
   * Créer une copie de la base de données originale pour les tests
   */
  async createTestDatabaseCopy(): Promise<void> {
    console.log('📋 Création de la copie de test...')

    try {
      // Terminer toutes les connexions actives sur la base originale
      await this.adminDataSource.query(`
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = '${this.testEnv.originalDbName}' AND pid <> pg_backend_pid()
      `)

      // Créer la copie de test
      await this.adminDataSource.query(`
        CREATE DATABASE "${this.testEnv.testDbName}" 
        WITH TEMPLATE "${this.testEnv.originalDbName}" 
        OWNER ${process.env.DB_USERNAME || 'postgres'}
      `)

      console.log(`   ✅ Base de test créée: ${this.testEnv.testDbName}`)

    } catch (error) {
      console.error('   ❌ Erreur lors de la création de la copie:', (error as Error).message)
      throw error
    }
  }

  /**
   * Configurer l'environnement de test
   */
  setupTestEnvironment(): void {
    console.log(`⚙️ Configuration de l'environnement de test...`)

    // Sauvegarder les variables d'environnement originales
    const originalEnv = {
      DB_NAME: process.env.DB_NAME,
      DB_AUTH_NAME: process.env.DB_AUTH_NAME,
      DB_SHARED_NAME: process.env.DB_SHARED_NAME
    }

    // Définir les variables pour les bases de test
    process.env.DB_NAME = this.testEnv.testDbName
    process.env.DB_AUTH_NAME = this.testEnv.testAuthDbName
    process.env.DB_SHARED_NAME = this.testEnv.testSharedDbName

    console.log(`   ✅ Variables environnement de test configurées`)

    // Stocker l'environnement original pour le restaurer plus tard
    ;(global as any).__originalEnv = originalEnv
  }

  /**
   * Restaurer l'environnement original
   */
  restoreOriginalEnvironment(): void {
    console.log(`🔄 Restauration de l'environnement original...`)

    const originalEnv = (global as any).__originalEnv
    if (originalEnv) {
      process.env.DB_NAME = originalEnv.DB_NAME
      process.env.DB_AUTH_NAME = originalEnv.DB_AUTH_NAME
      process.env.DB_SHARED_NAME = originalEnv.DB_SHARED_NAME
    }

    console.log(`   ✅ Environnement original restauré`)
  }

  /**
   * Exécuter la migration sur l'environnement de test
   */
  async runTestMigration(): Promise<boolean> {
    console.log('🚀 Exécution de la migration de test...')

    try {
      // Créer une instance du service de migration avec l'environnement de test
      const migrationService = new MigrationService()
      
      console.log('   📋 Initialisation du service de migration...')
      await migrationService.initializeConnections()

      console.log('   🗄️ Création des nouvelles bases de données...')
      await migrationService.createDatabases()

      console.log('   📊 Exécution des migrations de schéma...')
      await migrationService.runMigrations()

      console.log('   👥 Migration des utilisateurs...')
      await migrationService.migrateUsers()

      console.log('   🏢 Création de la société par défaut...')
      const companyId = await migrationService.createDefaultCompany()

      console.log('   📦 Migration des données métier...')
      await migrationService.migrateBusinessData(companyId)

      console.log('   🧹 Nettoyage final...')
      await migrationService.closeConnections()

      console.log('   ✅ Migration de test terminée avec succès')
      return true

    } catch (error) {
      console.error('   ❌ Erreur lors de la migration de test:', (error as Error).message)
      console.error('   📄 Détails:', error)
      return false
    }
  }

  /**
   * Valider l'intégrité après migration de test
   */
  async validateTestMigration(): Promise<boolean> {
    console.log(`🔍 Validation de l'intégrité de la migration de test...`)

    try {
      // Créer une instance du validateur avec l'environnement de test
      const validator = new MigrationIntegrityValidator()
      
      // Modifier temporairement les sources de données pour pointer vers les bases de test
      ;(validator as any).authDataSource.options.database = this.testEnv.testAuthDbName
      ;(validator as any).sharedDataSource.options.database = this.testEnv.testSharedDbName
      ;(validator as any).tenantDataSource.options.database = this.testEnv.testTenantDbName

      await validator.runValidation()

      console.log('   ✅ Validation terminée')
      return true

    } catch (error) {
      console.error('   ❌ Erreur lors de la validation:', (error as Error).message)
      return false
    }
  }

  /**
   * Nettoyer les bases de données de test
   */
  async cleanupTestDatabases(): Promise<void> {
    console.log('🧹 Nettoyage des bases de données de test...')

    const testDatabases = [
      this.testEnv.testDbName,
      this.testEnv.testAuthDbName,
      this.testEnv.testSharedDbName,
      this.testEnv.testTenantDbName
    ]

    for (const dbName of testDatabases) {
      try {
        // Vérifier si la base existe
        const exists = await this.adminDataSource.query(
          'SELECT 1 FROM pg_database WHERE datname = $1', [dbName]
        )

        if (exists.length > 0) {
          // Terminer toutes les connexions
          await this.adminDataSource.query(`
            SELECT pg_terminate_backend(pid)
            FROM pg_stat_activity
            WHERE datname = '${dbName}' AND pid <> pg_backend_pid()
          `)

          // Supprimer la base
          await this.adminDataSource.query(`DROP DATABASE "${dbName}"`)
          console.log(`   ✓ Base supprimée: ${dbName}`)
        }
      } catch (error) {
        console.log(`   ⚠️ Erreur lors de la suppression de ${dbName}:`, (error as Error).message)
      }
    }
  }

  /**
   * Générer un rapport de test
   */
  generateTestReport(migrationSuccess: boolean, validationSuccess: boolean): void {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const reportFile = path.join(__dirname, '../../../backups/test', `migration_test_report_${timestamp}.json`)

    // Créer le dossier si nécessaire
    const dir = path.dirname(reportFile)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    const report = {
      timestamp: new Date().toISOString(),
      testEnvironment: this.testEnv,
      results: {
        migrationSuccess,
        validationSuccess,
        overallSuccess: migrationSuccess && validationSuccess
      },
      conclusion: migrationSuccess && validationSuccess ? 'TEST_PASSED' : 'TEST_FAILED',
      recommendations: migrationSuccess && validationSuccess ? [
        'La migration peut être exécutée en production',
        'Effectuer une sauvegarde complète avant la migration',
        'Préparer le plan de rollback',
        'Informer les utilisateurs de la maintenance'
      ] : [
        'Ne pas exécuter la migration en production',
        'Analyser les erreurs rencontrées',
        'Corriger les problèmes identifiés',
        'Relancer le test après corrections'
      ]
    }

    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2))

    console.log('\n' + '='.repeat(60))
    console.log('📋 RAPPORT DE TEST DE MIGRATION')
    console.log('='.repeat(60))
    console.log(`\n📊 RÉSULTATS:`)
    console.log(`   Migration: ${migrationSuccess ? '✅ RÉUSSIE' : '❌ ÉCHOUÉE'}`)
    console.log(`   Validation: ${validationSuccess ? '✅ RÉUSSIE' : '❌ ÉCHOUÉE'}`)
    console.log(`   Résultat global: ${migrationSuccess && validationSuccess ? '✅ SUCCÈS' : '❌ ÉCHEC'}`)
    console.log(`   📁 Rapport: ${reportFile}`)

    if (migrationSuccess && validationSuccess) {
      console.log('\n🎉 TEST DE MIGRATION RÉUSSI!')
      console.log('   La migration est prête pour la production.')
    } else {
      console.log('\n⚠️ TEST DE MIGRATION ÉCHOUÉ!')
      console.log('   Des corrections sont nécessaires avant la migration en production.')
    }
  }

  /**
   * Processus complet de test de migration
   */
  async runFullTest(options: { keepTestDbs?: boolean } = {}): Promise<void> {
    console.log('🧪 DÉMARRAGE DU TEST DE MIGRATION')
    console.log('=' + '='.repeat(59))

    let migrationSuccess = false
    let validationSuccess = false

    try {
      await this.initialize()

      // 1. Créer la copie de test
      await this.createTestDatabaseCopy()

      // 2. Configurer l'environnement de test
      this.setupTestEnvironment()

      // 3. Exécuter la migration
      migrationSuccess = await this.runTestMigration()

      // 4. Valider l'intégrité
      if (migrationSuccess) {
        validationSuccess = await this.validateTestMigration()
      }

      // 5. Générer le rapport
      this.generateTestReport(migrationSuccess, validationSuccess)

      console.log('\n✅ TEST DE MIGRATION TERMINÉ')

    } catch (error) {
      console.error('💥 ERREUR CRITIQUE LORS DU TEST')
      console.error('Erreur:', error)
    } finally {
      // Restaurer l'environnement
      this.restoreOriginalEnvironment()

      // Nettoyer les bases de test (sauf si demandé de les conserver)
      if (!options.keepTestDbs) {
        await this.cleanupTestDatabases()
      } else {
        console.log('🔒 Bases de données de test conservées pour analyse')
        console.log(`   Test DB: ${this.testEnv.testDbName}`)
        console.log(`   Auth DB: ${this.testEnv.testAuthDbName}`)
        console.log(`   Shared DB: ${this.testEnv.testSharedDbName}`)
        console.log(`   Tenant DB: ${this.testEnv.testTenantDbName}`)
      }

      await this.destroy()
    }
  }
}

// Exécution du script
if (require.main === module) {
  const args = process.argv.slice(2)
  const keepTestDbs = args.includes('--keep-test-dbs')

  const tester = new MigrationTester()
  tester.runFullTest({ keepTestDbs })
    .then(() => {
      console.log('\n✅ Test de migration terminé.')
      process.exit(0)
    })
    .catch(error => {
      console.error('❌ Test de migration échoué:', error)
      process.exit(1)
    })
}

export { MigrationTester }