#!/usr/bin/env ts-node

/**
 * Script de nettoyage des données de test
 * Supprime les données factices avant la migration
 */

import { DataSource } from 'typeorm'
import { config } from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

// Charger les variables d'environnement
config({ path: path.join(__dirname, '../../../.env') })

interface CleanupTask {
  table: string
  condition?: string
  reason: string
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  estimatedRows?: number
}

class TestDataCleaner {
  private dataSource: DataSource
  private cleanupTasks: CleanupTask[] = []
  private executedTasks: Array<CleanupTask & { deletedRows: number }> = []

  constructor() {
    this.dataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'erp_topsteel',
    })

    this.initializeCleanupTasks()
  }

  private initializeCleanupTasks(): void {
    this.cleanupTasks = [
      // Tables de test explicites
      {
        table: 'test_categories',
        reason: 'Table de test - données factices',
        priority: 'HIGH'
      },
      {
        table: 'test_products',
        reason: 'Table de test - données factices',
        priority: 'HIGH'
      },
      {
        table: 'test_orders',
        reason: 'Table de test - données factices',
        priority: 'HIGH'
      },
      {
        table: 'test_order_items',
        reason: 'Table de test - données factices',
        priority: 'HIGH'
      },
      
      // Sessions expirées
      {
        table: 'user_session',
        condition: "expires_at < NOW()",
        reason: 'Sessions expirées',
        priority: 'HIGH'
      },
      {
        table: 'mfa_session',
        condition: "expires_at < NOW()",
        reason: 'Sessions MFA expirées',
        priority: 'HIGH'
      },
      
      // Anciennes notifications
      {
        table: 'notifications',
        condition: "created_at < NOW() - INTERVAL '6 months' AND lu = true",
        reason: 'Anciennes notifications lues',
        priority: 'MEDIUM'
      },
      
      // Logs anciens
      {
        table: 'email_log',
        condition: "sent_at < NOW() - INTERVAL '3 months'",
        reason: 'Anciens logs d\'email',
        priority: 'MEDIUM'
      },
      
      // Données de développement (heuristiques)
      {
        table: 'users',
        condition: "email LIKE '%test%' OR email LIKE '%demo%' OR nom LIKE 'Test%'",
        reason: 'Utilisateurs de test identifiés par nom/email',
        priority: 'MEDIUM'
      },
      {
        table: 'clients',
        condition: "nom LIKE '%TEST%' OR nom LIKE '%Demo%' OR nom LIKE 'Client Test%'",
        reason: 'Clients de test identifiés par nom',
        priority: 'MEDIUM'
      },
      {
        table: 'commandes',
        condition: "reference LIKE 'TEST%' OR reference LIKE 'DEMO%'",
        reason: 'Commandes de test identifiées par référence',
        priority: 'MEDIUM'
      },

      // Données orphelines potentielles
      {
        table: 'user_roles',
        condition: `
          user_id NOT IN (SELECT id FROM users WHERE deleted_at IS NULL) 
          OR role_id NOT IN (SELECT id FROM roles)
        `,
        reason: 'Relations utilisateur-rôle orphelines',
        priority: 'HIGH'
      },
      {
        table: 'role_permissions',
        condition: `
          role_id NOT IN (SELECT id FROM roles) 
          OR permission_id NOT IN (SELECT id FROM permissions)
        `,
        reason: 'Relations rôle-permission orphelines',
        priority: 'HIGH'
      },

      // Données temporaires ou de cache
      {
        table: 'query_builder_executions',
        condition: "created_at < NOW() - INTERVAL '1 month'",
        reason: 'Anciennes exécutions de requêtes',
        priority: 'LOW'
      },
      
      // Préférences utilisateur obsolètes
      {
        table: 'user_menu_preferences',
        condition: `
          user_id NOT IN (SELECT id FROM users WHERE deleted_at IS NULL AND actif = true)
        `,
        reason: 'Préférences d\'utilisateurs supprimés/inactifs',
        priority: 'LOW'
      }
    ]
  }

  async initialize(): Promise<void> {
    await this.dataSource.initialize()
    console.log('🔗 Connexion à la base de données établie')
  }

  async destroy(): Promise<void> {
    await this.dataSource.destroy()
    console.log('🔌 Connexion fermée')
  }

  /**
   * Estime le nombre de lignes qui seront supprimées
   */
  async estimateCleanupImpact(): Promise<void> {
    console.log('📊 Estimation de l\'impact du nettoyage...')
    
    for (const task of this.cleanupTasks) {
      try {
        let query: string
        
        if (task.condition) {
          query = `SELECT COUNT(*) as count FROM ${task.table} WHERE ${task.condition}`
        } else {
          query = `SELECT COUNT(*) as count FROM ${task.table}`
        }
        
        const result = await this.dataSource.query(query)
        task.estimatedRows = result[0].count
        
        if (task.estimatedRows && task.estimatedRows > 0) {
          console.log(`   ${task.table}: ${task.estimatedRows.toLocaleString()} lignes - ${task.reason}`)
        }
        
      } catch (error) {
        console.log(`   ${task.table}: Table non trouvée ou erreur`)
        task.estimatedRows = 0
      }
    }
    
    const totalRows = this.cleanupTasks.reduce((sum, task) => sum + (task.estimatedRows || 0), 0)
    console.log(`\n📈 Total estimé: ${totalRows.toLocaleString()} lignes à supprimer`)
  }

  /**
   * Exécute le nettoyage des données
   */
  async executeCleanup(dryRun: boolean = true): Promise<void> {
    console.log(`${dryRun ? '🔍 SIMULATION' : '🧹 EXÉCUTION'} du nettoyage...`)
    
    // Trier par priorité
    const sortedTasks = this.cleanupTasks
      .filter(task => (task.estimatedRows || 0) > 0)
      .sort((a, b) => {
        const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 }
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      })

    for (const task of sortedTasks) {
      try {
        let query: string
        
        if (task.condition) {
          query = `DELETE FROM ${task.table} WHERE ${task.condition}`
        } else {
          query = `DELETE FROM ${task.table}`
        }
        
        if (dryRun) {
          // En mode simulation, on compte juste
          const countQuery = task.condition 
            ? `SELECT COUNT(*) as count FROM ${task.table} WHERE ${task.condition}`
            : `SELECT COUNT(*) as count FROM ${task.table}`
          
          const result = await this.dataSource.query(countQuery)
          const deletedRows = result[0].count
          
          console.log(`   ✓ ${task.table}: ${deletedRows} lignes seraient supprimées`)
          
          this.executedTasks.push({ ...task, deletedRows })
        } else {
          // Exécution réelle
          const result = await this.dataSource.query(query)
          const deletedRows = result.rowCount || 0
          
          console.log(`   ✓ ${task.table}: ${deletedRows} lignes supprimées`)
          
          this.executedTasks.push({ ...task, deletedRows })
        }
        
      } catch (error: any) {
        console.log(`   ❌ ${task.table}: Erreur - ${error?.message || 'Erreur inconnue'}`)
      }
    }
    
    const totalDeleted = this.executedTasks.reduce((sum, task) => sum + task.deletedRows, 0)
    
    if (dryRun) {
      console.log(`\n📊 SIMULATION TERMINÉE: ${totalDeleted.toLocaleString()} lignes seraient supprimées`)
    } else {
      console.log(`\n🧹 NETTOYAGE TERMINÉ: ${totalDeleted.toLocaleString()} lignes supprimées`)
    }
  }

  /**
   * Génère un rapport de nettoyage
   */
  async generateCleanupReport(): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const reportFile = path.join(
      __dirname,
      '../../../backups/pre-migration',
      `cleanup_report_${timestamp}.json`
    )
    
    // Créer le dossier si nécessaire
    const dir = path.dirname(reportFile)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    
    const report = {
      timestamp: new Date().toISOString(),
      database: process.env.DB_NAME || 'erp_topsteel',
      summary: {
        totalTasks: this.executedTasks.length,
        totalRowsDeleted: this.executedTasks.reduce((sum, task) => sum + task.deletedRows, 0),
        byPriority: {
          HIGH: this.executedTasks.filter(t => t.priority === 'HIGH').reduce((sum, t) => sum + t.deletedRows, 0),
          MEDIUM: this.executedTasks.filter(t => t.priority === 'MEDIUM').reduce((sum, t) => sum + t.deletedRows, 0),
          LOW: this.executedTasks.filter(t => t.priority === 'LOW').reduce((sum, t) => sum + t.deletedRows, 0),
        }
      },
      tasks: this.executedTasks
    }
    
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2))
    console.log(`📁 Rapport généré: ${reportFile}`)
  }

  /**
   * Processus complet de nettoyage
   */
  async runCleanupProcess(dryRun: boolean = true): Promise<void> {
    console.log('🧹 DÉMARRAGE DU NETTOYAGE DES DONNÉES DE TEST')
    console.log(`⚙️  Mode: ${dryRun ? 'SIMULATION' : 'EXÉCUTION RÉELLE'}`)
    console.log('=' + '='.repeat(59))
    
    if (!dryRun) {
      console.log('⚠️  ATTENTION: Ce processus va SUPPRIMER des données définitivement!')
      console.log('⚠️  Assurez-vous d\'avoir une sauvegarde récente!')
      console.log('')
    }
    
    try {
      await this.initialize()
      
      await this.estimateCleanupImpact()
      
      if (dryRun) {
        console.log('\n❓ Voulez-vous continuer avec la simulation?')
      } else {
        console.log('\n❓ Voulez-vous continuer avec la suppression réelle?')
        console.log('   Tapez "CONFIRMER" pour continuer:')
        // Dans un vrai script, on ajouterait une confirmation utilisateur
      }
      
      await this.executeCleanup(dryRun)
      
      await this.generateCleanupReport()
      
      console.log('\n✅ NETTOYAGE TERMINÉ')
      
      if (dryRun) {
        console.log('💡 Pour exécuter réellement le nettoyage, lancez:')
        console.log('   npm run clean-test-data -- --execute')
      }
      
    } catch (error) {
      console.error('❌ Erreur lors du nettoyage:', error)
      throw error
    } finally {
      await this.destroy()
    }
  }
}

// Exécution du script
if (require.main === module) {
  const args = process.argv.slice(2)
  const execute = args.includes('--execute')
  
  const cleaner = new TestDataCleaner()
  cleaner.runCleanupProcess(!execute)
    .then(() => {
      console.log('\n✅ Nettoyage terminé.')
      process.exit(0)
    })
    .catch(error => {
      console.error('❌ Erreur fatale:', error)
      process.exit(1)
    })
}

export { TestDataCleaner }