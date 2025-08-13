/**
 * Script pour tester la recherche directement sans authentification
 */

import { Logger } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { AppModule } from '../app/app.module'
import { GlobalSearchService } from '../features/search/services/global-search.service'

async function testSearchDirectly() {
  const logger = new Logger('TestSearchDirectly')

  logger.log('🔍 Test direct de la recherche (sans auth)...')

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  })

  try {
    const searchService = app.get(GlobalSearchService)

    // Vérifier le statut
    const status = searchService.getSearchEngineStatus()
    logger.log(`\n📊 Moteur de recherche actuel: ${status.engine}`)

    const tenantId = '73416fa9-f693-42f6-99d3-7c919cefe4d5'

    // Test principal: Recherche "IPE 300"
    logger.log('\n🔎 Recherche "IPE 300" avec tenantId TopSteel')
    logger.log(`TenantId: ${tenantId}`)

    const result = await searchService.search({
      query: 'IPE 300',
      tenantId: tenantId,
      limit: 10,
    })

    logger.log(`\n✅ RÉSULTATS:`)
    logger.log(`  Total trouvé: ${result.total} documents`)
    logger.log(`  Moteur utilisé: ${result.searchEngine}`)
    logger.log(`  Temps: ${result.took}ms`)

    if (result.results.length > 0) {
      logger.log(`\n📦 Top 5 résultats:`)
      result.results.slice(0, 5).forEach((r, i) => {
        logger.log(`  ${i + 1}. ${r.title}`)
        logger.log(`     Type: ${r.type}`)
        logger.log(`     Score: ${r.score}`)
        if (r.description) {
          logger.log(`     Description: ${r.description.substring(0, 100)}...`)
        }
        logger.log('')
      })
    } else {
      logger.warn('⚠️ Aucun résultat trouvé')
    }

    // Test 2: Recherche plus large "IPE"
    logger.log('\n🔎 Recherche "IPE" (plus large)')
    const result2 = await searchService.search({
      query: 'IPE',
      tenantId: tenantId,
      limit: 5,
    })

    logger.log(`  Total trouvé: ${result2.total} documents`)

    // Test 3: Vérifier les facettes
    if (result.facets?.types) {
      logger.log('\n📊 Distribution par type:')
      result.facets.types.forEach((facet: any) => {
        logger.log(`  - ${facet.value}: ${facet.count} documents`)
      })
    }

    logger.log('\n✅ Test terminé avec succès!')
  } catch (error) {
    logger.error('❌ Erreur lors du test:', error)
  } finally {
    await app.close()
    process.exit(0)
  }
}

// Définir les variables d'environnement
process.env.ELASTICSEARCH_USERNAME = 'elastic'
process.env.ELASTICSEARCH_PASSWORD = 'ogAceYjRKTIMmACWwhRA'

testSearchDirectly()
