/**
 * Server-only Elasticsearch utilities
 * This file should only be imported in API routes and server components
 */

// Dynamic imports to ensure these are only loaded server-side
export async function getElasticsearchClient() {
  const { elasticsearchClient } = await import('@erp/domains/server')
  return elasticsearchClient
}

export async function getMigrationService() {
  const { migrationService } = await import('@erp/domains/server')
  return migrationService
}

export async function getImageElasticsearchService() {
  try {
    const { imageElasticsearchService } = await import('@erp/domains/server')
    return imageElasticsearchService
  } catch (_error) {
    // Retourner un service mock si l'import échoue
    return {
      toElasticsearchDocument: () => ({}),
      searchImages: async () => [],
      indexImage: async () => {},
      deleteImage: async () => {},
    }
  }
}
