'use client'

import { ImageUpload, type ImageUploadProps } from '@erp/ui/business'
import { useTranslation } from '@/lib/i18n'
import { callClientApi } from '@/utils/backend-api'

interface ImageUploadWrapperProps extends Omit<ImageUploadProps, 'uploadApi' | 'translations'> {
  // Override props that we'll handle internally
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
    upload: t('upload')
  }
  
  return (
    <ImageUpload 
      {...props} 
      uploadApi={uploadApi} 
      translations={translations}
    />
  )
}

export default ImageUploadWrapper