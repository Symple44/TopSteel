/**
 * 🏗️ PACKAGES DOMAINS - EXPORTS SERVEUR UNIQUEMENT
 * Services qui nécessitent des dépendances serveur (Sharp, etc.)
 */

export { ImageElasticsearchService, imageElasticsearchService } from './image/elasticsearch-service'
// Services d'images (utilisent Sharp, Node.js uniquement)
export { ImageService, imageService } from './image/service'
export type * from './image/types'

// Services de recherche avec dépendances serveur
export { elasticsearchClient } from './search/elasticsearch-client'
export { migrationService } from './search/migration-service'
