#!/usr/bin/env ts-node

/**
 * Script d'analyse de la structure de la table user_sessions
 * Comparaison entre la structure actuelle en BD et celle définie dans l'entité TypeORM
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
}

interface IndexInfo {
  indexname: string
  indexdef: string
}

class UserSessionsTableAnalyzer {
  private dataSource: DataSource

  constructor() {
    this.dataSource = new DataSource(authDataSourceOptions)
  }

  async analyzeUserSessionsTable(): Promise<void> {
    console.log('🔍 Analyse de la table user_sessions...\n')

    try {
      // Connexion à la base de données d'authentification
      await this.dataSource.initialize()
      console.log('✅ Connexion à la base de données auth établie\n')

      // 1. Vérifier l'existence de la table
      const tableExists = await this.dataSource.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'user_sessions'
        );
      `)

      if (!tableExists[0].exists) {
        console.log("❌ La table user_sessions n'existe pas dans la base de données auth")
        return
      }

      console.log('✅ La table user_sessions existe\n')

      // 2. Analyser la structure des colonnes
      const columns: ColumnInfo[] = await this.dataSource.query(`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length,
          numeric_precision,
          numeric_scale
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_sessions'
        ORDER BY ordinal_position;
      `)

      console.log('===== STRUCTURE ACTUELLE DES COLONNES =====')
      console.log(
        'Colonne'.padEnd(25) +
          'Type'.padEnd(20) +
          'Nullable'.padEnd(10) +
          'Défaut'.padEnd(20) +
          'Longueur'
      )
      console.log('-'.repeat(90))

      columns.forEach((col) => {
        const name = col.column_name.padEnd(25)
        const type = col.data_type.padEnd(20)
        const nullable = col.is_nullable.padEnd(10)
        const defaultVal = (col.column_default || 'NULL').padEnd(20)
        const length = col.character_maximum_length ? col.character_maximum_length.toString() : ''

        console.log(`${name}${type}${nullable}${defaultVal}${length}`)
      })

      // 3. Comparer avec la structure attendue (basée sur l'entité TypeORM)
      console.log('\n===== COMPARAISON AVEC LA STRUCTURE ATTENDUE =====')

      const expectedColumns = [
        { name: 'id', type: 'uuid', nullable: false, description: 'Clé primaire UUID' },
        {
          name: 'userId',
          type: 'uuid',
          nullable: false,
          description: 'ID utilisateur (avec index)',
        },
        {
          name: 'sessionId',
          type: 'varchar(255)',
          nullable: false,
          description: 'ID de session unique (avec index)',
        },
        {
          name: 'accessToken',
          type: 'varchar(255)',
          nullable: false,
          description: "Token d'accès",
        },
        {
          name: 'refreshToken',
          type: 'varchar(255)',
          nullable: true,
          description: 'Token de rafraîchissement',
        },
        {
          name: 'loginTime',
          type: 'timestamp',
          nullable: false,
          description: 'Heure de connexion (avec index)',
        },
        {
          name: 'logoutTime',
          type: 'timestamp',
          nullable: true,
          description: 'Heure de déconnexion',
        },
        {
          name: 'lastActivity',
          type: 'timestamp',
          nullable: false,
          description: 'Dernière activité (avec index)',
        },
        { name: 'ipAddress', type: 'varchar', nullable: true, description: 'Adresse IP' },
        {
          name: 'userAgent',
          type: 'text',
          nullable: true,
          description: 'User agent du navigateur',
        },
        {
          name: 'deviceInfo',
          type: 'jsonb',
          nullable: true,
          description: "Informations sur l'appareil",
        },
        {
          name: 'location',
          type: 'jsonb',
          nullable: true,
          description: 'Informations de géolocalisation',
        },
        {
          name: 'isActive',
          type: 'boolean',
          nullable: false,
          description: 'Session active (défaut: true, avec index)',
        },
        {
          name: 'isIdle',
          type: 'boolean',
          nullable: false,
          description: 'Session inactive (défaut: false)',
        },
        {
          name: 'status',
          type: 'varchar(50)',
          nullable: false,
          description: 'Statut de session (défaut: active, avec index)',
        },
        {
          name: 'warningCount',
          type: 'integer',
          nullable: false,
          description: "Nombre d'avertissements (défaut: 0)",
        },
        {
          name: 'forcedLogoutBy',
          type: 'uuid',
          nullable: true,
          description: "ID de l'admin qui a forcé la déconnexion",
        },
        {
          name: 'forcedLogoutReason',
          type: 'text',
          nullable: true,
          description: 'Raison de la déconnexion forcée',
        },
        {
          name: 'metadata',
          type: 'jsonb',
          nullable: true,
          description: 'Métadonnées additionnelles',
        },
        { name: 'createdAt', type: 'timestamp', nullable: false, description: 'Date de création' },
        {
          name: 'updatedAt',
          type: 'timestamp',
          nullable: false,
          description: 'Date de mise à jour',
        },
      ]

      // Vérifier les colonnes manquantes
      const actualColumnNames = columns.map((col) => col.column_name)
      const missingColumns = expectedColumns.filter(
        (expected) => !actualColumnNames.includes(expected.name)
      )

      if (missingColumns.length > 0) {
        console.log('\n❌ COLONNES MANQUANTES:')
        missingColumns.forEach((col) => {
          console.log(`   • ${col.name} (${col.type}) - ${col.description}`)
        })
      }

      // Vérifier les colonnes supplémentaires (qui ne sont pas dans l'entité)
      const expectedColumnNames = expectedColumns.map((col) => col.name)
      const extraColumns = columns.filter(
        (actual) => !expectedColumnNames.includes(actual.column_name)
      )

      if (extraColumns.length > 0) {
        console.log("\n⚠️  COLONNES SUPPLÉMENTAIRES (non définies dans l'entité):")
        extraColumns.forEach((col) => {
          console.log(`   • ${col.column_name} (${col.data_type})`)
        })
      }

      // Vérifier les différences de types/contraintes
      console.log('\n===== VÉRIFICATION DES TYPES ET CONTRAINTES =====')
      let typeMismatches = 0

      expectedColumns.forEach((expected) => {
        const actual = columns.find((col) => col.column_name === expected.name)
        if (actual) {
          // Vérification simplifiée des types (peut être étendue)
          const actualType = actual.data_type
          const expectedType = expected.type.split('(')[0] // Enlever la longueur pour la comparaison

          if (
            actualType !== expectedType &&
            !(actualType === 'character varying' && expectedType === 'varchar') &&
            !(actualType === 'timestamp without time zone' && expectedType === 'timestamp')
          ) {
            console.log(
              `   ⚠️  ${expected.name}: type attendu '${expected.type}', trouvé '${actualType}'`
            )
            typeMismatches++
          }
        }
      })

      if (typeMismatches === 0) {
        console.log('✅ Tous les types de colonnes correspondent')
      }

      // 4. Analyser les index
      console.log('\n===== INDEX EXISTANTS =====')
      const indexes: IndexInfo[] = await this.dataSource.query(`
        SELECT indexname, indexdef
        FROM pg_indexes 
        WHERE tablename = 'user_sessions'
        ORDER BY indexname;
      `)

      indexes.forEach((idx) => {
        console.log(`• ${idx.indexname}`)
        console.log(`  ${idx.indexdef}`)
      })

      // Vérifier les index manquants attendus
      const expectedIndexes = [
        'userId (FK index)',
        'sessionId (unique index)',
        'loginTime (index)',
        'lastActivity (index)',
        'isActive (index)',
        'status (index)',
      ]

      console.log('\n===== INDEX ATTENDUS =====')
      expectedIndexes.forEach((idx) => {
        console.log(`• ${idx}`)
      })

      // 5. Compter les enregistrements
      const countResult = await this.dataSource.query('SELECT COUNT(*) as count FROM user_sessions')
      const recordCount = parseInt(countResult[0].count)

      console.log(`\n===== STATISTIQUES =====`)
      console.log(`Nombre d'enregistrements: ${recordCount}`)

      if (recordCount > 0) {
        // Analyser quelques exemples de données
        const sampleData = await this.dataSource.query(`
          SELECT 
            id, 
            "userId",
            session_token,
            expires_at,
            ip_address,
            user_agent,
            created_at,
            status
          FROM user_sessions 
          ORDER BY created_at DESC 
          LIMIT 3
        `)

        console.log('\n===== ÉCHANTILLON DE DONNÉES =====')
        sampleData.forEach((row: any, index: number) => {
          console.log(`\nEnregistrement ${index + 1}:`)
          console.log(`  ID: ${row.id}`)
          console.log(`  User ID: ${row.userId || 'N/A'}`)
          console.log(
            `  Session Token: ${row.session_token ? row.session_token.substring(0, 20) + '...' : 'N/A'}`
          )
          console.log(`  Expires At: ${row.expires_at || 'N/A'}`)
          console.log(`  IP: ${row.ip_address || 'N/A'}`)
          console.log(
            `  User Agent: ${row.user_agent ? row.user_agent.substring(0, 50) + '...' : 'N/A'}`
          )
          console.log(`  Created: ${row.created_at}`)
          console.log(`  Status: ${row.status || 'N/A'}`)
        })
      }

      // 6. Résumé final
      console.log("\n===== RÉSUMÉ DE L'ANALYSE =====")
      console.log(`✅ Table existe: Oui`)
      console.log(`📊 Colonnes trouvées: ${columns.length}`)
      console.log(`📊 Colonnes attendues: ${expectedColumns.length}`)
      console.log(`❌ Colonnes manquantes: ${missingColumns.length}`)
      console.log(`⚠️  Colonnes supplémentaires: ${extraColumns.length}`)
      console.log(`🔍 Index trouvés: ${indexes.length}`)
      console.log(`📝 Enregistrements: ${recordCount}`)

      if (missingColumns.length > 0 || extraColumns.length > 0) {
        console.log("\n⚠️  La structure de la table ne correspond pas exactement à l'entité TypeORM")
        console.log('   Une migration pourrait être nécessaire pour synchroniser la structure.')
      } else {
        console.log("\n✅ La structure de la table correspond à l'entité TypeORM")
      }
    } catch (error) {
      console.error("❌ Erreur lors de l'analyse:", error)
    } finally {
      if (this.dataSource?.isInitialized) {
        await this.dataSource.destroy()
        console.log('\n🔌 Connexion fermée')
      }
    }
  }
}

// Exécution du script
async function main() {
  const analyzer = new UserSessionsTableAnalyzer()
  await analyzer.analyzeUserSessionsTable()
}

if (require.main === module) {
  main()
    .then(() => {
      console.log('\n✅ Analyse terminée')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Erreur fatale:', error)
      process.exit(1)
    })
}

export { UserSessionsTableAnalyzer }
