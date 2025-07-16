/**
 * Server-only Elasticsearch utilities
 * This file should only be imported in API routes and server components
 */

// Dynamic imports to ensure these are only loaded server-side
export async function getElasticsearchClient() {
  const { elasticsearchClient } = await import('@erp/domains/search')
  return elasticsearchClient
}

export async function getMigrationService() {
  const { migrationService } = await import('@erp/domains/search')
  return migrationService
}

export async function getImageElasticsearchService() {
  const { imageElasticsearchService } = await import('@erp/domains/image')
  return imageElasticsearchService
}