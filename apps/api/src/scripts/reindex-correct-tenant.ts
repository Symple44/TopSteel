/**
 * Script de réindexation avec le bon tenantId
 */

import { Logger } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import type { DataSource } from 'typeorm'
import { AppModule } from '../app/app.module'
import { GlobalSearchService } from '../features/search/services/global-search.service'

async function bootstrap() {
  const logger = new Logger('ReindexCorrectTenant')

  try {
    logger.log('🚀 Démarrage de la réindexation avec le bon tenantId...')

    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: ['log', 'error', 'warn'],
    })

    const searchService = app.get(GlobalSearchService)
    const authDataSource = app.get<DataSource>('authDataSource')

    // Récupérer la première société active
    logger.log('📋 Récupération de la société active...')
    const societes = await authDataSource.query(`
      SELECT id, nom, code, status 
      FROM societes 
      WHERE status = 'ACTIVE'
      LIMIT 1
    `)

    if (societes.length === 0) {
      logger.error('Aucune société active trouvée')
      await app.close()
      process.exit(1)
    }

    const societe = societes[0]
    logger.log(`✅ Société trouvée: ${societe.nom} (ID: ${societe.id})`)

    // Supprimer l'index existant et le recréer
    logger.log("🗑️ Suppression de l'index existant...")
    try {
      const elasticsearchClient = (searchService as any).elasticsearchStrategy?.client
      if (elasticsearchClient) {
        try {
          await elasticsearchClient.indices.delete({ index: 'topsteel_global' })
          logger.log('✅ Index supprimé')
        } catch (_e) {
          logger.log("ℹ️ Index n'existait pas")
        }

        // Recréer l'index avec le bon mapping
        await elasticsearchClient.indices.create({
          index: 'topsteel_global',
          settings: {
            analysis: {
              analyzer: {
                french_analyzer: {
                  type: 'standard',
                  stopwords: '_french_',
                },
              },
            },
          },
          mappings: {
            properties: {
              title: {
                type: 'text',
                analyzer: 'french_analyzer',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              description: {
                type: 'text',
                analyzer: 'french_analyzer',
              },
              type: {
                type: 'keyword',
              },
              tenantId: {
                type: 'keyword',
              },
              id: {
                type: 'keyword',
              },
              designation: {
                type: 'text',
                analyzer: 'french_analyzer',
              },
              reference: {
                type: 'keyword',
              },
              url: {
                type: 'keyword',
              },
              icon: {
                type: 'keyword',
              },
              indexedAt: {
                type: 'date',
              },
            },
          },
        })
        logger.log('✅ Index recréé avec le mapping correct')
      }
    } catch (error) {
      logger.warn('⚠️ Problème avec ElasticSearch:', error.message)
    }

    // Réindexer avec le bon tenantId
    logger.log(`📚 Réindexation avec tenantId=${societe.id}...`)
    const count = await searchService.reindexAll(societe.id)

    logger.log(`✅ Réindexation terminée: ${count} documents indexés`)

    // Attendre un peu pour que l'index se rafraîchisse
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Tester la recherche avec le bon tenantId
    logger.log(`🔍 Test de recherche pour "IPE" avec tenantId=${societe.id}...`)
    const testResult = await searchService.search({
      query: 'IPE',
      limit: 5,
      tenantId: societe.id,
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
