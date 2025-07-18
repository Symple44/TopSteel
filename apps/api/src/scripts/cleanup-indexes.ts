import { NestFactory } from '@nestjs/core'
import { AppModule } from '../app.module'
import { DataSource } from 'typeorm'
import { Logger } from '@nestjs/common'

const logger = new Logger('CleanupIndexes')

async function cleanupIndexes() {
  const app = await NestFactory.createApplicationContext(AppModule)
  const dataSource = app.get(DataSource)

  try {
    logger.log('🧹 Nettoyage des index problématiques...')

    // Liste des index à supprimer
    const indexesToDrop = [
      'IDX_97672ac88f789774dd47f7c8be3',
      'IDX_e4a5a4bcd15ca9eedd81916638'
    ]

    // Rechercher et supprimer tous les index TypeORM générés automatiquement sur la table users
    const userIndexes = await dataSource.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'users' 
      AND indexname LIKE 'IDX_%'
      AND indexname != 'users_pkey'
    `)

    logger.log(`${userIndexes.length} index trouvés sur la table users`)

    for (const idx of userIndexes) {
      indexesToDrop.push(idx.indexname)
    }

    // Supprimer les index
    for (const indexName of indexesToDrop) {
      try {
        logger.log(`Suppression de l'index ${indexName}...`)
        await dataSource.query(`DROP INDEX IF EXISTS "${indexName}" CASCADE`)
        logger.log(`✅ Index ${indexName} supprimé`)
      } catch (error: any) {
        logger.warn(`⚠️ Impossible de supprimer ${indexName}: ${error.message}`)
      }
    }

    // Recréer proprement les index nécessaires
    logger.log('\n📝 Recréation des index nécessaires...')

    // Index unique sur email dans users
    try {
      await dataSource.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS "users_email_unique" 
        ON "users" ("email")
      `)
      logger.log('✅ Index unique sur users.email créé')
    } catch (error: any) {
      logger.warn(`⚠️ Erreur création index email: ${error.message}`)
    }

    // Vérifier le résultat
    const remainingIndexes = await dataSource.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE indexname IN (${indexesToDrop.map(i => `'${i}'`).join(',')})
    `)

    if (remainingIndexes.length === 0) {
      logger.log('\n✅ Tous les index problématiques ont été supprimés')
    } else {
      logger.warn(`\n⚠️ ${remainingIndexes.length} index problématiques restants`)
    }

  } catch (error) {
    logger.error('❌ Erreur lors du nettoyage:', error)
  } finally {
    await app.close()
  }
}

cleanupIndexes()