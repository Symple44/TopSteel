import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { Injectable, Logger } from '@nestjs/common'
import type { ConfigService } from '@nestjs/config'
import sharp from 'sharp'

export interface CloudflareConfig {
  accountId: string
  apiToken: string
  zoneId: string
  imagesApiToken: string
  imagesAccountHash: string
  customDomain?: string
}

export interface ImageTransformOptions {
  width?: number
  height?: number
  quality?: number
  format?: 'webp' | 'avif' | 'jpeg' | 'png'
  fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad'
  gravity?: 'auto' | 'center' | 'north' | 'south' | 'east' | 'west'
  sharpen?: number
  blur?: number
  background?: string
}

export interface UploadedImage {
  id: string
  filename: string
  uploaded: Date
  requireSignedURLs: boolean
  variants: string[]
  meta?: Record<string, unknown>
  draft?: boolean
}

@Injectable()
export class CloudflareConfigService {
  private readonly logger = new Logger(CloudflareConfigService.name)
  private readonly config: CloudflareConfig
  private readonly baseUrl: string
  private readonly cacheDir: string

  constructor(private configService: ConfigService) {
    this.config = {
      accountId: this.configService.get('CLOUDFLARE_ACCOUNT_ID') || '',
      apiToken: this.configService.get('CLOUDFLARE_API_TOKEN') || '',
      zoneId: this.configService.get('CLOUDFLARE_ZONE_ID') || '',
      imagesApiToken: this.configService.get('CLOUDFLARE_IMAGES_API_TOKEN') || '',
      imagesAccountHash: this.configService.get('CLOUDFLARE_IMAGES_ACCOUNT_HASH') || '',
      customDomain: this.configService.get('CLOUDFLARE_CUSTOM_DOMAIN'),
    }

    this.baseUrl = this.config.customDomain
      ? `https://${this.config.customDomain}`
      : `https://imagedelivery.net/${this.config.imagesAccountHash}`

    this.cacheDir = path.join(process.cwd(), 'cache', 'cloudflare')
    this.initializeCacheDir()
  }

  private async initializeCacheDir(): Promise<void> {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true })
    } catch (error) {
      this.logger.error('Failed to create cache directory:', error)
    }
  }

  /**
   * Upload image to Cloudflare Images
   */
  async uploadImage(
    buffer: Buffer,
    filename: string,
    metadata?: Record<string, string>
  ): Promise<UploadedImage> {
    try {
      const formData = new FormData()
      const blob = new Blob([buffer])
      formData.append('file', blob, filename)

      if (metadata) {
        Object.entries(metadata).forEach(([key, value]) => {
          formData.append(`metadata.${key}`, value)
        })
      }

      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${this.config.accountId}/images/v1`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.config.imagesApiToken}`,
          },
          body: formData,
        }
      )

      const data = (await response.json()) as unknown

      if (!data.success) {
        throw new Error(`Cloudflare upload failed: ${JSON.stringify(data.errors)}`)
      }

      this.logger.log(`Image uploaded successfully: ${data.result.id}`)

      return {
        id: data.result.id,
        filename: data.result.filename,
        uploaded: new Date(data.result.uploaded),
        requireSignedURLs: data.result.requireSignedURLs,
        variants: data.result.variants,
        meta: data.result.meta,
        draft: data.result.draft,
      }
    } catch (error) {
      this.logger.error('Error uploading image to Cloudflare:', error)
      throw error
    }
  }

  /**
   * Generate optimized image URL with transformations
   */
  generateImageUrl(imageId: string, options: ImageTransformOptions = {}): string {
    const variant = this.buildVariantString(options)
    return `${this.baseUrl}/${imageId}/${variant}`
  }

  /**
   * Build variant string for Cloudflare Images
   */
  private buildVariantString(options: ImageTransformOptions): string {
    const parts: string[] = []

    if (options.width || options.height) {
      const width = options.width || ''
      const height = options.height || ''
      parts.push(`w=${width},h=${height}`)
    }

    if (options.quality) {
      parts.push(`q=${options.quality}`)
    }

    if (options.format) {
      parts.push(`f=${options.format}`)
    }

    if (options.fit) {
      parts.push(`fit=${options.fit}`)
    }

    if (options.gravity) {
      parts.push(`g=${options.gravity}`)
    }

    if (options.sharpen) {
      parts.push(`sharpen=${options.sharpen}`)
    }

    if (options.blur) {
      parts.push(`blur=${options.blur}`)
    }

    if (options.background) {
      parts.push(`bg=${options.background}`)
    }

    return parts.length > 0 ? parts.join(',') : 'public'
  }

  /**
   * Optimize image before upload
   */
  async optimizeImage(
    buffer: Buffer,
    options: {
      maxWidth?: number
      maxHeight?: number
      quality?: number
      format?: 'webp' | 'avif' | 'jpeg' | 'png'
    } = {}
  ): Promise<Buffer> {
    try {
      let pipeline = sharp(buffer)

      // Resize if needed
      if (options.maxWidth || options.maxHeight) {
        pipeline = pipeline.resize(options.maxWidth, options.maxHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        })
      }

      // Convert format
      switch (options.format) {
        case 'webp':
          pipeline = pipeline.webp({ quality: options.quality || 85 })
          break
        case 'avif':
          pipeline = pipeline.avif({ quality: options.quality || 80 })
          break
        case 'jpeg':
          pipeline = pipeline.jpeg({ quality: options.quality || 85 })
          break
        case 'png':
          pipeline = pipeline.png({ quality: options.quality || 90 })
          break
      }

      return await pipeline.toBuffer()
    } catch (error) {
      this.logger.error('Error optimizing image:', error)
      throw error
    }
  }

  /**
   * Delete image from Cloudflare
   */
  async deleteImage(imageId: string): Promise<boolean> {
    try {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${this.config.accountId}/images/v1/${imageId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${this.config.imagesApiToken}`,
          },
        }
      )

      const data = (await response.json()) as unknown

      if (!data.success) {
        this.logger.error(`Failed to delete image: ${JSON.stringify(data.errors)}`)
        return false
      }

      this.logger.log(`Image deleted successfully: ${imageId}`)
      return true
    } catch (error) {
      this.logger.error('Error deleting image from Cloudflare:', error)
      return false
    }
  }

  /**
   * List all images
   */
  async listImages(page = 1, perPage = 100): Promise<UploadedImage[]> {
    try {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${this.config.accountId}/images/v1?page=${page}&per_page=${perPage}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${this.config.imagesApiToken}`,
          },
        }
      )

      const data = (await response.json()) as unknown

      if (!data.success) {
        throw new Error(`Failed to list images: ${JSON.stringify(data.errors)}`)
      }

      return data.result.images.map((img: unknown) => ({
        id: img.id,
        filename: img.filename,
        uploaded: new Date(img.uploaded),
        requireSignedURLs: img.requireSignedURLs,
        variants: img.variants,
        meta: img.meta,
        draft: img.draft,
      }))
    } catch (error) {
      this.logger.error('Error listing images from Cloudflare:', error)
      throw error
    }
  }

  /**
   * Purge cache for specific URLs
   */
  async purgeCache(urls: string[]): Promise<boolean> {
    try {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${this.config.zoneId}/purge_cache`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.config.apiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ files: urls }),
        }
      )

      const data = (await response.json()) as unknown

      if (!data.success) {
        this.logger.error(`Cache purge failed: ${JSON.stringify(data.errors)}`)
        return false
      }

      this.logger.log(`Cache purged for ${urls.length} URLs`)
      return true
    } catch (error) {
      this.logger.error('Error purging cache:', error)
      return false
    }
  }

  /**
   * Generate responsive image srcset
   */
  generateSrcSet(
    imageId: string,
    sizes: number[],
    format: 'webp' | 'avif' | 'jpeg' | 'png' = 'webp'
  ): string {
    return sizes
      .map((size) => {
        const url = this.generateImageUrl(imageId, { width: size, format })
        return `${url} ${size}w`
      })
      .join(', ')
  }

  /**
   * Generate picture element HTML
   */
  generatePictureElement(
    imageId: string,
    alt: string,
    sizes: string = '100vw',
    breakpoints: number[] = [320, 640, 768, 1024, 1280, 1920]
  ): string {
    const avifSrcSet = this.generateSrcSet(imageId, breakpoints, 'avif')
    const webpSrcSet = this.generateSrcSet(imageId, breakpoints, 'webp')
    const jpegSrcSet = this.generateSrcSet(imageId, breakpoints, 'jpeg')
    const defaultSrc = this.generateImageUrl(imageId, { width: 1024, format: 'jpeg' })

    return `
      <picture>
        <source type="image/avif" srcset="${avifSrcSet}" sizes="${sizes}">
        <source type="image/webp" srcset="${webpSrcSet}" sizes="${sizes}">
        <source type="image/jpeg" srcset="${jpegSrcSet}" sizes="${sizes}">
        <img src="${defaultSrc}" alt="${alt}" loading="lazy" decoding="async">
      </picture>
    `.trim()
  }

  /**
   * Batch upload images
   */
  async batchUploadImages(
    images: Array<{
      buffer: Buffer
      filename: string
      metadata?: Record<string, string>
    }>
  ): Promise<UploadedImage[]> {
    const uploadPromises = images.map((img) =>
      this.uploadImage(img.buffer, img.filename, img.metadata)
    )

    return Promise.all(uploadPromises)
  }

  /**
   * Generate image statistics
   */
  async getImageStatistics(): Promise<{
    totalImages: number
    totalSize: number
    averageSize: number
    formats: Record<string, number>
  }> {
    try {
      const images = await this.listImages()

      const stats = {
        totalImages: images.length,
        totalSize: 0,
        averageSize: 0,
        formats: {} as Record<string, number>,
      }

      // Note: Cloudflare API doesn't provide size info directly
      // This would need additional implementation to track sizes

      return stats
    } catch (error) {
      this.logger.error('Error getting image statistics:', error)
      throw error
    }
  }
}
