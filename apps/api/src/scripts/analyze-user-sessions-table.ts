#!/usr/bin/env ts-node

/**
 * Script d'analyse de la structure de la table user_sessions
 * Comparaison entre la structure actuelle en BD et celle définie dans l'entité TypeORM
 */

import { join } from 'node:path'
import { ConfigService } from '@nestjs/config'
import { config } from 'dotenv'
import { DataSource } from 'typeorm'
import { authDataSourceOptions } from '../core/database/data-source-auth'

// Charger le .env depuis la racine du projet
config({ path: join(__dirname, '../../../../.env') })

const _configService = new ConfigService()

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
    try {
      // Connexion à la base de données d'authentification
      await this.dataSource.initialize()

      // 1. Vérifier l'existence de la table
      const tableExists = await this.dataSource.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'user_sessions'
        );
      `)

      if (!tableExists[0].exists) {
        return
      }

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

      columns.forEach((col) => {
        const _name = col.column_name.padEnd(25)
        const _type = col.data_type.padEnd(20)
        const _nullable = col.is_nullable.padEnd(10)
        const _defaultVal = (col.column_default || 'NULL').padEnd(20)
        const _length = col.character_maximum_length ? col.character_maximum_length.toString() : ''
      })

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
        missingColumns.forEach((_col) => {})
      }

      // Vérifier les colonnes supplémentaires (qui ne sont pas dans l'entité)
      const expectedColumnNames = expectedColumns.map((col) => col.name)
      const extraColumns = columns.filter(
        (actual) => !expectedColumnNames.includes(actual.column_name)
      )

      if (extraColumns.length > 0) {
        extraColumns.forEach((_col) => {})
      }
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
            typeMismatches++
          }
        }
      })

      if (typeMismatches === 0) {
      }
      const indexes: IndexInfo[] = await this.dataSource.query(`
        SELECT indexname, indexdef
        FROM pg_indexes 
        WHERE tablename = 'user_sessions'
        ORDER BY indexname;
      `)

      indexes.forEach((_idx) => {})

      // Vérifier les index manquants attendus
      const expectedIndexes = [
        'userId (FK index)',
        'sessionId (unique index)',
        'loginTime (index)',
        'lastActivity (index)',
        'isActive (index)',
        'status (index)',
      ]
      expectedIndexes.forEach((_idx) => {})

      // 5. Compter les enregistrements
      const countResult = await this.dataSource.query('SELECT COUNT(*) as count FROM user_sessions')
      const recordCount = parseInt(countResult[0].count)

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
        sampleData.forEach((_row: any, _index: number) => {})
      }

      if (missingColumns.length > 0 || extraColumns.length > 0) {
      } else {
      }
    } catch (_error) {
    } finally {
      if (this.dataSource?.isInitialized) {
        await this.dataSource.destroy()
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
      process.exit(0)
    })
    .catch((_error) => {
      process.exit(1)
    })
}

export { UserSessionsTableAnalyzer }
