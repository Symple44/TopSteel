/**
 * Script de diagnostic pour comprendre pourquoi la recherche ne fonctionne pas
 */

import { NestFactory } from '@nestjs/core'
import { AppModule } from '../app/app.module'
import { Client } from '@elastic/elasticsearch'
import { Logger } from '@nestjs/common'

async function diagnose() {
  const logger = new Logger('DiagnoseSearch')
  
  try {
    logger.log('🔍 Diagnostic du système de recherche...')
    
    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: false,
    })

    // Obtenir le client ElasticSearch directement
    const searchService = app.get('GlobalSearchService')
    const elasticsearchClient = (searchService as any).elasticsearchStrategy?.client as Client
    
    if (!elasticsearchClient) {
      logger.error('Client ElasticSearch non disponible')
      await app.close()
      return
    }

    // 1. Vérifier le nombre total de documents
    logger.log('\n📊 Statistiques de l\'index:')
    const stats = await elasticsearchClient.indices.stats({ index: 'topsteel_global' })
    const docCount = stats._all.primaries.docs.count
    logger.log(`  Nombre total de documents: ${docCount}`)
    
    // 2. Récupérer quelques documents pour voir leur structure
    logger.log('\n📄 Échantillon de documents:')
    const sample = await elasticsearchClient.search({
      index: 'topsteel_global',
      size: 3,
      query: { match_all: {} }
    })
    
    if (sample.hits.hits.length > 0) {
      sample.hits.hits.forEach((hit: any, i) => {
        logger.log(`\nDocument ${i + 1}:`)
        logger.log(`  ID: ${hit._id}`)
        logger.log(`  Type: ${hit._source.type}`)
        logger.log(`  Title: ${hit._source.title}`)
        logger.log(`  TenantId: ${hit._source.tenantId}`)
        logger.log(`  Reference: ${hit._source.reference}`)
        logger.log(`  Designation: ${hit._source.designation}`)
      })
    }
    
    // 3. Recherche directe pour "IPE" sans aucun filtre
    logger.log('\n🔎 Recherche "IPE" sans filtre:')
    const ipeSearchNoFilter = await elasticsearchClient.search({
      index: 'topsteel_global',
      size: 5,
      query: {
        query_string: {
          query: '*IPE*',
          fields: ['title', 'designation', 'reference', 'description']
        }
      }
    })
    const totalNoFilter = typeof ipeSearchNoFilter.hits.total === 'object' 
      ? ipeSearchNoFilter.hits.total.value 
      : ipeSearchNoFilter.hits.total
    logger.log(`  Résultats trouvés: ${totalNoFilter}`)
    
    // 4. Recherche avec multi_match comme dans l'API
    logger.log('\n🔎 Recherche "IPE 300" avec multi_match:')
    const ipeSearchMulti = await elasticsearchClient.search({
      index: 'topsteel_global',
      size: 5,
      query: {
        multi_match: {
          query: 'IPE 300',
          fields: ['title^3', 'designation^3', 'reference^2', 'description'],
          type: 'best_fields',
          fuzziness: 'AUTO'
        }
      }
    })
    const totalMulti = typeof ipeSearchMulti.hits.total === 'object' 
      ? ipeSearchMulti.hits.total.value 
      : ipeSearchMulti.hits.total
    logger.log(`  Résultats trouvés: ${totalMulti}`)
    
    if (ipeSearchMulti.hits.hits.length > 0) {
      logger.log('  Premiers résultats:')
      ipeSearchMulti.hits.hits.forEach((hit: any) => {
        logger.log(`    - ${hit._source.title || hit._source.designation} (score: ${hit._score})`)
      })
    }
    
    // 5. Recherche avec le filtre tenantId exact
    const tenantId = '73416fa9-f693-42f6-99d3-7c919cefe4d5'
    logger.log(`\n🔎 Recherche "IPE" avec tenantId=${tenantId}:`)
    const ipeSearchWithTenant = await elasticsearchClient.search({
      index: 'topsteel_global',
      size: 5,
      query: {
        bool: {
          must: [
            {
              query_string: {
                query: '*IPE*',
                fields: ['title', 'designation', 'reference']
              }
            }
          ],
          filter: [
            {
              bool: {
                should: [
                  { term: { tenantId } },
                  { bool: { must_not: { exists: { field: 'tenantId' } } } }
                ]
              }
            }
          ]
        }
      }
    })
    const totalWithTenant = typeof ipeSearchWithTenant.hits.total === 'object' 
      ? ipeSearchWithTenant.hits.total.value 
      : ipeSearchWithTenant.hits.total
    logger.log(`  Résultats trouvés: ${totalWithTenant}`)
    
    // 6. Vérifier les valeurs uniques de tenantId
    logger.log('\n📊 Distribution des tenantId:')
    const tenantAgg = await elasticsearchClient.search({
      index: 'topsteel_global',
      size: 0,
      aggs: {
        tenants: {
          terms: {
            field: 'tenantId',
            size: 10
          }
        }
      }
    })
    
    const buckets = (tenantAgg.aggregations?.tenants as any)?.buckets || []
    if (buckets.length > 0) {
      buckets.forEach((bucket: any) => {
        logger.log(`  ${bucket.key}: ${bucket.doc_count} documents`)
      })
    } else {
      logger.log('  Aucun tenantId trouvé ou non indexé comme keyword')
    }
    
    // 7. Vérifier le mapping de l'index
    logger.log('\n📋 Mapping de l\'index:')
    const mapping = await elasticsearchClient.indices.getMapping({ index: 'topsteel_global' })
    const properties = mapping.topsteel_global.mappings.properties
    logger.log('  Champs principaux:')
    Object.keys(properties).slice(0, 10).forEach(field => {
      const fieldType = properties[field].type
      logger.log(`    - ${field}: ${fieldType}`)
    })
    
    await app.close()
  } catch (error) {
    logger.error('❌ Erreur:', error)
  }
}

diagnose()