#!/usr/bin/env ts-node

/**
 * Script de validation de l'intégrité après migration multi-tenant
 * Vérifie que toutes les données ont été correctement migrées
 */

import { DataSource } from 'typeorm'
import { config } from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

// Charger les variables d'environnement
config({ path: path.join(__dirname, '../../../.env') })

interface ValidationCheck {
  name: string
  description: string
  status: 'PASS' | 'FAIL' | 'WARNING'
  details?: any
  message?: string
}

class MigrationIntegrityValidator {
  private currentDataSource: DataSource
  private authDataSource: DataSource
  private sharedDataSource: DataSource
  private tenantDataSource: DataSource
  private checks: ValidationCheck[] = []

  constructor() {
    // Base actuelle (pour comparaison)
    this.currentDataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'erp_topsteel',
    })

    // Base AUTH
    this.authDataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_AUTH_NAME || 'erp_topsteel_auth',
    })

    // Base SHARED
    this.sharedDataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_SHARED_NAME || 'erp_topsteel_shared',
    })

    // Base TENANT par défaut
    this.tenantDataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: 'erp_topsteel_topsteel',
    })
  }

  private addCheck(name: string, description: string, status: 'PASS' | 'FAIL' | 'WARNING', details?: any, message?: string) {
    this.checks.push({ name, description, status, details, message })
    const emoji = status === 'PASS' ? '✅' : status === 'WARNING' ? '⚠️' : '❌'
    console.log(`${emoji} [${name}] ${description}`)
    if (message) {
      console.log(`   ${message}`)
    }
    if (details && typeof details === 'object') {
      console.log(`   Détails: ${JSON.stringify(details, null, 2)}`)
    }
  }

  async initializeConnections(): Promise<void> {
    console.log('🔗 Initialisation des connexions...')
    
    try {
      await this.currentDataSource.initialize()
      console.log('   ✓ Base actuelle connectée')
    } catch (error) {
      console.log('   ❌ Base actuelle non accessible (normal après migration)')
    }

    try {
      await this.authDataSource.initialize()
      console.log('   ✓ Base AUTH connectée')
    } catch (error) {
      console.log('   ❌ Base AUTH non accessible')
      throw error
    }

    try {
      await this.sharedDataSource.initialize()
      console.log('   ✓ Base SHARED connectée')
    } catch (error) {
      console.log('   ❌ Base SHARED non accessible')
      throw error
    }

    try {
      await this.tenantDataSource.initialize()
      console.log('   ✓ Base TENANT connectée')
    } catch (error) {
      console.log('   ❌ Base TENANT non accessible')
      throw error
    }
  }

  async closeConnections(): Promise<void> {
    const connections = [
      this.currentDataSource,
      this.authDataSource,
      this.sharedDataSource,
      this.tenantDataSource
    ]

    for (const connection of connections) {
      if (connection.isInitialized) {
        await connection.destroy()
      }
    }
    console.log('🔌 Connexions fermées')
  }

  /**
   * Valider la migration des utilisateurs
   */
  async validateUserMigration(): Promise<void> {
    console.log('\\n👥 Validation de la migration des utilisateurs...')

    try {
      // Compter les utilisateurs dans AUTH
      const authUsers = await this.authDataSource.query('SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL')
      const authCount = authUsers[0].count

      if (authCount > 0) {
        this.addCheck('USER_MIGRATION', 'Utilisateurs migrés vers AUTH', 'PASS', { count: authCount })
      } else {
        this.addCheck('USER_MIGRATION', 'Aucun utilisateur dans AUTH', 'FAIL', {}, 'La migration des utilisateurs a échoué')
      }

      // Vérifier l'intégrité des données utilisateur
      const userSample = await this.authDataSource.query('SELECT id, email, nom, prenom FROM users LIMIT 5')
      const hasValidData = userSample.every(user => user.email && user.id)
      
      if (hasValidData) {
        this.addCheck('USER_DATA', 'Intégrité des données utilisateur', 'PASS', { sample: userSample.length })
      } else {
        this.addCheck('USER_DATA', 'Données utilisateur incomplètes', 'FAIL')
      }

    } catch (error) {
      this.addCheck('USER_MIGRATION', 'Erreur validation utilisateurs', 'FAIL', {}, (error as Error).message)
    }
  }

  /**
   * Valider la création de la société par défaut
   */
  async validateDefaultCompanyCreation(): Promise<void> {
    console.log('\\n🏢 Validation de la société par défaut...')

    try {
      // Vérifier la société TopSteel
      const societes = await this.authDataSource.query('SELECT * FROM societes WHERE code = $1', ['TOPSTEEL'])
      
      if (societes.length > 0) {
        const societe = societes[0]
        this.addCheck('DEFAULT_COMPANY', 'Société TopSteel créée', 'PASS', {
          id: societe.id,
          nom: societe.nom,
          code: societe.code,
          status: societe.status
        })

        // Vérifier le site principal
        const sites = await this.authDataSource.query('SELECT * FROM sites WHERE societe_id = $1 AND is_principal = true', [societe.id])
        
        if (sites.length > 0) {
          this.addCheck('DEFAULT_SITE', 'Site principal créé', 'PASS', { site: sites[0].nom })
        } else {
          this.addCheck('DEFAULT_SITE', 'Site principal manquant', 'WARNING')
        }

      } else {
        this.addCheck('DEFAULT_COMPANY', 'Société TopSteel manquante', 'FAIL')
      }

    } catch (error) {
      this.addCheck('DEFAULT_COMPANY', 'Erreur validation société', 'FAIL', {}, (error as Error).message)
    }
  }

  /**
   * Valider l'association des utilisateurs aux sociétés
   */
  async validateUserSocieteAssociations(): Promise<void> {
    console.log('\\n🔗 Validation des associations utilisateur-société...')

    try {
      // Compter les associations
      const associations = await this.authDataSource.query('SELECT COUNT(*) as count FROM societe_users WHERE deleted_at IS NULL')
      const associationCount = associations[0].count

      if (associationCount > 0) {
        this.addCheck('USER_SOCIETE', 'Associations utilisateur-société', 'PASS', { count: associationCount })

        // Vérifier que tous les utilisateurs ont au moins une association
        const usersWithoutSociete = await this.authDataSource.query(`
          SELECT u.id, u.email 
          FROM users u 
          LEFT JOIN societe_users su ON u.id = su.user_id AND su.deleted_at IS NULL
          WHERE u.deleted_at IS NULL AND su.user_id IS NULL
        `)

        if (usersWithoutSociete.length === 0) {
          this.addCheck('USER_COVERAGE', 'Tous les utilisateurs associés', 'PASS')
        } else {
          this.addCheck('USER_COVERAGE', 'Utilisateurs sans société', 'WARNING', { count: usersWithoutSociete.length })
        }

      } else {
        this.addCheck('USER_SOCIETE', 'Aucune association trouvée', 'FAIL')
      }

    } catch (error) {
      this.addCheck('USER_SOCIETE', 'Erreur validation associations', 'FAIL', {}, (error as Error).message)
    }
  }

  /**
   * Valider la migration des données métier
   */
  async validateBusinessDataMigration(): Promise<void> {
    console.log('\\n📦 Validation des données métier...')

    const businessTables = ['clients', 'fournisseurs', 'materiaux', 'stocks', 'commandes']

    for (const table of businessTables) {
      try {
        const count = await this.tenantDataSource.query(`SELECT COUNT(*) as count FROM ${table} WHERE deleted_at IS NULL`)
        const tableCount = count[0].count

        if (tableCount >= 0) {
          this.addCheck(`TENANT_${table.toUpperCase()}`, `Table ${table} migrée`, 'PASS', { count: tableCount })
        }

        // Vérifier l'intégrité des données (presence de societe_id)
        if (tableCount > 0) {
          const withSocieteId = await this.tenantDataSource.query(`SELECT COUNT(*) as count FROM ${table} WHERE societe_id IS NOT NULL`)
          const validCount = withSocieteId[0].count

          if (validCount === tableCount) {
            this.addCheck(`TENANT_${table.toUpperCase()}_INTEGRITY`, `Intégrité ${table}`, 'PASS')
          } else {
            this.addCheck(`TENANT_${table.toUpperCase()}_INTEGRITY`, `Données ${table} sans societe_id`, 'WARNING', {
              total: tableCount,
              valid: validCount
            })
          }
        }

      } catch (error) {
        this.addCheck(`TENANT_${table.toUpperCase()}`, `Erreur table ${table}`, 'FAIL', {}, (error as Error).message)
      }
    }
  }

  /**
   * Valider la base SHARED
   */
  async validateSharedData(): Promise<void> {
    console.log('\\n📊 Validation des données partagées...')

    const sharedTables = ['shared_materials', 'shared_suppliers', 'shared_processes', 'shared_quality_standards']

    for (const table of sharedTables) {
      try {
        const tableExists = await this.sharedDataSource.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          )
        `, [table])

        if (tableExists[0].exists) {
          const count = await this.sharedDataSource.query(`SELECT COUNT(*) as count FROM ${table}`)
          this.addCheck(`SHARED_${table.toUpperCase()}`, `Table ${table} créée`, 'PASS', { count: count[0].count })
        } else {
          this.addCheck(`SHARED_${table.toUpperCase()}`, `Table ${table} manquante`, 'WARNING')
        }

      } catch (error) {
        this.addCheck(`SHARED_${table.toUpperCase()}`, `Erreur table ${table}`, 'FAIL', {}, (error as Error).message)
      }
    }
  }

  /**
   * Valider la configuration des bases de données
   */
  async validateDatabaseConfiguration(): Promise<void> {
    console.log('\\n⚙️ Validation de la configuration...')

    // Vérifier que les bases existent
    const adminDataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: 'postgres',
    })

    await adminDataSource.initialize()

    try {
      const databases = [
        { name: process.env.DB_AUTH_NAME || 'erp_topsteel_auth', type: 'AUTH' },
        { name: process.env.DB_SHARED_NAME || 'erp_topsteel_shared', type: 'SHARED' },
        { name: 'erp_topsteel_topsteel', type: 'TENANT' }
      ]

      for (const db of databases) {
        const exists = await adminDataSource.query('SELECT 1 FROM pg_database WHERE datname = $1', [db.name])
        if (exists.length > 0) {
          this.addCheck(`DB_${db.type}`, `Base ${db.type} existe`, 'PASS', { name: db.name })
        } else {
          this.addCheck(`DB_${db.type}`, `Base ${db.type} manquante`, 'FAIL', { name: db.name })
        }
      }

    } finally {
      await adminDataSource.destroy()
    }
  }

  /**
   * Générer le rapport de validation
   */
  generateValidationReport(): void {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const reportFile = path.join(__dirname, '../../../backups/post-migration', `validation_report_${timestamp}.json`)

    // Créer le dossier si nécessaire
    const dir = path.dirname(reportFile)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    const summary = {
      total: this.checks.length,
      passed: this.checks.filter(c => c.status === 'PASS').length,
      warnings: this.checks.filter(c => c.status === 'WARNING').length,
      failed: this.checks.filter(c => c.status === 'FAIL').length
    }

    const report = {
      timestamp: new Date().toISOString(),
      summary,
      checks: this.checks,
      conclusion: summary.failed === 0 ? 'MIGRATION_SUCCESS' : 'MIGRATION_ISSUES'
    }

    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2))

    console.log('\\n' + '='.repeat(60))
    console.log('📋 RAPPORT DE VALIDATION POST-MIGRATION')
    console.log('='.repeat(60))
    console.log(`\\n📊 RÉSUMÉ:`)
    console.log(`   ✅ Succès: ${summary.passed}`)
    console.log(`   ⚠️  Avertissements: ${summary.warnings}`)
    console.log(`   ❌ Échecs: ${summary.failed}`)
    console.log(`   📁 Rapport: ${reportFile}`)

    if (summary.failed === 0) {
      console.log('\\n🎉 MIGRATION VALIDÉE AVEC SUCCÈS!')
      console.log('   Toutes les vérifications sont passées.')
    } else {
      console.log('\\n⚠️  PROBLÈMES DÉTECTÉS:')
      this.checks
        .filter(c => c.status === 'FAIL')
        .forEach(c => console.log(`   • ${c.name}: ${c.description}`))
    }
  }

  /**
   * Processus complet de validation
   */
  async runValidation(): Promise<void> {
    console.log('🔍 DÉMARRAGE DE LA VALIDATION POST-MIGRATION')
    console.log('=' + '='.repeat(59))

    try {
      await this.initializeConnections()

      await this.validateDatabaseConfiguration()
      await this.validateUserMigration()
      await this.validateDefaultCompanyCreation()
      await this.validateUserSocieteAssociations()
      await this.validateBusinessDataMigration()
      await this.validateSharedData()

      this.generateValidationReport()

      console.log('\\n✅ VALIDATION TERMINÉE')

    } catch (error) {
      console.error('❌ Erreur lors de la validation:', error)
      throw error
    } finally {
      await this.closeConnections()
    }
  }
}

// Exécution du script
if (require.main === module) {
  const validator = new MigrationIntegrityValidator()
  validator.runValidation()
    .then(() => {
      console.log('\\n✅ Validation terminée.')
      process.exit(0)
    })
    .catch(error => {
      console.error('❌ Validation échouée:', error)
      process.exit(1)
    })
}

export { MigrationIntegrityValidator }