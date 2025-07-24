#!/usr/bin/env ts-node

/**
 * Script de sauvegarde complète de la base de données actuelle
 * À exécuter AVANT la migration vers l'architecture multi-tenant
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs'
import * as path from 'path'
import { config } from 'dotenv'

// Charger les variables d'environnement
config({ path: path.join(__dirname, '../../../.env') })

const execAsync = promisify(exec)

interface BackupConfig {
  host: string
  port: number
  username: string
  password: string
  database: string
  backupDir: string
}

class DatabaseBackup {
  private config: BackupConfig
  private timestamp: string

  constructor() {
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    this.config = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'erp_topsteel',
      backupDir: path.join(__dirname, '../../../backups/pre-migration'),
    }

    // Créer le dossier de sauvegarde
    if (!fs.existsSync(this.config.backupDir)) {
      fs.mkdirSync(this.config.backupDir, { recursive: true })
    }
  }

  /**
   * Sauvegarde complète de la base de données
   */
  async createFullBackup(): Promise<string> {
    const backupFile = path.join(
      this.config.backupDir,
      `${this.config.database}_full_${this.timestamp}.sql`
    )

    console.log('🔄 Création de la sauvegarde complète...')
    
    const pgDumpCommand = [
      'pg_dump',
      `--host=${this.config.host}`,
      `--port=${this.config.port}`,
      `--username=${this.config.username}`,
      '--verbose',
      '--clean',
      '--no-owner',
      '--no-privileges',
      '--format=plain',
      `--file=${backupFile}`,
      this.config.database
    ].join(' ')

    try {
      // Définir le mot de passe via variable d'environnement
      const env = { ...process.env, PGPASSWORD: this.config.password }
      
      await execAsync(pgDumpCommand, { env })
      
      console.log(`✅ Sauvegarde complète créée : ${backupFile}`)
      
      // Vérifier la taille du fichier
      const stats = fs.statSync(backupFile)
      console.log(`📊 Taille de la sauvegarde : ${(stats.size / 1024 / 1024).toFixed(2)} MB`)
      
      return backupFile
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde complète :', error)
      throw error
    }
  }

  /**
   * Sauvegarde des données uniquement (sans structure)
   */
  async createDataOnlyBackup(): Promise<string> {
    const backupFile = path.join(
      this.config.backupDir,
      `${this.config.database}_data_only_${this.timestamp}.sql`
    )

    console.log('🔄 Création de la sauvegarde des données uniquement...')
    
    const pgDumpCommand = [
      'pg_dump',
      `--host=${this.config.host}`,
      `--port=${this.config.port}`,
      `--username=${this.config.username}`,
      '--verbose',
      '--data-only',
      '--no-owner',
      '--no-privileges',
      '--format=plain',
      `--file=${backupFile}`,
      this.config.database
    ].join(' ')

    try {
      const env = { ...process.env, PGPASSWORD: this.config.password }
      await execAsync(pgDumpCommand, { env })
      
      console.log(`✅ Sauvegarde des données créée : ${backupFile}`)
      return backupFile
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde des données :', error)
      throw error
    }
  }

  /**
   * Sauvegarde de la structure uniquement (sans données)
   */
  async createSchemaOnlyBackup(): Promise<string> {
    const backupFile = path.join(
      this.config.backupDir,
      `${this.config.database}_schema_only_${this.timestamp}.sql`
    )

    console.log('🔄 Création de la sauvegarde de la structure uniquement...')
    
    const pgDumpCommand = [
      'pg_dump',
      `--host=${this.config.host}`,
      `--port=${this.config.port}`,
      `--username=${this.config.username}`,
      '--verbose',
      '--schema-only',
      '--no-owner',
      '--no-privileges',
      '--format=plain',
      `--file=${backupFile}`,
      this.config.database
    ].join(' ')

    try {
      const env = { ...process.env, PGPASSWORD: this.config.password }
      await execAsync(pgDumpCommand, { env })
      
      console.log(`✅ Sauvegarde de la structure créée : ${backupFile}`)
      return backupFile
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde de la structure :', error)
      throw error
    }
  }

  /**
   * Analyse des tables et génération d'un rapport
   */
  async generateTableReport(): Promise<void> {
    const reportFile = path.join(
      this.config.backupDir,
      `table_analysis_${this.timestamp}.json`
    )

    console.log('🔄 Génération du rapport des tables...')
    
    try {
      // Requête pour analyser les tables
      const analysisQuery = `
        SELECT 
          schemaname,
          tablename,
          n_tup_ins as total_inserts,
          n_tup_upd as total_updates,
          n_tup_del as total_deletes,
          pg_total_relation_size(schemaname||'.'||tablename) as size_bytes,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size_pretty
        FROM pg_stat_user_tables 
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
      `

      const psqlCommand = [
        'psql',
        `--host=${this.config.host}`,
        `--port=${this.config.port}`,
        `--username=${this.config.username}`,
        `--dbname=${this.config.database}`,
        '--no-password',
        '--tuples-only',
        '--quiet',
        `--command="${analysisQuery}"`
      ].join(' ')

      const env = { ...process.env, PGPASSWORD: this.config.password }
      const { stdout } = await execAsync(psqlCommand, { env })
      
      // Parser et sauvegarder le résultat
      const lines = stdout.trim().split('\n')
      const tables = lines.map(line => {
        const parts = line.split('|').map(p => p.trim())
        return {
          schema: parts[0],
          table: parts[1],
          inserts: parseInt(parts[2]) || 0,
          updates: parseInt(parts[3]) || 0,
          deletes: parseInt(parts[4]) || 0,
          sizeBytes: parseInt(parts[5]) || 0,
          sizePretty: parts[6] || '0 bytes'
        }
      })

      const report = {
        timestamp: new Date().toISOString(),
        database: this.config.database,
        totalTables: tables.length,
        tables: tables,
        summary: {
          totalSizeBytes: tables.reduce((sum, t) => sum + t.sizeBytes, 0),
          totalInserts: tables.reduce((sum, t) => sum + t.inserts, 0),
          totalUpdates: tables.reduce((sum, t) => sum + t.updates, 0),
          totalDeletes: tables.reduce((sum, t) => sum + t.deletes, 0)
        }
      }

      fs.writeFileSync(reportFile, JSON.stringify(report, null, 2))
      console.log(`✅ Rapport des tables généré : ${reportFile}`)
      
      // Afficher un résumé
      console.log('\n📊 RÉSUMÉ DES DONNÉES :')
      console.log(`   Tables : ${report.totalTables}`)
      console.log(`   Taille totale : ${(report.summary.totalSizeBytes / 1024 / 1024).toFixed(2)} MB`)
      console.log(`   Insertions : ${report.summary.totalInserts.toLocaleString()}`)
      console.log(`   Mises à jour : ${report.summary.totalUpdates.toLocaleString()}`)
      
    } catch (error) {
      console.error('❌ Erreur lors de la génération du rapport :', error)
    }
  }

  /**
   * Processus complet de sauvegarde
   */
  async runFullBackupProcess(): Promise<void> {
    console.log('🚀 DÉMARRAGE DU PROCESSUS DE SAUVEGARDE PRÉ-MIGRATION')
    console.log(`📅 Date : ${new Date().toISOString()}`)
    console.log(`🗄️ Base de données : ${this.config.database}`)
    console.log(`📂 Dossier de sauvegarde : ${this.config.backupDir}`)
    console.log('=' + '='.repeat(59))

    try {
      // 1. Générer le rapport des tables
      await this.generateTableReport()

      // 2. Sauvegarde complète
      await this.createFullBackup()

      // 3. Sauvegarde des données uniquement
      await this.createDataOnlyBackup()

      // 4. Sauvegarde de la structure uniquement
      await this.createSchemaOnlyBackup()

      console.log('\n🎉 PROCESSUS DE SAUVEGARDE TERMINÉ AVEC SUCCÈS')
      console.log('📁 Fichiers créés dans :', this.config.backupDir)
      
      // Lister les fichiers créés
      const files = fs.readdirSync(this.config.backupDir)
        .filter(f => f.includes(this.timestamp))
        .map(f => `   - ${f}`)
      
      console.log('📋 Fichiers de sauvegarde :')
      console.log(files.join('\n'))

    } catch (error) {
      console.error('\n💥 ÉCHEC DU PROCESSUS DE SAUVEGARDE')
      console.error('Erreur :', error)
      process.exit(1)
    }
  }
}

// Exécution du script
if (require.main === module) {
  const backup = new DatabaseBackup()
  backup.runFullBackupProcess()
    .then(() => {
      console.log('\n✅ Sauvegarde terminée. Vous pouvez maintenant procéder à la migration.')
      process.exit(0)
    })
    .catch(error => {
      console.error('❌ Erreur fatale :', error)
      process.exit(1)
    })
}

export { DatabaseBackup }