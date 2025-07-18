import { NestFactory } from '@nestjs/core'
import { AppModule } from '../app.module'
import { DataSource } from 'typeorm'
import { Logger } from '@nestjs/common'

const logger = new Logger('AnalyzeIndexes')

async function analyzeIndexes() {
  const app = await NestFactory.createApplicationContext(AppModule)
  const dataSource = app.get(DataSource)

  try {
    logger.log('Analyse des index de la base de données...')

    // Récupérer tous les index
    const indexes = await dataSource.query(`
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `)

    logger.log(`${indexes.length} index trouvés`)

    // Rechercher les index potentiellement problématiques
    const problematicIndexes = indexes.filter((idx: any) => 
      idx.indexname.startsWith('IDX_') && idx.indexname.length === 33
    )

    logger.log(`\n${problematicIndexes.length} index avec hash TypeORM trouvés:`)
    
    for (const idx of problematicIndexes) {
      logger.log(`\nTable: ${idx.tablename}`)
      logger.log(`Index: ${idx.indexname}`)
      logger.log(`Definition: ${idx.indexdef}`)
    }

    // Rechercher spécifiquement l'index problématique
    const targetIndex = 'IDX_e4a5a4bcd15ca9eedd81916638'
    const found = indexes.find((idx: any) => idx.indexname === targetIndex)
    
    if (found) {
      logger.warn(`\n⚠️ Index problématique trouvé:`)
      logger.warn(`Table: ${found.tablename}`)
      logger.warn(`Definition: ${found.indexdef}`)
    } else {
      logger.log(`\n✅ Index ${targetIndex} non trouvé dans la base`)
    }

    // Analyser les colonnes uniques
    const uniqueConstraints = await dataSource.query(`
      SELECT 
        conname AS constraint_name,
        conrelid::regclass AS table_name,
        pg_get_constraintdef(oid) AS definition
      FROM pg_constraint
      WHERE contype = 'u'
      ORDER BY conrelid::regclass::text
    `)

    logger.log(`\n${uniqueConstraints.length} contraintes uniques trouvées`)

  } catch (error) {
    logger.error('Erreur lors de l\'analyse:', error)
  } finally {
    await app.close()
  }
}

analyzeIndexes()