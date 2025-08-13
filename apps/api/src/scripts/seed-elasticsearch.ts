import { Client } from '@elastic/elasticsearch'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env' })

const client = new Client({
  node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
  auth: {
    username: process.env.ELASTICSEARCH_USERNAME || 'elastic',
    password: process.env.ELASTICSEARCH_PASSWORD || 'ogAceYjRKTIMmACWwhRA',
  },
})

const testData = [
  // Menus
  {
    type: 'menu',
    id: 'menu-1',
    title: 'Projets',
    description: 'Gestion des projets de construction',
    url: '/projets',
    metadata: { icon: 'folder', order: 1 },
  },
  {
    type: 'menu',
    id: 'menu-2',
    title: 'Clients',
    description: 'Gestion des clients et prospects',
    url: '/clients',
    metadata: { icon: 'users', order: 2 },
  },
  {
    type: 'menu',
    id: 'menu-3',
    title: 'Devis',
    description: 'Création et suivi des devis',
    url: '/devis',
    metadata: { icon: 'file-text', order: 3 },
  },
  // Pages
  {
    type: 'page',
    id: 'page-1',
    title: 'Liste des projets',
    description: 'Affichage de tous les projets en cours',
    url: '/projets/list',
    content: 'Page permettant de visualiser tous les projets de construction métallique en cours',
  },
  {
    type: 'page',
    id: 'page-2',
    title: 'Nouveau client',
    description: 'Formulaire de création de client',
    url: '/clients/new',
    content: 'Formulaire pour ajouter un nouveau client dans le système',
  },
  // Clients
  {
    type: 'client',
    id: 'client-1',
    title: 'SARL Construction Moderne',
    description: 'Entreprise de construction générale',
    metadata: {
      email: 'contact@construction-moderne.fr',
      phone: '01 23 45 67 89',
      city: 'Lyon',
    },
  },
  {
    type: 'client',
    id: 'client-2',
    title: 'Métallerie Dupont',
    description: 'Spécialiste en charpente métallique',
    metadata: {
      email: 'info@metallerie-dupont.fr',
      phone: '04 78 90 12 34',
      city: 'Villeurbanne',
    },
  },
  // Articles
  {
    type: 'article',
    id: 'article-1',
    title: 'Poutre IPE 200',
    description: 'Poutre en acier IPE 200mm',
    metadata: {
      reference: 'IPE200',
      category: 'Poutrelles',
      weight: '22.4 kg/m',
    },
  },
  {
    type: 'article',
    id: 'article-2',
    title: 'Tube carré 50x50x3',
    description: 'Tube carré en acier 50x50mm épaisseur 3mm',
    metadata: {
      reference: 'TC50X50X3',
      category: 'Tubes',
      weight: '4.35 kg/m',
    },
  },
  // Projets
  {
    type: 'projet',
    id: 'projet-1',
    title: 'Construction Hangar Industriel Lyon',
    description: "Projet de construction d'un hangar industriel de 2000m²",
    metadata: {
      client: 'SARL Construction Moderne',
      status: 'En cours',
      budget: '450000',
    },
  },
  {
    type: 'projet',
    id: 'projet-2',
    title: 'Rénovation Charpente Métallique',
    description: "Rénovation complète de la charpente métallique d'un bâtiment",
    metadata: {
      client: 'Métallerie Dupont',
      status: 'Planifié',
      budget: '125000',
    },
  },
]

async function seedElasticSearch() {
  try {
    // Vérifier la connexion
    const info = await client.info()
    console.log('✅ Connecté à ElasticSearch:', info.version.number)

    // Vérifier si l'index existe
    const indexExists = await client.indices.exists({ index: 'topsteel_global' })

    if (!indexExists) {
      console.log("❌ L'index topsteel_global n'existe pas")
      return
    }

    // Supprimer les données existantes
    await client.deleteByQuery({
      index: 'topsteel_global',
      body: {
        query: {
          match_all: {},
        },
      },
    })
    console.log('🗑️  Données existantes supprimées')

    // Indexer les données de test
    const operations = testData.flatMap((doc) => [
      { index: { _index: 'topsteel_global', _id: doc.id } },
      { ...doc, createdAt: new Date(), updatedAt: new Date() },
    ])

    const bulkResponse = await client.bulk({ body: operations })

    if (bulkResponse.errors) {
      console.error("❌ Erreurs lors de l'indexation:")
      const erroredDocuments: any[] = []
      bulkResponse.items.forEach((action: any, i: number) => {
        const operation = Object.keys(action)[0]
        if (action[operation].error) {
          erroredDocuments.push({
            status: action[operation].status,
            error: action[operation].error,
            operation: operations[i * 2],
            document: operations[i * 2 + 1],
          })
        }
      })
      console.log(erroredDocuments)
    } else {
      console.log(`✅ ${testData.length} documents indexés avec succès`)
    }

    // Rafraîchir l'index
    await client.indices.refresh({ index: 'topsteel_global' })

    // Tester une recherche
    const searchResult = await client.search({
      index: 'topsteel_global',
      body: {
        query: {
          multi_match: {
            query: 'projet',
            fields: ['title^3', 'description^2', 'content'],
          },
        },
      },
    })

    console.log('\n📊 Test de recherche pour "projet":')
    console.log(`   Nombre de résultats: ${searchResult.hits.total}`)
    searchResult.hits.hits.forEach((hit: any) => {
      console.log(`   - [${hit._source.type}] ${hit._source.title} (score: ${hit._score})`)
    })
  } catch (error) {
    console.error('❌ Erreur:', error)
  }
}

seedElasticSearch()
