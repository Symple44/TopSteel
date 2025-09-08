/**
 * Script pour vérifier le contenu d'ElasticSearch
 */

import { Client } from '@elastic/elasticsearch'

async function checkElasticsearch() {
  const client = new Client({
    node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
    auth: {
      username: 'elastic',
      password: 'elastic123',
    },
  })

  try {
    console.log("🔍 Vérification du contenu d'ElasticSearch...\n")

    // Vérifier le nombre total de documents
    const count = await client.count({
      index: 'topsteel_global',
    })
    console.log(`📊 Nombre total de documents: ${count.count}\n`)

    // Récupérer quelques documents pour voir leur structure
    const sample = await client.search({
      index: 'topsteel_global',
      size: 3,
      query: {
        match_all: {},
      },
    })

    console.log('📄 Exemples de documents:')
    sample.hits.hits.forEach((hit: unknown, index) => {
      console.log(`\nDocument ${index + 1}:`)
      console.log('  Type:', hit._source.type)
      console.log('  Title:', hit._source.title)
      console.log('  TenantId:', hit._source.tenantId)
      console.log('  ID:', hit._source.id)
    })

    // Rechercher spécifiquement IPE
    console.log('\n🔎 Recherche de "IPE" sans filtre tenantId:')
    const ipeSearch = await client.search({
      index: 'topsteel_global',
      size: 5,
      query: {
        multi_match: {
          query: 'IPE',
          fields: ['title', 'description', 'reference', 'designation'],
        },
      },
    })

    console.log(`Résultats trouvés: ${ipeSearch.hits.total.value}`)
    if (ipeSearch.hits.hits.length > 0) {
      console.log('Premiers résultats:')
      ipeSearch.hits.hits.forEach((hit: unknown) => {
        console.log(`  - ${hit._source.title} (tenantId: ${hit._source.tenantId})`)
      })
    }

    // Vérifier les valeurs uniques de tenantId
    console.log('\n📊 Valeurs uniques de tenantId:')
    const tenantAgg = await client.search({
      index: 'topsteel_global',
      size: 0,
      aggs: {
        tenants: {
          terms: {
            field: 'tenantId',
            size: 10,
          },
        },
      },
    })

    const tenantBuckets = tenantAgg.aggregations?.tenants?.buckets || []
    if (tenantBuckets.length > 0) {
      tenantBuckets.forEach((bucket: unknown) => {
        console.log(`  - ${bucket.key}: ${bucket.doc_count} documents`)
      })
    } else {
      console.log('  Aucun tenantId trouvé')
    }
  } catch (error) {
    console.error('❌ Erreur:', error)
  }
}

checkElasticsearch()
