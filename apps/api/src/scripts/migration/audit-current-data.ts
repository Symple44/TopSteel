#!/usr/bin/env ts-node

/**
 * Script d'audit des données actuelles
 * Identifie les données orphelines, les incohérences et prépare la migration
 */

import { DataSource } from 'typeorm'
import { config } from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

// Charger les variables d'environnement
config({ path: path.join(__dirname, '../../../.env') })

interface AuditResult {
  category: 'AUTH' | 'TENANT' | 'SHARED'
  table: string
  totalRows: number
  issues: string[]
  recommendations: string[]
  migrationPriority: 'HIGH' | 'MEDIUM' | 'LOW'
}

class DatabaseAuditor {
  private dataSource: DataSource
  private auditResults: AuditResult[] = []
  private timestamp: string

  constructor() {
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    
    this.dataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'erp_topsteel',
    })
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
   * Audit des tables d'authentification
   */
  async auditAuthTables(): Promise<void> {
    console.log('🔍 Audit des tables AUTH...')
    
    // Audit table users
    await this.auditUsersTable()
    
    // Audit table roles et permissions
    await this.auditRolesAndPermissions()
    
    // Audit table sessions
    await this.auditSessionTables()
    
    // Audit table notifications
    await this.auditNotificationTables()
  }

  private async auditUsersTable(): Promise<void> {
    const query = `
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN actif = true THEN 1 END) as active_users,
        COUNT(CASE WHEN deleted_at IS NOT NULL THEN 1 END) as deleted_users,
        COUNT(CASE WHEN email IS NULL OR email = '' THEN 1 END) as users_without_email,
        COUNT(CASE WHEN password IS NULL OR password = '' THEN 1 END) as users_without_password
      FROM users
    `
    
    const result = await this.dataSource.query(query)
    const stats = result[0]
    
    const issues: string[] = []
    const recommendations: string[] = []
    
    if (stats.users_without_email > 0) {
      issues.push(`${stats.users_without_email} utilisateurs sans email`)
      recommendations.push('Corriger ou supprimer les utilisateurs sans email')
    }
    
    if (stats.users_without_password > 0) {
      issues.push(`${stats.users_without_password} utilisateurs sans mot de passe`)
      recommendations.push('Corriger ou désactiver les utilisateurs sans mot de passe')
    }

    this.auditResults.push({
      category: 'AUTH',
      table: 'users',
      totalRows: stats.total_users,
      issues,
      recommendations,
      migrationPriority: 'HIGH'
    })
  }

  private async auditRolesAndPermissions(): Promise<void> {
    // Vérifier les rôles orphelins
    const orphanRolesQuery = `
      SELECT r.id, r.nom 
      FROM roles r 
      LEFT JOIN user_roles ur ON r.id = ur."roleId" 
      WHERE ur."roleId" IS NULL
    `
    
    const orphanRoles = await this.dataSource.query(orphanRolesQuery)
    
    // Vérifier les permissions orphelines
    const orphanPermissionsQuery = `
      SELECT p.id, p.nom 
      FROM permissions p 
      LEFT JOIN role_permissions rp ON p.id = rp."permissionId" 
      WHERE rp."permissionId" IS NULL
    `
    
    const orphanPermissions = await this.dataSource.query(orphanPermissionsQuery)
    
    const totalRoles = await this.dataSource.query('SELECT COUNT(*) as count FROM roles')
    const totalPermissions = await this.dataSource.query('SELECT COUNT(*) as count FROM permissions')
    
    const issues: string[] = []
    const recommendations: string[] = []
    
    if (orphanRoles.length > 0) {
      issues.push(`${orphanRoles.length} rôles non utilisés`)
      recommendations.push('Supprimer ou affecter les rôles orphelins')
    }
    
    if (orphanPermissions.length > 0) {
      issues.push(`${orphanPermissions.length} permissions non utilisées`)
      recommendations.push('Supprimer ou affecter les permissions orphelines')
    }

    this.auditResults.push({
      category: 'AUTH',
      table: 'roles_permissions',
      totalRows: totalRoles[0].count + totalPermissions[0].count,
      issues,
      recommendations,
      migrationPriority: 'HIGH'
    })
  }

  private async auditSessionTables(): Promise<void> {
    // Sessions expirées
    const expiredSessionsQuery = `
      SELECT COUNT(*) as count 
      FROM user_session 
      WHERE expires_at < NOW()
    `
    
    const expiredSessions = await this.dataSource.query(expiredSessionsQuery)
    const totalSessions = await this.dataSource.query('SELECT COUNT(*) as count FROM user_session')
    
    const issues: string[] = []
    const recommendations: string[] = []
    
    if (expiredSessions[0].count > 0) {
      issues.push(`${expiredSessions[0].count} sessions expirées`)
      recommendations.push('Nettoyer les sessions expirées avant migration')
    }

    this.auditResults.push({
      category: 'AUTH',
      table: 'user_session',
      totalRows: totalSessions[0].count,
      issues,
      recommendations,
      migrationPriority: 'MEDIUM'
    })
  }

  private async auditNotificationTables(): Promise<void> {
    // Notifications anciennes
    const oldNotificationsQuery = `
      SELECT COUNT(*) as count 
      FROM notifications 
      WHERE created_at < NOW() - INTERVAL '6 months'
    `
    
    const oldNotifications = await this.dataSource.query(oldNotificationsQuery)
    const totalNotifications = await this.dataSource.query('SELECT COUNT(*) as count FROM notifications')
    
    const issues: string[] = []
    const recommendations: string[] = []
    
    if (oldNotifications[0].count > 0) {
      issues.push(`${oldNotifications[0].count} notifications anciennes (>6 mois)`)
      recommendations.push('Archiver ou supprimer les anciennes notifications')
    }

    this.auditResults.push({
      category: 'AUTH',
      table: 'notifications',
      totalRows: totalNotifications[0].count,
      issues,
      recommendations,
      migrationPriority: 'LOW'
    })
  }

  /**
   * Audit des tables métier (tenant)
   */
  async auditTenantTables(): Promise<void> {
    console.log('🔍 Audit des tables TENANT...')
    
    await this.auditClientsTable()
    await this.auditCommandesTable()
    await this.auditStocksTable()
    await this.auditProductionTable()
    await this.auditTestTables()
  }

  private async auditClientsTable(): Promise<void> {
    const query = `
      SELECT 
        COUNT(*) as total_clients,
        COUNT(CASE WHEN actif = true THEN 1 END) as active_clients,
        COUNT(CASE WHEN nom IS NULL OR nom = '' THEN 1 END) as clients_without_name,
        COUNT(CASE WHEN email IS NULL OR email = '' THEN 1 END) as clients_without_email
      FROM clients
    `
    
    const result = await this.dataSource.query(query)
    const stats = result[0]
    
    const issues: string[] = []
    const recommendations: string[] = []
    
    if (stats.clients_without_name > 0) {
      issues.push(`${stats.clients_without_name} clients sans nom`)
      recommendations.push('Compléter ou supprimer les clients sans nom')
    }

    this.auditResults.push({
      category: 'TENANT',
      table: 'clients',
      totalRows: stats.total_clients,
      issues,
      recommendations,
      migrationPriority: 'HIGH'
    })
  }

  private async auditCommandesTable(): Promise<void> {
    const query = `
      SELECT 
        COUNT(*) as total_commandes,
        COUNT(CASE WHEN statut = 'EN_COURS' THEN 1 END) as active_orders,
        COUNT(CASE WHEN client_id IS NULL THEN 1 END) as orders_without_client
      FROM commandes
    `
    
    const result = await this.dataSource.query(query)
    const stats = result[0]
    
    const issues: string[] = []
    const recommendations: string[] = []
    
    if (stats.orders_without_client > 0) {
      issues.push(`${stats.orders_without_client} commandes sans client`)
      recommendations.push('Associer ou supprimer les commandes orphelines')
    }

    this.auditResults.push({
      category: 'TENANT',
      table: 'commandes',
      totalRows: stats.total_commandes,
      issues,
      recommendations,
      migrationPriority: 'HIGH'
    })
  }

  private async auditStocksTable(): Promise<void> {
    const query = `
      SELECT 
        COUNT(*) as total_stocks,
        COUNT(CASE WHEN actif = true THEN 1 END) as active_stocks,
        SUM(CASE WHEN quantite < 0 THEN 1 ELSE 0 END) as negative_stocks
      FROM stocks
    `
    
    const result = await this.dataSource.query(query)
    const stats = result[0]
    
    const issues: string[] = []
    const recommendations: string[] = []
    
    if (stats.negative_stocks > 0) {
      issues.push(`${stats.negative_stocks} stocks négatifs`)
      recommendations.push('Corriger les quantités négatives')
    }

    this.auditResults.push({
      category: 'TENANT',
      table: 'stocks',
      totalRows: stats.total_stocks,
      issues,
      recommendations,
      migrationPriority: 'HIGH'
    })
  }

  private async auditProductionTable(): Promise<void> {
    const totalProduction = await this.dataSource.query('SELECT COUNT(*) as count FROM production')
    
    this.auditResults.push({
      category: 'TENANT',
      table: 'production',
      totalRows: totalProduction[0].count,
      issues: [],
      recommendations: ['Vérifier la cohérence des données de production'],
      migrationPriority: 'HIGH'
    })
  }

  private async auditTestTables(): Promise<void> {
    const testTables = ['test_categories', 'test_products', 'test_orders', 'test_order_items']
    
    for (const table of testTables) {
      try {
        const count = await this.dataSource.query(`SELECT COUNT(*) as count FROM ${table}`)
        
        if (count[0].count > 0) {
          this.auditResults.push({
            category: 'TENANT',
            table,
            totalRows: count[0].count,
            issues: ['Table de test avec données'],
            recommendations: ['Supprimer les données de test avant migration'],
            migrationPriority: 'LOW'
          })
        }
      } catch (error) {
        // Table n'existe pas, ignorer
      }
    }
  }

  /**
   * Génère le rapport d'audit
   */
  async generateAuditReport(): Promise<void> {
    const reportFile = path.join(
      __dirname,
      '../../../backups/pre-migration',
      `audit_report_${this.timestamp}.json`
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
        totalTables: this.auditResults.length,
        totalRows: this.auditResults.reduce((sum, r) => sum + r.totalRows, 0),
        totalIssues: this.auditResults.reduce((sum, r) => sum + r.issues.length, 0),
        byCategory: {
          AUTH: this.auditResults.filter(r => r.category === 'AUTH').length,
          TENANT: this.auditResults.filter(r => r.category === 'TENANT').length,
          SHARED: this.auditResults.filter(r => r.category === 'SHARED').length,
        },
        byPriority: {
          HIGH: this.auditResults.filter(r => r.migrationPriority === 'HIGH').length,
          MEDIUM: this.auditResults.filter(r => r.migrationPriority === 'MEDIUM').length,
          LOW: this.auditResults.filter(r => r.migrationPriority === 'LOW').length,
        }
      },
      results: this.auditResults
    }
    
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2))
    
    console.log('\n📊 RAPPORT D\'AUDIT GÉNÉRÉ')
    console.log(`📁 Fichier: ${reportFile}`)
    console.log(`📋 Tables auditées: ${report.summary.totalTables}`)
    console.log(`📈 Lignes totales: ${report.summary.totalRows.toLocaleString()}`)
    console.log(`⚠️  Problèmes trouvés: ${report.summary.totalIssues}`)
    
    // Afficher les problèmes critiques
    const criticalIssues = this.auditResults.filter(r => 
      r.migrationPriority === 'HIGH' && r.issues.length > 0
    )
    
    if (criticalIssues.length > 0) {
      console.log('\n🚨 PROBLÈMES CRITIQUES À RÉSOUDRE:')
      criticalIssues.forEach(issue => {
        console.log(`   ${issue.table}: ${issue.issues.join(', ')}`)
      })
    }
  }

  /**
   * Processus complet d'audit
   */
  async runCompleteAudit(): Promise<void> {
    console.log('🔍 DÉMARRAGE DE L\'AUDIT PRÉ-MIGRATION')
    console.log('=' + '='.repeat(49))
    
    try {
      await this.initialize()
      
      await this.auditAuthTables()
      await this.auditTenantTables()
      
      await this.generateAuditReport()
      
      console.log('\n✅ AUDIT TERMINÉ AVEC SUCCÈS')
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'audit:', error)
      throw error
    } finally {
      await this.destroy()
    }
  }
}

// Exécution du script
if (require.main === module) {
  const auditor = new DatabaseAuditor()
  auditor.runCompleteAudit()
    .then(() => {
      console.log('\n✅ Audit terminé. Consultez le rapport pour les recommandations.')
      process.exit(0)
    })
    .catch(error => {
      console.error('❌ Erreur fatale:', error)
      process.exit(1)
    })
}

export { DatabaseAuditor }