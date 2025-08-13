/**
 * Script pour corriger le tenantId dans ElasticSearch
 */

import { Client } from '@elastic/elasticsearch'
import { DataSource } from 'typeorm'

async function fixTenantId() {
  console.log('🔧 Correction du tenantId dans ElasticSearch...')

  const client = new Client({
    node: 'http://127.0.0.1:9200',
    auth: {
      username: 'elastic',
      password: 'ogAceYjRKTIMmACWwhRA',
    },
  })

  // Connexion à la base auth pour vérifier les sociétés
  const authDataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'postgres',
    database: 'erp_topsteel_auth',
    synchronize: false,
  })

  try {
    await authDataSource.initialize()
    console.log('✅ Connecté à la base auth')

    // Récupérer les sociétés actives
    const societes = await authDataSource.query(`
      SELECT id, nom, code, status 
      FROM societes 
      WHERE status = 'ACTIVE'
      ORDER BY nom
    `)

    console.log(`\n📊 Sociétés trouvées: ${societes.length}`)
    societes.forEach((s: any) => {
      console.log(`  - ${s.nom} (ID: ${s.id}, Code: ${s.code})`)
    })

    // Identifier le bon tenant
    const targetTenantId = '73416fa9-f693-42f6-99d3-7c919cefe4d5'
    const currentTenantId = 'a4a21147-ef1b-489c-8769-067bc45da723'

    const targetSociete = societes.find((s: any) => s.id === targetTenantId)
    const currentSociete = societes.find((s: any) => s.id === currentTenantId)

    console.log(
      `\n🎯 Tenant cible: ${targetSociete ? targetSociete.nom : 'Non trouvé'} (${targetTenantId})`
    )
    console.log(
      `📍 Tenant actuel dans ES: ${currentSociete ? currentSociete.nom : 'Non trouvé'} (${currentTenantId})`
    )

    // Vérifier le nombre de documents à migrer
    const countResult = await client.count({
      index: 'topsteel_global',
      query: {
        term: { tenantId: currentTenantId },
      },
    })

    console.log(`\n📦 Documents à migrer: ${countResult.count}`)

    if (countResult.count > 0) {
      console.log('\n🔄 Migration des documents...')

      // Utiliser update_by_query pour mettre à jour tous les documents
      const updateResult = await client.updateByQuery({
        index: 'topsteel_global',
        refresh: true,
        query: {
          term: { tenantId: currentTenantId },
        },
        script: {
          source: 'ctx._source.tenantId = params.newTenantId',
          params: {
            newTenantId: targetTenantId,
          },
        },
      })

      console.log(`✅ Documents mis à jour: ${updateResult.updated}`)
      console.log(`⚠️ Échecs: ${updateResult.failures?.length || 0}`)

      // Vérifier le résultat
      const verifyCount = await client.count({
        index: 'topsteel_global',
        query: {
          term: { tenantId: targetTenantId },
        },
      })

      console.log(`\n✅ Documents avec le nouveau tenantId: ${verifyCount.count}`)

      // Tester une recherche
      console.log('\n🔎 Test de recherche "IPE 300" avec le nouveau tenantId:')
      const testSearch = await client.search({
        index: 'topsteel_global',
        size: 5,
        query: {
          bool: {
            must: [
              {
                multi_match: {
                  query: 'IPE 300',
                  fields: ['title^3', 'designation^3', 'reference^2', 'description'],
                  type: 'best_fields',
                },
              },
            ],
            filter: [{ term: { tenantId: targetTenantId } }],
          },
        },
      })

      const total =
        typeof testSearch.hits.total === 'object'
          ? testSearch.hits.total.value
          : testSearch.hits.total

      console.log(`  Résultats trouvés: ${total}`)

      if (testSearch.hits.hits.length > 0) {
        console.log('  Premiers résultats:')
        testSearch.hits.hits.forEach((hit: any) => {
          console.log(`    - ${hit._source.title || hit._source.designation}`)
        })
      }
    }

    await authDataSource.destroy()
    console.log('\n✅ Migration terminée')
    process.exit(0)
  } catch (error) {
    console.error('❌ Erreur:', error)
    await authDataSource.destroy()
    process.exit(1)
  }
}

fixTenantId()
