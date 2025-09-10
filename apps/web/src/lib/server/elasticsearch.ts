/**
 * Server-only Elasticsearch utilities
 * This file should only be imported in API routes and server components
 */

// Type imports for better type inference
type ElasticsearchClient = import('@erp/domains/server').ElasticsearchClient
type ElasticsearchMigrationService = import('@erp/domains/server').ElasticsearchMigrationService  
type ImageElasticsearchService = import('@erp/domains/server').ImageElasticsearchService

// Import from local wrapper to ensure proper server-only isolation
export async function getElasticsearchClient(): Promise<ElasticsearchClient> {
  const domainsServer = await import('./domains-server')
  return domainsServer.elasticsearchClient
}

export async function getMigrationService(): Promise<ElasticsearchMigrationService> {
  const domainsServer = await import('./domains-server')
  return domainsServer.migrationService
}

export async function getImageElasticsearchService(): Promise<ImageElasticsearchService> {
  const domainsServer = await import('./domains-server')
  return domainsServer.imageElasticsearchService
}
