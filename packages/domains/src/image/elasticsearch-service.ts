import { ImageMetadata, ImageVariant } from './types'

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

export class ImageElasticsearchService {
  private indexName: string
  private baseUrl: string

  constructor(indexName: string = 'images', baseUrl: string = '/api/images') {
    this.indexName = indexName
    this.baseUrl = baseUrl
  }

  /**
   * Convertit les métadonnées d'image en document Elasticsearch
   */
  toElasticsearchDocument(
    metadata: ImageMetadata, 
    variants: ImageVariant[]
  ): ElasticsearchImageDocument {
    // Construction du texte de recherche
    const searchParts = [
      metadata.originalName,
      metadata.fileName,
      metadata.alt || '',
      metadata.description || '',
      ...(metadata.tags || [])
    ].filter(Boolean)

    // Suggestions basées sur le nom de fichier et les tags
    const suggestions = [
      metadata.originalName,
      metadata.fileName.replace(/\.[^/.]+$/, ''), // nom sans extension
      ...(metadata.tags || [])
    ].filter(Boolean)

    return {
      id: metadata.id,
      fileName: metadata.fileName,
      originalName: metadata.originalName,
      mimeType: metadata.mimeType,
      size: metadata.size,
      dimensions: {
        width: metadata.width,
        height: metadata.height
      },
      hash: metadata.hash,
      category: metadata.category,
      uploadedBy: metadata.uploadedBy,
      uploadedAt: metadata.uploadedAt.toISOString(),
      tags: metadata.tags,
      alt: metadata.alt,
      description: metadata.description,
      entity: metadata.entityType && metadata.entityId ? {
        type: metadata.entityType,
        id: metadata.entityId
      } : undefined,
      variants: variants.map(variant => ({
        variant: variant.variant,
        fileName: variant.fileName,
        dimensions: {
          width: variant.width,
          height: variant.height
        },
        size: variant.size,
        url: `${this.baseUrl}/${metadata.category}/${variant.variant}/${variant.fileName}`
      })),
      searchText: searchParts.join(' '),
      suggest: {
        input: suggestions,
        weight: this.calculateWeight(metadata)
      }
    }
  }

  /**
   * Calcule le poids pour les suggestions basé sur la catégorie et la taille
   */
  private calculateWeight(metadata: ImageMetadata): number {
    let weight = 1

    // Poids basé sur la catégorie
    switch (metadata.category) {
      case 'logo':
        weight += 3
        break
      case 'avatar':
        weight += 2
        break
      case 'document':
        weight += 1
        break
    }

    // Poids basé sur la taille (plus grande = plus importante)
    if (metadata.size > 1024 * 1024) { // > 1MB
      weight += 2
    } else if (metadata.size > 100 * 1024) { // > 100KB
      weight += 1
    }

    return weight
  }

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
    sizeRange?: { min?: number; max?: number }
    dateRange?: { from?: Date; to?: Date }
    limit?: number
    offset?: number
    sortBy?: 'relevance' | 'date' | 'size' | 'name'
    sortOrder?: 'asc' | 'desc'
  }) {
    const {
      query,
      category,
      entityType,
      entityId,
      tags,
      mimeType,
      sizeRange,
      dateRange,
      limit = 20,
      offset = 0,
      sortBy = 'relevance',
      sortOrder = 'desc'
    } = params

    const must: any[] = []
    const filter: any[] = []

    // Recherche textuelle
    if (query) {
      must.push({
        multi_match: {
          query,
          fields: ['searchText^2', 'originalName^3', 'fileName^2', 'alt', 'description', 'tags^2'],
          type: 'best_fields',
          fuzziness: 'AUTO'
        }
      })
    }

    // Filtres exacts
    if (category) {
      filter.push({ term: { category } })
    }

    if (entityType) {
      filter.push({ term: { 'entity.type': entityType } })
    }

    if (entityId) {
      filter.push({ term: { 'entity.id': entityId } })
    }

    if (mimeType) {
      filter.push({ term: { mimeType } })
    }

    if (tags && tags.length > 0) {
      filter.push({ terms: { tags } })
    }

    // Filtres de plage
    if (sizeRange) {
      const range: any = {}
      if (sizeRange.min !== undefined) range.gte = sizeRange.min
      if (sizeRange.max !== undefined) range.lte = sizeRange.max
      filter.push({ range: { size: range } })
    }

    if (dateRange) {
      const range: any = {}
      if (dateRange.from) range.gte = dateRange.from.toISOString()
      if (dateRange.to) range.lte = dateRange.to.toISOString()
      filter.push({ range: { uploadedAt: range } })
    }

    // Construction de la query
    const esQuery: any = {
      from: offset,
      size: limit,
      query: {
        bool: {
          must: must.length > 0 ? must : [{ match_all: {} }],
          filter
        }
      },
      highlight: {
        fields: {
          originalName: {},
          alt: {},
          description: {}
        }
      }
    }

    // Tri
    if (sortBy !== 'relevance') {
      const sortField = {
        date: 'uploadedAt',
        size: 'size',
        name: 'originalName.keyword'
      }[sortBy]

      if (sortField) {
        esQuery.sort = [{ [sortField]: { order: sortOrder } }]
      }
    }

    return esQuery
  }

  /**
   * Génère une requête d'autocomplétion
   */
  buildSuggestQuery(text: string, limit: number = 5) {
    return {
      suggest: {
        image_suggest: {
          prefix: text,
          completion: {
            field: 'suggest',
            size: limit
          }
        }
      }
    }
  }

  /**
   * Génère des agrégations pour les facettes de recherche
   */
  buildAggregationQuery() {
    return {
      size: 0,
      aggs: {
        categories: {
          terms: {
            field: 'category',
            size: 10
          }
        },
        mimeTypes: {
          terms: {
            field: 'mimeType',
            size: 20
          }
        },
        tags: {
          terms: {
            field: 'tags',
            size: 50
          }
        },
        entityTypes: {
          terms: {
            field: 'entity.type',
            size: 10
          }
        },
        sizeRanges: {
          range: {
            field: 'size',
            ranges: [
              { key: 'small', to: 100000 }, // < 100KB
              { key: 'medium', from: 100000, to: 1000000 }, // 100KB - 1MB
              { key: 'large', from: 1000000 } // > 1MB
            ]
          }
        },
        uploadedBy: {
          terms: {
            field: 'uploadedBy',
            size: 20
          }
        }
      }
    }
  }
}

export const imageElasticsearchService = new ImageElasticsearchService()