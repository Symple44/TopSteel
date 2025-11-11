/**
 * Server-only wrapper for @erp/domains
 * This file ensures the module is only loaded on the server
 * ⚠️ ImageService requires Node.js (Sharp dependency)
 */
import 'server-only'

// Re-export server modules
export {
  elasticsearchClient,
  ImageService,
  imageElasticsearchService,
  migrationService,
} from '@erp/domains'
