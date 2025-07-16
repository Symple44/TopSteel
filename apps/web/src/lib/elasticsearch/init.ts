import { getElasticsearchClient, getMigrationService } from '@/lib/server/elasticsearch'

let initializationPromise: Promise<boolean> | null = null

export async function initializeElasticsearch(): Promise<boolean> {
  // Éviter les initialisations multiples
  if (initializationPromise) {
    return initializationPromise
  }

  initializationPromise = performInitialization()
  return initializationPromise
}

async function performInitialization(): Promise<boolean> {
  try {
    console.log('Initializing Elasticsearch...')

    // Vérifier si Elasticsearch est configuré
    if (!process.env.ELASTICSEARCH_URL && process.env.NODE_ENV === 'production') {
      console.warn('Elasticsearch URL not configured, skipping initialization')
      return false
    }

    // Obtenir les services
    const elasticsearchClient = await getElasticsearchClient()
    const migrationService = await getMigrationService()

    // Vérifier la connexion
    const isConnected = await elasticsearchClient.isConnected()
    if (!isConnected) {
      console.warn('Elasticsearch not available, skipping migrations')
      return false
    }

    console.log('Elasticsearch connected, running migrations...')

    // Lancer les migrations
    const success = await migrationService.runAllMigrations()
    
    if (success) {
      console.log('Elasticsearch initialization completed successfully')
    } else {
      console.warn('Elasticsearch initialization completed with warnings')
    }

    return success
  } catch (error) {
    console.error('Elasticsearch initialization failed:', error)
    return false
  }
}

// Auto-initialisation désactivée pour éviter les problèmes de bundling
// L'initialisation doit être faite explicitement côté serveur
// if (process.env.NODE_ENV === 'development') {
//   initializeElasticsearch().catch(error => {
//     console.error('Auto-initialization failed:', error)
//   })
// }