/**
 * Script pour tester la recherche PostgreSQL directement
 */

import { Logger } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { AppModule } from '../app/app.module'
import { GlobalSearchService } from '../features/search/services/global-search.service'

async function testPostgreSQLSearch() {
  const logger = new Logger('TestPostgreSQLSearch')

  try {
    logger.log('🔍 Test de recherche PostgreSQL...')

    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: false,
    })

    const searchService = app.get(GlobalSearchService)

    // Vérifier le statut
    const status = searchService.getSearchEngineStatus()
    logger.log(`Moteur de recherche: ${status.engine}`)
    logger.log(`Info: ${status.info}`)

    // Test 1: Recherche "IPE 300"
    logger.log('\n🔎 Test 1: Recherche "IPE 300"')
    const result1 = await searchService.search({
      query: 'IPE 300',
      tenantId: '73416fa9-f693-42f6-99d3-7c919cefe4d5',
      limit: 10,
    })

    logger.log(`Résultats trouvés: ${result1.total}`)
    logger.log(`Moteur utilisé: ${result1.searchEngine}`)
    logger.log(`Temps de recherche: ${result1.took}ms`)

    if (result1.results.length > 0) {
      logger.log('Premiers résultats:')
      result1.results.slice(0, 3).forEach((r) => {
        logger.log(`  - ${r.title} (${r.type})`)
      })
    }

    // Test 2: Recherche "IPE"
    logger.log('\n🔎 Test 2: Recherche "IPE"')
    const result2 = await searchService.search({
      query: 'IPE',
      tenantId: '73416fa9-f693-42f6-99d3-7c919cefe4d5',
      limit: 10,
    })

    logger.log(`Résultats trouvés: ${result2.total}`)

    if (result2.results.length > 0) {
      logger.log('Premiers résultats:')
      result2.results.slice(0, 3).forEach((r) => {
        logger.log(`  - ${r.title} (${r.type})`)
      })
    }

    // Test 3: Recherche sans tenantId (pour voir tous les résultats)
    logger.log('\n🔎 Test 3: Recherche "IPE" sans tenantId')
    const result3 = await searchService.search({
      query: 'IPE',
      limit: 10,
    })

    logger.log(`Résultats trouvés: ${result3.total}`)

    if (result3.results.length > 0) {
      logger.log('Premiers résultats:')
      result3.results.slice(0, 3).forEach((r) => {
        logger.log(`  - ${r.title} (${r.type})`)
      })
    }

    // Test 4: Recherche d'articles spécifiquement
    logger.log('\n🔎 Test 4: Recherche d\'articles avec "IPE"')
    const result4 = await searchService.search({
      query: 'IPE',
      types: ['article'],
      tenantId: '73416fa9-f693-42f6-99d3-7c919cefe4d5',
      limit: 10,
    })

    logger.log(`Articles trouvés: ${result4.total}`)

    if (result4.results.length > 0) {
      logger.log('Premiers articles:')
      result4.results.slice(0, 3).forEach((r) => {
        logger.log(`  - ${r.title} (${r.description || 'pas de description'})`)
      })
    }

    await app.close()
    process.exit(0)
  } catch (error) {
    logger.error('❌ Erreur:', error)
    process.exit(1)
  }
}

testPostgreSQLSearch()
