#!/usr/bin/env ts-node

/**
 * Script d'identification et de traitement des données orphelines
 * Détecte les enregistrements sans références valides avant la migration
 */

import { DataSource } from 'typeorm'
import { config } from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

// Charger les variables d'environnement
config({ path: path.join(__dirname, '../../../.env') })

interface OrphanedRecord {
  table: string
  column: string
  id: string
  orphanedValue: any
  reason: string
}

interface OrphanedDataReport {
  timestamp: string
  totalOrphans: number
  tablesSummary: { [table: string]: number }
  orphanedRecords: OrphanedRecord[]
  recommendations: string[]
}

class OrphanedDataIdentifier {
  private dataSource: DataSource
  private orphanedRecords: OrphanedRecord[] = []

  constructor() {
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
    if (this.dataSource.isInitialized) {
      await this.dataSource.destroy()
      console.log('🔌 Connexion fermée')
    }
  }

  private addOrphanedRecord(table: string, column: string, id: string, orphanedValue: any, reason: string) {
    this.orphanedRecords.push({
      table,
      column,
      id,
      orphanedValue,
      reason
    })
  }

  /**
   * Vérifier les utilisateurs orphelins
   */
  async checkOrphanedUsers(): Promise<void> {
    console.log('👥 Vérification des utilisateurs orphelins...')

    try {
      // Utilisateurs avec des rôles inexistants
      const usersWithInvalidRoles = await this.dataSource.query(`
        SELECT u.id, u.email, u.role
        FROM users u
        LEFT JOIN roles r ON u.role = r.code
        WHERE u.deleted_at IS NULL 
        AND u.role IS NOT NULL 
        AND r.code IS NULL
      `)

      usersWithInvalidRoles.forEach(user => {
        this.addOrphanedRecord(
          'users',
          'role',
          user.id,
          user.role,
          `Rôle '${user.role}' n'existe pas dans la table roles`
        )
      })

      // Utilisateurs avec des services inexistants
      const usersWithInvalidServices = await this.dataSource.query(`
        SELECT u.id, u.email, u.service_id
        FROM users u
        LEFT JOIN services s ON u.service_id = s.id
        WHERE u.deleted_at IS NULL 
        AND u.service_id IS NOT NULL 
        AND s.id IS NULL
      `)

      usersWithInvalidServices.forEach(user => {
        this.addOrphanedRecord(
          'users',
          'service_id',
          user.id,
          user.service_id,
          `Service ID '${user.service_id}' n'existe pas dans la table services`
        )
      })

      console.log(`   ✓ ${usersWithInvalidRoles.length + usersWithInvalidServices.length} utilisateurs orphelins trouvés`)

    } catch (error) {
      console.error('   ❌ Erreur lors de la vérification des utilisateurs:', (error as Error).message)
    }
  }

  /**
   * Vérifier les données métier orphelines
   */
  async checkOrphanedBusinessData(): Promise<void> {
    console.log('📦 Vérification des données métier orphelines...')

    const businessTables = [
      { table: 'clients', foreignKeys: [{ column: 'created_by', refTable: 'users', refColumn: 'id' }] },
      { table: 'fournisseurs', foreignKeys: [{ column: 'created_by', refTable: 'users', refColumn: 'id' }] },
      { table: 'materiaux', foreignKeys: [
        { column: 'created_by', refTable: 'users', refColumn: 'id' },
        { column: 'fournisseur_id', refTable: 'fournisseurs', refColumn: 'id' }
      ]},
      { table: 'stocks', foreignKeys: [
        { column: 'materiau_id', refTable: 'materiaux', refColumn: 'id' },
        { column: 'created_by', refTable: 'users', refColumn: 'id' }
      ]},
      { table: 'commandes', foreignKeys: [
        { column: 'client_id', refTable: 'clients', refColumn: 'id' },
        { column: 'created_by', refTable: 'users', refColumn: 'id' }
      ]}
    ]

    for (const { table, foreignKeys } of businessTables) {
      try {
        // Vérifier si la table existe
        const tableExists = await this.dataSource.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          )
        `, [table])

        if (!tableExists[0].exists) {
          console.log(`   ⚠️ Table '${table}' n'existe pas`)
          continue
        }

        for (const fk of foreignKeys) {
          // Vérifier si la colonne existe
          const columnExists = await this.dataSource.query(`
            SELECT EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_schema = 'public' 
              AND table_name = $1 
              AND column_name = $2
            )
          `, [table, fk.column])

          if (!columnExists[0].exists) {
            console.log(`   ⚠️ Colonne '${fk.column}' n'existe pas dans '${table}'`)
            continue
          }

          // Rechercher les enregistrements orphelins
          const orphanedRecords = await this.dataSource.query(`
            SELECT t.id, t.${fk.column}
            FROM ${table} t
            LEFT JOIN ${fk.refTable} ref ON t.${fk.column} = ref.${fk.refColumn}
            WHERE t.deleted_at IS NULL 
            AND t.${fk.column} IS NOT NULL 
            AND ref.${fk.refColumn} IS NULL
          `)

          orphanedRecords.forEach(record => {
            this.addOrphanedRecord(
              table,
              fk.column,
              record.id,
              record[fk.column],
              `Référence vers '${fk.refTable}.${fk.refColumn}' inexistante`
            )
          })
        }

        console.log(`   ✓ Table '${table}' vérifiée`)

      } catch (error) {
        console.error(`   ❌ Erreur lors de la vérification de '${table}':`, (error as Error).message)
      }
    }
  }

  /**
   * Vérifier les sessions et données de sécurité orphelines
   */
  async checkOrphanedSecurityData(): Promise<void> {
    console.log('🔐 Vérification des données de sécurité orphelines...')

    try {
      // Sessions utilisateur orphelines
      const orphanedSessions = await this.dataSource.query(`
        SELECT s.id, s.user_id
        FROM user_sessions s
        LEFT JOIN users u ON s.user_id = u.id
        WHERE u.id IS NULL
      `)

      orphanedSessions.forEach(session => {
        this.addOrphanedRecord(
          'user_sessions',
          'user_id',
          session.id,
          session.user_id,
          `Utilisateur '${session.user_id}' n'existe pas`
        )
      })

      // Données MFA orphelines
      const orphanedMFA = await this.dataSource.query(`
        SELECT m.id, m.user_id
        FROM user_mfa m
        LEFT JOIN users u ON m.user_id = u.id
        WHERE u.id IS NULL
      `)

      orphanedMFA.forEach(mfa => {
        this.addOrphanedRecord(
          'user_mfa',
          'user_id',
          mfa.id,
          mfa.user_id,
          `Utilisateur '${mfa.user_id}' n'existe pas`
        )
      })

      console.log(`   ✓ ${orphanedSessions.length + orphanedMFA.length} enregistrements de sécurité orphelins trouvés`)

    } catch (error) {
      console.error('   ❌ Erreur lors de la vérification des données de sécurité:', (error as Error).message)
    }
  }

  /**
   * Vérifier les logs et données d'audit orphelins
   */
  async checkOrphanedAuditData(): Promise<void> {
    console.log('📋 Vérification des données d\'audit orphelines...')

    try {
      // Logs d'audit avec utilisateurs inexistants
      const auditTables = ['audit_logs', 'activity_logs', 'system_logs']

      for (const table of auditTables) {
        try {
          const tableExists = await this.dataSource.query(`
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = 'public' 
              AND table_name = $1
            )
          `, [table])

          if (!tableExists[0].exists) {
            continue
          }

          const orphanedLogs = await this.dataSource.query(`
            SELECT l.id, l.user_id
            FROM ${table} l
            LEFT JOIN users u ON l.user_id = u.id
            WHERE l.user_id IS NOT NULL AND u.id IS NULL
          `)

          orphanedLogs.forEach(log => {
            this.addOrphanedRecord(
              table,
              'user_id',
              log.id,
              log.user_id,
              `Utilisateur '${log.user_id}' n'existe pas`
            )
          })

        } catch (error) {
          // Table n'existe peut-être pas, continuer
          continue
        }
      }

      console.log('   ✓ Données d\'audit vérifiées')

    } catch (error) {
      console.error('   ❌ Erreur lors de la vérification des données d\'audit:', (error as Error).message)
    }
  }

  /**
   * Suggérer des actions de nettoyage
   */
  generateCleanupSuggestions(): string[] {
    const suggestions: string[] = []
    const tableStats = this.getTableStatistics()

    for (const [table, count] of Object.entries(tableStats)) {
      if (count > 0) {
        switch (table) {
          case 'users':
            suggestions.push(`Corriger ou supprimer ${count} utilisateurs avec des références invalides`)
            break
          case 'user_sessions':
            suggestions.push(`Supprimer ${count} sessions utilisateur orphelines`)
            break
          case 'user_mfa':
            suggestions.push(`Supprimer ${count} configurations MFA orphelines`)
            break
          default:
            if (table.includes('logs')) {
              suggestions.push(`Nettoyer ${count} logs avec des références utilisateur invalides`)
            } else {
              suggestions.push(`Vérifier et corriger ${count} enregistrements orphelins dans '${table}'`)
            }
        }
      }
    }

    if (suggestions.length === 0) {
      suggestions.push('Aucune donnée orpheline détectée - la base est propre')
    }

    return suggestions
  }

  /**
   * Obtenir les statistiques par table
   */
  private getTableStatistics(): { [table: string]: number } {
    const stats: { [table: string]: number } = {}

    this.orphanedRecords.forEach(record => {
      stats[record.table] = (stats[record.table] || 0) + 1
    })

    return stats
  }

  /**
   * Générer le rapport des données orphelines
   */
  generateReport(): void {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const reportFile = path.join(__dirname, '../../../backups/pre-migration', `orphaned_data_report_${timestamp}.json`)

    // Créer le dossier si nécessaire
    const dir = path.dirname(reportFile)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    const report: OrphanedDataReport = {
      timestamp: new Date().toISOString(),
      totalOrphans: this.orphanedRecords.length,
      tablesSummary: this.getTableStatistics(),
      orphanedRecords: this.orphanedRecords,
      recommendations: this.generateCleanupSuggestions()
    }

    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2))

    console.log('\n' + '='.repeat(60))
    console.log('📋 RAPPORT DES DONNÉES ORPHELINES')
    console.log('='.repeat(60))
    console.log(`\n📊 STATISTIQUES:`)
    console.log(`   Total d'enregistrements orphelins: ${report.totalOrphans}`)

    if (report.totalOrphans > 0) {
      console.log('\n📋 PAR TABLE:')
      Object.entries(report.tablesSummary).forEach(([table, count]) => {
        console.log(`   ${table}: ${count} enregistrements`)
      })

      console.log('\n💡 RECOMMANDATIONS:')
      report.recommendations.forEach(rec => {
        console.log(`   • ${rec}`)
      })
    } else {
      console.log('\n✅ AUCUNE DONNÉE ORPHELINE DÉTECTÉE')
      console.log('   La base de données est propre et prête pour la migration.')
    }

    console.log(`\n📁 Rapport détaillé: ${reportFile}`)
  }

  /**
   * Processus complet d'identification des données orphelines
   */
  async runOrphanedDataCheck(): Promise<void> {
    console.log('🔍 IDENTIFICATION DES DONNÉES ORPHELINES')
    console.log('=' + '='.repeat(59))

    try {
      await this.initialize()

      await this.checkOrphanedUsers()
      await this.checkOrphanedBusinessData()
      await this.checkOrphanedSecurityData()
      await this.checkOrphanedAuditData()

      this.generateReport()

      console.log('\n✅ IDENTIFICATION TERMINÉE')

    } catch (error) {
      console.error('❌ Erreur lors de l\'identification:', error)
      throw error
    } finally {
      await this.destroy()
    }
  }
}

// Exécution du script
if (require.main === module) {
  const identifier = new OrphanedDataIdentifier()
  identifier.runOrphanedDataCheck()
    .then(() => {
      console.log('\n✅ Identification des données orphelines terminée.')
      process.exit(0)
    })
    .catch(error => {
      console.error('❌ Identification échouée:', error)
      process.exit(1)
    })
}

export { OrphanedDataIdentifier }