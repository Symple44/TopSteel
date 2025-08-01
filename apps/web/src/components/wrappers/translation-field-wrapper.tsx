'use client'

import { TranslationField, type TranslationFieldProps } from '@erp/ui/forms'
import { useTranslation } from '@/lib/i18n/hooks'
import { translator } from '@/lib/i18n/translator'

interface TranslationFieldWrapperProps extends Omit<TranslationFieldProps, 'currentLanguage' | 'fieldTranslations'> {
  // Override props that we'll handle internally
}

export function TranslationFieldWrapper(props: TranslationFieldWrapperProps) {
  const { t } = useTranslation('translation')
  
  const currentLanguage = translator.getCurrentLanguage()
  
  const fieldTranslations = {
    translateField: t('translateField'),
    fieldTranslations: t('fieldTranslations'),
    translateDescription: t('translateDescription'),
    current: t('current'),
    translateTo: t('translateTo'),
    cancel: t('cancel'),
    save: t('save')
  }
  
  return (
    <TranslationField 
      {...props} 
      currentLanguage={currentLanguage}
      fieldTranslations={fieldTranslations}
    />
  )
}

export default TranslationFieldWrapper