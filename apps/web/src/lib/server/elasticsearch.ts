/**
 * Server-only Elasticsearch utilities
 * This file should only be imported in API routes and server components
 */

// Import from local wrapper to ensure proper server-only isolation
export async function getElasticsearchClient() {
  const domainsServer = await import('./domains-server')
  return domainsServer.elasticsearchClient
}

export async function getMigrationService() {
  const domainsServer = await import('./domains-server')
  return domainsServer.migrationService
}

export async function getImageElasticsearchService() {
  const domainsServer = await import('./domains-server')
  return domainsServer.imageElasticsearchService
}
