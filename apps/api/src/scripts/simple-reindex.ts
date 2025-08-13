/**
 * Script simple de réindexation
 */

import { Logger } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { AppModule } from '../app/app.module'
import { GlobalSearchService } from '../features/search/services/global-search.service'

async function bootstrap() {
  const logger = new Logger('SimpleReindex')

  try {
    logger.log('🚀 Démarrage de la réindexation simple...')

    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: ['log', 'error', 'warn'],
    })

    const searchService = app.get(GlobalSearchService)

    // Réindexer avec tenantId=1 (société par défaut)
    logger.log('📚 Réindexation avec tenantId=1...')
    const count = await searchService.reindexAll('1')

    logger.log(`✅ Réindexation terminée: ${count} documents indexés`)

    // Tester la recherche
    logger.log('🔍 Test de recherche pour "IPE"...')
    const testResult = await searchService.search({
      query: 'IPE',
      limit: 5,
      tenantId: '1',
    })

    logger.log(`✅ Test de recherche: ${testResult.total} résultats trouvés`)
    logger.log('Moteur utilisé:', testResult.searchEngine)

    if (testResult.results.length > 0) {
      logger.log('📄 Premiers résultats:')
      testResult.results.slice(0, 3).forEach((result) => {
        logger.log(`  - ${result.type}: ${result.title}`)
      })
    }

    await app.close()
    process.exit(0)
  } catch (error) {
    logger.error('❌ Erreur lors de la réindexation:', error)
    process.exit(1)
  }
}

bootstrap()
