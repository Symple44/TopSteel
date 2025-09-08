export interface ImageMetadata {
  id: string
  fileName: string
  originalName: string
  mimeType: string
  size: number
  width: number
  height: number
  hash: string
  category: 'avatar' | 'logo' | 'document'
  uploadedBy: string
  uploadedAt: Date
  tags?: string[]
  alt?: string
  description?: string
  entityType?: 'user' | 'company' | 'project'
  entityId?: string
}
export interface ImageVariant {
  id: string
  imageId: string
  variant: 'original' | 'thumbnail' | 'medium' | 'large'
  fileName: string
  width: number
  height: number
  size: number
  path: string
}
export interface UploadConfig {
  maxSize: number
  allowedTypes: string[]
  generateVariants: boolean
  variants?: {
    thumbnail: {
      width: number
      height: number
    }
    medium: {
      width: number
      height: number
    }
    large?: {
      width: number
      height: number
    }
  }
}
export interface UploadResult {
  metadata: ImageMetadata
  variants: ImageVariant[]
  urls: {
    original: string
    thumbnail?: string
    medium?: string
    large?: string
  }
}
export declare const DEFAULT_CONFIGS: Record<string, UploadConfig>
//# sourceMappingURL=types.d.ts.map
