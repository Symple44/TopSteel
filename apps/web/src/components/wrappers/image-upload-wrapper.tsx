'use client'

import { ImageUpload } from '@erp/ui/business'
import { useTranslation } from '@/lib/i18n'
import { callClientApi } from '@/utils/backend-api'

interface ImageUploadWrapperProps {
  category: 'avatar' | 'logo' | 'document'
  entityType: 'user' | 'company' | 'project'
  entityId: string
  currentImageUrl?: string
  onUploadSuccess: (imageUrl: string) => void
  onUploadError: (error: string) => void
  maxSize?: number
  allowedTypes?: string[]
  className?: string
  disabled?: boolean
  showPreview?: boolean
  variant?: 'default' | 'avatar' | 'compact'
}

export function ImageUploadWrapper(props: ImageUploadWrapperProps) {
  const { t } = useTranslation('common')

  const uploadApi = async (formData: FormData) => {
    return await callClientApi('images/upload', {
      method: 'POST',
      body: formData,
    })
  }

  const translations = {
    uploading: t('uploading'),
    changePhoto: t('changePhoto'),
    remove: t('remove'),
    upload: t('upload'),
  }

  return (
    <ImageUpload
      category={props.category}
      entityType={props.entityType}
      entityId={props.entityId}
      currentImageUrl={props.currentImageUrl}
      onUploadSuccess={props.onUploadSuccess}
      onUploadError={props.onUploadError}
      maxSize={props.maxSize}
      allowedTypes={props.allowedTypes}
      className={props.className}
      disabled={props.disabled}
      showPreview={props.showPreview}
      variant={props.variant}
      uploadApi={uploadApi}
      translations={translations}
    />
  )
}

export default ImageUploadWrapper
