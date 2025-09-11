/**
 * Service Elasticsearch pour la gestion des métadonnées d'images
 *
 * Ce service fournit une interface pour indexer et rechercher des métadonnées d'images
 * dans Elasticsearch. Il permet la synchronisation des données d'images avec l'index
 * de recherche pour améliorer les performances de recherche.
 */

/**
 * Interface pour les métadonnées d'image indexées dans Elasticsearch
 */
export interface ImageMetadata {
  id: string
  fileName: string
  filePath: string
  fileSize: number
  mimeType: string
  width?: number
  height?: number
  createdAt: string
  updatedAt: string
  tags?: string[]
  description?: string
  userId?: string
  albumId?: string
  isPublic: boolean
  thumbnailPath?: string
  originalPath?: string
  metadata?: Record<string, unknown>
}

/**
 * Interface pour les documents Elasticsearch
 */
export interface ElasticsearchImageDocument extends ImageMetadata {
  suggest: {
    input: string[]
    weight: number
  }
  [key: string]: unknown // Add index signature for compatibility
}

export class ImageElasticsearchService {
  private readonly indexName: string
  private baseUrl: string

  constructor(indexName: string = 'images', baseUrl: string = '/api/images') {
    this.indexName = indexName
    this.baseUrl = baseUrl
  }

  /**
   * Convertit les métadonnées d'image en document Elasticsearch
   */
  private convertToElasticsearchDocument(metadata: ImageMetadata): ElasticsearchImageDocument {
    const suggestInput = [
      metadata.fileName,
      metadata.description || '',
      ...(metadata.tags || []),
    ].filter(Boolean)

    return {
      ...metadata,
      suggest: {
        input: suggestInput,
        weight: metadata.isPublic ? 10 : 5,
      },
    }
  }

  /**
   * Public method to convert image metadata and variants to Elasticsearch document
   * This method is used by the ImageService to index images
   */
  toElasticsearchDocument(
    metadata: import('./types').ImageMetadata, 
    variants: import('./types').ImageVariant[]
  ): ElasticsearchImageDocument {
    // Convert domain ImageMetadata to elasticsearch ImageMetadata format
    const elasticsearchMetadata: ImageMetadata = {
      id: metadata.id,
      fileName: metadata.fileName,
      filePath: variants.find(v => v.variant === 'original')?.path || '',
      fileSize: metadata.size,
      mimeType: metadata.mimeType,
      width: metadata.width,
      height: metadata.height,
      createdAt: metadata.uploadedAt.toISOString(),
      updatedAt: metadata.uploadedAt.toISOString(),
      tags: metadata.tags,
      description: metadata.description,
      userId: metadata.uploadedBy,
      albumId: metadata.entityId,
      isPublic: true, // Default to public, can be configured
      thumbnailPath: variants.find(v => v.variant === 'thumbnail')?.path,
      originalPath: variants.find(v => v.variant === 'original')?.path,
      metadata: {
        category: metadata.category,
        entityType: metadata.entityType,
        hash: metadata.hash,
        alt: metadata.alt,
        variants: variants.map(v => ({
          id: v.id,
          variant: v.variant,
          fileName: v.fileName,
          width: v.width,
          height: v.height,
          size: v.size,
          path: v.path
        }))
      }
    }

    return this.convertToElasticsearchDocument(elasticsearchMetadata)
  }

  /**
   * Indexe une image dans Elasticsearch
   */
  async indexImage(metadata: ImageMetadata): Promise<boolean> {
    try {
      const document = this.convertToElasticsearchDocument(metadata)

      const response = await fetch(`${this.baseUrl}/elasticsearch/index`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          index: this.indexName,
          id: metadata.id,
          document,
        }),
      })

      return response.ok
    } catch (error) {
      console.error("Erreur lors de l'indexation de l'image:", error)
      return false
    }
  }

  /**
   * Met à jour une image dans l'index Elasticsearch
   */
  async updateImage(metadata: ImageMetadata): Promise<boolean> {
    try {
      const document = this.convertToElasticsearchDocument(metadata)

      const response = await fetch(`${this.baseUrl}/elasticsearch/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          index: this.indexName,
          id: metadata.id,
          document,
        }),
      })

      return response.ok
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'image:", error)
      return false
    }
  }

  /**
   * Supprime une image de l'index Elasticsearch
   */
  async deleteImage(imageId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/elasticsearch/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          index: this.indexName,
          id: imageId,
        }),
      })

      return response.ok
    } catch (error) {
      console.error("Erreur lors de la suppression de l'image:", error)
      return false
    }
  }

  /**
   * Recherche des images dans Elasticsearch
   */
  async searchImages(query: string, filters?: Record<string, unknown>): Promise<ImageMetadata[]> {
    try {
      const searchBody = {
        index: this.indexName,
        query: {
          bool: {
            must: query
              ? [
                  {
                    multi_match: {
                      query,
                      fields: ['fileName^3', 'description^2', 'tags^2', 'suggest.input'],
                    },
                  },
                ]
              : [{ match_all: {} }],
            filter: filters
              ? Object.entries(filters).map(([field, value]) => ({
                  term: { [field]: value },
                }))
              : [],
          },
        },
        sort: [{ _score: { order: 'desc' } }, { createdAt: { order: 'desc' } }],
      }

      const response = await fetch(`${this.baseUrl}/elasticsearch/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchBody),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la recherche')
      }

      const result = await response.json()
      return result.hits?.hits?.map((hit: { _source: ImageMetadata }) => hit._source) || []
    } catch (error) {
      console.error("Erreur lors de la recherche d'images:", error)
      return []
    }
  }

  /**
   * Obtient des suggestions d'autocomplétion
   */
  async getSuggestions(query: string): Promise<string[]> {
    try {
      const searchBody = {
        index: this.indexName,
        suggest: {
          image_suggest: {
            prefix: query,
            completion: {
              field: 'suggest',
              size: 10,
            },
          },
        },
      }

      const response = await fetch(`${this.baseUrl}/elasticsearch/suggest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchBody),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des suggestions')
      }

      const result = await response.json()
      const suggestions = result.suggest?.image_suggest?.[0]?.options || []
      return suggestions.map((option: { text: string }) => option.text)
    } catch (error) {
      console.error('Erreur lors de la récupération des suggestions:', error)
      return []
    }
  }

  /**
   * Synchronise toutes les images avec l'index Elasticsearch
   */
  async bulkIndex(images: ImageMetadata[]): Promise<boolean> {
    try {
      const documents = images.map((metadata) => ({
        index: { _index: this.indexName, _id: metadata.id },
        ...this.convertToElasticsearchDocument(metadata),
      }))

      const response = await fetch(`${this.baseUrl}/elasticsearch/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documents }),
      })

      return response.ok
    } catch (error) {
      console.error("Erreur lors de l'indexation en masse:", error)
      return false
    }
  }
}

export const imageElasticsearchService = new ImageElasticsearchService()
