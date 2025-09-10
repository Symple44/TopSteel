/**
 * Server-only wrapper for @erp/domains/server
 * This file ensures the module is only loaded on the server
 */
import 'server-only'

// Re-export server modules
export {
  elasticsearchClient,
  ImageService,
  imageElasticsearchService,
  migrationService,
} from '@erp/domains/server'
