/**
 * 🖼️ IMAGE MODULE - GESTION DES IMAGES
 * Upload, traitement et indexation d'images pour TopSteel ERP
 */

// Service principal
export { ImageService } from './service'

// Service Elasticsearch
export { ImageElasticsearchService, imageElasticsearchService } from './elasticsearch-service'

// Types
export type * from './types'