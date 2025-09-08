import { type ImageMetadata, type UploadResult } from './types'
export declare class ImageService {
  private uploadDir
  private baseUrl
  constructor(uploadDir?: string, baseUrl?: string)
  private ensureDirectory
  private calculateHash
  private getImageDimensions
  private generateVariant
  uploadImage(
    file: Buffer,
    originalName: string,
    mimeType: string,
    category: 'avatar' | 'logo' | 'document',
    uploadedBy: string,
    options?: {
      entityType?: 'user' | 'company' | 'project'
      entityId?: string
      tags?: string[]
      alt?: string
      description?: string
    }
  ): Promise<UploadResult>
  deleteImage(imageId: string, category: string): Promise<void>
  private indexToElasticsearch
  private removeFromElasticsearch
  getImageMetadata(_imageId: string): Promise<ImageMetadata | null>
  searchImages(_query: {
    category?: string
    entityType?: string
    entityId?: string
    tags?: string[]
    limit?: number
    offset?: number
  }): Promise<ImageMetadata[]>
}
export declare const imageService: ImageService
//# sourceMappingURL=service.d.ts.map
