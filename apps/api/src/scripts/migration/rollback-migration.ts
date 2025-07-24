#!/usr/bin/env ts-node

/**
 * Script de rollback d'urgence pour la migration multi-tenant
 * Permet de revenir à l'état précédent en cas de problème
 */

import { DataSource } from 'typeorm'
import { config } from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'
import { exec } from 'child_process'
import { promisify } from 'util'

// Charger les variables d'environnement
config({ path: path.join(__dirname, '../../../.env') })

const execAsync = promisify(exec)

interface RollbackStep {
  name: string
  description: string
  execute: () => Promise<void>
  critical: boolean
}

class MigrationRollback {
  private currentDataSource: DataSource
  private completedSteps: string[] = []

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

  async initialize(): Promise<void> {
    await this.currentDataSource.initialize()
    console.log('🔗 Connexion à la base de données établie')
  }

  async destroy(): Promise<void> {
    if (this.currentDataSource.isInitialized) {
      await this.currentDataSource.destroy()
      console.log('🔌 Connexion fermée')
    }
  }

  /**
   * Trouve le backup le plus récent
   */
  findLatestBackup(): string | null {
    const backupDir = path.join(__dirname, '../../../backups/pre-migration')
    
    if (!fs.existsSync(backupDir)) {
      console.log('❌ Dossier de sauvegarde non trouvé')
      return null
    }

    const backupFiles = fs.readdirSync(backupDir)
      .filter(file => file.includes('_full_') && file.endsWith('.sql'))
      .sort()
      .reverse()

    if (backupFiles.length === 0) {
      console.log('❌ Aucun fichier de sauvegarde trouvé')
      return null
    }

    const latestBackup = path.join(backupDir, backupFiles[0])
    console.log(`📁 Sauvegarde trouvée: ${backupFiles[0]}`)
    return latestBackup
  }

  /**
   * Supprime les nouvelles bases de données
   */
  async dropNewDatabases(): Promise<void> {
    console.log('🗑️ Suppression des nouvelles bases de données...')

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
      const newDatabases = [
        process.env.DB_AUTH_NAME || 'erp_topsteel_auth',
        process.env.DB_SHARED_NAME || 'erp_topsteel_shared',
        'erp_topsteel_topsteel' // Base tenant par défaut
      ]

      for (const dbName of newDatabases) {
        try {
          // Terminer toutes les connexions actives
          await adminDataSource.query(`
            SELECT pg_terminate_backend(pid)
            FROM pg_stat_activity
            WHERE datname = '${dbName}' AND pid <> pg_backend_pid()
          `)

          // Supprimer la base
          await adminDataSource.query(`DROP DATABASE IF EXISTS "${dbName}"`)
          console.log(`   ✓ Base supprimée: ${dbName}`)
        } catch (error) {
          console.log(`   ⚠️ Erreur lors de la suppression de ${dbName}:`, (error as Error).message)
        }
      }
    } finally {
      await adminDataSource.destroy()
    }
  }

  /**
   * Restaure la base de données originale
   */
  async restoreOriginalDatabase(backupFile: string): Promise<void> {
    console.log('🔄 Restauration de la base de données originale...')

    const dbName = process.env.DB_NAME || 'erp_topsteel'

    try {
      // Terminer toutes les connexions actives
      const adminDataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: 'postgres',
      })

      await adminDataSource.initialize()

      await adminDataSource.query(`
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = '${dbName}' AND pid <> pg_backend_pid()
      `)

      await adminDataSource.destroy()

      // Restaurer depuis le backup
      const restoreCommand = [
        'psql',
        `--host=${process.env.DB_HOST || 'localhost'}`,
        `--port=${process.env.DB_PORT || '5432'}`,
        `--username=${process.env.DB_USERNAME || 'postgres'}`,
        `--dbname=${dbName}`,
        `--file=${backupFile}`,
        '--single-transaction',
        '--verbose'
      ].join(' ')

      console.log('   📋 Exécution de la restauration...')
      const env = { ...process.env, PGPASSWORD: process.env.DB_PASSWORD || 'postgres' }
      await execAsync(restoreCommand, { env })

      console.log('   ✅ Base de données restaurée avec succès')

    } catch (error) {
      console.error('   ❌ Erreur lors de la restauration:', (error as Error).message)
      throw error
    }
  }

  /**
   * Nettoie les fichiers de configuration multi-tenant
   */
  async cleanupConfiguration(): Promise<void> {
    console.log('🧹 Nettoyage de la configuration...')

    // Lister les fichiers à nettoyer (optionnel)
    const configPaths = [
      path.join(__dirname, '../../modules/database/database-multi-tenant.module.ts'),
      path.join(__dirname, '../../database/config/multi-tenant-database.config.ts')
    ]

    configPaths.forEach(filePath => {
      if (fs.existsSync(filePath)) {
        console.log(`   ℹ️ Configuration multi-tenant trouvée: ${path.basename(filePath)}`)
        console.log('   💡 Vous pouvez désactiver le module multi-tenant dans app.module.ts')
      }
    })

    console.log('   ✅ Vérification de la configuration terminée')
  }

  /**
   * Processus complet de rollback
   */
  async runRollback(options: { force?: boolean } = {}): Promise<void> {
    console.log('🚨 DÉMARRAGE DU ROLLBACK DE MIGRATION')
    console.log(`⚠️  ATTENTION: Cette opération va supprimer les nouvelles bases de données !`)
    console.log('=' + '='.repeat(59))

    if (!options.force) {
      console.log('❌ Pour des raisons de sécurité, ce script nécessite le flag --force')
      console.log('   Utilisation: npm run rollback-migration -- --force')
      return
    }

    try {
      await this.initialize()

      // 1. Trouver le backup
      const backupFile = this.findLatestBackup()
      if (!backupFile) {
        throw new Error('Aucun fichier de sauvegarde disponible pour le rollback')
      }

      // 2. Supprimer les nouvelles bases
      await this.dropNewDatabases()

      // 3. Restaurer la base originale
      await this.restoreOriginalDatabase(backupFile)

      // 4. Nettoyer la configuration
      await this.cleanupConfiguration()

      console.log('\\n🎉 ROLLBACK TERMINÉ AVEC SUCCÈS!')
      console.log('📋 Actions effectuées:')
      console.log('   ✓ Nouvelles bases de données supprimées')
      console.log('   ✓ Base de données originale restaurée')
      console.log('   ✓ Configuration vérifiée')
      console.log('\\n💡 Actions recommandées:')
      console.log('   • Redémarrer l\'application')
      console.log('   • Vérifier que tout fonctionne correctement')
      console.log('   • Analyser les logs pour comprendre la cause du problème')

    } catch (error) {
      console.error('\\n💥 ERREUR LORS DU ROLLBACK')
      console.error('Erreur:', error)
      console.log('\\n🚨 ACTIONS D\'URGENCE:')
      console.log('   1. Contactez l\'administrateur système')
      console.log('   2. Vérifiez manuellement l\'état des bases de données')
      console.log('   3. Restaurez manuellement depuis le backup si nécessaire')
      throw error
    } finally {
      await this.destroy()
    }
  }

  /**
   * Validation avant rollback
   */
  async validateRollback(): Promise<boolean> {
    console.log('🔍 Validation des conditions de rollback...')

    try {
      await this.initialize()

      // Vérifier si les nouvelles bases existent
      const adminDataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: 'postgres',
      })

      await adminDataSource.initialize()

      const newDatabases = [
        process.env.DB_AUTH_NAME || 'erp_topsteel_auth',
        process.env.DB_SHARED_NAME || 'erp_topsteel_shared'
      ]

      let newDbsExist = 0
      for (const dbName of newDatabases) {
        const result = await adminDataSource.query(
          'SELECT 1 FROM pg_database WHERE datname = $1', [dbName]
        )
        if (result.length > 0) {
          newDbsExist++
          console.log(`   ✓ Base trouvée: ${dbName}`)
        }
      }

      await adminDataSource.destroy()

      if (newDbsExist === 0) {
        console.log('   ℹ️ Aucune nouvelle base de données trouvée - rollback peut-être inutile')
        return false
      }

      // Vérifier la disponibilité du backup
      const backupFile = this.findLatestBackup()
      if (!backupFile) {
        console.log('   ❌ Aucun backup disponible - rollback impossible')
        return false
      }

      console.log('   ✅ Conditions de rollback validées')
      return true

    } catch (error) {
      console.error('   ❌ Erreur lors de la validation:', (error as Error).message)
      return false
    } finally {
      await this.destroy()
    }
  }
}

// Exécution du script
if (require.main === module) {
  const args = process.argv.slice(2)
  const force = args.includes('--force')
  const validateOnly = args.includes('--validate')

  const rollback = new MigrationRollback()

  if (validateOnly) {
    rollback.validateRollback()
      .then(canRollback => {
        if (canRollback) {
          console.log('\\n✅ Rollback possible.')
          process.exit(0)
        } else {
          console.log('\\n❌ Rollback non possible ou non nécessaire.')
          process.exit(1)
        }
      })
      .catch(error => {
        console.error('❌ Erreur lors de la validation:', error)
        process.exit(1)
      })
  } else {
    rollback.runRollback({ force })
      .then(() => {
        console.log('\\n✅ Rollback terminé.')
        process.exit(0)
      })
      .catch(error => {
        console.error('❌ Erreur fatale:', error)
        process.exit(1)
      })
  }
}

export { MigrationRollback }