/**
 * 🏗️ PACKAGES DOMAINS - SERVER-ONLY EXPORTS
 * Exports for server-side usage only (includes Sharp and other Node.js dependencies)
 */

export { imageElasticsearchService } from './image/elasticsearch-service'

// Server-only exports (with Sharp dependency)
export { ImageService } from './image/service'
// Re-export everything from main index
export * from './index'
