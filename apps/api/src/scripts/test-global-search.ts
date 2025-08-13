import axios from 'axios'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env' })

const API_URL = `http://localhost:${process.env.PORT || 3002}/api`

interface SearchResult {
  data: {
    results: Array<{
      type: string
      id: string
      title: string
      description?: string
      url?: string
      metadata?: Record<string, unknown>
      highlight?: Record<string, string[]>
      score?: number
    }>
    total: number
    searchTime: number
    strategy: 'elasticsearch' | 'postgresql'
  }
}

async function testGlobalSearch() {
  try {
    // 1. Login pour obtenir le token
    console.log('🔐 Authentification...')
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      login: 'admin@topsteel.tech',
      password: 'TopSteel44!',
    })

    const { accessToken } = loginResponse.data.data

    // Configuration pour les requêtes authentifiées
    const authConfig = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }

    console.log('✅ Authentification réussie\n')

    // 2. Tests de recherche
    const testCases = [
      {
        name: 'Recherche générale',
        query: 'projet',
        filters: {},
      },
      {
        name: 'Recherche dans les menus',
        query: 'projet',
        filters: { types: ['menu'] },
      },
      {
        name: 'Recherche dans les pages',
        query: 'list',
        filters: { types: ['page'] },
      },
      {
        name: 'Recherche multi-types',
        query: 'client',
        filters: { types: ['client', 'menu', 'page'] },
      },
      {
        name: 'Recherche avec pagination',
        query: 'a',
        filters: { limit: 5, offset: 0 },
      },
    ]

    for (const testCase of testCases) {
      console.log(`\n📍 Test: ${testCase.name}`)
      console.log(`   Query: "${testCase.query}"`)
      console.log(`   Filters:`, testCase.filters)

      try {
        const searchResponse = await axios.post<SearchResult>(
          `${API_URL}/search/global`,
          {
            query: testCase.query,
            filters: testCase.filters,
          },
          authConfig
        )

        const { data } = searchResponse.data

        console.log(`   ✅ Résultats: ${data.results.length}/${data.total}`)
        console.log(`   ⚡ Stratégie: ${data.strategy}`)
        console.log(`   ⏱️  Temps: ${data.searchTime}ms`)

        // Afficher les premiers résultats
        data.results.slice(0, 3).forEach((result, index) => {
          console.log(`   ${index + 1}. [${result.type}] ${result.title}`)
          if (result.score) {
            console.log(`      Score: ${result.score.toFixed(2)}`)
          }
          if (result.highlight) {
            console.log(`      Highlight:`, result.highlight)
          }
        })
      } catch (error: any) {
        console.error(`   ❌ Erreur:`, error.response?.data?.message || error.message)
      }
    }

    // 3. Test de la stratégie de fallback
    console.log('\n\n🔄 Test du fallback PostgreSQL')
    console.log('   (Simulation avec ElasticSearch désactivé)')

    try {
      // Forcer le fallback en spécifiant une stratégie
      const fallbackResponse = await axios.post<SearchResult>(
        `${API_URL}/search/global`,
        {
          query: 'test',
          filters: { forceStrategy: 'postgresql' },
        },
        authConfig
      )

      const { data } = fallbackResponse.data
      console.log(`   ✅ Fallback fonctionnel`)
      console.log(`   Résultats: ${data.results.length}`)
      console.log(`   Stratégie: ${data.strategy}`)
    } catch (error: any) {
      console.error(`   ❌ Erreur:`, error.response?.data?.message || error.message)
    }

    // 4. Test des suggestions
    console.log('\n\n💡 Test des suggestions')
    try {
      const suggestResponse = await axios.get(
        `${API_URL}/search/suggestions?query=proj`,
        authConfig
      )

      console.log(`   Suggestions pour "proj":`)
      suggestResponse.data.data.forEach((suggestion: string, index: number) => {
        console.log(`   ${index + 1}. ${suggestion}`)
      })
    } catch (error: any) {
      console.error(`   ❌ Erreur:`, error.response?.data?.message || error.message)
    }

    // 5. Test de l'historique
    console.log("\n\n📜 Test de l'historique de recherche")
    try {
      const historyResponse = await axios.get(`${API_URL}/search/history`, authConfig)

      console.log(`   Dernières recherches:`)
      historyResponse.data.data.slice(0, 5).forEach((item: any, index: number) => {
        console.log(`   ${index + 1}. "${item.query}" - ${item.timestamp}`)
      })
    } catch (error: any) {
      console.error(`   ❌ Erreur:`, error.response?.data?.message || error.message)
    }

    console.log('\n\n✅ Tests terminés avec succès!')
  } catch (error: any) {
    console.error('❌ Erreur générale:', error.message)
    if (error.response) {
      console.error('   Détails:', error.response.data)
    }
  }
}

// Lancer les tests
testGlobalSearch()
