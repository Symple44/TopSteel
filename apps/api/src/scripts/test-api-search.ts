/**
 * Script pour tester la recherche via l'API
 */

import { NestFactory } from '@nestjs/core'
import { AppModule } from '../app/app.module'
import { GlobalSearchService } from '../features/search/services/global-search.service'
import { Logger } from '@nestjs/common'

async function testAPISearch() {
  const logger = new Logger('TestAPISearch')
  
  try {
    logger.log('🔍 Test de recherche via l\'API...')
    
    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: false,
    })

    const searchService = app.get(GlobalSearchService)
    
    // Vérifier le statut
    const status = searchService.getSearchEngineStatus()
    logger.log(`\n📊 Statut du moteur de recherche:`)
    logger.log(`  Moteur: ${status.engine}`)
    logger.log(`  Info: ${status.info}`)
    
    const tenantId = '73416fa9-f693-42f6-99d3-7c919cefe4d5'
    
    // Test 1: Recherche "IPE 300"
    logger.log('\n🔎 Test 1: Recherche "IPE 300" avec tenantId')
    const result1 = await searchService.search({
      query: 'IPE 300',
      tenantId: tenantId,
      limit: 10
    })
    
    logger.log(`  Résultats trouvés: ${result1.total}`)
    logger.log(`  Moteur utilisé: ${result1.searchEngine}`)
    logger.log(`  Temps de recherche: ${result1.took}ms`)
    
    if (result1.results.length > 0) {
      logger.log('  Top 5 résultats:')
      result1.results.slice(0, 5).forEach((r, i) => {
        logger.log(`    ${i + 1}. ${r.title} (${r.type}) - Score: ${r.score}`)
      })
    }
    
    // Test 2: Recherche "IPE" seul
    logger.log('\n🔎 Test 2: Recherche "IPE" avec tenantId')
    const result2 = await searchService.search({
      query: 'IPE',
      tenantId: tenantId,
      limit: 5
    })
    
    logger.log(`  Résultats trouvés: ${result2.total}`)
    
    if (result2.results.length > 0) {
      logger.log('  Premiers résultats:')
      result2.results.forEach((r, i) => {
        logger.log(`    ${i + 1}. ${r.title}`)
      })
    }
    
    // Test 3: Recherche d'articles uniquement
    logger.log('\n🔎 Test 3: Recherche "IPE 300" - Articles uniquement')
    const result3 = await searchService.search({
      query: 'IPE 300',
      types: ['article'],
      tenantId: tenantId,
      limit: 5
    })
    
    logger.log(`  Articles trouvés: ${result3.total}`)
    
    if (result3.results.length > 0) {
      logger.log('  Articles IPE 300:')
      result3.results.forEach((r, i) => {
        logger.log(`    ${i + 1}. ${r.title}`)
        if (r.description) {
          logger.log(`       Description: ${r.description}`)
        }
      })
    }
    
    // Test 4: Recherche sans query (tous les documents)
    logger.log('\n📊 Statistiques globales')
    const stats = await searchService.getSearchStatistics()
    logger.log(`  Moteur: ${stats.engine.engine}`)
    logger.log(`  Entités configurées: ${stats.entities.length}`)
    logger.log('  Types disponibles:')
    stats.entities.forEach((e: any) => {
      logger.log(`    - ${e.name} (${e.type})`)
    })
    
    await app.close()
    logger.log('\n✅ Tests terminés avec succès!')
    process.exit(0)
  } catch (error) {
    logger.error('❌ Erreur:', error)
    process.exit(1)
  }
}

testAPISearch()