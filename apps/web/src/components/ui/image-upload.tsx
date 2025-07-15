'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@erp/ui'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n'

export interface ImageUploadProps {
  category: 'avatar' | 'logo' | 'document'
  entityType?: 'user' | 'company' | 'project'
  entityId?: string
  currentImageUrl?: string
  onUploadSuccess?: (result: any) => void
  onUploadError?: (error: string) => void
  maxSize?: number
  allowedTypes?: string[]
  className?: string
  disabled?: boolean
  showPreview?: boolean
  variant?: 'default' | 'avatar' | 'compact'
}

export function ImageUpload({
  category,
  entityType,
  entityId,
  currentImageUrl,
  onUploadSuccess,
  onUploadError,
  maxSize,
  allowedTypes,
  className,
  disabled = false,
  showPreview = true,
  variant = 'default'
}: ImageUploadProps) {
  const { t } = useTranslation('common')
  const [isUploading, setIsUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback(async (file: File) => {
    if (disabled) return

    // Validation de la taille
    const maxFileSize = maxSize || (category === 'avatar' ? 2 * 1024 * 1024 : 5 * 1024 * 1024)
    if (file.size > maxFileSize) {
      onUploadError?.(`File size exceeds ${Math.round(maxFileSize / 1024 / 1024)}MB`)
      return
    }

    // Validation du type
    const allowedFileTypes = allowedTypes || ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedFileTypes.includes(file.type)) {
      onUploadError?.('Invalid file type')
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('category', category)
      if (entityType) formData.append('entityType', entityType)
      if (entityId) formData.append('entityId', entityId)

      const response = await fetch('/api/images/upload', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed')
      }

      // Mise à jour de la preview
      setPreviewUrl(result.data.urls.medium || result.data.urls.original)
      onUploadSuccess?.(result.data)

    } catch (error) {
      console.error('Upload error:', error)
      onUploadError?.(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }, [category, entityType, entityId, maxSize, allowedTypes, disabled, onUploadSuccess, onUploadError])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  const handleClick = useCallback(() => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }, [disabled])

  const handleRemove = useCallback(() => {
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const renderDefault = () => (
    <div
      className={cn(
        'relative border-2 border-dashed rounded-lg p-6 transition-colors',
        dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary',
        className
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={allowedTypes?.join(',') || 'image/*'}
        onChange={handleFileInputChange}
        disabled={disabled}
      />

      <div className="flex flex-col items-center justify-center space-y-4">
        {previewUrl && showPreview ? (
          <div className="relative">
            <img
              src={previewUrl}
              alt="Preview"
              className="h-32 w-32 rounded-lg object-cover"
            />
            {!disabled && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemove()
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            {isUploading ? (
              <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
            ) : (
              <Upload className="h-12 w-12 text-muted-foreground" />
            )}
            <div className="text-center">
              <p className="text-sm font-medium">
                {isUploading ? t('uploading') : 'Click to upload or drag and drop'}
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, WebP up to {Math.round((maxSize || 2 * 1024 * 1024) / 1024 / 1024)}MB
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  const renderAvatar = () => (
    <div className="flex items-center space-x-4">
      <div className="relative">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Avatar"
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
        {isUploading && (
          <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-white" />
          </div>
        )}
      </div>
      <div className="flex flex-col space-y-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleClick}
          disabled={disabled || isUploading}
        >
          {isUploading ? t('uploading') : t('changePhoto')}
        </Button>
        {previewUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={disabled}
            className="text-destructive hover:text-destructive"
          >
            {t('remove')}
          </Button>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={handleFileInputChange}
        disabled={disabled}
      />
    </div>
  )

  const renderCompact = () => (
    <Button
      type="button"
      variant="outline"
      onClick={handleClick}
      disabled={disabled || isUploading}
      className={cn('relative', className)}
    >
      {isUploading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Upload className="h-4 w-4 mr-2" />
      )}
      {isUploading ? t('uploading') : t('upload')}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={allowedTypes?.join(',') || 'image/*'}
        onChange={handleFileInputChange}
        disabled={disabled}
      />
    </Button>
  )

  switch (variant) {
    case 'avatar':
      return renderAvatar()
    case 'compact':
      return renderCompact()
    default:
      return renderDefault()
  }
}

export default ImageUpload