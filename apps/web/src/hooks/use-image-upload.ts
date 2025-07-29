import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { callClientApi } from '@/utils/backend-api'

export interface UseImageUploadOptions {
  onSuccess?: (result: any) => void
  onError?: (error: string) => void
  category: 'avatar' | 'logo' | 'document'
  entityType?: 'user' | 'company' | 'project'
  entityId?: string
  maxSize?: number
  allowedTypes?: string[]
}

export function useImageUpload({
  onSuccess,
  onError,
  category,
  entityType,
  entityId,
  maxSize,
  allowedTypes
}: UseImageUploadOptions) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const upload = useCallback(async (file: File, options: {
    alt?: string
    description?: string
    tags?: string[]
  } = {}) => {
    // Validation de la taille
    const maxFileSize = maxSize || (category === 'avatar' ? 2 * 1024 * 1024 : 5 * 1024 * 1024)
    if (file.size > maxFileSize) {
      const error = `File size exceeds ${Math.round(maxFileSize / 1024 / 1024)}MB`
      onError?.(error)
      toast.error(error)
      return null
    }

    // Validation du type
    const allowedFileTypes = allowedTypes || ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedFileTypes.includes(file.type)) {
      const error = 'Invalid file type'
      onError?.(error)
      toast.error(error)
      return null
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('category', category)
      
      if (entityType) formData.append('entityType', entityType)
      if (entityId) formData.append('entityId', entityId)
      if (options.alt) formData.append('alt', options.alt)
      if (options.description) formData.append('description', options.description)
      if (options.tags) formData.append('tags', options.tags.join(','))

      // Simulation du progrès d'upload
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 100)

      const response = await callClientApi('images/upload', {
        method: 'POST',
        body: formData
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed')
      }

      onSuccess?.(result.data)
      toast.success('Image uploaded successfully')
      return result.data

    } catch (error) {
      console.error('Upload error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      onError?.(errorMessage)
      toast.error(errorMessage)
      return null
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }, [category, entityType, entityId, maxSize, allowedTypes, onSuccess, onError])

  const deleteImage = useCallback(async (imageId: string) => {
    try {
      const response = await callClientApi(`images/upload?imageId=${imageId}&category=${category}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Delete failed')
      }

      toast.success('Image deleted successfully')
      return true

    } catch (error) {
      console.error('Delete error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Delete failed'
      toast.error(errorMessage)
      return false
    }
  }, [category])

  return {
    upload,
    deleteImage,
    isUploading,
    uploadProgress
  }
}