/**
 * 🖼️ IMAGE MODULE - GESTION DES IMAGES
 * Upload, traitement et indexation d'images pour TopSteel ERP
 */

// Service Elasticsearch (sans Sharp)
export { ImageElasticsearchService, imageElasticsearchService } from './elasticsearch-service'

// Types
export type * from './types'

// Service principal avec Sharp (charge dynamiquement)
export async function createImageService() {
  try {
    const { ImageService } = await import('./service')
    return new ImageService()
  } catch (_error) {
    throw new Error('ImageService is not available in this environment')
  }
}
