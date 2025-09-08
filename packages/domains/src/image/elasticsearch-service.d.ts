import type { ImageMetadata, ImageVariant } from './types'
export interface ElasticsearchImageDocument {
  id: string
  fileName: string
  originalName: string
  mimeType: string
  size: number
  dimensions: {
    width: number
    height: number
  }
  hash: string
  category: string
  uploadedBy: string
  uploadedAt: string
  tags?: string[]
  alt?: string
  description?: string
  entity?: {
    type: string
    id: string
  }
  variants: Array<{
    variant: string
    fileName: string
    dimensions: {
      width: number
      height: number
    }
    size: number
    url: string
  }>
  searchText: string
  suggest: {
    input: string[]
    weight: number
  }
}
export declare class ImageElasticsearchService {
  private indexName
  private baseUrl
  constructor(indexName?: string, baseUrl?: string)
  /**
   * Convertit les métadonnées d'image en document Elasticsearch
   */
  toElasticsearchDocument(
    metadata: ImageMetadata,
    variants: ImageVariant[]
  ): ElasticsearchImageDocument
  /**
   * Calcule le poids pour les suggestions basé sur la catégorie et la taille
   */
  private calculateWeight
  /**
   * Génère une requête de recherche Elasticsearch
   */
  buildSearchQuery(params: {
    query?: string
    category?: string
    entityType?: string
    entityId?: string
    tags?: string[]
    mimeType?: string
    sizeRange?: {
      min?: number
      max?: number
    }
    dateRange?: {
      from?: Date
      to?: Date
    }
    limit?: number
    offset?: number
    sortBy?: 'relevance' | 'date' | 'size' | 'name'
    sortOrder?: 'asc' | 'desc'
  }): Record<string, unknown>
  /**
   * Génère une requête d'autocomplétion
   */
  buildSuggestQuery(
    text: string,
    limit?: number
  ): {
    suggest: {
      image_suggest: {
        prefix: string
        completion: {
          field: string
          size: number
        }
      }
    }
  }
  /**
   * Génère des agrégations pour les facettes de recherche
   */
  buildAggregationQuery(): {
    size: number
    aggs: {
      categories: {
        terms: {
          field: string
          size: number
        }
      }
      mimeTypes: {
        terms: {
          field: string
          size: number
        }
      }
      tags: {
        terms: {
          field: string
          size: number
        }
      }
      entityTypes: {
        terms: {
          field: string
          size: number
        }
      }
      sizeRanges: {
        range: {
          field: string
          ranges: (
            | {
                key: string
                to: number
                from?: undefined
              }
            | {
                key: string
                from: number
                to: number
              }
            | {
                key: string
                from: number
                to?: undefined
              }
          )[]
        }
      }
      uploadedBy: {
        terms: {
          field: string
          size: number
        }
      }
    }
  }
}
export declare const imageElasticsearchService: ImageElasticsearchService
//# sourceMappingURL=elasticsearch-service.d.ts.map
