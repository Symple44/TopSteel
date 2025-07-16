import { randomUUID } from 'crypto'
import { promises as fs } from 'fs'
import path from 'path'
import { createHash } from 'crypto'
import { ImageMetadata, ImageVariant, UploadConfig, UploadResult, DEFAULT_CONFIGS } from './types'
import { elasticsearchClient } from '../search/elasticsearch-client'
import { imageElasticsearchService } from './elasticsearch-service'

export class ImageService {
  private uploadDir: string
  private baseUrl: string

  constructor(uploadDir: string = 'uploads', baseUrl: string = '/api/images') {
    this.uploadDir = uploadDir
    this.baseUrl = baseUrl
  }

  private async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true })
    } catch (error) {
      // Directory already exists
    }
  }

  private async calculateHash(buffer: Buffer): Promise<string> {
    return createHash('sha256').update(buffer).digest('hex')
  }

  private async getImageDimensions(buffer: Buffer): Promise<{ width: number; height: number }> {
    try {
      const sharp = await import('sharp')
      const metadata = await sharp.default(buffer).metadata()
      return {
        width: metadata.width || 0,
        height: metadata.height || 0
      }
    } catch (error) {
      console.error('Sharp not available, using fallback dimensions:', error)
      return { width: 0, height: 0 }
    }
  }

  private async generateVariant(
    buffer: Buffer,
    variant: { width: number; height: number },
    outputPath: string
  ): Promise<{ width: number; height: number; size: number }> {
    try {
      const sharp = await import('sharp')
      const result = await sharp.default(buffer)
        .resize(variant.width, variant.height, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 90 })
        .toFile(outputPath)

      return {
        width: result.width,
        height: result.height,
        size: result.size
      }
    } catch (error) {
      console.error('Sharp not available, cannot generate variant:', error)
      // Fallback: save original file as variant
      await fs.writeFile(outputPath, buffer)
      return {
        width: variant.width,
        height: variant.height,
        size: buffer.length
      }
    }
  }

  async uploadImage(
    file: Buffer,
    originalName: string,
    mimeType: string,
    category: 'avatar' | 'logo' | 'document',
    uploadedBy: string,
    options: {
      entityType?: 'user' | 'company' | 'project'
      entityId?: string
      tags?: string[]
      alt?: string
      description?: string
    } = {}
  ): Promise<UploadResult> {
    const config = DEFAULT_CONFIGS[category]
    
    // Validation
    if (file.length > config.maxSize) {
      throw new Error(`File size exceeds maximum allowed size of ${config.maxSize} bytes`)
    }

    if (!config.allowedTypes.includes(mimeType)) {
      throw new Error(`File type ${mimeType} is not allowed`)
    }

    // Génération des métadonnées
    const imageId = randomUUID()
    const hash = await this.calculateHash(file)
    const dimensions = await this.getImageDimensions(file)
    const extension = path.extname(originalName) || '.jpg'
    const fileName = `${imageId}${extension}`

    // Création des dossiers
    const categoryDir = path.join(this.uploadDir, 'images', category)
    const originalDir = path.join(categoryDir, 'original')
    await this.ensureDirectory(originalDir)

    // Sauvegarde de l'image originale
    const originalPath = path.join(originalDir, fileName)
    await fs.writeFile(originalPath, file)

    const metadata: ImageMetadata = {
      id: imageId,
      fileName,
      originalName,
      mimeType,
      size: file.length,
      width: dimensions.width,
      height: dimensions.height,
      hash,
      category,
      uploadedBy,
      uploadedAt: new Date(),
      tags: options.tags,
      alt: options.alt,
      description: options.description,
      entityType: options.entityType,
      entityId: options.entityId
    }

    const variants: ImageVariant[] = []
    const urls: any = {
      original: `${this.baseUrl}/${category}/original/${fileName}`
    }

    // Génération des variantes si nécessaire
    if (config.generateVariants && config.variants) {
      for (const [variantName, variantConfig] of Object.entries(config.variants)) {
        const variantDir = path.join(categoryDir, variantName)
        await this.ensureDirectory(variantDir)
        
        const variantFileName = `${imageId}_${variantName}${extension}`
        const variantPath = path.join(variantDir, variantFileName)
        
        const variantResult = await this.generateVariant(file, variantConfig, variantPath)
        
        const variant: ImageVariant = {
          id: randomUUID(),
          imageId,
          variant: variantName as any,
          fileName: variantFileName,
          width: variantResult.width,
          height: variantResult.height,
          size: variantResult.size,
          path: variantPath
        }
        
        variants.push(variant)
        urls[variantName] = `${this.baseUrl}/${category}/${variantName}/${variantFileName}`
      }
    }

    // Indexer dans Elasticsearch si disponible
    await this.indexToElasticsearch(metadata, variants)

    return {
      metadata,
      variants,
      urls
    }
  }

  async deleteImage(imageId: string, category: string): Promise<void> {
    const categoryDir = path.join(this.uploadDir, 'images', category)
    
    // Suppression de toutes les variantes
    const variants = ['original', 'thumbnail', 'medium', 'large']
    
    for (const variant of variants) {
      const variantDir = path.join(categoryDir, variant)
      try {
        const files = await fs.readdir(variantDir)
        const imageFiles = files.filter(file => file.startsWith(imageId))
        
        for (const file of imageFiles) {
          await fs.unlink(path.join(variantDir, file))
        }
      } catch (error) {
        // Directory or file doesn't exist
      }
    }

    // Supprimer de Elasticsearch si disponible
    await this.removeFromElasticsearch(imageId)
  }

  private async indexToElasticsearch(metadata: ImageMetadata, variants: ImageVariant[]): Promise<void> {
    try {
      const isConnected = await elasticsearchClient.isConnected()
      if (!isConnected) {
        console.warn('Elasticsearch not available, skipping indexing')
        return
      }

      const document = imageElasticsearchService.toElasticsearchDocument(metadata, variants)
      await elasticsearchClient.indexDocument('images', metadata.id, document)
      console.log(`Indexed image ${metadata.id} to Elasticsearch`)
    } catch (error) {
      console.error('Failed to index image to Elasticsearch:', error)
      // Ne pas faire échouer l'upload si l'indexation échoue
    }
  }

  private async removeFromElasticsearch(imageId: string): Promise<void> {
    try {
      const isConnected = await elasticsearchClient.isConnected()
      if (!isConnected) {
        return
      }

      await elasticsearchClient.deleteDocument('images', imageId)
      console.log(`Removed image ${imageId} from Elasticsearch`)
    } catch (error) {
      console.error('Failed to remove image from Elasticsearch:', error)
    }
  }

  async getImageMetadata(imageId: string): Promise<ImageMetadata | null> {
    // Cette méthode devra être implémentée avec la base de données
    // Pour l'instant, retourne null
    return null
  }

  async searchImages(query: {
    category?: string
    entityType?: string
    entityId?: string
    tags?: string[]
    limit?: number
    offset?: number
  }): Promise<ImageMetadata[]> {
    // Cette méthode sera implémentée avec Elasticsearch
    // Pour l'instant, retourne un tableau vide
    return []
  }
}

export const imageService = new ImageService()