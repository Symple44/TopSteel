#!/usr/bin/env ts-node
/**
 * Script de vérification de l'état de la base de données
 * Usage: npm run db:check
 */

import { DataSource } from 'typeorm'
import { Logger } from '@nestjs/common'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Charger les variables d'environnement
dotenv.config({ path: path.join(__dirname, '../../../../.env.local') })

const logger = new Logger('DatabaseCheck')

async function checkDatabase() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'erp_topsteel',
  })

  try {
    await dataSource.initialize()
    logger.log('✅ Connexion à la base de données établie')

    // Vérifier les tables
    const tables = await dataSource.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `)
    logger.log(`📊 ${tables.length} tables trouvées`)
    
    // Vérifier les index problématiques
    const problematicIndexes = await dataSource.query(`
      SELECT indexname, tablename
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND indexname LIKE 'IDX_%'
      AND length(indexname) = 34
    `)
    
    if (problematicIndexes.length > 0) {
      logger.warn(`⚠️  ${problematicIndexes.length} index auto-générés détectés:`)
      problematicIndexes.forEach((idx: any) => {
        logger.warn(`   - ${idx.indexname} sur ${idx.tablename}`)
      })
    }

    // Vérifier les contraintes uniques
    const uniqueConstraints = await dataSource.query(`
      SELECT conname, conrelid::regclass as table_name
      FROM pg_constraint
      WHERE contype = 'u'
      AND connamespace = (
        SELECT oid FROM pg_namespace WHERE nspname = 'public'
      )
    `)
    logger.log(`🔐 ${uniqueConstraints.length} contraintes uniques trouvées`)

    // Vérifier les types ENUM
    const enums = await dataSource.query(`
      SELECT typname 
      FROM pg_type 
      WHERE typtype = 'e' 
      AND typnamespace = (
        SELECT oid FROM pg_namespace WHERE nspname = 'public'
      )
    `)
    logger.log(`📝 ${enums.length} types ENUM trouvés`)

    // Vérifier l'index spécifique problématique
    const specificIndex = await dataSource.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE indexname = 'IDX_e4a5a4bcd15ca9eedd81916638'
    `)
    
    if (specificIndex.length > 0) {
      logger.error(`❌ L'index problématique IDX_e4a5a4bcd15ca9eedd81916638 existe encore!`)
    }

    // Afficher un résumé
    logger.log('\n📋 RÉSUMÉ:')
    logger.log(`   Tables: ${tables.length}`)
    logger.log(`   Index auto-générés: ${problematicIndexes.length}`)
    logger.log(`   Contraintes uniques: ${uniqueConstraints.length}`)
    logger.log(`   Types ENUM: ${enums.length}`)
    
    if (problematicIndexes.length > 0 || specificIndex.length > 0) {
      logger.warn('\n⚠️  Des problèmes ont été détectés.')
      logger.warn('Exécutez "npm run db:reset" pour réinitialiser la base.')
    } else {
      logger.log('\n✅ La base de données semble en bon état!')
    }

    await dataSource.destroy()
  } catch (error) {
    logger.error('❌ Erreur lors de la vérification:', error)
    process.exit(1)
  }
}

checkDatabase()