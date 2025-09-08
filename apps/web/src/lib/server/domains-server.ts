/**
 * Server-only wrapper for @erp/domains/server
 * This file ensures the module is only loaded on the server
 */
import 'server-only'

// Re-export server modules
export {
  // elasticsearchClient, // Missing export from @erp/domains/server
  ImageService,
  imageElasticsearchService,
  // migrationService, // Missing export from @erp/domains/server
} from '@erp/domains/server'

// Temporary stubs for missing exports
export const elasticsearchClient = {} as unknown
export const migrationService = {} as unknown
