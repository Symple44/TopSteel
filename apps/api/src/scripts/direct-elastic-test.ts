import { Client } from '@elastic/elasticsearch'

async function testElastic() {
  console.log('🔍 Test direct ElasticSearch...')
  
  const client = new Client({
    node: 'http://127.0.0.1:9200',
    auth: {
      username: 'elastic',
      password: 'ogAceYjRKTIMmACWwhRA'
    },
    maxRetries: 3,
    requestTimeout: 5000,
  })

  try {
    // 1. Vérifier la connexion
    const ping = await client.ping()
    console.log('✅ ElasticSearch connecté')

    // 2. Vérifier l'index
    const exists = await client.indices.exists({ index: 'topsteel_global' })
    console.log(`Index topsteel_global existe: ${exists}`)

    // 3. Compter les documents
    const count = await client.count({ index: 'topsteel_global' })
    console.log(`Nombre total de documents: ${count.count}`)

    // 4. Récupérer quelques documents
    console.log('\n📄 Échantillon de documents:')
    const sample = await client.search({
      index: 'topsteel_global',
      size: 3,
      query: { match_all: {} }
    })
    
    console.log(`Total hits: ${typeof sample.hits.total === 'object' ? sample.hits.total.value : sample.hits.total}`)
    
    if (sample.hits.hits.length > 0) {
      sample.hits.hits.forEach((hit: any, i) => {
        console.log(`\nDocument ${i + 1}:`)
        console.log(`  ID: ${hit._id}`)
        console.log(`  Type: ${hit._source.type}`)
        console.log(`  Title: ${hit._source.title}`)
        console.log(`  TenantId: ${hit._source.tenantId}`)
        if (hit._source.designation) {
          console.log(`  Designation: ${hit._source.designation}`)
        }
        if (hit._source.reference) {
          console.log(`  Reference: ${hit._source.reference}`)
        }
      })
    }

    // 5. Rechercher "IPE" sans filtre
    console.log('\n🔎 Recherche "IPE" sans filtre:')
    const ipeSearch = await client.search({
      index: 'topsteel_global',
      size: 5,
      query: {
        query_string: {
          query: '*IPE*',
          fields: ['title', 'designation', 'reference', 'description']
        }
      }
    })
    
    const ipeTotal = typeof ipeSearch.hits.total === 'object' 
      ? ipeSearch.hits.total.value 
      : ipeSearch.hits.total
    console.log(`  Résultats trouvés: ${ipeTotal}`)
    
    if (ipeSearch.hits.hits.length > 0) {
      console.log('  Premiers résultats:')
      ipeSearch.hits.hits.forEach((hit: any) => {
        console.log(`    - ${hit._source.title || hit._source.designation} (type: ${hit._source.type})`)
      })
    }

    // 6. Recherche avec multi_match comme l'API
    console.log('\n🔎 Recherche "IPE 300" avec multi_match:')
    const multiSearch = await client.search({
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
    
    const multiTotal = typeof multiSearch.hits.total === 'object' 
      ? multiSearch.hits.total.value 
      : multiSearch.hits.total
    console.log(`  Résultats trouvés: ${multiTotal}`)
    
    if (multiSearch.hits.hits.length > 0) {
      console.log('  Premiers résultats:')
      multiSearch.hits.hits.forEach((hit: any) => {
        console.log(`    - ${hit._source.title || hit._source.designation} (score: ${hit._score})`)
      })
    }

    // 7. Recherche avec filtre tenantId
    const tenantId = '73416fa9-f693-42f6-99d3-7c919cefe4d5'
    console.log(`\n🔎 Recherche "IPE" avec tenantId=${tenantId}:`)
    const tenantSearch = await client.search({
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
    
    const tenantTotal = typeof tenantSearch.hits.total === 'object' 
      ? tenantSearch.hits.total.value 
      : tenantSearch.hits.total
    console.log(`  Résultats trouvés: ${tenantTotal}`)

    // 8. Vérifier les tenantId uniques
    console.log('\n📊 Distribution des tenantId:')
    const agg = await client.search({
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
    
    const buckets = (agg.aggregations?.tenants as any)?.buckets || []
    if (buckets.length > 0) {
      buckets.forEach((bucket: any) => {
        console.log(`  ${bucket.key}: ${bucket.doc_count} documents`)
      })
    } else {
      console.log('  Aucun tenantId trouvé')
    }

  } catch (error: any) {
    console.error('❌ Erreur:', error.message)
    if (error.meta?.body) {
      console.error('Détails:', JSON.stringify(error.meta.body, null, 2))
    }
  }

  process.exit(0)
}

testElastic()