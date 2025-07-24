#!/usr/bin/env ts-node

/**
 * Script d'analyse de la structure de la table users
 * Pour adapter la migration aux colonnes réelles
 */

import { DataSource } from 'typeorm'
import { config } from 'dotenv'
import * as path from 'path'

// Charger les variables d'environnement
config({ path: path.join(__dirname, '../../../.env') })

class UsersTableAnalyzer {
  private dataSource: DataSource

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
    console.log('🔗 Connexion établie')
  }

  async destroy(): Promise<void> {
    if (this.dataSource.isInitialized) {
      await this.dataSource.destroy()
      console.log('🔌 Connexion fermée')
    }
  }

  async analyzeUsersTable(): Promise<void> {
    console.log('🔍 ANALYSE DE LA TABLE USERS')
    console.log('=' + '='.repeat(39))

    try {
      // Vérifier si la table users existe
      const tableExists = await this.dataSource.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'users'
        )
      `)

      if (!tableExists[0].exists) {
        console.log('❌ La table users n\'existe pas')
        return
      }

      console.log('✅ La table users existe')

      // Obtenir la structure de la table
      const columns = await this.dataSource.query(`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length
        FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'users'
        ORDER BY ordinal_position
      `)

      console.log('\n📊 STRUCTURE DE LA TABLE USERS:')
      console.log('Column Name'.padEnd(25) + 'Type'.padEnd(20) + 'Nullable'.padEnd(10) + 'Default')
      console.log('-'.repeat(70))

      columns.forEach(col => {
        const name = col.column_name.padEnd(25)
        const type = col.data_type.padEnd(20)
        const nullable = (col.is_nullable === 'YES' ? 'YES' : 'NO').padEnd(10)
        const defaultVal = col.column_default || ''
        console.log(`${name}${type}${nullable}${defaultVal}`)
      })

      // Compter les utilisateurs
      const userCount = await this.dataSource.query('SELECT COUNT(*) as count FROM users')
      console.log(`\n👥 Nombre d'utilisateurs: ${userCount[0].count}`)

      // Échantillon de données
      const sampleUsers = await this.dataSource.query('SELECT * FROM users LIMIT 3')
      
      if (sampleUsers.length > 0) {
        console.log('\n📋 ÉCHANTILLON DE DONNÉES:')
        sampleUsers.forEach((user, index) => {
          console.log(`\nUtilisateur ${index + 1}:`)
          Object.keys(user).forEach(key => {
            console.log(`  ${key}: ${user[key]}`)
          })
        })
      }

      // Générer la requête SQL adaptée
      const columnNames = columns.map(col => col.column_name).join(', ')
      console.log('\n🔧 REQUÊTE SQL SUGGÉRÉE:')
      console.log(`SELECT ${columnNames}`)
      console.log('FROM users')
      console.log('WHERE deleted_at IS NULL')

    } catch (error) {
      console.error('❌ Erreur lors de l\'analyse:', (error as Error).message)
    }
  }

  async run(): Promise<void> {
    try {
      await this.initialize()
      await this.analyzeUsersTable()
    } catch (error) {
      console.error('💥 Erreur fatale:', error)
    } finally {
      await this.destroy()
    }
  }
}

// Exécution du script
if (require.main === module) {
  const analyzer = new UsersTableAnalyzer()
  analyzer.run()
    .then(() => {
      console.log('\n✅ Analyse terminée.')
      process.exit(0)
    })
    .catch(error => {
      console.error('❌ Analyse échouée:', error)
      process.exit(1)
    })
}

export { UsersTableAnalyzer }