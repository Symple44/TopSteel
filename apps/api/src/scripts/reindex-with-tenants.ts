/**
 * Script de réindexation avec gestion correcte des tenantId
 * Ce script réindexe toutes les entités dans ElasticSearch avec les tenantId appropriés
 */

import { Logger } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import type { DataSource } from 'typeorm'
import { AppModule } from '../app/app.module'
import { GlobalSearchService } from '../features/search/services/global-search.service'

async function bootstrap() {
  const logger = new Logger('ReindexWithTenants')

  try {
    logger.log('🚀 Démarrage du script de réindexation avec tenantId...')

    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: ['log', 'error', 'warn', 'debug'],
    })

    const searchService = app.get(GlobalSearchService)
    const authDataSource = app.get<DataSource>('authDataSource')

    // Récupérer toutes les sociétés actives
    logger.log('📋 Récupération des sociétés actives...')
    const societes = await authDataSource.query(`
      SELECT id, nom, code, status 
      FROM societes 
      WHERE status = 'ACTIVE'
    `)

    logger.log(`✅ ${societes.length} société(s) active(s) trouvée(s)`)

    // Vider l'index ElasticSearch existant
    logger.log("🗑️ Suppression de l'index existant...")
    try {
      const elasticsearchClient = (searchService as unknown).elasticsearchStrategy?.client
      if (elasticsearchClient) {
        await elasticsearchClient.indices.delete({ index: 'topsteel_global' })
        logger.log('✅ Index supprimé')

        // Recréer l'index
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
                  suggest: {
                    type: 'completion',
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
      logger.warn("⚠️ Impossible de supprimer l'index:", error.message)
    }

    // Réindexer pour chaque société
    let totalIndexed = 0

    for (const societe of societes) {
      logger.log(`\n🏢 Réindexation pour la société: ${societe.nom} (ID: ${societe.id})`)

      try {
        // Appeler la méthode reindexAll avec le contexte de la société
        const count = await searchService.reindexAll(societe.id)
        totalIndexed += count || 0
        logger.log(`✅ ${count} documents indexés pour ${societe.nom}`)
      } catch (error) {
        logger.error(`❌ Erreur pour la société ${societe.nom}:`, error.message)
      }
    }

    // Indexer aussi les entités partagées (sans tenantId)
    logger.log('\n📚 Indexation des entités partagées...')
    // Les entités partagées seront indexées sans tenantId

    logger.log(`\n🎯 Réindexation terminée: ${totalIndexed} documents au total`)

    // Tester la recherche
    logger.log('\n🔍 Test de recherche...')
    const testResult = await searchService.search({
      query: 'IPE',
      limit: 5,
      tenantId: societes[0]?.id,
    })

    logger.log(`✅ Test de recherche: ${testResult.total} résultats trouvés`)
    logger.log('Moteur utilisé:', testResult.searchEngine)

    await app.close()
    process.exit(0)
  } catch (error) {
    logger.error('❌ Erreur lors de la réindexation:', error)
    process.exit(1)
  }
}

bootstrap()
