/**
 * 🔍 SEARCH MODULE - ELASTICSEARCH INTEGRATION
 * Gestion de la recherche et indexation pour TopSteel ERP
 */

export type { ElasticsearchConfig } from './elasticsearch-client'
// Client Elasticsearch
export { ElasticsearchClient, elasticsearchClient } from './elasticsearch-client'
// Mappings
export { imageElasticsearchMapping } from './mappings/images'
export type { MigrationConfig } from './migration-service'
// Service de migration
export { ElasticsearchMigrationService, migrationService } from './migration-service'
