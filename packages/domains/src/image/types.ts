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
  maxSize: number // en bytes
  allowedTypes: string[]
  generateVariants: boolean
  variants?: {
    thumbnail: { width: number; height: number }
    medium: { width: number; height: number }
    large?: { width: number; height: number }
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

export const DEFAULT_CONFIGS: Record<string, UploadConfig> = {
  avatar: {
    maxSize: 2 * 1024 * 1024, // 2MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    generateVariants: true,
    variants: {
      thumbnail: { width: 64, height: 64 },
      medium: { width: 200, height: 200 }
    }
  },
  logo: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'],
    generateVariants: true,
    variants: {
      thumbnail: { width: 64, height: 64 },
      medium: { width: 200, height: 200 },
      large: { width: 400, height: 400 }
    }
  },
  document: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    generateVariants: false
  }
}