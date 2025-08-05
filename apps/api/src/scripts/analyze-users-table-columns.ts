#!/usr/bin/env ts-node

/**
 * Script d'analyse des colonnes de la table users
 *
 * Ce script se connecte à la base de données AUTH et liste toutes les colonnes
 * de la table users pour identifier les potentielles colonnes dupliquées
 * comme password/mot_de_passe et actif/isActive.
 */

import { ConfigService } from '@nestjs/config'
import { config } from 'dotenv'
import { join } from 'path'
import { DataSource } from 'typeorm'
import { authDataSourceOptions } from '../core/database/data-source-auth'

// Charger le .env depuis la racine du projet
config({ path: join(__dirname, '../../../../.env') })

const configService = new ConfigService()

interface ColumnInfo {
  column_name: string
  data_type: string
  is_nullable: string
  column_default: string | null
  character_maximum_length: number | null
  numeric_precision: number | null
  numeric_scale: number | null
  ordinal_position: number
}

class UsersTableAnalyzer {
  private dataSource: DataSource

  constructor() {
    this.dataSource = new DataSource(authDataSourceOptions)
  }

  async analyzeUsersTable(): Promise<void> {
    console.log('🔍 Analyse des colonnes de la table users dans la base AUTH...\n')

    try {
      // Initialiser la connexion
      await this.dataSource.initialize()
      console.log('✅ Connexion à la base AUTH établie')

      // Vérifier l'existence de la table users
      const tableExists = await this.checkTableExists()
      if (!tableExists) {
        console.log("❌ La table users n'existe pas dans la base AUTH")
        return
      }

      // Analyser les colonnes
      await this.analyzeColumns()

      // Rechercher les potentielles colonnes dupliquées
      await this.findPotentialDuplicates()

      // Afficher un échantillon de données
      await this.showSampleData()
    } catch (error) {
      console.error("❌ Erreur lors de l'analyse:", error)
    } finally {
      if (this.dataSource.isInitialized) {
        await this.dataSource.destroy()
        console.log('\n🔐 Connexion fermée')
      }
    }
  }

  private async checkTableExists(): Promise<boolean> {
    const result = await this.dataSource.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_name = 'users' 
      AND table_schema = 'public'
    `)

    return parseInt(result[0].count) > 0
  }

  private async analyzeColumns(): Promise<ColumnInfo[]> {
    console.log('\n📋 Liste complète des colonnes de la table users:')
    console.log('='.repeat(80))

    const columns = (await this.dataSource.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length,
        numeric_precision,
        numeric_scale,
        ordinal_position
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `)) as ColumnInfo[]

    // Afficher les colonnes dans un format lisible
    console.log(
      `${'Position'.padEnd(8)} ${'Colonne'.padEnd(25)} ${'Type'.padEnd(20)} ${'Nullable'.padEnd(8)} ${'Défaut'.padEnd(15)}`
    )
    console.log('-'.repeat(80))

    for (const column of columns) {
      const position = column.ordinal_position.toString().padEnd(8)
      const name = column.column_name.padEnd(25)
      const type = this.formatDataType(column).padEnd(20)
      const nullable = column.is_nullable.padEnd(8)
      const defaultValue = (column.column_default || 'NULL').substring(0, 15).padEnd(15)

      console.log(`${position} ${name} ${type} ${nullable} ${defaultValue}`)
    }

    console.log(`\n📊 Total: ${columns.length} colonnes trouvées`)
    return columns
  }

  private formatDataType(column: ColumnInfo): string {
    let type = column.data_type

    if (column.character_maximum_length) {
      type += `(${column.character_maximum_length})`
    } else if (column.numeric_precision && column.numeric_scale !== null) {
      type += `(${column.numeric_precision},${column.numeric_scale})`
    } else if (column.numeric_precision) {
      type += `(${column.numeric_precision})`
    }

    return type
  }

  private async findPotentialDuplicates(): Promise<void> {
    console.log('\n🔍 Recherche de potentielles colonnes dupliquées:')
    console.log('='.repeat(50))

    const columns = await this.dataSource.query(`
      SELECT column_name
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND table_schema = 'public'
      ORDER BY column_name
    `)

    const columnNames = columns.map((col: any) => col.column_name)

    // Rechercher des patterns de duplication connus
    const potentialDuplicates = [
      { english: 'password', french: 'mot_de_passe', description: 'Mot de passe' },
      { english: 'isactive', french: 'actif', description: 'Statut actif' },
      { english: 'email', french: 'email', description: 'Adresse email' },
      { english: 'firstname', french: 'prenom', description: 'Prénom' },
      { english: 'lastname', french: 'nom', description: 'Nom de famille' },
      { english: 'phone', french: 'telephone', description: 'Téléphone' },
      { english: 'createdat', french: 'date_creation', description: 'Date de création' },
      { english: 'updatedat', french: 'date_modification', description: 'Date de modification' },
    ]

    let duplicatesFound = 0

    for (const duplicate of potentialDuplicates) {
      const englishExists = columnNames.some(
        (name: string) =>
          name.toLowerCase().includes(duplicate.english) || name.toLowerCase() === duplicate.english
      )
      const frenchExists = columnNames.some(
        (name: string) =>
          name.toLowerCase().includes(duplicate.french) || name.toLowerCase() === duplicate.french
      )

      if (englishExists && frenchExists) {
        const englishCols = columnNames.filter(
          (name: string) =>
            name.toLowerCase().includes(duplicate.english) ||
            name.toLowerCase() === duplicate.english
        )
        const frenchCols = columnNames.filter(
          (name: string) =>
            name.toLowerCase().includes(duplicate.french) || name.toLowerCase() === duplicate.french
        )

        console.log(`⚠️  ${duplicate.description}:`)
        console.log(`   Anglais: ${englishCols.join(', ')}`)
        console.log(`   Français: ${frenchCols.join(', ')}`)
        console.log('')
        duplicatesFound++
      }
    }

    if (duplicatesFound === 0) {
      console.log('✅ Aucune duplication évidente détectée')
    } else {
      console.log(`❌ ${duplicatesFound} potentielle(s) duplication(s) détectée(s)`)
    }

    // Afficher toutes les colonnes pour inspection manuelle
    console.log('\n📝 Tous les noms de colonnes (pour inspection manuelle):')
    console.log(columnNames.join(', '))
  }

  private async showSampleData(): Promise<void> {
    console.log('\n📊 Échantillon de données (5 premiers utilisateurs):')
    console.log('='.repeat(80))

    try {
      // Compter le nombre total d'utilisateurs
      const countResult = await this.dataSource.query('SELECT COUNT(*) as count FROM users')
      const totalUsers = parseInt(countResult[0].count)
      console.log(`👥 Total utilisateurs: ${totalUsers}`)

      if (totalUsers === 0) {
        console.log('ℹ️  Aucun utilisateur dans la table')
        return
      }

      // Récupérer les noms de colonnes pour construire la requête
      const columns = await this.dataSource.query(`
        SELECT column_name
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND table_schema = 'public'
        ORDER BY ordinal_position
      `)

      const columnNames = columns.map((col: any) => col.column_name)

      // Sélectionner quelques colonnes importantes pour l'échantillon
      const importantColumns = columnNames.filter((name: string) =>
        [
          'id',
          'email',
          'username',
          'nom',
          'prenom',
          'firstname',
          'lastname',
          'password',
          'mot_de_passe',
          'actif',
          'isactive',
          'createdat',
          'date_creation',
        ].includes(name.toLowerCase())
      )

      if (importantColumns.length > 0) {
        const sampleQuery = `SELECT ${importantColumns.join(', ')} FROM users LIMIT 5`
        const sampleData = await this.dataSource.query(sampleQuery)

        console.log('\n📋 Colonnes importantes affichées:', importantColumns.join(', '))
        console.log('-'.repeat(80))

        for (let i = 0; i < sampleData.length; i++) {
          console.log(`\nUtilisateur ${i + 1}:`)
          for (const column of importantColumns) {
            const value = sampleData[i][column]
            const displayValue =
              typeof value === 'string' && value.length > 50
                ? value.substring(0, 47) + '...'
                : value
            console.log(`  ${column}: ${displayValue}`)
          }
        }
      } else {
        console.log('ℹ️  Aucune colonne importante standard trouvée')
      }
    } catch (error) {
      console.log(`⚠️  Impossible d'afficher l'échantillon: ${error}`)
    }
  }
}

// Fonction utilitaire pour vérifier les variables d'environnement
function checkEnvironmentVariables(): boolean {
  const requiredVars = ['DB_HOST', 'DB_PORT', 'DB_USERNAME', 'DB_PASSWORD', 'DB_AUTH_NAME']

  const configService = new ConfigService()
  const missingVars = requiredVars.filter((varName) => !configService.get(varName))

  if (missingVars.length > 0) {
    console.log("⚠️  Variables d'environnement manquantes:")
    missingVars.forEach((varName) => {
      console.log(`   - ${varName}`)
    })
    console.log('\nVeuillez configurer ces variables dans votre fichier .env')
    return false
  }

  return true
}

// Exécution du script
async function main() {
  console.log('🔬 Analyse des colonnes de la table users - Base AUTH\n')

  // Vérifier les variables d'environnement
  if (!checkEnvironmentVariables()) {
    process.exit(1)
  }

  const analyzer = new UsersTableAnalyzer()
  await analyzer.analyzeUsersTable()
}

if (require.main === module) {
  main().catch((error) => {
    console.error('💥 Erreur fatale:', error)
    process.exit(1)
  })
}

export { UsersTableAnalyzer }
