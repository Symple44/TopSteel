#!/usr/bin/env ts-node

/**
 * Script de test complet avec création de bases de données topsteel_test_*
 * Test de bout en bout de la migration multi-tenant
 */

import { DataSource } from 'typeorm'
import { config } from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'
import { MigrationService } from './migration-service'
import { MigrationIntegrityValidator } from './validate-migration-integrity'

// Charger les variables d'environnement
config({ path: path.join(__dirname, '../../../.env') })

interface TestDatabases {
  original: string
  testCopy: string
  auth: string
  shared: string
  tenant: string
}

/**
 * Service de migration personnalisé pour les tests
 * Permet de surcharger le nom de la base tenant
 */
class TestMigrationService extends MigrationService {
  constructor(private tenantDbName: string) {
    super()
    
    // Reconfigurer la source de données tenant avec le bon nom
    ;(this as any).tenantDataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: tenantDbName,
      migrations: [path.join(__dirname, '../../database/migrations/tenant/*.ts')],
      migrationsRun: false
    })
  }

  /**
   * Créer les nouvelles bases de données - version surchargée pour le test
   */
  async createDatabases(): Promise<void> {
    console.log('🗄️ Création des nouvelles bases de données...')
    
    const adminDataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: 'postgres', // Base admin
    })

    await adminDataSource.initialize()

    try {
      const databases = [
        process.env.DB_AUTH_NAME || 'erp_topsteel_auth',
        process.env.DB_SHARED_NAME || 'erp_topsteel_shared',
        this.tenantDbName // Utiliser le nom de test
      ]

      for (const dbName of databases) {
        try {
          await adminDataSource.query(`CREATE DATABASE "${dbName}" WITH ENCODING 'UTF8'`)
          console.log(`   ✓ Base créée: ${dbName}`)
        } catch (error: any) {
          if (error.code === '42P04') {
            console.log(`   ⚠️ Base existe déjà: ${dbName}`)
          } else {
            throw error
          }
        }
      }
    } finally {
      await adminDataSource.destroy()
    }
  }

  /**
   * Créer la société par défaut - version surchargée pour le test
   */
  async createDefaultCompany(): Promise<string> {
    console.log('🏢 Création de la société par défaut...')
    
    const authDataSource = (this as any).authDataSource
    
    const societeId = await authDataSource.query(`
      INSERT INTO societes (
        nom, code, database_name, status, plan,
        max_users, max_sites, configuration
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `, [
      'TopSteel',
      'TOPSTEEL',
      this.tenantDbName, // Utiliser le nom de test
      'ACTIVE',
      'ENTERPRISE',
      100,
      10,
      JSON.stringify({
        modules: ['stocks', 'production', 'clients', 'commandes'],
        features: ['multi_site', 'advanced_reporting'],
        locale: 'fr-FR',
        timezone: 'Europe/Paris'
      })
    ])
    
    const companyId = societeId[0].id
    console.log(`   ✓ Société créée avec ID: ${companyId}`)
    
    // Créer le site principal
    await authDataSource.query(`
      INSERT INTO sites (
        societe_id, nom, code, type, is_principal, actif
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `, [companyId, 'Site Principal TopSteel', 'MAIN', 'MIXED', true, true])
    
    console.log('   ✓ Site principal créé')
    
    return companyId
  }
}

class TopSteelMigrationTester {
  private adminDataSource: DataSource
  private testDatabases: TestDatabases
  private originalEnv: any

  constructor() {
    this.adminDataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: 'postgres',
    })

    // Utiliser des noms fixes pour les tests concrets
    this.testDatabases = {
      original: process.env.DB_NAME || 'erp_topsteel',
      testCopy: `topsteel_test_original`,
      auth: `topsteel_test_auth`,
      shared: `topsteel_test_shared`,
      tenant: `topsteel_test_societe1` // Utiliser societe1 comme exemple concret
    }

    // Sauvegarder l'environnement original
    this.originalEnv = {
      DB_NAME: process.env.DB_NAME,
      DB_AUTH_NAME: process.env.DB_AUTH_NAME,
      DB_SHARED_NAME: process.env.DB_SHARED_NAME
    }
  }

  async initialize(): Promise<void> {
    await this.adminDataSource.initialize()
    console.log('🔗 Connexion administrateur établie')
  }

  /**
   * Nettoyer toutes les bases de test existantes
   */
  async cleanupExistingTestDatabases(): Promise<void> {
    console.log('🧹 Nettoyage des bases de test existantes...')

    try {
      // Lister toutes les bases qui commencent par topsteel_test ou erp_topsteel (sauf erp_topsteel lui-même)
      const testDbs = await this.adminDataSource.query(`
        SELECT datname FROM pg_database 
        WHERE (datname LIKE 'topsteel_test%' OR datname LIKE 'erp_topsteel_%') 
        AND datname != 'erp_topsteel'
      `)

      for (const db of testDbs) {
        const dbName = db.datname
        try {
          // Terminer toutes les connexions
          await this.adminDataSource.query(`
            SELECT pg_terminate_backend(pid)
            FROM pg_stat_activity
            WHERE datname = '${dbName}' AND pid <> pg_backend_pid()
          `)

          // Supprimer la base
          await this.adminDataSource.query(`DROP DATABASE IF EXISTS "${dbName}"`)
          console.log(`   🗑️ Base supprimée: ${dbName}`)
        } catch (error) {
          console.log(`   ⚠️ Erreur suppression ${dbName}:`, (error as Error).message)
        }
      }

      console.log('   ✅ Nettoyage terminé')
    } catch (error) {
      console.error('   ❌ Erreur lors du nettoyage:', (error as Error).message)
    }
  }

  async destroy(): Promise<void> {
    if (this.adminDataSource.isInitialized) {
      await this.adminDataSource.destroy()
    }
    console.log('🔌 Connexion fermée')
  }

  /**
   * Créer une copie de la base originale pour le test
   */
  async createOriginalDatabaseCopy(): Promise<void> {
    console.log('📋 Création de la copie de la base originale...')

    try {
      // Terminer toutes les connexions actives sur la base originale
      await this.adminDataSource.query(`
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = '${this.testDatabases.original}' AND pid <> pg_backend_pid()
      `)

      // Créer la copie
      await this.adminDataSource.query(`
        CREATE DATABASE "${this.testDatabases.testCopy}" 
        WITH TEMPLATE "${this.testDatabases.original}" 
        OWNER ${process.env.DB_USERNAME || 'postgres'}
      `)

      console.log(`   ✅ Copie créée: ${this.testDatabases.testCopy}`)

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

    // Configurer les variables d'environnement pour pointer vers les bases de test
    process.env.DB_NAME = this.testDatabases.testCopy
    process.env.DB_AUTH_NAME = this.testDatabases.auth
    process.env.DB_SHARED_NAME = this.testDatabases.shared

    console.log(`   📊 Base originale de test: ${this.testDatabases.testCopy}`)
    console.log(`   🔐 Base AUTH de test: ${this.testDatabases.auth}`)
    console.log(`   📋 Base SHARED de test: ${this.testDatabases.shared}`)
    console.log(`   🏢 Base SOCIÉTÉ de test: ${this.testDatabases.tenant}`)
    console.log('   ✅ Environnement de test configuré')
  }

  /**
   * Restaurer l'environnement original
   */
  restoreOriginalEnvironment(): void {
    console.log(`🔄 Restauration de l'environnement original...`)

    process.env.DB_NAME = this.originalEnv.DB_NAME
    process.env.DB_AUTH_NAME = this.originalEnv.DB_AUTH_NAME
    process.env.DB_SHARED_NAME = this.originalEnv.DB_SHARED_NAME

    console.log('   ✅ Environnement original restauré')
  }

  /**
   * Vérifier que les bases de test existent
   */
  async verifyTestDatabases(): Promise<void> {
    console.log('🔍 Vérification des bases de données de test...')

    const databasesToCheck = [
      { name: this.testDatabases.testCopy, type: 'ORIGINAL_COPY' },
      { name: this.testDatabases.auth, type: 'AUTH' },
      { name: this.testDatabases.shared, type: 'SHARED' },
      { name: this.testDatabases.tenant, type: 'SOCIÉTÉ' }
    ]

    for (const db of databasesToCheck) {
      try {
        const exists = await this.adminDataSource.query(
          'SELECT 1 FROM pg_database WHERE datname = $1', [db.name]
        )
        
        if (exists.length > 0) {
          console.log(`   ✅ ${db.type}: ${db.name}`)
        } else {
          console.log(`   ❌ ${db.type}: ${db.name} - N'EXISTE PAS`)
        }
      } catch (error) {
        console.error(`   ❌ Erreur vérification ${db.type}:`, (error as Error).message)
      }
    }
  }

  /**
   * Compter les enregistrements dans chaque base
   */
  async countRecordsInDatabases(): Promise<void> {
    console.log('📊 Comptage des enregistrements...')

    // Compter dans la base originale copiée
    const originalDS = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: this.testDatabases.testCopy,
    })

    try {
      await originalDS.initialize()
      
      const usersCount = await originalDS.query('SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL')
      console.log(`   👥 Utilisateurs dans la copie originale: ${usersCount[0].count}`)

      // Compter d'autres tables si elles existent
      const businessTables = ['clients', 'fournisseurs', 'materiaux', 'stocks', 'commandes']
      for (const table of businessTables) {
        try {
          const count = await originalDS.query(`SELECT COUNT(*) as count FROM ${table} WHERE deleted_at IS NULL`)
          console.log(`   📦 ${table}: ${count[0].count}`)
        } catch {
          console.log(`   ⚠️ Table '${table}' n'existe pas`)
        }
      }

    } catch (error) {
      console.error('   ❌ Erreur lors du comptage:', (error as Error).message)
    } finally {
      if (originalDS.isInitialized) {
        await originalDS.destroy()
      }
    }
  }

  /**
   * Exécuter la migration complète
   */
  async runFullMigration(): Promise<boolean> {
    console.log('🚀 Exécution de la migration complète...')

    try {
      // Créer un service de migration personnalisé pour le test
      const migrationService = new TestMigrationService(this.testDatabases.tenant)
      
      console.log('   📋 Initialisation des connexions...')
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

      console.log('   🧹 Fermeture des connexions...')
      await migrationService.closeConnections()

      console.log('   ✅ Migration complète terminée avec succès')
      return true

    } catch (error) {
      console.error('   ❌ Erreur lors de la migration:', (error as Error).message)
      console.error('   📄 Détails:', error)
      return false
    }
  }

  /**
   * Valider l'intégrité de la migration
   */
  async validateMigrationIntegrity(): Promise<boolean> {
    console.log(`🔍 Validation de l'intégrité de la migration...`)

    try {
      const validator = new MigrationIntegrityValidator()
      
      // Adapter les sources de données pour pointer vers nos bases de test
      ;(validator as any).currentDataSource.options.database = this.testDatabases.testCopy
      ;(validator as any).authDataSource.options.database = this.testDatabases.auth
      ;(validator as any).sharedDataSource.options.database = this.testDatabases.shared
      ;(validator as any).tenantDataSource.options.database = this.testDatabases.tenant

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
  async cleanupTestDatabases(options: { keepDatabases?: boolean } = {}): Promise<void> {
    if (options.keepDatabases) {
      console.log('🔒 Conservation des bases de données de test pour analyse')
      console.log(`   📋 Copie originale: ${this.testDatabases.testCopy}`)
      console.log(`   🔐 AUTH: ${this.testDatabases.auth}`)
      console.log(`   📊 SHARED: ${this.testDatabases.shared}`)
      console.log(`   🏢 TENANT: ${this.testDatabases.tenant}`)
      return
    }

    console.log('🧹 Nettoyage des bases de données de test...')

    const testDatabases = [
      this.testDatabases.testCopy,
      this.testDatabases.auth,
      this.testDatabases.shared,
      this.testDatabases.tenant
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
    const reportFile = path.join(__dirname, '../../../backups/test', `topsteel_test_report_${timestamp}.json`)

    // Créer le dossier si nécessaire
    const dir = path.dirname(reportFile)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    const report = {
      timestamp: new Date().toISOString(),
      testType: 'FULL_MIGRATION_TEST_WITH_TOPSTEEL_PREFIX',
      testDatabases: this.testDatabases,
      results: {
        migrationSuccess,
        validationSuccess,
        overallSuccess: migrationSuccess && validationSuccess
      },
      conclusion: migrationSuccess && validationSuccess ? 'TEST_PASSED' : 'TEST_FAILED',
      recommendations: migrationSuccess && validationSuccess ? [
        '🎉 Test complet réussi avec le préfixe topsteel_test_',
        '✅ La migration multi-tenant fonctionne parfaitement',
        '🚀 Le système est prêt pour la migration en production',
        '📋 Procéder avec la migration réelle après sauvegarde'
      ] : [
        '❌ Le test a échoué - ne pas migrer en production',
        '🔍 Analyser les logs d\'erreur',
        '🛠️ Corriger les problèmes identifiés',
        '🔄 Relancer le test après corrections'
      ]
    }

    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2))

    console.log('\\n' + '='.repeat(80))
    console.log('📋 RAPPORT DE TEST MIGRATION TOPSTEEL_TEST_*')
    console.log('='.repeat(80))
    console.log(`\\n🏗️ BASES DE DONNÉES DE TEST:`)
    console.log(`   📋 Copie originale: ${this.testDatabases.testCopy}`)
    console.log(`   🔐 AUTH: ${this.testDatabases.auth}`)
    console.log(`   📊 SHARED: ${this.testDatabases.shared}`)
    console.log(`   🏢 TENANT: ${this.testDatabases.tenant}`)
    
    console.log(`\\n📊 RÉSULTATS:`)
    console.log(`   Migration: ${migrationSuccess ? '✅ RÉUSSIE' : '❌ ÉCHOUÉE'}`)
    console.log(`   Validation: ${validationSuccess ? '✅ RÉUSSIE' : '❌ ÉCHOUÉE'}`)
    console.log(`   Résultat global: ${migrationSuccess && validationSuccess ? '✅ SUCCÈS' : '❌ ÉCHEC'}`)
    console.log(`   📁 Rapport: ${reportFile}`)

    if (migrationSuccess && validationSuccess) {
      console.log('\\n🎉 TEST TOPSTEEL_TEST_* RÉUSSI!')
      console.log('   🚀 La migration multi-tenant est validée et prête pour la production!')
    } else {
      console.log('\\n⚠️ TEST TOPSTEEL_TEST_* ÉCHOUÉ!')
      console.log('   🛠️ Des corrections sont nécessaires avant la migration en production.')
    }
  }

  /**
   * Exécuter le test complet
   */
  async runCompleteTest(options: { keepDatabases?: boolean } = {}): Promise<void> {
    console.log('🧪 DÉMARRAGE DU TEST COMPLET TOPSTEEL_TEST_*')
    console.log('=' + '='.repeat(79))

    let migrationSuccess = false
    let validationSuccess = false

    try {
      await this.initialize()

      // 0. Nettoyer les bases existantes
      console.log('\\n🧹 ÉTAPE 0: NETTOYAGE DES BASES EXISTANTES')
      await this.cleanupExistingTestDatabases()

      // 1. Créer la copie de la base originale
      console.log('\\n🔄 ÉTAPE 1: CRÉATION DE LA COPIE DE BASE')
      await this.createOriginalDatabaseCopy()

      // 2. Configurer l'environnement de test
      console.log('\\n⚙️ ÉTAPE 2: CONFIGURATION DE L\'ENVIRONNEMENT')
      this.setupTestEnvironment()

      // 3. Compter les enregistrements initiaux
      console.log('\\n📊 ÉTAPE 3: ANALYSE DES DONNÉES INITIALES')
      await this.countRecordsInDatabases()

      // 4. Exécuter la migration
      console.log('\\n🚀 ÉTAPE 4: MIGRATION COMPLÈTE')
      migrationSuccess = await this.runFullMigration()

      // 5. Vérifier les bases créées
      console.log('\\n🔍 ÉTAPE 5: VÉRIFICATION DES BASES CRÉÉES')
      await this.verifyTestDatabases()

      // 6. Valider l'intégrité
      if (migrationSuccess) {
        console.log('\\n✅ ÉTAPE 6: VALIDATION DE L\'INTÉGRITÉ')
        validationSuccess = await this.validateMigrationIntegrity()
      }

      // 7. Générer le rapport
      console.log('\\n📋 ÉTAPE 7: GÉNÉRATION DU RAPPORT')
      this.generateTestReport(migrationSuccess, validationSuccess)

    } catch (error) {
      console.error('\\n💥 ERREUR CRITIQUE LORS DU TEST')
      console.error('Erreur:', error)
      this.generateTestReport(false, false)
    } finally {
      // Restaurer l'environnement
      this.restoreOriginalEnvironment()

      // Nettoyer les bases de test
      await this.cleanupTestDatabases({ keepDatabases: options.keepDatabases })

      await this.destroy()
    }
  }
}

// Exécution du script
if (require.main === module) {
  const args = process.argv.slice(2)
  const keepDatabases = args.includes('--keep-databases')

  console.log('🎯 LANCEMENT DU TEST TOPSTEEL_TEST_* - MIGRATION MULTI-TENANT')
  console.log('🔧 Ce test va créer des bases de données temporaires avec le préfixe topsteel_test_')
  
  if (keepDatabases) {
    console.log('🔒 Mode conservation activé - les bases de test seront conservées')
  }

  const tester = new TopSteelMigrationTester()
  tester.runCompleteTest({ keepDatabases })
    .then(() => {
      console.log('\\n✅ Test topsteel_test_* terminé.')
      process.exit(0)
    })
    .catch(error => {
      console.error('❌ Test topsteel_test_* échoué:', error)
      process.exit(1)
    })
}

export { TopSteelMigrationTester }