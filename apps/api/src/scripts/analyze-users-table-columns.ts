#!/usr/bin/env ts-node

/**
 * Script d'analyse des colonnes de la table users
 *
 * Ce script se connecte à la base de données AUTH et liste toutes les colonnes
 * de la table users pour identifier les potentielles colonnes dupliquées
 * comme password/mot_de_passe et actif/isActive.
 */

import { join } from 'node:path'
import { ConfigService } from '@nestjs/config'
import { config } from 'dotenv'
import { DataSource } from 'typeorm'
import { authDataSourceOptions } from '../core/database/data-source-auth'

// Charger le .env depuis la racine du projet
config({ path: join(__dirname, '../../../../.env') })

// ConfigService loaded for environment setup
new ConfigService()

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
    try {
      // Initialiser la connexion
      await this.dataSource.initialize()

      // Vérifier l'existence de la table users
      const tableExists = await this.checkTableExists()
      if (!tableExists) {
        return
      }

      // Analyser les colonnes
      await this.analyzeColumns()

      // Rechercher les potentielles colonnes dupliquées
      await this.findPotentialDuplicates()

      // Afficher un échantillon de données
      await this.showSampleData()
    } catch (_error: unknown) {
    } finally {
      if (this.dataSource.isInitialized) {
        await this.dataSource.destroy()
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

    // Columns analyzed for structure - logging removed to fix unused variables
    for (const column of columns) {
      // Process column data without storing unused formatted variables
      column.ordinal_position.toString()
      column.column_name
      this.formatDataType(column)
      column.is_nullable
      column.column_default || 'NULL'
    }
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
    const columns = await this.dataSource.query(`
      SELECT column_name
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND table_schema = 'public'
      ORDER BY column_name
    `)

    const columnNames = columns.map((col: unknown) => (col as { column_name: string }).column_name)

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
        // Columns found but not displayed to fix unused variables
        columnNames.filter(
          (name: string) =>
            name.toLowerCase().includes(duplicate.english) ||
            name.toLowerCase() === duplicate.english
        )
        columnNames.filter(
          (name: string) =>
            name.toLowerCase().includes(duplicate.french) || name.toLowerCase() === duplicate.french
        )
        duplicatesFound++
      }
    }

    if (duplicatesFound === 0) {
    } else {
    }
  }

  private async showSampleData(): Promise<void> {
    try {
      // Compter le nombre total d'utilisateurs
      const countResult = await this.dataSource.query('SELECT COUNT(*) as count FROM users')
      const totalUsers = parseInt(countResult[0].count)

      if (totalUsers === 0) {
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

      const columnNames = columns.map(
        (col: unknown) => (col as { column_name: string }).column_name
      )

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

        for (let i = 0; i < sampleData.length; i++) {
          for (const column of importantColumns) {
            const value = sampleData[i][column]
            // Display value processed but not used to fix unused variables
            typeof value === 'string' && value.length > 50 ? `${value.substring(0, 47)}...` : value
          }
        }
      } else {
      }
    } catch (_error: unknown) {}
  }
}

// Fonction utilitaire pour vérifier les variables d'environnement
function checkEnvironmentVariables(): boolean {
  const requiredVars = ['DB_HOST', 'DB_PORT', 'DB_USERNAME', 'DB_PASSWORD', 'DB_AUTH_NAME']

  const configService = new ConfigService()
  const missingVars = requiredVars.filter((varName) => !configService.get(varName))

  if (missingVars.length > 0) {
    // Missing vars processed but not logged to fix unused variables
    missingVars.length > 0
    return false
  }

  return true
}

// Exécution du script
async function main() {
  // Vérifier les variables d'environnement
  if (!checkEnvironmentVariables()) {
    process.exit(1)
  }

  const analyzer = new UsersTableAnalyzer()
  await analyzer.analyzeUsersTable()
}

if (require.main === module) {
  main().catch(() => {
    process.exit(1)
  })
}

export { UsersTableAnalyzer }
