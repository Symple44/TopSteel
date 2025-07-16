/**
 * 🔍 SEARCH MODULE - ELASTICSEARCH INTEGRATION
 * Gestion de la recherche et indexation pour TopSteel ERP
 */

// Client Elasticsearch
export { ElasticsearchClient, elasticsearchClient } from './elasticsearch-client'
export type { ElasticsearchConfig } from './elasticsearch-client'

// Service de migration
export { ElasticsearchMigrationService, migrationService } from './migration-service'
export type { MigrationConfig } from './migration-service'

// Mappings
export { imageElasticsearchMapping } from './mappings/images'